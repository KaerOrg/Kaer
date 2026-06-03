import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../../../theme'
import type { DataPoint, XLabel } from './chartUtils'

export interface BarChartProps {
  points: DataPoint[]
  color: string
  xLabels: XLabel[]
  /** Hauteur max des barres en pixels (défaut 48). */
  maxBarHeight?: number
  /** Valeur max de l'axe Y pour normaliser (défaut 3). */
  maxY?: number
}

/**
 * Graphique en barres verticales — valeurs au-dessus, étiquettes de date en-dessous.
 * Barres absentes (`hasValue: false`) rendues comme trait grisé minimal.
 * Primitif pur, aucune logique métier.
 */
export function BarChart({ points, color, xLabels, maxBarHeight = 48, maxY = 3 }: BarChartProps) {
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

      <View style={[styles.row, { height: maxBarHeight }]}>
        {points.map((p, i) => {
          const h = !p.hasValue || p.value === 0
            ? 2
            : Math.max(4, (p.value / maxY) * maxBarHeight)
          return (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: h,
                  backgroundColor: p.hasValue && p.value > 0 ? color : colors.border,
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
  wrapper:      { gap: 2 },
  topLabels:    { flexDirection: 'row', height: 13 },
  topCell:      { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  valueLabel:   { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  row:          { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar:          { flex: 1, borderRadius: 2 },
  bottomLabels: { flexDirection: 'row', marginTop: 3 },
  bottomCell:   { flex: 1, alignItems: 'center' },
  dateLabel:    { fontSize: 9, color: colors.textMuted, textAlign: 'center' },
})
