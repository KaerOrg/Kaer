import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../../../../theme'

interface Props { spec: string }

export function StarsWidget({ spec }: Props) {
  const max = Number(spec.split(':')[1] ?? 5)
  const filled = Math.ceil(max / 2)
  return (
    <View style={styles.row}>
      {Array.from({ length: max }, (_, i) => (
        <Ionicons
          key={i}
          name={i < filled ? 'star' : 'star-outline'}
          size={14}
          color={i < filled ? colors.stars : colors.border}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
})
