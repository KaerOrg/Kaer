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

const flexOf = (node: ReturnType<typeof screen.getByTestId>): number => {
  const style = node.props.style
  const arr = Array.isArray(style) ? style : [style]
  for (const s of arr) {
    if (s != null && typeof s === 'object' && 'flex' in s && typeof s.flex === 'number') return s.flex
  }
  throw new Error('flex introuvable dans le style')
}

describe('RatingSelector — variant track continuous (jauge)', () => {
  it('affiche la valeur formatée avec unité', () => {
    render(
      <RatingSelector variant="track" continuous steps={[0, 120]} value={60} unit="min" color="#0AA" showHeader={false} />,
    )
    expect(screen.getByText('60 min')).toBeTruthy()
  })

  it('affiche la valeur sans unité', () => {
    render(<RatingSelector variant="track" continuous steps={[0, 10]} value={5} color="#0AA" showHeader={false} />)
    expect(screen.getByText('5')).toBeTruthy()
  })

  it('remplit la jauge au ratio (value-min)/(max-min)', () => {
    render(<RatingSelector variant="track" continuous steps={[0, 100]} value={25} color="#0AA" showHeader={false} />)
    expect(flexOf(screen.getByTestId('rating-gauge-fill'))).toBeCloseTo(0.25)
    expect(flexOf(screen.getByTestId('rating-gauge-empty'))).toBeCloseTo(0.75)
  })

  it('borne le ratio à 1 quand la valeur dépasse le max', () => {
    render(<RatingSelector variant="track" continuous steps={[0, 100]} value={150} color="#0AA" showHeader={false} />)
    expect(flexOf(screen.getByTestId('rating-gauge-fill'))).toBe(1)
    expect(flexOf(screen.getByTestId('rating-gauge-empty'))).toBe(0)
  })

  it('borne le ratio à 0 quand la valeur est sous le min', () => {
    render(<RatingSelector variant="track" continuous steps={[0, 100]} value={-10} color="#0AA" showHeader={false} />)
    expect(flexOf(screen.getByTestId('rating-gauge-fill'))).toBe(0)
  })

  it('retombe sur un ratio 0.5 quand min >= max (cas dégénéré)', () => {
    render(<RatingSelector variant="track" continuous steps={[5, 5]} value={5} color="#0AA" showHeader={false} />)
    expect(flexOf(screen.getByTestId('rating-gauge-fill'))).toBe(0.5)
  })
})

describe('RatingSelector — readonly', () => {
  it('ne déclenche pas onPress sur un pip en lecture seule', () => {
    const onPress = jest.fn()
    render(
      <RatingSelector
        label="Humeur"
        steps={STEPS}
        color="#000"
        value={2}
        readonly
        testIdPrefix="ro"
        onPress={onPress}
      />,
    )
    fireEvent.press(screen.getByTestId('ro-3'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('reflète toujours la sélection accessible en lecture seule', () => {
    render(<RatingSelector label="Humeur" steps={STEPS} color="#000" value={2} readonly testIdPrefix="ro" />)
    expect(screen.getByTestId('ro-2').props.accessibilityState).toEqual({ checked: true })
    expect(screen.getByTestId('ro-3').props.accessibilityState).toEqual({ checked: false })
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
