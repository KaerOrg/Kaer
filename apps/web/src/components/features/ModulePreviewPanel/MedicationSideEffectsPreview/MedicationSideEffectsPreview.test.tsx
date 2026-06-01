import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { MedicationSideEffectsPreview } from './MedicationSideEffectsPreview'

describe('MedicationSideEffectsPreview', () => {
  it('affiche les 3 symptômes visibles par défaut', () => {
    render(<MedicationSideEffectsPreview />)
    expect(screen.getByText('modules.medication_side_effects.effect_sedation_label')).toBeInTheDocument()
    expect(screen.getByText('modules.medication_side_effects.effect_akathisia_label')).toBeInTheDocument()
    expect(screen.getByText('modules.medication_side_effects.effect_tremors_label')).toBeInTheDocument()
    expect(screen.queryByText('modules.medication_side_effects.effect_dry_mouth_label')).toBeNull()
  })

  it('affiche les 6 symptômes après "Voir plus"', async () => {
    const user = userEvent.setup()
    render(<MedicationSideEffectsPreview />)

    await user.click(screen.getByText(/common\.show_more/))

    expect(screen.getByText('modules.medication_side_effects.effect_dry_mouth_label')).toBeInTheDocument()
    expect(screen.getByText('modules.medication_side_effects.effect_sleep_label')).toBeInTheDocument()
    expect(screen.getByText('modules.medication_side_effects.effect_nausea_label')).toBeInTheDocument()
  })

  it('affiche le badge streak et le hint i18n', () => {
    render(<MedicationSideEffectsPreview />)
    expect(screen.getByText('modules.medication_side_effects.streak_days', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('modules.medication_side_effects.streak_hint')).toBeInTheDocument()
  })

  it('affiche la note démo et l\'événement via i18n', () => {
    render(<MedicationSideEffectsPreview />)
    expect(screen.getByText('modules.medication_side_effects.preview_demo_note')).toBeInTheDocument()
    expect(screen.getByText('modules.medication_side_effects.preview_event_label')).toBeInTheDocument()
  })
})
