import React from 'react'
import { StyleSheet } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { MeasureStep } from './MeasureStep'

function renderStep(onSubmit = jest.fn()) {
  render(
    <MeasureStep
      title="Avant de commencer"
      discomfortLabel="Inconfort"
      beliefLabel="Conviction"
      continueLabel="Continuer"
      skipLabel="Passer cette étape"
      accent="#F59E0B"
      onSubmit={onSubmit}
    />,
  )
  return onSubmit
}

describe('MeasureStep — curseurs vides au départ (MDR)', () => {
  it('les deux curseurs sont vides (remplissage nul, aucune valeur d\'ancrage)', () => {
    renderStep()
    expect(StyleSheet.flatten(screen.getByTestId('measure-discomfort-fill').props.style).flex).toBe(0)
    expect(StyleSheet.flatten(screen.getByTestId('measure-belief-fill').props.style).flex).toBe(0)
  })

  it('« Continuer » n\'a aucun effet tant que les deux curseurs ne sont pas renseignés', () => {
    const onSubmit = renderStep()
    fireEvent.press(screen.getByText('Continuer'))
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('MeasureStep — passer l\'étape (null par paire)', () => {
  it('« Passer cette étape » soumet null (les deux dimensions ensemble)', () => {
    const onSubmit = renderStep()
    fireEvent.press(screen.getByText('Passer cette étape'))
    expect(onSubmit).toHaveBeenCalledWith(null)
  })
})
