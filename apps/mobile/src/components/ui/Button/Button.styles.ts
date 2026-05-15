import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../../../theme'

export const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primary:   { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primaryLight, borderWidth: 1.5, borderColor: colors.primary },
  ghost:     { backgroundColor: 'transparent' },
  danger:    { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: colors.danger },
  disabled:  { opacity: 0.5 },
  label:          { fontSize: 16, fontWeight: '600' },
  primaryLabel:   { color: colors.white },
  secondaryLabel: { color: colors.primary },
  ghostLabel:     { color: colors.primary },
  dangerLabel:    { color: colors.danger },
})
