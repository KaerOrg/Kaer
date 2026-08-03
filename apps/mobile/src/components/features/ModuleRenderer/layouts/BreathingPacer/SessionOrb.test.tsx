import React from 'react'
import { Animated } from 'react-native'
import { render } from '@testing-library/react-native'
import { SessionOrb } from './SessionOrb'

const base = {
  phaseType: 'inhale' as const, phaseInstance: 0, remainingInPhase: 5, running: true,
}

describe('SessionOrb', () => {
  afterEach(() => jest.restoreAllMocks())

  it('anime par l’API Animated, jamais par un tick d’une seconde', () => {
    const timing = jest.spyOn(Animated, 'timing')
    const setInterval = jest.spyOn(global, 'setInterval')
    render(<SessionOrb {...base} />)
    expect(timing).toHaveBeenCalled()
    expect(setInterval).not.toHaveBeenCalled()
  })

  it('utilise le driver natif (l’animation ne passe pas par le thread JS)', () => {
    const timing = jest.spyOn(Animated, 'timing')
    render(<SessionOrb {...base} />)
    for (const call of timing.mock.calls) {
      expect(call[1].useNativeDriver).toBe(true)
    }
  })

  it('joue l’inspiration sur la durée restante de la phase', () => {
    const timing = jest.spyOn(Animated, 'timing')
    render(<SessionOrb {...base} remainingInPhase={4} />)
    expect(timing.mock.calls[0][1]).toMatchObject({ toValue: 1, duration: 4000 })
  })

  it('rétrécit l’orbe à l’expiration, sans la faire disparaître', () => {
    const timing = jest.spyOn(Animated, 'timing')
    render(<SessionOrb {...base} phaseType="exhale" />)
    expect(timing.mock.calls[0][1].toValue).toBeGreaterThan(0.5)
    expect(timing.mock.calls[0][1].toValue).toBeLessThan(1)
  })

  it('tient la taille avec une pulsation pendant une rétention', () => {
    const loop = jest.spyOn(Animated, 'loop')
    render(<SessionOrb {...base} phaseType="hold_in" />)
    expect(loop).toHaveBeenCalled()
  })

  it('ne relance pas l’animation quand seul le décompte change', () => {
    const timing = jest.spyOn(Animated, 'timing')
    const { rerender } = render(<SessionOrb {...base} remainingInPhase={5} />)
    const initial = timing.mock.calls.length
    rerender(<SessionOrb {...base} remainingInPhase={4} />)
    rerender(<SessionOrb {...base} remainingInPhase={3} />)
    expect(timing.mock.calls.length).toBe(initial)
  })

  it('relance l’animation au changement d’instance de phase', () => {
    const timing = jest.spyOn(Animated, 'timing')
    const { rerender } = render(<SessionOrb {...base} phaseInstance={0} />)
    const initial = timing.mock.calls.length
    rerender(<SessionOrb {...base} phaseInstance={1} phaseType="exhale" />)
    expect(timing.mock.calls.length).toBeGreaterThan(initial)
  })

  it('n’anime rien tant que la session est en pause', () => {
    const timing = jest.spyOn(Animated, 'timing')
    render(<SessionOrb {...base} running={false} />)
    expect(timing).not.toHaveBeenCalled()
  })
})
