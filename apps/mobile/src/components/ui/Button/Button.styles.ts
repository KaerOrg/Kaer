import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@theme'

export const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Tailles (dimensions only) ───────────────────────────────────────────
  md: { paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.lg, minHeight: 50 },
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 36 },
  // ── Variantes (couleurs only) ───────────────────────────────────────────
  primary:   { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primaryLight, borderWidth: 1.5, borderColor: colors.primary },
  ghost:     { backgroundColor: 'transparent' },
  danger:    { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: colors.danger },
  disabled:   { opacity: 0.5 },
  withIcon:   { flexDirection: 'row', gap: spacing.xs },
  // Mode icône seule : annule le « chrome » CTA (hauteur min + padding large).
  iconOnly:   { minHeight: 0, paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  label:          { fontWeight: '600' },
  labelMd:        { fontSize: 16 },
  labelSm:        { fontSize: 14 },
  primaryLabel:   { color: colors.white },
  secondaryLabel: { color: colors.primary },
  ghostLabel:     { color: colors.primary },
  dangerLabel:    { color: colors.danger },
})
