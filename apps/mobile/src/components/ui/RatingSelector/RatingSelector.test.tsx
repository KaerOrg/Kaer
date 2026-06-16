import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { RatingSelector } from './RatingSelector'

const STEPS = [1, 2, 3, 4, 5]

describe('RatingSelector — variant numbered', () => {
  it('affiche le header label + valeur sélectionnée', () => {
    render(<RatingSelector label="Humeur" steps={STEPS} color="#8B5CF6" value={3} onPress={jest.fn()} />)
    expect(screen.getByText('Humeur')).toBeTruthy()
    expect(screen.getByTestId('rating-header-value')).toBeTruthy()
  })

  it('masque le header quand showHeader=false', () => {
    render(<RatingSelector label="X" steps={STEPS} color="#000" value={2} showHeader={false} onPress={jest.fn()} />)
    expect(screen.queryByText('X')).toBeNull()
  })

  it('ne montre pas de valeur dans le header quand value=null', () => {
    render(<RatingSelector label="Humeur" steps={STEPS} color="#000" value={null} onPress={jest.fn()} />)
    expect(screen.queryByTestId('rating-header-value')).toBeNull()
  })

  it('appelle onPress avec la bonne valeur', () => {
    const onPress = jest.fn()
    render(<RatingSelector label="Humeur" steps={STEPS} color="#000" value={null} onPress={onPress} />)
    fireEvent.press(screen.getByText('4'))
    expect(onPress).toHaveBeenCalledWith(4)
  })
})

describe('RatingSelector — variant track', () => {
  it('affiche les labels min/max quand showEndLabels=true', () => {
    render(
      <RatingSelector
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

describe('RatingSelector — variant icon', () => {
  it('expose un testID par pip et appelle onPress avec la valeur', () => {
    const onPress = jest.fn()
    render(
      <RatingSelector
        label="Qualité"
        steps={STEPS}
        color="#F59E0B"
        value={3}
        variant="icon"
        showHeader={false}
        testIdPrefix="quality-star"
        onPress={onPress}
      />,
    )
    expect(screen.getByTestId('quality-star-1')).toBeTruthy()
    expect(screen.getByTestId('quality-star-5')).toBeTruthy()
    fireEvent.press(screen.getByTestId('quality-star-4'))
    expect(onPress).toHaveBeenCalledWith(4)
  })

  it('respecte l’état accessible coché sur la valeur sélectionnée', () => {
    render(
      <RatingSelector
        label="Ressenti"
        steps={STEPS}
        color="#F59E0B"
        value={2}
        variant="icon"
        icon="weather-sunny"
        showHeader={false}
        testIdPrefix="restedness-star"
        onPress={jest.fn()}
      />,
    )
    expect(screen.getByTestId('restedness-star-2').props.accessibilityState).toEqual({ checked: true })
    expect(screen.getByTestId('restedness-star-3').props.accessibilityState).toEqual({ checked: false })
  })
})
