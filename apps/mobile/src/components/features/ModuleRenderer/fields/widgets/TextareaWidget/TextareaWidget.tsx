import React from 'react'
import { View, StyleSheet } from 'react-native'
import { colors, radius } from '@theme'

export function TextareaWidget() {
  return <View style={styles.field} />
}

const styles = StyleSheet.create({
  field: { height: 52, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, opacity: 0.5 },
})
