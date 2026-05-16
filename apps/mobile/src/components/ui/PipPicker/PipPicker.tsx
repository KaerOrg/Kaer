import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { styles } from './PipPicker.styles'
import type { PipPickerProps } from './PipPicker.types'

export const PipPicker = React.memo(function PipPicker({
  value,
  steps,
  color,
  label,
  sublabel,
  variant = 'numbered',
  showHeader = true,
  showEndLabels = false,
  onPress,
}: PipPickerProps) {
  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <View>
            <Text style={styles.label}>{label}</Text>
            {sublabel != null && <Text style={styles.sublabel}>{sublabel}</Text>}
          </View>
          {value != null && <Text style={[styles.value, { color }]} testID="pip-header-value">{value}</Text>}
        </View>
      )}

      <View style={variant === 'track' ? styles.track : styles.pips}>
        {steps.map((n) => {
          const selected = value === n
          const filled = variant === 'track' && value != null && n <= value

          return variant === 'track' ? (
            <Pressable
              key={n}
              style={[styles.trackPip, (selected || filled) && { backgroundColor: color }]}
              onPress={() => onPress(n)}
              hitSlop={4}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${label} : ${n}`}
            />
          ) : (
            <Pressable
              key={n}
              style={[styles.numberedPip, selected && { backgroundColor: color, borderColor: color }]}
              onPress={() => onPress(n)}
              hitSlop={4}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${label} : ${n}`}
            >
              <Text style={[styles.pipText, selected && styles.pipTextSelected]}>{n}</Text>
            </Pressable>
          )
        })}
      </View>

      {showEndLabels && steps.length > 0 && (
        <View style={styles.endLabels}>
          <Text style={styles.endLabel}>{steps[0]}</Text>
          <Text style={styles.endLabel}>{steps[steps.length - 1]}</Text>
        </View>
      )}
    </View>
  )
})
