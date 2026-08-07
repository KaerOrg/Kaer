import { StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize } from '@theme'

/** Styles des blocs de l'accueil de module (#408). */
export const homeStyles = StyleSheet.create({
  // ── Bandeau du dernier envoi
  // `primaryDark` est le turquoise de marque qui porte du texte blanc en AA. C'est un
  // accent d'identité, jamais une teinte de gravité clinique : il ne dépend d'aucune
  // valeur saisie et reste le même quel que soit le score (MDR 2017/745).
  banner:      { backgroundColor: colors.primaryDark, borderRadius: radius.md, padding: spacing.md, gap: 2 },
  bannerLabel: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.primaryPale,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  bannerDate:  { fontSize: fontSize.h2, fontWeight: '700', color: colors.white },
  bannerRead:  { fontSize: fontSize.caption, color: colors.primaryPale },

  // ── Carte de présentation (état jamais rempli)
  intro:     { gap: spacing.sm },
  introLine: { fontSize: fontSize.label, color: colors.text, lineHeight: 22 },
  introStrong: { fontWeight: '700' },

  // ── Liste des passations
  sectionLabel: {
    fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.xs,
  },
  sentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: spacing.sm, minHeight: 52,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  sentDate:   { fontSize: fontSize.label, fontWeight: '700', color: colors.text },
  sentStatus: { fontSize: fontSize.sm, color: colors.textMuted },

  // ── Dépli des totaux
  scoreCard:  { gap: spacing.sm },
  scoreRow:   { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  scoreDate:  { fontSize: fontSize.caption, color: colors.textMuted, flex: 1 },
  // Le total est un chiffre brut : même graisse, même couleur pour tous, aucune
  // échelle de teinte, aucune flèche. Il n'est pas qualifié.
  scoreValue: { fontSize: fontSize.h2, fontWeight: '700', color: colors.text },
  scoreMax:   { fontSize: fontSize.caption, fontWeight: '400', color: colors.textMuted },
  scoreNote:  {
    fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19,
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm,
  },

  // ── Pied d'écran
  startHint: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
})
