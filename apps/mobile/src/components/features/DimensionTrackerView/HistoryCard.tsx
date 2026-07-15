import React, { useCallback, useMemo } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing, radius } from '@theme'
import { formatDateLong } from '../../../lib/dateUtils'
import type { ScaleEntry } from '../../../lib/database'
import { DimensionFingerprint, type FingerprintBar } from '../DimensionFingerprint'

// ─── Carte d'une saisie dans l'historique ───────────────────────────────────
//
// Deux rendus, pilotés par `kind` :
//   - 'fingerprint' : empreinte 6 barres (mood_tracker) — aucune moyenne globale.
//   - 'score'       : score calculé + chips (medication_side_effects, legacy).
// Composant mémoïsé à callbacks stables (item de liste).

export type HistoryCardKind = 'score' | 'fingerprint'

export interface HistoryCardProps {
  readonly entry: ScaleEntry
  readonly kind: HistoryCardKind
  readonly dimensionKeys: readonly string[]
  /** Libellés courts par dimension (chips / barres). */
  readonly labels: Record<string, string>
  /** Teinte de barre (fill) par dimension. */
  readonly fills: Record<string, string>
  /** Teinte de chip (mi-teinte) par dimension. */
  readonly colors: Record<string, string>
  readonly yMax: number
  readonly accentColor: string
  /** Rendu 'score' uniquement. */
  readonly scoreLabel?: string
  readonly scoreMax?: string
  readonly modifyLabel: string
  readonly deleteLabel: string
  readonly onEdit: (id: string) => void
  readonly onDelete: (id: string) => void
}

export const HistoryCard = React.memo(function HistoryCard({
  entry, kind, dimensionKeys, labels, fills, colors: dimColors, yMax, accentColor,
  scoreLabel, scoreMax, modifyLabel, deleteLabel, onEdit, onDelete,
}: HistoryCardProps) {
  const subs = entry.subscale_scores

  const bars = useMemo<FingerprintBar[]>(
    () => dimensionKeys.map(key => {
      const raw = subs?.[key]
      return {
        key,
        label: labels[key] ?? key,
        value: typeof raw === 'number' ? raw : null,
        color: fills[key] ?? accentColor,
      }
    }),
    [dimensionKeys, subs, labels, fills, accentColor]
  )

  const handleEdit = useCallback(() => onEdit(entry.id), [onEdit, entry.id])
  const handleDelete = useCallback(() => onDelete(entry.id), [onDelete, entry.id])

  return (
    <Pressable
      style={styles.card}
      onPress={handleEdit}
      accessibilityRole="button"
      accessibilityLabel={modifyLabel}
    >
      <View style={styles.main}>
        <Text style={styles.date}>{formatDateLong(entry.created_at)}</Text>

        {kind === 'fingerprint' ? (
          <DimensionFingerprint bars={bars} yMax={yMax} testID={`fingerprint-${entry.id}`} />
        ) : (
          <>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>{scoreLabel}</Text>
              <Text style={[styles.scoreValue, { color: accentColor }]}>
                {Math.round(entry.total_score)}
                <Text style={styles.scoreMax}> {scoreMax}</Text>
              </Text>
            </View>
            {subs != null ? (
              <View style={styles.chips}>
                {dimensionKeys.map(key => {
                  const val = subs[key]
                  if (typeof val !== 'number') return null
                  return (
                    <View key={key} style={styles.chip}>
                      <View style={[styles.chipDot, { backgroundColor: dimColors[key] }]} />
                      <Text style={styles.chipKey}>{labels[key]}</Text>
                      <Text style={styles.chipValue}>{val}</Text>
                    </View>
                  )
                })}
              </View>
            ) : null}
          </>
        )}
      </View>

      <View style={styles.actions}>
        <MaterialCommunityIcons name="pencil-outline" size={17} color={accentColor} />
        <Pressable onPress={handleDelete} hitSlop={8} accessibilityLabel={deleteLabel}>
          <MaterialCommunityIcons name="trash-can-outline" size={17} color={colors.textMuted} />
        </Pressable>
      </View>
    </Pressable>
  )
})

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  main: { flex: 1, gap: 6 },
  date: { fontSize: 14, fontWeight: '600', color: colors.text },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  scoreLabel: { fontSize: 13, color: colors.textMuted },
  scoreValue: { fontSize: 22, fontWeight: '700' },
  scoreMax: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  chips: { flexDirection: 'row', gap: 6, marginTop: 2, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.neutral, borderRadius: radius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipKey: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  chipValue: { fontSize: 11, color: colors.text },
  actions: { flexDirection: 'column', alignItems: 'center', gap: 10, paddingLeft: spacing.sm },
})
