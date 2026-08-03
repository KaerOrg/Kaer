import React from 'react'
import { StyleSheet, type ViewStyle } from 'react-native'
import { render } from '@testing-library/react-native'
import { ProgressBar, type ProgressBarProps } from './ProgressBar'

/** Largeur de remplissage effectivement appliquée, aplatie depuis le style du fill. */
function fillWidth(props: ProgressBarProps): ViewStyle['width'] {
  const { getByTestId } = render(<ProgressBar {...props} testID="pb" />)
  return StyleSheet.flatten<ViewStyle>(getByTestId('pb-fill').props.style).width
}

describe('ProgressBar', () => {
  it('remplit au prorata de value / max', () => {
    expect(fillWidth({ value: 3, max: 5 })).toBe('60%')
  })

  it('borne à 100 % quand la valeur dépasse le max', () => {
    expect(fillWidth({ value: 9, max: 5 })).toBe('100%')
  })

  it('borne à 0 % pour une valeur négative', () => {
    expect(fillWidth({ value: -2, max: 5 })).toBe('0%')
  })

  it('reste à 0 % si max vaut 0 (aucune division par zéro)', () => {
    expect(fillWidth({ value: 3, max: 0 })).toBe('0%')
  })

  it('expose la valeur à l’accessibilité', () => {
    const { getByTestId } = render(
      <ProgressBar value={3} max={5} accessibilityLabel="3 sur 5 sessions" testID="pb" />,
    )
    const bar = getByTestId('pb')
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 5, now: 3 })
    expect(bar.props.accessibilityLabel).toBe('3 sur 5 sessions')
  })
})
