import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'fr' } }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { MedicationAdherenceCard } from './MedicationAdherenceCard'
import type { PatientModule } from '../../../lib/database.types'
import type { ModuleItem } from '@services/moduleCatalogService'
import type { Medication } from '@kaer/shared'

const MOD_ITEM: ModuleItem = { id: 'medication_adherence', icon: 'pill', mobile_icon: 'pill', color: '#2C6E72' }
const MOD: PatientModule = {
  id: 'pm1', patient_id: 'p1', practitioner_id: 'pr1',
  module_type: 'medication_adherence', config: {}, unlocked_at: '2026-06-01T00:00:00Z',
}
const MED: Medication = { id: 'm1', name: 'Sertraline', posology: '50 mg', kind: 'maintenance' }

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
    modItem: MOD_ITEM,
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

  it('le bouton configurer ouvre l\'éditeur de liste', () => {
    const medList = makeMedList()
    setup({ medList })
    fireEvent.click(screen.getByRole('button', { name: 'modules.medication_adherence.config_button' }))
    expect(medList.openEditor).toHaveBeenCalled()
  })

  it('la bascule révoque le module débloqué et ferme l\'éditeur', () => {
    const medList = makeMedList()
    const { onRevoke } = setup({ medList })
    fireEvent.click(screen.getByTestId('module-toggle'))
    expect(medList.close).toHaveBeenCalled()
    expect(onRevoke).toHaveBeenCalledWith('pm1')
  })

  it('éditeur ouvert : liste les molécules et supprime par id', () => {
    const medList = makeMedList({ open: true, medications: [MED] })
    setup({ medList })
    expect(screen.getByText('Sertraline')).toBeTruthy()
    expect(screen.getByText('50 mg')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('common.delete'))
    expect(medList.removeMedication).toHaveBeenCalledWith('m1')
  })
})
