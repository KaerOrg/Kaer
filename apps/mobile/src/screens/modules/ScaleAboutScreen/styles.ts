import { StyleSheet } from 'react-native'
import { colors, spacing, fontSize } from '@theme'

export const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },

  // ── Bloc titré
  blockTitle: { fontSize: fontSize.label, fontWeight: '700', color: colors.text },
  blockBody:  { fontSize: fontSize.caption, color: colors.text, lineHeight: 21 },

  // ── Note portée par l'instrument
  // Fond neutre, jamais une teinte d'alerte : cette note est AFFICHÉE EN PERMANENCE et
  // ne réagit à aucune réponse. La teinter en avertissement lui donnerait l'air d'un
  // déclenchement, ce qu'elle n'est pas (MDR 2017/745).
  note:     { gap: spacing.xs },
  noteText: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19, fontStyle: 'italic' },

  // ── Renvoi vers le plan de sécurité
  planCard:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  planText:     { flex: 1, gap: 2 },
  planLead:     { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19 },
  planAction:   { fontSize: fontSize.label, fontWeight: '700', color: colors.text },

  footer: { marginTop: spacing.sm },
})
