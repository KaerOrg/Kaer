import { StyleSheet } from 'react-native'
import { colors, spacing, radius, shadows } from '../../../../../theme'

export const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },

  // ── Accueil (métaphore de la vague)
  introCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', gap: spacing.md,
    ...shadows.sm,
  },
  introIconCircle: {
    width: 72, height: 72, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight,
  },
  introTitle: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' },
  introText: { fontSize: 15, color: colors.textMuted, lineHeight: 22, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },

  // ── Choix de catégorie
  sectionLabel: {
    fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center',
  },
  categoryCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderLeftWidth: 4,
    ...shadows.sm,
  },
  categoryIconCircle: {
    width: 44, height: 44, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },

  // ── Activité proposée
  activityCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    gap: spacing.md, borderTopWidth: 4,
    ...shadows.md,
  },
  activityHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  activityCategoryName: {
    flex: 1, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8,
  },
  activityText: { fontSize: 18, color: colors.text, lineHeight: 27, fontWeight: '500' },
  durationRow: { flexDirection: 'row', gap: spacing.sm },
  durationBtn: {
    flex: 1, borderRadius: radius.lg, paddingVertical: spacing.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background,
  },
  durationBtnText: { fontSize: 16, fontWeight: '700', color: colors.text },
  linkBtn: { alignItems: 'center', paddingVertical: spacing.sm, flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  linkBtnText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },

  // ── Minuteur (vague)
  timerContainer: {
    flex: 1, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center', alignItems: 'center',
  },
  timerWaveCircle: {
    width: 160, height: 160, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight,
  },
  timerCount: { fontSize: 44, fontWeight: '800', color: colors.primary },
  timerCaption: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.lg },
  progressTrack: {
    width: '100%', height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.primary },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  cancelBtnText: { fontSize: 14, color: colors.textMuted },

  // ── Fin
  doneCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', gap: spacing.md,
    ...shadows.sm,
  },
  doneTitle: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center' },
  doneText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: spacing.md, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primaryLight,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary },
})
