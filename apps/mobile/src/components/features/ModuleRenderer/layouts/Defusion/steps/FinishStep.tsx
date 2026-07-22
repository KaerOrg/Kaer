import React, { useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { Button } from '@ui/Button'
import { colors, spacing, radius } from '@theme'
import type { DefusionMeasure } from '../defusionReaderMachine'

export interface FinishStepLabels {
  title: string
  colBefore: string
  colAfter: string
  rowDiscomfort: string
  rowBelief: string
  durationLabel: string
  note: string
  closeLabel: string
  redoLabel: string
  skipped: string
}

export interface FinishStepProps {
  before: DefusionMeasure | null
  after: DefusionMeasure | null
  /** Durée en secondes (0 = distanciation, sans minuteur → ligne durée masquée). */
  durationSeconds: number
  accent: string
  labels: FinishStepLabels
  onClose: () => void
  onRedo: () => void
}

/**
 * Étape E — écran de fin. Les 4 chiffres bruts côte à côte (grille Avant / Après),
 * la durée, rien d'autre. MDR 2017/745 : AUCUN écart calculé, aucune flèche, aucune
 * couleur conditionnelle — tous les chiffres au même style `colors.text`. Une mesure
 * passée s'affiche « - » (jamais un 0 implicite).
 */
export function FinishStep({
  before, after, durationSeconds, accent, labels, onClose, onRedo,
}: FinishStepProps) {
  const cell = useCallback(
    (value: number | null): string => (value === null ? labels.skipped : String(value)),
    [labels.skipped],
  )
  const accentBtnStyle = useMemo(() => ({ backgroundColor: accent }), [accent])

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{labels.title}</Text>

      <View style={styles.grid}>
        <View style={styles.headerRow}>
          <View style={styles.rowLabelCell} />
          <Text style={styles.colHeader}>{labels.colBefore}</Text>
          <Text style={styles.colHeader}>{labels.colAfter}</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.rowLabel}>{labels.rowDiscomfort}</Text>
          <Text style={styles.value} testID="finish-discomfort-before">{cell(before?.discomfort ?? null)}</Text>
          <Text style={styles.value} testID="finish-discomfort-after">{cell(after?.discomfort ?? null)}</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.rowLabel}>{labels.rowBelief}</Text>
          <Text style={styles.value} testID="finish-belief-before">{cell(before?.belief ?? null)}</Text>
          <Text style={styles.value} testID="finish-belief-after">{cell(after?.belief ?? null)}</Text>
        </View>
      </View>

      {durationSeconds > 0 ? (
        <Text style={styles.duration}>{labels.durationLabel}{durationSeconds}s</Text>
      ) : null}

      <Text style={styles.note}>{labels.note}</Text>

      <View style={styles.actions}>
        <Button variant="primary" style={accentBtnStyle} label={labels.closeLabel} onPress={onClose} />
        <Button variant="ghost" label={labels.redoLabel} onPress={onRedo} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' },
  grid: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  rowLabelCell: { flex: 1.4 },
  colHeader: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.textMuted, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  dataRow: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { flex: 1.4, flexShrink: 1, fontSize: 14, color: colors.text },
  // MDR : même style pour TOUS les chiffres, avant comme après — pas de couleur selon la valeur.
  value: { flex: 1, fontSize: 26, fontWeight: '700', color: colors.text, textAlign: 'center' },
  duration: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  note: { fontSize: 12, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 },
  actions: { gap: spacing.sm },
})
