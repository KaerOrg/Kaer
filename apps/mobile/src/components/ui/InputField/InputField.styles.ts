import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../../../theme'

export const styles = StyleSheet.create({
  container:  { gap: spacing.xs },
  label:      { fontSize: 14, fontWeight: '600', color: colors.text },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 16,
    color: colors.text,
    minHeight: 50,
  },
  focused:    { borderColor: colors.primary, borderWidth: 2 },
  inputError: { borderColor: colors.danger, borderWidth: 1.5 },
  error:      { fontSize: 13, color: colors.danger },
})
