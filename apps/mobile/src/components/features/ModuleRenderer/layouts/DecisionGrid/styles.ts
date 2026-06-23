import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@theme'

export const dgStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll:    { flex: 1 },
  scrollContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  // Target behavior input
  behaviorSection: { gap: spacing.xs },
  behaviorLabel: {
    fontSize: 13, fontWeight: '600', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  behaviorInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
  },

  // 2x2 grid
  grid: { gap: spacing.sm },
  gridRow: { flexDirection: 'row', gap: spacing.sm },

  // Quadrant card
  quadrantCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flex: 1,
  },
  quadrantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  quadrantHeaderText: { flex: 1 },
  quadrantTitle: { fontSize: 13, fontWeight: '700' },
  quadrantSubtitle: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  quadrantCountBadge: {
    borderRadius: radius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  quadrantCountText: { fontSize: 11, fontWeight: '700', color: colors.white },
  quadrantBody: { padding: spacing.sm },

  // Gauge
  gaugeContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  gaugeTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  gaugeLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  gaugeLabelText: { fontSize: 11, color: colors.textMuted },
  gaugeTrack: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'visible',
    position: 'relative',
  },
  gaugeFill: { height: '100%', borderRadius: radius.full },
  gaugeMarker: {
    position: 'absolute',
    top: -4,
    width: 2,
    height: 20,
    backgroundColor: colors.textMuted,
    marginLeft: -1,
  },

  // Footer save button
  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
})
