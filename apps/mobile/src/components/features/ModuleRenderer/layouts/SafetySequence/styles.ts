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

  // Rangée de tête : retour à gauche, progression poussée à droite par sa marge auto.
  // `space-between` ne conviendrait pas — sans retour, la progression se recalerait
  // à gauche.
  topRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingTop: spacing.xs },

  scroll:        { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.md },

  screenTitle:   { fontFamily: fonts.serif, fontSize: fontSize.display, lineHeight: 38, color: colors.text, flexShrink: 1 },

  // Entrées de l'écran d'arrivée. L'entrée dominante est pleine : sur l'écran d'entrée
  // en crise, l'action dominante est le plan, et elle doit se lire sans être cherchée.
  entryLead:      { backgroundColor: colors.primary, borderColor: colors.primary },
  entryLeadLabel: { fontFamily: fonts.serif, fontSize: fontSize.h1, lineHeight: 34, color: colors.text, flexShrink: 1 },
  entryLeadHint:  { fontSize: fontSize.label, color: colors.text, flexShrink: 1 },
  entryLabel:     { fontFamily: fonts.serif, fontSize: fontSize.h2, lineHeight: 28, color: colors.text, flexShrink: 1 },
  entryHint:      { fontSize: fontSize.label, color: colors.textMuted, flexShrink: 1 },

  // Clôture : les raisons de vivre sont du contenu, pas une fiche. Une grande photo,
  // deux petites, et la phrase sur un panneau turquoise pâle, sans guillemets.
  closing:            { gap: spacing.md },
  closingLeadPhoto:   { width: '100%', height: 220, borderRadius: radius.lg },
  closingPhotoRow:    { flexDirection: 'row', gap: spacing.sm },
  closingPhoto:       { flex: 1, height: 110, borderRadius: radius.md },
  closingPhrasePanel: { backgroundColor: colors.primaryPale, borderLeftWidth: 4, borderLeftColor: colors.primary, borderRadius: radius.md, padding: spacing.md },
  closingPhrase:      { fontFamily: fonts.serif, fontSize: fontSize.h2, lineHeight: 30, color: colors.text, flexShrink: 1 },

  // Filet de l'écran des ressources : il sépare les secours des deux autres issues,
  // sans les hiérarchiser — elles gardent le même poids visuel.
  resourcesRule: { height: 1, backgroundColor: colors.border },

  stepLabel:     { fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  stepTitle:     { fontFamily: fonts.serif, fontSize: fontSize.display, lineHeight: 38, color: colors.text, flexShrink: 1 },
  // Sous-titre d'une ligne : il distingue deux étapes voisines, il ne les commente pas.
  stepSubtitle:  { fontSize: fontSize.label, color: colors.textMuted, flexShrink: 1 },

  // Items du patient, tels qu'il les a écrits. Séparés par un filet, sans puce ni
  // pastille colorée : une seule couleur d'action sur tout le parcours (P-7).
  item:          { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemLast:      { paddingVertical: spacing.sm },
  itemText:      { fontSize: fontSize.h2, lineHeight: 30, color: colors.text, flexShrink: 1 },

  // Actions ancrées HORS du flux défilant.
  actions:       { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  progress:      { fontSize: fontSize.sm, color: colors.textMuted, marginLeft: 'auto' },
})
