import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { spacing } from '@theme'
import type { BreathingPhase } from '../../../services/breathingService'

export interface BreathCircleProps {
  phase: BreathingPhase
  progress: number // 0 → 1 au sein de la phase courante
  color: string
  countdown: number
}

// ─── Cercle animé ─────────────────────────────────────────────────────────────
// Animation pure JS — pas de bibliothèque d'animation requise.
// Le cercle scale entre 0.55 (expiration/pause) et 1.0 (inspiration complète).

/** Cercle de respiration : grossit à l'inspiration, rétrécit à l'expiration, stable en rétention. */
export const BreathCircle = React.memo(function BreathCircle({
  phase,
  progress,
  color,
  countdown,
}: BreathCircleProps) {
  const { t } = useTranslation()
  // Scale : inspiration → grandit, expiration → rétrécit, rétentions → stable
  const getScale = () => {
    switch (phase.type) {
      case 'inhale':    return 0.55 + 0.45 * progress
      case 'hold_in':   return 1.0
      case 'exhale':    return 1.0 - 0.45 * progress
      case 'hold_out':  return 0.55
    }
  }

  const scale = getScale()
  const size = 220
  const innerSize = size * scale

  return (
    <View style={[styles.outer, { width: size, height: size, borderColor: color + '33' }]}>
      <View
        style={[
          styles.inner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: color + '22',
            borderColor: color,
          },
        ]}
      >
        <Text style={[styles.countdown, { color }]}>{countdown}</Text>
        <Text style={[styles.phaseLabel, { color }]}>{t(`modules.breathing_techniques.phase_${phase.type}`)}</Text>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  outer: {
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  countdown: { fontSize: 40, fontWeight: '800' },
  phaseLabel: { fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: spacing.sm },
})
