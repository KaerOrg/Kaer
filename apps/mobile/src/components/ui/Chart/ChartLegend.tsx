import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, spacing } from '@theme'

export interface ChartLegendProps {
  accentColor?: string
  /** Afficher l'item de la ligne de référence pointillée. Défaut: true. */
  showReference?: boolean
  /** Libellé de la référence (teen-aware). Défaut: clé i18n commune. */
  referenceLabel?: string
}

// Légende pour DesensitizationChart : point = séance réalisée, dash = niveau
// estimé au départ (ligne de référence pointillée, optionnelle).
export function ChartLegend({ accentColor = colors.primary, showReference = true, referenceLabel }: ChartLegendProps) {
  const { t } = useTranslation()
  return (
    <View style={styles.row}>
      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
        <Text style={styles.label}>{t('common.chart_legend.sessions')}</Text>
      </View>
      {showReference ? (
        <View style={styles.item}>
          <View style={[styles.dash, { borderColor: accentColor }]} />
          <Text style={styles.label}>{referenceLabel ?? t('common.chart_legend.initial_suds')}</Text>
        </View>
      ) : null}
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
