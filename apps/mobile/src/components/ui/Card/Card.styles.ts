import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../../../theme'

export const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  default:  { borderWidth: 1, borderColor: colors.border },
  outlined: { borderWidth: 2, borderColor: colors.primary },
  elevated: {
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  active:   { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  disabled: { opacity: 0.5 },
  header:   { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  icon:     { fontSize: 20, lineHeight: 24 },
  titles:   { flex: 1, gap: 2 },
  title:    { fontSize: 18, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted },
  actions:  {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
})
