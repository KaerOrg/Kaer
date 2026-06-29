import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@theme'

// Styles du layout `dual_ruler` — deux thermomètres (échelles 0-10) + saisies
// libres + historique. Aucun habillage de bouton ici (les actions passent par
// `ui/Button`) : uniquement structure, cartes et typographie.
export const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: spacing.xs },

  rulerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rulerTitle: { fontSize: 14, fontWeight: '700' },
  rulerScore: { fontSize: 20, fontWeight: '800' },
  rulerQuestion: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginBottom: spacing.xs },

  savedMsg: { fontSize: 13, color: colors.primary, textAlign: 'center', marginTop: spacing.xs },

  // Historique
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyDate: { fontSize: 12, color: colors.textMuted },
  historyBehavior: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  historyScores: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap', marginTop: 4 },
  historyScore: { fontSize: 14, fontWeight: '700' },
  historyCommitment: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', lineHeight: 18, marginTop: 4 },

  deleteHit: { padding: 4, borderRadius: radius.sm },
})
