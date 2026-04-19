import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../../theme'

export const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    gap: spacing.sm,
  },
  labels:   { flex: 1, gap: 2 },
  title:    { fontSize: 16, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted },
  meta:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  chevron:   { fontSize: 18, color: colors.textMuted },
  body: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
})
