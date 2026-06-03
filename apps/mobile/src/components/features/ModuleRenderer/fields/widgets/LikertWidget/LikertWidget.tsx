import React, { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors, radius } from '../../../../../../theme'

export interface LikertOption {
  value: number
  label: string
}

interface Props {
  options: LikertOption[]
  selected: number | null
  onSelect: (value: number) => void
  accentColor?: string
}

export function LikertWidget({ options, selected, onSelect, accentColor }: Props) {
  const activeColor = accentColor ?? colors.primary

  const handlePress = useCallback((value: number) => { onSelect(value) }, [onSelect])

  return (
    <View style={styles.row}>
      {options.map(opt => {
        const isSelected = selected === opt.value
        return (
          <Pressable
            key={opt.value}
            style={[
              styles.option,
              isSelected && { backgroundColor: activeColor, borderColor: activeColor },
            ]}
            onPress={() => handlePress(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]} numberOfLines={2}>
              {opt.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  option: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  label: { fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 15 },
  labelSelected: { color: colors.white, fontWeight: '600' },
})
