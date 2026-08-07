import { StyleSheet } from 'react-native'
import { colors, spacing, fontSize } from '@theme'

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // ── En-tête : retour, barre de progression, compteur
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBar:   { flex: 1 },
  headerCount: { fontSize: fontSize.caption, fontWeight: '700', color: colors.text },
  headerTitle: { flex: 1, fontSize: fontSize.h3, fontWeight: '700', color: colors.text },

  // ── Écran d'un item
  itemContent: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
  instructions: { gap: 2 },
  instructionText: { fontSize: fontSize.caption, color: colors.textMuted, lineHeight: 20 },
  // 15 px : le libellé de l'item est le stimulus, il doit se lire sans effort.
  questionText: { fontSize: fontSize.label, fontWeight: '700', color: colors.text, lineHeight: 22 },

  // ── Écran de relecture
  reviewContent: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  reviewHint:    { fontSize: fontSize.sm, color: colors.textMuted },
  reviewList:    { gap: spacing.xs },
  // `ui/Card` fournit fond, bordure et rayon : on ne resserre ici que le rythme
  // vertical, une relecture de dix lignes n'ayant pas besoin du padding d'une carte.
  reviewRow: { paddingVertical: spacing.sm, gap: 2 },
  // Le libellé n'est ici qu'un repère de ligne, pas un stimulus : sa troncature est
  // volontaire et sans conséquence, la réponse est déjà donnée.
  reviewLabel:  { fontSize: fontSize.sm, color: colors.textMuted },
  reviewAnswer: { fontSize: fontSize.label, fontWeight: '700', color: colors.text },
  reviewUnanswered: { fontSize: fontSize.label, fontWeight: '700', color: colors.textMuted },
  submitBar: { paddingTop: spacing.sm },
})
