import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { DataPoint, XLabel } from './chartUtils'

const BAR_H = 48

interface Props {
  points: DataPoint[]
  color: string
  xLabels: XLabel[]
  /** Valeur maximale de l'axe Y (3 pour effets secondaires, 10 pour mood tracker) */
  yMax?: number
}

export function BarChart({ points, color, xLabels, yMax = 10 }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.topLabels}>
        {points.map((p, i) => (
          <View key={i} style={styles.topCell}>
            {p.hasValue && p.value > 0 && (
              <Text style={[styles.valueLabel, { color }]}>
                {Number.isInteger(p.value) ? p.value : p.value.toFixed(1)}
              </Text>
            )}
          </View>
        ))}
      </View>
      <View style={styles.row}>
        {points.map((p, i) => {
          const h = !p.hasValue || p.value === 0 ? 2 : Math.max(4, (p.value / yMax) * BAR_H)
          return (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: h,
                  backgroundColor: p.hasValue && p.value > 0 ? color : '#D1D5DB',
                  opacity: p.hasValue ? 1 : 0.4,
                },
              ]}
            />
          )
        })}
      </View>
      <View style={styles.bottomLabels}>
        {points.map((_, i) => (
          <View key={i} style={styles.bottomCell}>
            <Text style={styles.dateLabel}>{xLabels[i]?.label ?? ''}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: 2 },
  topLabels: { flexDirection: 'row', height: 13 },
  topCell: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  valueLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: BAR_H },
  bar: { flex: 1, borderRadius: 2 },
  bottomLabels: { flexDirection: 'row', marginTop: 3 },
  bottomCell: { flex: 1, alignItems: 'center' },
  dateLabel: { fontSize: 9, color: '#9CA3AF', textAlign: 'center' },
})
