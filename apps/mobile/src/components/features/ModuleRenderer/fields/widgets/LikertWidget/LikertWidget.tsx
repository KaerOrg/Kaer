import React, { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors, radius } from '../../../../../../theme'

export interface LikertOption {
  value: number
  label: string
  color?: string
}

interface Props {
  options: LikertOption[]
  selected: number | null
  onSelect: (value: number) => void
  accentColor?: string
}

export function LikertWidget({ options, selected, onSelect, accentColor }: Props) {
  const activeColor = accentColor ?? colors.primary
  const hasColorPalette = options.some(o => o.color != null)

  const handlePress = useCallback((value: number) => { onSelect(value) }, [onSelect])

  return (
    <View style={styles.row}>
      {options.map(opt => {
        const isSelected = selected === opt.value
        const dotColor = opt.color ?? activeColor
        return (
          <Pressable
            key={opt.value}
            style={[
              styles.option,
              isSelected && {
                backgroundColor: dotColor + '22',
                borderColor: dotColor,
              },
            ]}
            onPress={() => handlePress(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
          >
            {hasColorPalette && (
              <View style={[
                styles.dot,
                { borderColor: dotColor },
                isSelected && { backgroundColor: dotColor },
              ]} />
            )}
            <Text
              style={[
                styles.label,
                isSelected && { color: dotColor, fontWeight: '700' },
              ]}
              numberOfLines={2}
            >
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
    gap: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  label: { fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 15 },
})
