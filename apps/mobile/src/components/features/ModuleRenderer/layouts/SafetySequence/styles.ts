import { StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize, fonts } from '@theme'

// Largeurs fluides et textes rétractables partout : la Séquence doit tenir à taille
// de police système maximale sans jamais provoquer de défilement horizontal (P-12).
export const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.background },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  // Bandeau d'urgence en TÊTE, permanent : en crise, il doit être vu en premier, et
  // le bas de l'écran reste réservé à l'action (ce qui évite au passage le bug de la
  // barre qui rognait le contenu en vue Consultation, cf. P-17).
  emergencyBar:  { paddingHorizontal: spacing.md, paddingTop: spacing.sm },

  backRow:       { flexDirection: 'row', paddingHorizontal: spacing.sm, paddingTop: spacing.xs },

  scroll:        { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.md },

  screenTitle:   { fontFamily: fonts.serif, fontSize: fontSize.display, lineHeight: 38, color: colors.text, flexShrink: 1 },

  stepLabel:     { fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  stepTitle:     { fontFamily: fonts.serif, fontSize: fontSize.display, lineHeight: 38, color: colors.text, flexShrink: 1 },

  // Items du patient, tels qu'il les a écrits. Séparés par un filet, sans puce ni
  // pastille colorée : une seule couleur d'action sur tout le parcours (P-7).
  item:          { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemText:      { fontSize: fontSize.h2, lineHeight: 30, color: colors.text, flexShrink: 1 },

  // Actions ancrées HORS du flux défilant.
  actions:       { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  progress:      { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
})
