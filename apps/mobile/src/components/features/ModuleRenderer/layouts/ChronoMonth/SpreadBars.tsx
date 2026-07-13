// ─── SpreadBars — « Écart d'un jour à l'autre · minutes » ────────────────────
//
// Une ligne par repère suivi : pastille couleur d'ancre + libellé + barre GRISE
// NEUTRE proportionnelle à l'écart brut + valeur ±NN. La barre est volontairement
// neutre (aucune teinte de gravité) : conformité MDR 2017/745 — valeur descriptive
// uniquement, jamais un jugement « bon / mauvais ». Présentationnel.

import { memo, useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@theme'

export interface SpreadRow {
  readonly key: string
  readonly color: string
  readonly label: string
  /** Écart-type brut en minutes (valeur descriptive). */
  readonly sdMinutes: number
  /** Nombre de jours renseignés (un repère jamais saisi est masqué). */
  readonly count: number
}

interface Props {
  rows: readonly SpreadRow[]
  title: string
  unit: string
  testID?: string
}

function SpreadBarsBase({ rows, title, unit, testID }: Props) {
  const tracked = useMemo(() => rows.filter(r => r.count >= 1), [rows])
  // Barres proportionnelles au plus grand écart de l'ensemble (échelle relative).
  const maxSd = useMemo(() => Math.max(1, ...tracked.map(r => r.sdMinutes)), [tracked])

  if (tracked.length === 0) return null

  return (
    <View style={styles.wrapper} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      {tracked.map(row => (
        <View key={row.key} style={styles.row} testID={`spread-${row.key}`}>
          <View style={[styles.pill, { backgroundColor: row.color }]} />
          <Text style={styles.label} numberOfLines={1}>{row.label}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${(row.sdMinutes / maxSd) * 100}%` }]} />
          </View>
          <Text style={styles.value}>±{row.sdMinutes}</Text>
        </View>
      ))}
    </View>
  )
}

export const SpreadBars = memo(SpreadBarsBase)

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.xs },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  unit: { fontSize: 12, color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pill: { width: 12, height: 12, borderRadius: 6 },
  label: { width: 92, fontSize: 13, color: colors.text },
  barTrack: { flex: 1, height: 8, borderRadius: radius.full, backgroundColor: colors.neutral, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: radius.full, backgroundColor: colors.neutralBar },
  value: { width: 44, textAlign: 'right', fontSize: 13, color: colors.text, fontVariant: ['tabular-nums'] },
})
