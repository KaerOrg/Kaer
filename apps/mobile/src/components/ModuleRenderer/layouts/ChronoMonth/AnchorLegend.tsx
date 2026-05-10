import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, spacing } from '../../../../theme'
import type { AnchorSpec } from './chronoMonthUtils'

interface Props {
  anchors: readonly AnchorSpec[]
}

// Légende des 5 ancrages — couleur + label i18n.
export function AnchorLegend({ anchors }: Props) {
  const { t } = useTranslation()
  return (
    <View style={styles.row}>
      {anchors.map(({ key, labelCode, color }) => (
        <View key={key} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.label}>{t(labelCode)}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 11, color: colors.textMuted },
})
