import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { DimensionFingerprint, type FingerprintBar } from './DimensionFingerprint'

const BARS: FingerprintBar[] = [
  { key: 'mood', label: 'Hum', value: 7, color: '#C4B8ED' },
  { key: 'energy', label: 'Éne', value: 6, color: '#F0CE96' },
  { key: 'anxiety', label: 'Str', value: 3, color: '#EDB1B1' },
]

describe('DimensionFingerprint', () => {
  it('rend une barre par dimension avec sa valeur et son libellé court', () => {
    render(<DimensionFingerprint bars={BARS} yMax={10} testID="fp" />)
    expect(screen.getByText('7')).toBeTruthy()
    expect(screen.getByText('6')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('Hum')).toBeTruthy()
    expect(screen.getByText('Éne')).toBeTruthy()
    expect(screen.getByText('Str')).toBeTruthy()
    expect(screen.getByTestId('fp-bar-mood')).toBeTruthy()
    expect(screen.getByTestId('fp-bar-energy')).toBeTruthy()
  })

  it('affiche « - » et une barre nulle pour une dimension non renseignée', () => {
    render(
      <DimensionFingerprint
        bars={[{ key: 'mood', label: 'Hum', value: null, color: '#C4B8ED' }]}
        yMax={10}
        testID="fp"
      />
    )
    expect(screen.getByText('-')).toBeTruthy()
    const bar = screen.getByTestId('fp-bar-mood')
    // Barre de hauteur 0 pour une valeur absente (jamais de fausse magnitude).
    const flat = (Array.isArray(bar.props.style) ? bar.props.style : [bar.props.style]).reduce(
      (acc: Record<string, unknown>, s: Record<string, unknown> | undefined) => ({ ...acc, ...(s ?? {}) }),
      {}
    )
    expect(flat.height).toBe(0)
  })

  it('la barre pleine (valeur = yMax) occupe toute la hauteur de zone', () => {
    render(
      <DimensionFingerprint
        bars={[{ key: 'mood', label: 'Hum', value: 10, color: '#C4B8ED' }]}
        yMax={10}
        barAreaHeight={50}
        testID="fp"
      />
    )
    const bar = screen.getByTestId('fp-bar-mood')
    const flat = (Array.isArray(bar.props.style) ? bar.props.style : [bar.props.style]).reduce(
      (acc: Record<string, unknown>, s: Record<string, unknown> | undefined) => ({ ...acc, ...(s ?? {}) }),
      {}
    )
    expect(flat.height).toBe(50)
  })
})
