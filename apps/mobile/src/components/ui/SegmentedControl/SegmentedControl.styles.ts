import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@theme'

export const styles = StyleSheet.create({
  // ── Variant 'track' : piste teintée, segments adjacents
  track: {
    flexDirection: 'row',
    backgroundColor: colors.neutral,
    borderRadius: radius.sm,
    padding: 2,
    gap: 2,
    alignSelf: 'flex-start',
  },
  trackSegment: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm - 2,
  },
  // ── Variant 'pills' : pastilles bordées indépendantes
  pills: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  pillSegment: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  // ── Commun
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  labelActive: { color: colors.white },
})
