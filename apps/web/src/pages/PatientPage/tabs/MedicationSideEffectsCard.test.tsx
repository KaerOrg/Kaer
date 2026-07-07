import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'fr' } }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { MedicationSideEffectsCard } from './MedicationSideEffectsCard'
import type { PatientModule } from '../../../lib/database.types'
import type { ModuleItem } from '@services/moduleCatalogService'

const MOD_ITEM: ModuleItem = { id: 'medication_side_effects', icon: 'pill', mobile_icon: 'pill', color: '#2C6E72' }
const MOD: PatientModule = {
  id: 'pm1', patient_id: 'p1', practitioner_id: 'pr1',
  module_type: 'medication_side_effects', config: {}, unlocked_at: '2026-06-01T00:00:00Z',
}

type MedEffects = React.ComponentProps<typeof MedicationSideEffectsCard>['medEffects']

function makeMedEffects(over: Partial<MedEffects> = {}): MedEffects {
  return {
    module: MOD,
    open: false,
    tracked: [],
    saving: false,
    openEditor: vi.fn(),
    close: vi.fn(),
    toggleFixed: vi.fn(),
    addCustom: vi.fn(),
    removeEffect: vi.fn(),
    ...over,
  }
}

function setup(over: Partial<React.ComponentProps<typeof MedicationSideEffectsCard>> = {}) {
  const props: React.ComponentProps<typeof MedicationSideEffectsCard> = {
    tagChips: null,
    modItem: MOD_ITEM,
    modIcon: null,
    mod: MOD,
    unlocked: true,
    loading: false,
    previewOpen: false,
    dataOpen: false,
    medEffects: makeMedEffects(),
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
  render(<MedicationSideEffectsCard {...props} />)
  return props
}

describe('MedicationSideEffectsCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rend le label, la description et les actions quand débloqué', () => {
    setup()
    expect(screen.getByText('modules.medication_side_effects.label')).toBeTruthy()
    expect(screen.getByText('modules.medication_side_effects.description')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'patient.preview_button' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'patient.data_button' })).toBeTruthy()
  })

  it('le bouton aperçu déclenche onTogglePreview (ouvre la modale côté parent)', () => {
    const { onTogglePreview } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'patient.preview_button' }))
    expect(onTogglePreview).toHaveBeenCalledWith('medication_side_effects')
  })

  it('le bouton données déclenche onToggleData (ouvre la modale côté parent)', () => {
    const { onToggleData } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'patient.data_button' }))
    expect(onToggleData).toHaveBeenCalledWith('medication_side_effects')
  })

  it('ne rend aucun panneau inline dans la carte', () => {
    setup({ previewOpen: true, dataOpen: false })
    expect(screen.queryByTestId('preview-panel')).toBeNull()
    expect(screen.queryByTestId('data-panel')).toBeNull()
  })

  it('la bascule révoque le module débloqué et ferme l\'éditeur', () => {
    const medEffects = makeMedEffects()
    const { onRevoke } = setup({ medEffects })
    fireEvent.click(screen.getByTestId('module-toggle'))
    expect(medEffects.close).toHaveBeenCalled()
    expect(onRevoke).toHaveBeenCalledWith('pm1')
  })

  it('n’affiche pas les actions si le module n’est pas débloqué', () => {
    setup({ unlocked: false, mod: undefined })
    expect(screen.queryByRole('button', { name: 'patient.data_button' })).toBeNull()
  })
})
