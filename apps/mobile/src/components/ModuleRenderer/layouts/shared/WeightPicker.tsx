import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing } from '../../../../theme'

export interface WeightPickerProps {
  value: number
  min: number
  max: number
  accentColor: string
  onChange: (v: number) => void
  /** Accessibility label of the picker (e.g. "Importance: 3 / 5") */
  ariaLabel?: string
  /** Optional testID prefix — each star becomes `${testIdPrefix}-${n}` */
  testIdPrefix?: string
}

/**
 * Generic 1..N stars/dots rating picker. Pure UI — caller owns the value.
 * Used by editable lists where each item has an optional importance weight.
 */
export function WeightPicker({ value, min, max, accentColor, onChange, ariaLabel, testIdPrefix }: WeightPickerProps) {
  const range: number[] = []
  for (let n = min; n <= max; n += 1) range.push(n)
  return (
    <View style={styles.row} accessibilityLabel={ariaLabel}>
      {range.map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(n)}
          hitSlop={6}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === n }}
          accessibilityLabel={`${n}`}
          testID={testIdPrefix ? `${testIdPrefix}-${n}` : undefined}
        >
          <MaterialCommunityIcons
            name={n <= value ? 'star' : 'star-outline'}
            size={20}
            color={n <= value ? accentColor : colors.border}
          />
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2, marginTop: spacing.xs },
})
