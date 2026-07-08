import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { MedicationEffectsConfigPanel } from './MedicationEffectsConfigPanel'

type MedEffects = React.ComponentProps<typeof MedicationEffectsConfigPanel>['medEffects']

function makeMedEffects(over: Partial<MedEffects> = {}): MedEffects {
  return {
    module: undefined,
    open: true,
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

beforeEach(() => vi.clearAllMocks())

describe('MedicationEffectsConfigPanel', () => {
  it('affiche le titre de configuration', () => {
    render(<MedicationEffectsConfigPanel medEffects={makeMedEffects()} onClose={vi.fn()} />)
    expect(screen.getByText('modules.medication_side_effects.config_title')).toBeTruthy()
  })

  it('ajoute un effet personnalisé depuis le champ', () => {
    const medEffects = makeMedEffects()
    render(<MedicationEffectsConfigPanel medEffects={medEffects} onClose={vi.fn()} />)
    const input = screen.getByPlaceholderText('modules.medication_side_effects.config_add_placeholder')
    fireEvent.change(input, { target: { value: 'Vertiges' } })
    fireEvent.click(screen.getByText('modules.medication_side_effects.config_add'))
    expect(medEffects.addCustom).toHaveBeenCalledWith('Vertiges')
  })

  it('« Terminé » ferme la modale', () => {
    const onClose = vi.fn()
    render(<MedicationEffectsConfigPanel medEffects={makeMedEffects()} onClose={onClose} />)
    fireEvent.click(screen.getByText('common.done'))
    expect(onClose).toHaveBeenCalled()
  })
})
