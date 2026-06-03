import React from 'react'
import { render } from '@testing-library/react-native'

jest.mock('react-native-svg', () => {
  const React = require('react')
  const { View, Text } = require('react-native')
  const stub = ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children)
  return {
    __esModule: true, default: stub, Svg: stub, Polyline: stub, Circle: stub, Line: stub,
    Text: ({ children }: { children?: React.ReactNode }) => React.createElement(Text, null, children),
  }
})

import { LineChart } from './LineChart'
import type { DataPoint, XLabel } from './chartTypes'

const POINTS: DataPoint[] = [
  { value: 2, hasValue: true },
  { value: 1, hasValue: true },
  { value: 0, hasValue: false },
  { value: 3, hasValue: true },
]
const LABELS: XLabel[] = [{ index: 0, label: '01' }, { index: 3, label: '04' }]

describe('LineChart (mobile)', () => {
  it('retourne null pour un tableau vide', () => {
    const { toJSON } = render(<LineChart points={[]} color="#8B5CF6" xLabels={[]} />)
    expect(toJSON()).toBeNull()
  })

  it('rend sans erreur avec des points valides et étiquettes', () => {
    const { toJSON } = render(<LineChart points={POINTS} color="#8B5CF6" xLabels={LABELS} />)
    expect(toJSON()).toBeTruthy()
  })

  it('rend avec un seul point (pas de crash)', () => {
    const { toJSON } = render(
      <LineChart points={[{ value: 2, hasValue: true }]} color="#EC4899" xLabels={[]} />
    )
    expect(toJSON()).toBeTruthy()
  })

  it('accepte maxY personnalisé', () => {
    const { toJSON } = render(<LineChart points={POINTS} color="#3B82F6" xLabels={LABELS} maxY={10} />)
    expect(toJSON()).toBeTruthy()
  })
})
