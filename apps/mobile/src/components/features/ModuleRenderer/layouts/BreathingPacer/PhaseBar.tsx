import React from 'react'
import { View, StyleSheet } from 'react-native'
import { colors, radius } from '@theme'
import type { BreathingPhase } from '@services/breathingService'

export interface PhaseBarProps {
  phases: BreathingPhase[]
  currentPhaseIndex: number
  color: string
}

/** Barre segmentée des phases du cycle : segment courant plein, phases passées atténuées. */
export const PhaseBar = React.memo(function PhaseBar({
  phases,
  currentPhaseIndex,
  color,
}: PhaseBarProps) {
  return (
    <View style={styles.container} testID="phase-bar">
      {phases.map((phase, i) => (
        <View
          key={i}
          testID={`phase-segment-${i}`}
          style={[
            styles.segment,
            { flex: phase.seconds },
            i === currentPhaseIndex && { backgroundColor: color },
            i < currentPhaseIndex && { backgroundColor: color + '55' },
          ]}
        />
      ))}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: colors.border,
    gap: 2,
  },
  segment: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
})
