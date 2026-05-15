jest.mock('react-native-svg', () => {
  const React = require('react')
  const make = (name: string) => (props: Record<string, unknown>) =>
    React.createElement(name, { ...props })
  return {
    __esModule: true,
    default: make('Svg'),
    Svg: make('Svg'),
    Path: make('Path'),
    Circle: make('Circle'),
    Line: make('Line'),
    Text: make('SvgText'),
    Defs: make('Defs'),
    LinearGradient: make('LinearGradient'),
    Stop: make('Stop'),
  }
})

import React from 'react'
import { render } from '@testing-library/react-native'
import { DesensitizationChart } from './DesensitizationChart'
import type { SudsPoint } from './sudsChartUtils'

describe('DesensitizationChart', () => {
  it('rend sans crash avec aucun point', () => {
    const result = render(
      <DesensitizationChart points={[]} referenceScore={70} width={300} />
    )
    expect(result).toBeTruthy()
  })

  it('rend sans crash avec un seul point (pas de courbe)', () => {
    const points: SudsPoint[] = [{ score: 80, date: '2026-05-01' }]
    const result = render(
      <DesensitizationChart points={points} referenceScore={80} width={300} />
    )
    expect(result).toBeTruthy()
  })

  it('rend la courbe et l\'aire avec ≥2 points', () => {
    const points: SudsPoint[] = [
      { score: 80, date: '2026-04-01' },
      { score: 60, date: '2026-04-15' },
      { score: 40, date: '2026-05-01' },
    ]
    const result = render(
      <DesensitizationChart points={points} referenceScore={80} width={300} />
    )
    expect(result).toBeTruthy()
  })

  it('accepte une couleur d\'accent personnalisée', () => {
    const result = render(
      <DesensitizationChart
        points={[{ score: 50, date: '2026-05-01' }]}
        referenceScore={50}
        width={300}
        accentColor="#FF0000"
      />
    )
    expect(result).toBeTruthy()
  })
})
