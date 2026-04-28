import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing } from '../../../../../theme'

interface Props { text?: string }

export function InfoWidget({ text }: Props) {
  return (
    <View style={styles.row}>
      <Ionicons name="reorder-four-outline" size={11} color={colors.textMuted} />
      {text ? <Text style={styles.label}>{text}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  label: { flex: 1, fontSize: 11, color: colors.textMuted, fontStyle: 'italic', lineHeight: 16 },
})
