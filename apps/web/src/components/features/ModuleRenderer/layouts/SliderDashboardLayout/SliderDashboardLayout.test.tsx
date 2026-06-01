import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { SliderDashboardLayout } from './SliderDashboardLayout'
import type { ContentField } from '../../../../../services/moduleService'

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
      props: { color: '#8B5CF6', min: '1', max: '10', low_hint_code: 'modules.mood_tracker.dim_mood_low', high_hint_code: 'modules.mood_tracker.dim_mood_high' },
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
    field('scale_slider_question', {
      id: 'mood_tracker.q_pleasure',
      text_code: 'modules.mood_tracker.dim_pleasure',
      sort_order: 50,
      props: { color: '#059669', min: '1', max: '10' },
    }),
  ]
}

describe('SliderDashboardLayout — onglet Aujourd\'hui (défaut)', () => {
  it('rend les onglets via ui/Tabs, l\'instruction, une ValueBar par slider et le bouton save', () => {
    const fields = [
      field('scale_instruction', { text_code: 'modules.mood_tracker.instructions' }),
      ...sliderFields(),
      field('scale_text_input', { text_code: 'modules.mood_tracker.notes_label', props: { placeholder_code: 'modules.mood_tracker.notes_placeholder' } }),
    ]
    const { container } = render(<SliderDashboardLayout fields={fields} footer={undefined} t={t} />)

    expect(container.querySelector('.sd')).toBeTruthy()

    const tabs = container.querySelectorAll('[role="tab"]')
    expect(tabs).toHaveLength(2)
    expect(tabs[0].textContent).toBe('modules.mood_tracker.tab_today')
    expect(tabs[1].textContent).toBe('modules.mood_tracker.tab_history')
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')

    expect(container.querySelector('.sd__instruction')?.textContent).toBe('modules.mood_tracker.instructions')
    expect(container.querySelectorAll('.value-bar')).toHaveLength(4)
    expect(container.querySelector('.value-bar__label')?.textContent).toBe('modules.mood_tracker.dim_mood')
    expect(container.querySelector('.sd__save-btn')?.textContent).toBe('common.save')
  })

  it('trie les sliders par sort_order', () => {
    const fields = [...sliderFields()].reverse()
    const { container } = render(<SliderDashboardLayout fields={fields} footer={undefined} t={t} />)
    const labels = Array.from(container.querySelectorAll('.value-bar__label')).map(n => n.textContent)
    expect(labels).toEqual([
      'modules.mood_tracker.dim_mood',
      'modules.mood_tracker.dim_energy',
      'modules.mood_tracker.dim_anxiety',
      'modules.mood_tracker.dim_pleasure',
    ])
  })

  it('dérive le namespace i18n du module_id des fields (aucun module hardcodé)', () => {
    const fields = sliderFields().map(f => ({ ...f, module_id: 'autre_module' }))
    const { container } = render(<SliderDashboardLayout fields={fields} footer={undefined} t={t} />)
    expect(container.querySelector('[role="tab"]')?.textContent).toBe('modules.autre_module.tab_today')
  })
})

describe('SliderDashboardLayout — onglet Historique', () => {
  it('bascule sur l\'historique et rend une sparkline + une chip par dimension', async () => {
    const user = userEvent.setup()
    const footer = field('footer_note', { text_code: 'modules.mood_tracker.footer' })
    const { container } = render(<SliderDashboardLayout fields={sliderFields()} footer={footer} t={t} />)

    await user.click(container.querySelectorAll('[role="tab"]')[1])

    expect(container.querySelector('.sd__history-title')?.textContent).toBe('modules.mood_tracker.history_title')
    expect(container.querySelectorAll('.sd-history__row')).toHaveLength(4)
    expect(container.querySelectorAll('.sparkline')).toHaveLength(4)
    expect(container.querySelectorAll('.sd-history__chip')).toHaveLength(4)
    expect(container.querySelector('.sd-history__score-label')?.textContent).toBe('modules.mood_tracker.score_label :')
    expect(container.querySelector('.preview-panel__info')).toBeTruthy()
  })

  it('n\'affiche pas le bloc footer quand footer est absent', async () => {
    const user = userEvent.setup()
    const { container } = render(<SliderDashboardLayout fields={sliderFields()} footer={undefined} t={t} />)
    await user.click(container.querySelectorAll('[role="tab"]')[1])
    expect(container.querySelector('.preview-panel__info')).toBeNull()
  })
})
