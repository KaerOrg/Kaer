import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../../../../theme'
import { LineChart } from './LineChart'
import { BarChart } from './BarChart'
import { computeAvg } from './chartUtils'
import type { DataPoint, XLabel, TimeRange } from './chartUtils'

interface Props {
  label: string
  points: DataPoint[]
  color: string
  avgLabel: string
  range: TimeRange
  xLabels: XLabel[]
  yMax?: number
}

export function DimensionChart({ label, points, color, avgLabel, range, xLabels, yMax = 10 }: Props) {
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
        ? <BarChart points={points} color={color} xLabels={xLabels} yMax={yMax} />
        : <LineChart points={points} color={color} xLabels={xLabels} yMax={yMax} />
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
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 17,
  },
  avg: { fontSize: 12, fontWeight: '700', flexShrink: 0 },
})
