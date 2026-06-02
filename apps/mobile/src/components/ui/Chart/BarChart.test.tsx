import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { BarChart } from './BarChart'
import type { DataPoint, XLabel } from './chartTypes'

const POINTS: DataPoint[] = [
  { value: 3, hasValue: true },
  { value: 0, hasValue: true },
  { value: 0, hasValue: false },
  { value: 2, hasValue: true },
]
const LABELS: XLabel[] = [
  { index: 0, label: 'L' },
  { index: 1, label: 'M' },
  { index: 2, label: 'M' },
  { index: 3, label: 'J' },
]

describe('BarChart (mobile)', () => {
  it('rend sans erreur', () => {
    const { toJSON } = render(<BarChart points={POINTS} color="#8B5CF6" xLabels={LABELS} />)
    expect(toJSON()).toBeTruthy()
  })

  it('affiche les étiquettes d\'axe X', () => {
    render(<BarChart points={POINTS} color="#8B5CF6" xLabels={LABELS} />)
    expect(screen.getByText('L')).toBeTruthy()
    expect(screen.getByText('J')).toBeTruthy()
  })

  it('affiche la valeur au-dessus des barres non nulles', () => {
    render(<BarChart points={POINTS} color="#8B5CF6" xLabels={LABELS} />)
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
  })

  it('n\'affiche pas "0" comme valeur', () => {
    render(<BarChart points={POINTS} color="#8B5CF6" xLabels={LABELS} />)
    expect(screen.queryByText('0')).toBeNull()
  })

  it('accepte maxBarHeight et maxY personnalisés', () => {
    const { toJSON } = render(
      <BarChart points={POINTS} color="#EC4899" xLabels={LABELS} maxBarHeight={64} maxY={10} />
    )
    expect(toJSON()).toBeTruthy()
  })
})
