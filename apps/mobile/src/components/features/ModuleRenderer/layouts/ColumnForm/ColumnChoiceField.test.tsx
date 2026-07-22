import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ColumnChoiceField } from './ColumnChoiceField'

const options = [
  { code: 'yes', label: 'Oui' },
  { code: 'some', label: 'Un peu' },
  { code: 'no', label: 'Non' },
]

function renderPills(value = '', onChange = jest.fn()) {
  render(
    <ColumnChoiceField fieldKey="helped" label="ÇA A AIDÉ ?" options={options} variant="pills" value={value} accent="#3FA183" onChange={onChange} />,
  )
  return onChange
}

describe('ColumnChoiceField — pills', () => {
  it('sélectionne une option (choix exclusif)', () => {
    const onChange = renderPills()
    fireEvent.press(screen.getByTestId('choice-pill-helped-yes'))
    expect(onChange).toHaveBeenCalledWith('yes')
  })

  it('décoche l\'option déjà active (retour à aucun choix)', () => {
    const onChange = renderPills('yes')
    fireEvent.press(screen.getByTestId('choice-pill-helped-yes'))
    expect(onChange).toHaveBeenCalledWith('')
  })
})

describe('ColumnChoiceField — radio', () => {
  it('rend les options en liste', () => {
    render(
      <ColumnChoiceField fieldKey="outcome" label="ET L'ENVIE ?" options={options} variant="radio" value="" accent="#4FA5A9" onChange={jest.fn()} />,
    )
    expect(screen.getByText('Oui')).toBeTruthy()
    expect(screen.getByText('Non')).toBeTruthy()
  })
})
