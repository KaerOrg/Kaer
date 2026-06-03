import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../../../../theme'
import type { TimeRange } from './chartUtils'

interface Props {
  value: TimeRange
  onChange: (r: TimeRange) => void
  ranges: readonly TimeRange[]
  labels: Record<string, string>
  color: string
}

export function RangeSelector({ value, onChange, ranges, labels, color }: Props) {
  return (
    <View style={styles.row}>
      {ranges.map(r => (
        <Pressable
          key={r}
          style={[styles.btn, value === r && { backgroundColor: color, borderColor: color }]}
          onPress={() => onChange(r)}
        >
          <Text style={[styles.label, value === r && styles.labelActive]}>
            {labels[r] ?? r}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  btn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  labelActive: { color: colors.white },
})
