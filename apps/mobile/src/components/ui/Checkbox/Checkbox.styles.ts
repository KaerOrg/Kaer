import { StyleSheet } from 'react-native'
import { colors, spacing } from '@theme'

export const styles = StyleSheet.create({
  row:           { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  label:         { flex: 1, fontSize: 15, color: colors.text },
  labelDisabled: { color: colors.textMuted },
})
