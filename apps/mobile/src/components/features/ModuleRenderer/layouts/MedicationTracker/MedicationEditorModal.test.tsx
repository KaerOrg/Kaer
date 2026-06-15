import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { MedicationEditorModal } from './MedicationEditorModal'

const LABELS = {
  title: 'Ajouter',
  name: 'Nom',
  posology: 'Posologie',
  kindMaintenance: 'Fond',
  kindPrn: 'Si besoin',
  save: 'Enregistrer',
  cancel: 'Annuler',
}

function setup(overrides: Partial<React.ComponentProps<typeof MedicationEditorModal>> = {}) {
  const onSave = jest.fn()
  const onCancel = jest.fn()
  render(
    <MedicationEditorModal
      visible
      initial={null}
      labels={LABELS}
      onSave={onSave}
      onCancel={onCancel}
      {...overrides}
    />,
  )
  return { onSave, onCancel }
}

describe('MedicationEditorModal', () => {
  it('affiche le titre, les libellés de type et les actions', () => {
    setup()
    expect(screen.getByText('Ajouter')).toBeTruthy()
    expect(screen.getByText('Fond')).toBeTruthy()
    expect(screen.getByText('Si besoin')).toBeTruthy()
    expect(screen.getByText('Enregistrer')).toBeTruthy()
  })

  it('n\'enregistre pas tant que le nom est vide', () => {
    const { onSave } = setup()
    fireEvent.press(screen.getByTestId('med-save-button'))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('enregistre le brouillon trimé avec le type sélectionné', () => {
    const { onSave } = setup()
    fireEvent.changeText(screen.getByTestId('med-name-input'), '  Sertraline  ')
    fireEvent.changeText(screen.getByTestId('med-posology-input'), ' 50 mg ')
    fireEvent.press(screen.getByText('Si besoin'))
    fireEvent.press(screen.getByTestId('med-save-button'))
    expect(onSave).toHaveBeenCalledWith({ name: 'Sertraline', posology: '50 mg', kind: 'prn' })
  })

  it('préremplit le nom en édition', () => {
    const { onSave } = setup({
      initial: { id: 'm1', name: 'Quétiapine', posology: '300 mg', kind: 'maintenance' },
    })
    fireEvent.press(screen.getByTestId('med-save-button'))
    expect(onSave).toHaveBeenCalledWith({ name: 'Quétiapine', posology: '300 mg', kind: 'maintenance' })
  })

  it('ferme via Annuler', () => {
    const { onCancel } = setup()
    fireEvent.press(screen.getByText('Annuler'))
    expect(onCancel).toHaveBeenCalled()
  })
})
