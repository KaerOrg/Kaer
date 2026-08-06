import React from 'react'
import { Animated, StyleSheet, type ViewStyle } from 'react-native'
import { render } from '@testing-library/react-native'
import { BreathingPulse } from './BreathingPulse'

describe('BreathingPulse', () => {
  it('anime en boucle par l’API Animated, jamais par un tick d’une seconde', () => {
    const loop = jest.spyOn(Animated, 'loop')
    const setInterval = jest.spyOn(global, 'setInterval')
    render(<BreathingPulse color="#4A9EA3" inhaleSeconds={5} cycleSeconds={10} />)
    expect(loop).toHaveBeenCalled()
    expect(setInterval).not.toHaveBeenCalled()
    loop.mockRestore()
    setInterval.mockRestore()
  })

  it('utilise le driver natif (l’animation ne passe pas par le thread JS)', () => {
    const timing = jest.spyOn(Animated, 'timing')
    render(<BreathingPulse color="#4A9EA3" inhaleSeconds={4} cycleSeconds={11} />)
    for (const call of timing.mock.calls) {
      expect(call[1].useNativeDriver).toBe(true)
    }
    timing.mockRestore()
  })

  it('dimensionne le halo selon la taille demandée', () => {
    const { getByTestId } = render(
      <BreathingPulse color="#4A9EA3" inhaleSeconds={5} cycleSeconds={10} size={96} testID="pulse" />,
    )
    const style = StyleSheet.flatten<ViewStyle>(getByTestId('pulse').props.style)
    expect(style.width).toBe(96)
    expect(style.height).toBe(96)
  })

  it('ne produit pas de durée nulle quand le cycle se réduit à l’inspiration', () => {
    const timing = jest.spyOn(Animated, 'timing')
    render(<BreathingPulse color="#4A9EA3" inhaleSeconds={5} cycleSeconds={5} />)
    for (const call of timing.mock.calls) {
      expect(call[1].duration).toBeGreaterThan(0)
    }
    timing.mockRestore()
  })
})
