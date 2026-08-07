import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { ProgressBar } from './ProgressBar'

/** Largeur de la portion remplie, telle que rendue (l'enfant unique de la piste). */
function fillWidth(testID: string): unknown {
  const track = screen.getByTestId(testID)
  const fill = track.children[0] as { props: { style: { width?: unknown } } }
  return fill.props.style.width
}

describe('ProgressBar', () => {
  it('remplit la fraction demandée', () => {
    render(<ProgressBar value={8} max={10} testID="bar" />)
    expect(fillWidth('bar')).toBe('80%')
  })

  it('borne une valeur au-dessus du maximum', () => {
    render(<ProgressBar value={42} max={10} testID="bar" />)
    expect(fillWidth('bar')).toBe('100%')
  })

  it('borne une valeur négative à zéro', () => {
    render(<ProgressBar value={-3} max={10} testID="bar" />)
    expect(fillWidth('bar')).toBe('0%')
  })

  it('ne divise pas par zéro quand max vaut 0', () => {
    render(<ProgressBar value={5} max={0} testID="bar" />)
    expect(fillWidth('bar')).toBe('0%')
  })

  it('expose la progression à l\'accessibilité', () => {
    render(<ProgressBar value={3} max={10} testID="bar" />)
    const bar = screen.getByTestId('bar')
    expect(bar.props.accessibilityRole).toBe('progressbar')
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 10, now: 3 })
  })

  it('utilise 100 comme maximum par défaut', () => {
    render(<ProgressBar value={25} testID="bar" />)
    expect(fillWidth('bar')).toBe('25%')
  })
})
