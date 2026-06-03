import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { colors, spacing, radius } from '../../../theme'
import type { PillSelectorProps } from './PillSelector.types'

/**
 * Sélecteur à pilules — une option active à la fois, couleur d'accent configurable.
 * Réutilisable pour tout filtre temporel, de catégorie, ou de période.
 */
export function PillSelector({ options, value, onChange, labels, color = colors.primary }: PillSelectorProps) {
  return (
    <View style={styles.row}>
      {options.map(opt => (
        <Pressable
          key={opt}
          style={[styles.pill, value === opt && { backgroundColor: color, borderColor: color }]}
          onPress={() => onChange(opt)}
          accessibilityRole="button"
          accessibilityState={{ selected: value === opt }}
        >
          <Text style={[styles.label, value === opt && styles.labelActive]}>
            {labels[opt] ?? opt}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row:         { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  label:       { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  labelActive: { color: colors.white },
})
