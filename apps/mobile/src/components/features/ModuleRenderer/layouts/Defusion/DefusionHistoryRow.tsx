import React, { useCallback } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Button } from '@ui/Button'
import { colors, spacing, radius } from '@theme'

export interface DefusionHistoryRowProps {
  id: string
  techniqueName: string
  dotColor: string
  durationSeconds: number
  dateLabel: string
  /** Ligne « Inconfort 8 puis 5 · Conviction … » ou « - (mesures passées) ». */
  measuresText: string
  word: string
  revealed: boolean
  revealLabel: string
  onReveal: (id: string) => void
}

/**
 * Une ligne de l'historique de défusion (mémoïsée). Le mot n'est rendu que si la
 * ligne est révélée ; sinon un bouton propose de l'afficher. Le callback de
 * révélation est stabilisé ici (composant d'item dédié — cf. règle listes).
 */
export const DefusionHistoryRow = React.memo(function DefusionHistoryRow({
  id, techniqueName, dotColor, durationSeconds, dateLabel, measuresText,
  word, revealed, revealLabel, onReveal,
}: DefusionHistoryRowProps) {
  const handleReveal = useCallback(() => onReveal(id), [onReveal, id])

  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={styles.technique}>{techniqueName}</Text>
        {durationSeconds > 0 ? <Text style={styles.meta}>{durationSeconds}s</Text> : null}
        <Text style={styles.meta}>{dateLabel}</Text>
      </View>

      <Text style={styles.measures}>{measuresText}</Text>

      {revealed ? (
        <Text style={styles.word} testID={`defusion-word-${id}`}>{word}</Text>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          label={revealLabel}
          onPress={handleReveal}
          testID={`defusion-reveal-${id}`}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  technique: { flex: 1, flexShrink: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted },
  measures: { fontSize: 13, color: colors.text },
  word: { fontSize: 15, color: colors.text, fontWeight: '600' },
})
