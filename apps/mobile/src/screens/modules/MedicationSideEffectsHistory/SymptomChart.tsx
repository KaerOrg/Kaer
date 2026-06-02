import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../../../theme'
import { computeAvg } from './chartUtils'
import { BarChart, LineChart } from '../../../components/ui/Chart'
import type { DataPoint, XLabel } from '../../../components/ui/Chart'
import type { TimeRange } from './types'

interface Props {
  label: string
  points: DataPoint[]
  color: string
  avgLabel: string
  range: TimeRange
  xLabels: XLabel[]
}

export function SymptomChart({ label, points, color, avgLabel, range, xLabels }: Props) {
  const avg = computeAvg(points)
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
        <Text style={[styles.avg, { color }]}>
          {avg === '—' ? avg : avgLabel.replace('{{value}}', avg)}
        </Text>
      </View>
      {range === '7J'
        ? <BarChart points={points} color={color} xLabels={xLabels} />
        : <LineChart points={points} color={color} xLabels={xLabels} />
      }
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text, lineHeight: 17 },
  avg: { fontSize: 12, fontWeight: '700', flexShrink: 0 },
})
