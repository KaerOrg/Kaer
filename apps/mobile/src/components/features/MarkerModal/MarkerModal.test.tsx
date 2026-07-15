jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker')

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { MarkerModal } from './MarkerModal'
import type { MarkerType } from '../../../lib/database'

const typeLabels: Record<MarkerType, string> = {
  treatment: 'Traitement',
  life_event: 'Événement de vie',
  other: 'Autre',
}

function renderModal(onSave = jest.fn(), onClose = jest.fn()) {
  render(
    <MarkerModal
      visible
      onClose={onClose}
      onSave={onSave}
      title="Ajouter un repère"
      labelPlaceholder="Ex. : début lithium…"
      typeLabels={typeLabels}
      cancelLabel="Annuler"
      saveLabel="Enregistrer"
      locale="fr"
    />
  )
  return { onSave, onClose }
}

describe('MarkerModal', () => {
  it('affiche le titre, le champ libellé et les 3 types', () => {
    renderModal()
    expect(screen.getByText('Ajouter un repère')).toBeTruthy()
    expect(screen.getByPlaceholderText('Ex. : début lithium…')).toBeTruthy()
    expect(screen.getByText('Traitement')).toBeTruthy()
    expect(screen.getByText('Événement de vie')).toBeTruthy()
    expect(screen.getByText('Autre')).toBeTruthy()
  })

  it('ne sauvegarde pas tant que le libellé est vide', () => {
    const { onSave } = renderModal()
    fireEvent.press(screen.getByText('Enregistrer'))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('sauvegarde le libellé, le type choisi et une date ISO', () => {
    const { onSave } = renderModal()
    fireEvent.changeText(screen.getByPlaceholderText('Ex. : début lithium…'), 'Passage à 150 mg')
    fireEvent.press(screen.getByText('Événement de vie'))
    fireEvent.press(screen.getByText('Enregistrer'))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Passage à 150 mg',
        type: 'life_event',
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
  })

  it('« Annuler » ferme la modale', () => {
    const { onClose } = renderModal()
    fireEvent.press(screen.getByText('Annuler'))
    expect(onClose).toHaveBeenCalled()
  })
})
