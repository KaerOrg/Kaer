import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { AmbientChip } from './AmbientChip'

describe('AmbientChip', () => {
  it('remonte la clé d’ambiance au tap', () => {
    const onSelect = jest.fn()
    const { getByTestId } = render(
      <AmbientChip soundKey="waves" label="Vagues" color="#4A9EA3" selected={false} onSelect={onSelect} />,
    )
    fireEvent.press(getByTestId('breathing-ambient-waves'))
    expect(onSelect).toHaveBeenCalledWith('waves')
  })

  it('affiche le libellé traduit fourni par le parent', () => {
    const { getByText } = render(
      <AmbientChip soundKey="bowl" label="Bol tibétain" color="#4A9EA3" selected onSelect={jest.fn()} />,
    )
    expect(getByText('Bol tibétain')).toBeTruthy()
  })

  it('reflète la sélection dans l’état accessible', () => {
    const { getByTestId } = render(
      <AmbientChip soundKey="rain" label="Pluie" color="#4A9EA3" selected onSelect={jest.fn()} />,
    )
    expect(getByTestId('breathing-ambient-rain').props.accessibilityState.selected).toBe(true)
  })
})
