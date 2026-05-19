import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing } from '../../../../../../theme'

export function CheckboxWidget() {
  return (
    <View style={styles.row}>
      <Ionicons name="square-outline" size={16} color={colors.border} />
      <Text style={styles.label}>Non accompli</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: 0.7 },
  label: { fontSize: 12, color: colors.textMuted },
})
