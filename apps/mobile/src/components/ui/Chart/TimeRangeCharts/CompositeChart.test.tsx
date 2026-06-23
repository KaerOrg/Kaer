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

import { CompositeChart } from './CompositeChart'
import type { DataPoint } from './chartUtils'

const AVG: DataPoint[] = [
  { value: 6, hasValue: true },
  { value: 7, hasValue: true },
]
const SERIES = [
  { key: 'mood', label: 'Humeur', color: '#8B5CF6', points: AVG },
  { key: 'energy', label: 'Énergie', color: '#F59E0B', points: AVG },
]

describe('CompositeChart', () => {
  it('retourne null quand aucun point moyen', () => {
    const { toJSON } = render(
      <CompositeChart series={[]} avgPoints={[]} xLabels={[]} avgLabel="moy {{value}}" legendLabel="Vue d'ensemble" />
    )
    expect(toJSON()).toBeNull()
  })

  it('affiche le titre et les libellés de séries', () => {
    render(
      <CompositeChart series={SERIES} avgPoints={AVG} xLabels={[]}
        avgLabel="moy {{value}}" legendLabel="Vue d'ensemble" yMax={10} />
    )
    expect(screen.getByText("Vue d'ensemble")).toBeTruthy()
    expect(screen.getByText('Humeur')).toBeTruthy()
    expect(screen.getByText('Énergie')).toBeTruthy()
    expect(screen.getByText('moy 6.5')).toBeTruthy()
  })

  it('rend les repères temporels fournis', () => {
    const { toJSON } = render(
      <CompositeChart series={SERIES} avgPoints={AVG} xLabels={[]}
        avgLabel="moy {{value}}" legendLabel="Vue" yMax={10}
        markers={[{ id: 'm1', index: 1, fraction: 0.5 }]} />
    )
    expect(toJSON()).toBeTruthy()
  })
})
