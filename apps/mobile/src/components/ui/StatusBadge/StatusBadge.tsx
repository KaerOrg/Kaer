import React from 'react'
import { View, Text } from 'react-native'
import { styles, VARIANT_COLORS } from './StatusBadge.styles'
import type { StatusBadgeProps } from './StatusBadge.types'

export const StatusBadge = React.memo(function StatusBadge({ variant = 'neutral', label, value, icon, style }: StatusBadgeProps) {
  const { bg, text } = VARIANT_COLORS[variant]

  return (
    <View style={[styles.container, { backgroundColor: bg }, style]}>
      {icon ? <Text style={[styles.icon, { color: text }]}>{icon}</Text> : null}
      <Text style={[styles.label, { color: text }]}>{label}</Text>
      {value !== undefined ? <Text style={[styles.value, { color: text }]}>{value}</Text> : null}
    </View>
  )
})
