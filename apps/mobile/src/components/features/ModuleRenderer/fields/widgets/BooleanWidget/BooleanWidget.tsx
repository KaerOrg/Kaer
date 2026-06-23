import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radius } from '@theme'

export function BooleanWidget() {
  return (
    <View style={styles.row}>
      <View style={[styles.option, styles.active]}>
        <Text style={[styles.label, styles.activeLabel]}>Non</Text>
      </View>
      <View style={styles.option}>
        <Text style={styles.label}>Oui</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row:         { flexDirection: 'row', gap: 6 },
  option:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  active:      { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  label:       { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  activeLabel: { color: colors.primary },
})
