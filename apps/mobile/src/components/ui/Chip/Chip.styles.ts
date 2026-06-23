import { StyleSheet } from 'react-native'
import { colors, radius, spacing } from '../../../theme'

/** Géométrie par taille — `sm` pour les aperçus compacts, `md` pour les puces standard. */
export const SIZE = {
  sm: { paddingHorizontal: 8, paddingVertical: 4, gap: spacing.xs, fontSize: 12, iconSize: 12 },
  md: { paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs + 1, gap: 6, fontSize: 13, iconSize: 14 },
} as const

export const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignSelf: 'flex-start',
  },
  muted: { opacity: 0.75 },
  label: { color: colors.textMuted, fontWeight: '600' },
})
