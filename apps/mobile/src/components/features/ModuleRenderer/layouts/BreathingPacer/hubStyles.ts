import { StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize } from '@theme'

/** Styles du hub `breathing_pacer` (M1), partagés par ses cartes et ses feuilles. */
export const hubStyles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },

  // ── Carte « Travaillée en séance » ──────────────────────────────────────────
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eyebrow: {
    flex: 1,
    fontSize: fontSize.xxs,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  primaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.md },
  primaryTexts: { flex: 1, flexShrink: 1, gap: spacing.xs },
  primaryName: { fontSize: fontSize.h3, fontWeight: '700', color: colors.text },
  primaryBenefit: { fontSize: fontSize.caption, color: colors.textMuted, lineHeight: 20 },
  rhythmChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  startBtn: { marginTop: spacing.md },
  lastSession: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // ── Carte « Cette semaine » ─────────────────────────────────────────────────
  weekHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  weekTitle: { flex: 1, fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  weekDots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  weekDot: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  weekDotToday: { borderStyle: 'dashed', borderColor: colors.textMuted },
  weekDotLabel: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted },
  weekDotLabelPracticed: { color: colors.white },
  weekCounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  weekStreak: { flex: 1, flexShrink: 1, fontSize: fontSize.xs, color: colors.textMuted },
  weekGoal: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },

  // ── Ligne de rappel ─────────────────────────────────────────────────────────
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reminderText: { flex: 1, flexShrink: 1, fontSize: fontSize.xs, color: colors.textMuted },

  // ── Liste « Vos techniques » ────────────────────────────────────────────────
  sectionTitle: {
    fontSize: fontSize.xxs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.sm,
  },
  techniqueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  techniqueRing: { width: 36, height: 36, borderRadius: radius.full, borderWidth: 3 },
  techniqueTexts: { flex: 1, flexShrink: 1 },
  techniqueName: { fontSize: fontSize.caption, fontWeight: '700', color: colors.text },
  techniqueBenefit: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  techniqueRhythm: { fontSize: fontSize.xs, color: colors.textMuted },

  // ── Feuilles (objectif, rappel) ─────────────────────────────────────────────
  sheetNote: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  sheetLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  dayPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
})
