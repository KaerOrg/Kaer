import React from 'react'
import { render, screen } from '@testing-library/react-native'

jest.mock('react-native-svg', () => {
  const React = require('react')
  const { View, Text } = require('react-native')
  const stub = ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children)
  return {
    __esModule: true, default: stub, Svg: stub, Polyline: stub, Circle: stub, Line: stub,
    Text: ({ children }: { children?: React.ReactNode }) => React.createElement(Text, null, children),
  }
})

jest.mock('@theme', () => ({
  colors: { card: '#fff', border: '#ccc', text: '#111', textMuted: '#999' },
  spacing: { xs: 4, sm: 8 },
  radius: { md: 8 },
}))

import { DimensionChart } from './DimensionChart'
import type { DataPoint } from './chartUtils'

const POINTS: DataPoint[] = [
  { value: 7, hasValue: true },
  { value: 0, hasValue: false },
  { value: 5, hasValue: true },
]

describe('DimensionChart', () => {
  it('affiche le libellé et la moyenne formatée', () => {
    render(
      <DimensionChart label="Humeur" points={POINTS} color="#8B5CF6"
        avgLabel="moy {{value}}" range="1M" xLabels={[]} yMax={10} />
    )
    expect(screen.getByText('Humeur')).toBeTruthy()
    expect(screen.getByText('moy 6.0')).toBeTruthy() // (7+5)/2
  })

  it('affiche un tiret quand aucune valeur', () => {
    render(
      <DimensionChart label="Énergie" points={[{ value: 0, hasValue: false }]} color="#F59E0B"
        avgLabel="moy {{value}}" range="1M" xLabels={[]} yMax={10} />
    )
    expect(screen.getByText('—')).toBeTruthy()
  })

  it('rend sans erreur en mode barres (7J)', () => {
    const { toJSON } = render(
      <DimensionChart label="Sommeil" points={POINTS} color="#0EA5E9"
        avgLabel="moy {{value}}" range="7J" xLabels={[]} yMax={10} />
    )
    expect(toJSON()).toBeTruthy()
  })
})
