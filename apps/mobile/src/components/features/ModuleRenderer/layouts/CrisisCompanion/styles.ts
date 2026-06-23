import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@theme'

export const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },

  // ── Surcharges Card (padding/radius/alignement propres à ce layout) ─────────
  centeredCard: {
    padding: spacing.lg, borderRadius: radius.lg,
    alignItems: 'center', gap: spacing.md,
  },
  categoryCardBase: {
    padding: spacing.lg, borderRadius: radius.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderLeftWidth: 4,
  },
  activityCardBase: { padding: spacing.lg, borderRadius: radius.lg, gap: spacing.md },

  // ── Cercles d'icône (pas de composant équivalent dans ui/) ──────────────────
  introIconCircle: {
    width: 72, height: 72, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight,
  },
  categoryIconCircle: {
    width: 44, height: 44, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  timerWaveCircle: {
    width: 160, height: 160, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight,
  },

  // ── Textes ──────────────────────────────────────────────────────────────────
  introTitle:           { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' },
  introText:            { fontSize: 15, color: colors.textMuted, lineHeight: 22, textAlign: 'center' },
  sectionLabel:         { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
  categoryLabel:        { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  activityHead:         { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  activityCategoryName: {
    flex: 1, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8,
  },
  activityText:   { fontSize: 18, color: colors.text, lineHeight: 27, fontWeight: '500' },
  timerCount:     { fontSize: 44, fontWeight: '800', color: colors.primary },
  timerCaption:   { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.lg },
  doneTitle:      { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center' },
  doneText:       { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },

  // ── Minuteur ────────────────────────────────────────────────────────────────
  timerContainer: {
    flex: 1, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center', alignItems: 'center',
  },
  progressTrack: {
    width: '100%', height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.primary },

  // ── Durées (ligne de boutons flex) ──────────────────────────────────────────
  durationRow: { flexDirection: 'row', gap: spacing.sm },
})
