import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@theme'

// Styles du layout `stage_wheel` — sélecteur de stade (cartes radio) + historique.
// Les cartes et boutons viennent du design system (`ui/Card`, `ui/Button`) ;
// ici uniquement structure, pastilles et typographie.
export const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  sectionSubtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginBottom: spacing.sm },

  stageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stageDot: { width: 12, height: 12, borderRadius: 6 },
  stageDotSm: { width: 8, height: 8, borderRadius: 4 },
  stageText: { flex: 1 },
  stageName: { fontSize: 14, fontWeight: '600', color: colors.text },
  stageDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  // Historique
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  historyLabel: { flex: 1, fontSize: 13, color: colors.text },
  historyDate: { fontSize: 12, color: colors.textMuted },

  deleteHit: { padding: 4, borderRadius: radius.sm },
})
