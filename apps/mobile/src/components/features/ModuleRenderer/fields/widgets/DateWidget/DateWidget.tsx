import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, spacing } from '../../../../../../theme'

export function DateWidget() {
  return (
    <View style={styles.chip}>
      <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
      <Text style={styles.value}>jj/mm/aaaa</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignSelf: 'flex-start',
    opacity: 0.75,
  },
  value: { fontSize: 12, color: colors.textMuted },
})
