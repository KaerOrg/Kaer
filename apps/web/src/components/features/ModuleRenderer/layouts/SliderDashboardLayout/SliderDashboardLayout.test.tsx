import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { SliderDashboardLayout } from './SliderDashboardLayout'
import type { ContentField } from '@services/moduleService'

// `t` déterministe : renvoie la clé i18n telle quelle (cf. FieldRenderer.test.tsx).
const t = (key: string) => key

function field(field_type: string, overrides: Partial<ContentField> = {}): ContentField {
  return {
    id: `${field_type}-${Math.random()}`,
    module_id: 'mood_tracker',
    section_id: null,
    parent_field_id: null,
    text_code: `${field_type}.text`,
    sort_order: 0,
    props: {},
    children: [],
    field_type,
    ...overrides,
  }
}

function sliderFields(): ContentField[] {
  return [
    field('scale_slider_question', {
      id: 'mood_tracker.q_mood',
      text_code: 'modules.mood_tracker.dim_mood',
      sort_order: 20,
      props: { color: '#8B5CF6', min: '1', max: '10' },
    }),
    field('scale_slider_question', {
      id: 'mood_tracker.q_energy',
      text_code: 'modules.mood_tracker.dim_energy',
      sort_order: 30,
      props: { color: '#F59E0B', min: '1', max: '10' },
    }),
    field('scale_slider_question', {
      id: 'mood_tracker.q_anxiety',
      text_code: 'modules.mood_tracker.dim_anxiety',
      sort_order: 40,
      props: { color: '#EF4444', min: '1', max: '10' },
    }),
  ]
}

const instruction = field('scale_instruction', {
  id: 'mood_tracker.instruction',
  text_code: 'modules.mood_tracker.instructions',
  props: { accent_color: '#F97316' },
})
const footer = field('footer_note', { text_code: 'modules.mood_tracker.footer' })

describe('SliderDashboardLayout — onglet Saisie (défaut)', () => {
  it('rend les 3 onglets via ui/Tabs, l\'instruction et une carte slider par dimension', () => {
    const fields = [instruction, ...sliderFields(), field('scale_text_input', { text_code: 'modules.mood_tracker.notes_label' })]
    const { container } = render(<SliderDashboardLayout fields={fields} footer={footer} t={t} />)

    expect(container.querySelector('.mt')).toBeTruthy()
    const tabs = container.querySelectorAll('[role="tab"]')
    expect(tabs).toHaveLength(3)
    expect(tabs[0].textContent).toBe('modules.mood_tracker.tab_entry')
    expect(tabs[1].textContent).toBe('modules.mood_tracker.tab_charts')
    expect(tabs[2].textContent).toBe('modules.mood_tracker.tab_month')
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')

    expect(container.querySelector('.mt__instruction')?.textContent).toBe('modules.mood_tracker.instructions')
    expect(container.querySelectorAll('.mt-slider-card')).toHaveLength(3)
    expect(container.querySelector('.btn--full')?.textContent).toBe('common.save')
  })

  it('trie les sliders par sort_order', () => {
    const { container } = render(<SliderDashboardLayout fields={[...sliderFields()].reverse()} footer={undefined} t={t} />)
    const labels = Array.from(container.querySelectorAll('.mt-slider-card .rating-selector__label')).map(n => n.textContent)
    expect(labels).toEqual([
      'modules.mood_tracker.dim_mood',
      'modules.mood_tracker.dim_energy',
      'modules.mood_tracker.dim_anxiety',
    ])
  })

  it('dérive le namespace i18n du module_id des fields (aucun module hardcodé)', () => {
    const fields = sliderFields().map(f => ({ ...f, module_id: 'autre_module' }))
    const { container } = render(<SliderDashboardLayout fields={fields} footer={undefined} t={t} />)
    expect(container.querySelector('[role="tab"]')?.textContent).toBe('modules.autre_module.tab_entry')
  })
})

describe('SliderDashboardLayout — onglets Évolution & Vue d\'ensemble', () => {
  it('Évolution : graphique composite, sélecteur de période et carte par dimension', async () => {
    const user = userEvent.setup()
    const { container } = render(<SliderDashboardLayout fields={[instruction, ...sliderFields()]} footer={footer} t={t} />)
    await user.click(screen.getByText('modules.mood_tracker.tab_charts'))

    expect(screen.getByText('modules.mood_tracker.chart_composite')).toBeTruthy()
    expect(container.querySelectorAll('.segmented--pills .segmented__btn').length).toBe(4)
    expect(container.querySelectorAll('.mt-chart-card').length).toBeGreaterThanOrEqual(sliderFields().length)
    expect(container.querySelector('.preview-panel__info')).toBeTruthy()
  })

  it('Vue d\'ensemble : heatmap calendrier', async () => {
    const user = userEvent.setup()
    const { container } = render(<SliderDashboardLayout fields={[instruction, ...sliderFields()]} footer={footer} t={t} />)
    await user.click(screen.getByText('modules.mood_tracker.tab_month'))
    expect(container.querySelector('.mt-cal')).toBeTruthy()
  })
})

describe('SliderDashboardLayout — conformité MDR', () => {
  it('aucun label interprétatif (sévère / anormal / alerte) dans le rendu', () => {
    const { container } = render(<SliderDashboardLayout fields={[instruction, ...sliderFields()]} footer={footer} t={t} />)
    const txt = (container.textContent ?? '').toLowerCase()
    expect(txt).not.toContain('sévère')
    expect(txt).not.toContain('anormal')
    expect(txt).not.toContain('alerte')
  })
})
