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
  }
})

import React from 'react'
import { render } from '@testing-library/react-native'
import { SudsSparkline } from './SudsSparkline'
import type { SudsPoint } from './sudsChartUtils'

describe('SudsSparkline', () => {
  it('ne rend rien si aucun point', () => {
    const { toJSON } = render(<SudsSparkline points={[]} width={120} />)
    expect(toJSON()).toBeNull()
  })

  it('rend un point unique sans courbe', () => {
    const points: SudsPoint[] = [{ score: 60 }]
    const result = render(<SudsSparkline points={points} width={120} />)
    expect(result).toBeTruthy()
  })

  it('limite l\'affichage aux 5 derniers points', () => {
    const points: SudsPoint[] = Array.from({ length: 8 }, (_, i) => ({
      score: 80 - i * 5,
    }))
    const result = render(<SudsSparkline points={points} width={120} />)
    expect(result).toBeTruthy()
  })
})
