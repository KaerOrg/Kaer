import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { PipPicker } from './PipPicker'

const STEPS = [1, 2, 3, 4, 5]

describe('PipPicker — variant numbered', () => {
  it('affiche le header label + valeur sélectionnée', () => {
    render(<PipPicker label="Humeur" steps={STEPS} color="#8B5CF6" value={3} onPress={jest.fn()} />)
    expect(screen.getByText('Humeur')).toBeTruthy()
    expect(screen.getByTestId('pip-header-value')).toBeTruthy()
  })

  it('masque le header quand showHeader=false', () => {
    render(<PipPicker label="X" steps={STEPS} color="#000" value={2} showHeader={false} onPress={jest.fn()} />)
    expect(screen.queryByText('X')).toBeNull()
  })

  it('ne montre pas de valeur dans le header quand value=null', () => {
    const { toJSON } = render(<PipPicker label="Humeur" steps={STEPS} color="#000" value={null} onPress={jest.fn()} />)
    expect(toJSON()).toBeTruthy()
  })

  it('appelle onPress avec la bonne valeur', () => {
    const onPress = jest.fn()
    render(<PipPicker label="Humeur" steps={STEPS} color="#000" value={null} onPress={onPress} />)
    fireEvent.press(screen.getByText('4'))
    expect(onPress).toHaveBeenCalledWith(4)
  })
})

describe('PipPicker — variant track', () => {
  it('affiche les labels min/max quand showEndLabels=true', () => {
    render(
      <PipPicker
        label="Plaisir"
        steps={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
        color="#059669"
        value={5}
        variant="track"
        showEndLabels
        onPress={jest.fn()}
      />,
    )
    expect(screen.getByText('0')).toBeTruthy()
    expect(screen.getByText('10')).toBeTruthy()
  })
})
