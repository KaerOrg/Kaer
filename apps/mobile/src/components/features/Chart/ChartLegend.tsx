import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, spacing } from '../../../theme'

export interface ChartLegendProps {
  accentColor?: string
}

// Légende pour DesensitizationChart : point = séance réalisée, dash = SUDs
// initial estimé (ligne de référence pointillée).
export function ChartLegend({ accentColor = colors.primary }: ChartLegendProps) {
  const { t } = useTranslation()
  return (
    <View style={styles.row}>
      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
        <Text style={styles.label}>{t('common.chart_legend.sessions')}</Text>
      </View>
      <View style={styles.item}>
        <View style={[styles.dash, { borderColor: accentColor }]} />
        <Text style={styles.label}>{t('common.chart_legend.initial_suds')}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xs },
  item: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dash: {
    width: 16,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  label: { fontSize: 11, color: colors.textMuted },
})
