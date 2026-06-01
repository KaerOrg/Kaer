import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { MedicationSideEffectsLayout } from './MedicationSideEffectsLayout'
import type { ContentField } from '../../../../../services/moduleService'

function field(field_type: string, overrides: Partial<ContentField> = {}): ContentField {
  return {
    id: `${field_type}-${Math.random()}`,
    module_id: 'medication_side_effects',
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

const sliders = [
  field('scale_slider_question', { id: 'mse.q_sedation', text_code: 'modules.medication_side_effects.dim_sedation', sort_order: 10, props: { color: '#8B5CF6', min: '0', max: '10' } }),
  field('scale_slider_question', { id: 'mse.q_nausea', text_code: 'modules.medication_side_effects.dim_nausea', sort_order: 60, props: { color: '#10B981', min: '0', max: '10' } }),
]
const instruction = field('scale_instruction', { id: 'mse.instruction', text_code: 'modules.medication_side_effects.instructions' })
const footer = field('footer_note', { id: 'mse.footer', text_code: 'modules.medication_side_effects.footer' })

const t = (key: string) => key

describe('MedicationSideEffectsLayout', () => {
  it('affiche les 3 onglets Saisie / Évolution / Vue d’ensemble', () => {
    render(<MedicationSideEffectsLayout fields={[instruction, ...sliders]} footer={footer} t={t} />)
    expect(screen.getByText('modules.medication_side_effects.tab_entry')).toBeTruthy()
    expect(screen.getByText('modules.medication_side_effects.tab_charts')).toBeTruthy()
    expect(screen.getByText('modules.medication_side_effects.tab_month')).toBeTruthy()
  })

  it('onglet Saisie : un slider par dimension', () => {
    const { container } = render(<MedicationSideEffectsLayout fields={[instruction, ...sliders]} footer={footer} t={t} />)
    expect(container.querySelectorAll('.mt-slider-card')).toHaveLength(sliders.length)
    expect(screen.getByText('modules.medication_side_effects.dim_sedation')).toBeTruthy()
    expect(screen.getByText('modules.medication_side_effects.dim_nausea')).toBeTruthy()
  })

  it('onglet Évolution : affiche le graphique composite et le sélecteur de période', async () => {
    const user = userEvent.setup()
    const { container } = render(<MedicationSideEffectsLayout fields={[instruction, ...sliders]} footer={footer} t={t} />)
    await user.click(screen.getByText('modules.medication_side_effects.tab_charts'))
    expect(screen.getByText('modules.medication_side_effects.chart_composite')).toBeTruthy()
    expect(container.querySelectorAll('.mt-range__btn').length).toBeGreaterThan(0)
    // une courbe par dimension dans le composite + au moins une carte par dimension
    expect(container.querySelectorAll('.mt-chart-card').length).toBeGreaterThanOrEqual(sliders.length)
  })

  it('onglet Vue d’ensemble : affiche la heatmap calendrier', async () => {
    const user = userEvent.setup()
    const { container } = render(<MedicationSideEffectsLayout fields={[instruction, ...sliders]} footer={footer} t={t} />)
    await user.click(screen.getByText('modules.medication_side_effects.tab_month'))
    expect(container.querySelector('.mt-cal')).toBeTruthy()
  })

  it('MDR : aucun label interprétatif (sévère/anormal/alerte) dans le rendu', () => {
    const { container } = render(<MedicationSideEffectsLayout fields={[instruction, ...sliders]} footer={footer} t={t} />)
    const txt = (container.textContent ?? '').toLowerCase()
    expect(txt).not.toContain('sévère')
    expect(txt).not.toContain('anormal')
    expect(txt).not.toContain('alerte')
  })
})
