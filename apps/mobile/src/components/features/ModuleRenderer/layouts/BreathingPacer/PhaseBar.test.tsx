import React from 'react'
import { StyleSheet } from 'react-native'
import { render } from '@testing-library/react-native'
import { PhaseBar } from './PhaseBar'
import type { BreathingPhase } from '@services/breathingService'

const PHASES: BreathingPhase[] = [
  { type: 'inhale', seconds: 4 },
  { type: 'hold_in', seconds: 4 },
  { type: 'exhale', seconds: 4 },
  { type: 'hold_out', seconds: 4 },
]

describe('PhaseBar', () => {
  it('rend un segment par phase', () => {
    const { getAllByTestId } = render(<PhaseBar phases={PHASES} currentPhaseIndex={0} color="#D97706" />)
    expect(getAllByTestId(/^phase-segment-/).length).toBe(PHASES.length)
  })

  it('met en évidence le segment de la phase courante via la couleur fournie', () => {
    const { getByTestId } = render(<PhaseBar phases={PHASES} currentPhaseIndex={1} color="#D97706" />)
    const style = StyleSheet.flatten(getByTestId('phase-segment-1').props.style)
    expect(style.backgroundColor).toBe('#D97706')
  })
})
