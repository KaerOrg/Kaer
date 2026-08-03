import { StyleSheet } from 'react-native'
import { colors, spacing, fontSize } from '@theme'

// Largeurs fluides et textes rétractables : l'éditeur doit tenir à taille de police
// système maximale sans jamais provoquer de défilement horizontal.
export const styles = StyleSheet.create({
  container:     { flex: 1 },
  scroll:        { flex: 1 },
  scrollContent: { gap: spacing.sm, paddingBottom: spacing.md },

  // La phrase est le contenu de la carte : elle se lit d'un coup d'œil.
  sentence:      { fontSize: fontSize.label, lineHeight: 22, color: colors.text, flexShrink: 1 },

  // Rangée de propositions : `flexWrap` pour qu'aucune puce ne pousse hors de l'écran.
  verbRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },

  // Actions ANCRÉES hors du flux défilant, clavier ouvert compris.
  actions:       { gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  temporaryNote: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 18, flexShrink: 1 },
})
