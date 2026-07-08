import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'fr' } }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { MedicationAdherenceCard } from './MedicationAdherenceCard'
import type { PatientModule } from '../../../lib/database.types'

const MOD: PatientModule = {
  id: 'pm1', patient_id: 'p1', practitioner_id: 'pr1',
  module_type: 'medication_adherence', config: {}, unlocked_at: '2026-06-01T00:00:00Z',
}

type MedList = React.ComponentProps<typeof MedicationAdherenceCard>['medList']

function makeMedList(over: Partial<MedList> = {}): MedList {
  return {
    module: MOD,
    open: false,
    medications: [],
    saving: false,
    openEditor: vi.fn(),
    close: vi.fn(),
    addMedication: vi.fn(),
    removeMedication: vi.fn(),
    ...over,
  }
}

function setup(over: Partial<React.ComponentProps<typeof MedicationAdherenceCard>> = {}) {
  const props: React.ComponentProps<typeof MedicationAdherenceCard> = {
    tagChips: null,
    modIcon: null,
    mod: MOD,
    unlocked: true,
    loading: false,
    previewOpen: false,
    dataOpen: false,
    medList: makeMedList(),
    moduleToggle: (_on, _loading, onToggle) => (
      <button data-testid="module-toggle" onClick={onToggle}>toggle</button>
    ),
    onTogglePreview: vi.fn(),
    onToggleData: vi.fn(),
    onConfigureNotif: vi.fn(),
    onConfigure: vi.fn(),
    onUnlock: vi.fn(),
    onRevoke: vi.fn(),
    ...over,
  }
  render(<MedicationAdherenceCard {...props} />)
  return props
}

describe('MedicationAdherenceCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rend le label, la description et les actions quand débloqué', () => {
    setup()
    expect(screen.getByText('modules.medication_adherence.label')).toBeTruthy()
    expect(screen.getByText('modules.medication_adherence.description')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'patient.preview_button' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'patient.data_button' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'modules.medication_adherence.config_button' })).toBeTruthy()
  })

  it('le bouton aperçu déclenche onTogglePreview', () => {
    const { onTogglePreview } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'patient.preview_button' }))
    expect(onTogglePreview).toHaveBeenCalledWith('medication_adherence')
  })

  it('le bouton données déclenche onToggleData', () => {
    const { onToggleData } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'patient.data_button' }))
    expect(onToggleData).toHaveBeenCalledWith('medication_adherence')
  })

  it('le bouton configurer ouvre la modale sur l\'onglet Configuration', () => {
    const { onConfigure } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'modules.medication_adherence.config_button' }))
    expect(onConfigure).toHaveBeenCalledWith('medication_adherence')
  })

  it('la bascule révoque le module débloqué et ferme l\'éditeur', () => {
    const medList = makeMedList()
    const { onRevoke } = setup({ medList })
    fireEvent.click(screen.getByTestId('module-toggle'))
    expect(medList.close).toHaveBeenCalled()
    expect(onRevoke).toHaveBeenCalledWith('pm1')
  })

  it('affiche le résumé du nombre de médicaments', () => {
    setup({ medList: makeMedList({ medications: [
      { id: 'm1', name: 'Sertraline', posology: '50 mg', kind: 'maintenance' },
    ] }) })
    expect(screen.getByText('modules.medication_adherence.config_count', { exact: false })).toBeTruthy()
  })
})
