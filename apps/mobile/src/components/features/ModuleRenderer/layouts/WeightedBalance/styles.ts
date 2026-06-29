import { StyleSheet } from 'react-native'
import { colors, spacing } from '@theme'

// Styles du layout `weighted_balance` — sélection de valeurs (chips) + deux
// blocs Pour/Contre avec items pondérés. Chips, cartes, boutons et échelle de
// poids viennent du design system ; ici structure et typographie uniquement.
export const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  sectionSubtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginBottom: spacing.sm },

  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },

  savedMsg: { fontSize: 13, color: colors.primary, textAlign: 'center', marginTop: spacing.xs },

  blockTitle: { fontSize: 14, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.xs },
  emptyText: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', paddingVertical: spacing.xs },

  itemText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  weightBox: { flex: 1, marginRight: spacing.sm },

  addRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, marginTop: spacing.xs },
  addInputBox: { flex: 1 },
})
