import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../../../theme'

export const styles = StyleSheet.create({
  container: { gap: spacing.xs },

  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  buttonEmpty: { borderStyle: 'dashed' },

  value: { fontSize: 16, fontWeight: '600', color: colors.text },
  placeholder: { fontSize: 16, color: colors.textMuted },
  hint: { fontSize: 12, color: colors.textMuted, marginLeft: 'auto' },

  confirm: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  confirmText: { color: colors.white, fontWeight: '700', fontSize: 14 },
})
