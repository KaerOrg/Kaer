import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { Button } from '@ui/Button'
import { colors, spacing, radius } from '@theme'

export interface LinguisticDistancingExerciseProps {
  /** Les trois paliers déjà interpolés avec la pensée (« … » → « J'ai la pensée que … »). */
  paliers: string[]
  accent: string
  instruction: string
  nextLabel: string
  finishLabel: string
  /** L'exercice n'a pas de minuteur : durée toujours 0. */
  onDone: (durationSeconds: number) => void
}

/**
 * Étape C (distanciation) — trois paliers de reformulation, SANS minuteur.
 * Les paliers lus restent empilés ; seul le palier actif est accentué ; le palier
 * suivant est esquissé en pointillés, sans contenu. Avancement au bouton.
 */
export function LinguisticDistancingExercise({
  paliers, accent, instruction, nextLabel, finishLabel, onDone,
}: LinguisticDistancingExerciseProps) {
  const [active, setActive] = useState(0)
  const isLast = active >= paliers.length - 1

  const handleNext = useCallback(() => {
    if (isLast) { onDone(0); return }
    setActive((i) => i + 1)
  }, [isLast, onDone])

  const accentBtnStyle = useMemo(() => ({ backgroundColor: accent }), [accent])

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.instruction}>{instruction}</Text>

      <View style={styles.stack}>
        {paliers.map((text, index) => {
          if (index > active) return null
          const isActive = index === active
          return (
            <View
              key={index}
              style={[styles.palier, isActive && { borderColor: accent, borderWidth: 2 }]}
            >
              <Text style={[styles.palierText, isActive && styles.palierTextActive]}>{text}</Text>
            </View>
          )
        })}

        {/* Palier suivant esquissé (pointillés, sans contenu) tant qu'il en reste. */}
        {!isLast ? <View style={styles.palierGhost} /> : null}
      </View>

      <Button
        variant="primary"
        style={accentBtnStyle}
        label={isLast ? finishLabel : nextLabel}
        onPress={handleNext}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  instruction: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  stack: { gap: spacing.sm },
  palier: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  palierText: { fontSize: 16, color: colors.textMuted, lineHeight: 24 },
  palierTextActive: { color: colors.text, fontWeight: '600' },
  palierGhost: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
})
