import { StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize } from '@theme'

/** Styles de l'écran de clôture de session (M4). */
export const summaryStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },

  // ── En-tête : coche, titre, technique ──────────────────────────────────────
  header: { alignItems: 'center', gap: spacing.sm },
  checkCircle: {
    width: 64, height: 64, borderRadius: radius.full,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: fontSize.h2, fontWeight: '700', color: colors.text, textAlign: 'center' },
  technique: { fontSize: fontSize.caption, color: colors.textMuted, textAlign: 'center' },

  // ── Trois tuiles de comptes bruts ──────────────────────────────────────────
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    flexShrink: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  statValue: { fontSize: fontSize.h2, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, textAlign: 'center' },

  // ── Ressenti (facultatif) ──────────────────────────────────────────────────
  feelingTitle: { fontSize: fontSize.body, fontWeight: '700', color: colors.text, textAlign: 'center' },
  feelingNote: {
    fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center',
    marginTop: spacing.sm, lineHeight: 18,
  },

  // ── Encart de régularité (texte fixe, jamais dérivé des données) ───────────
  callout: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  calloutText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },

  actions: { gap: spacing.xs },
})
