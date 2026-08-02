import { StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize, shadows } from '@theme'

// Charte du primitive (passe d'accessibilité K-10, ticket #258) :
//   · les surfaces d'ACTION portent le turquoise de marque `colors.primary`, avec un
//     libellé en `colors.text`. `colors.primary` avec du blanc échoue AA (≈ 2.1:1),
//     ce que documente déjà `packages/shared/src/theme.ts` ;
//   · la couleur de famille IDENTIFIE (filet, fond très pâle, icône) et ne porte
//     JAMAIS de texte : ces teintes sont pastel et échouent AA en petit corps ;
//   · aucun texte sous `fontSize.xxs` (11) ; toute cible tactile fait au moins 44 px.

const TOUCH_TARGET = 44

export const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  // ── Bouton démarrer (mode historique) : habillage via `@ui/Button` (variant
  // primary, AA-safe) ; ce style ne porte que le positionnement.
  startBtnLayout:   { marginHorizontal: spacing.lg, marginTop: spacing.lg },
  // ── Historique
  historyContent:   { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  introCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    ...shadows.sm,
  },
  introText:        { flex: 1, fontSize: fontSize.caption, color: colors.textMuted, lineHeight: 20 },
  section:          { gap: spacing.sm },
  sectionLabel: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  empty:            { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  emptyTitle:       { fontSize: fontSize.h3, fontWeight: '600', color: colors.text },
  emptyText:        { fontSize: fontSize.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  // ── Carte d'entrée
  entryCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    borderLeftWidth: 4, gap: spacing.xs,
    ...shadows.sm,
  },
  entryHeader:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  entryIcon: {
    width: 36, height: 36, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  entryLabels:      { flex: 1, gap: 2 },
  entryPrimary:     { fontSize: fontSize.label, fontWeight: '700', color: colors.text },
  entrySecondary:   { fontSize: fontSize.sm, color: colors.textMuted },
  entryRight:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  entryChips:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  intensityBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full,
    backgroundColor: colors.neutral,
  },
  intensityText:    { fontSize: fontSize.xs, fontWeight: '700', color: colors.text },
  entryNotes: {
    fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic',
    lineHeight: 18, marginTop: spacing.xs,
  },
  entryDate:        { fontSize: fontSize.xxs, color: colors.textMuted, marginTop: 2 },
  // ── En-tête mode sélection
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm,
  },
  backBtn: {
    width: TOUCH_TARGET, height: TOUCH_TARGET,
    alignItems: 'center', justifyContent: 'center', marginLeft: -spacing.sm,
  },
  progressContainer:{ flex: 1, gap: spacing.xs },
  progressTrack: {
    height: 4, backgroundColor: colors.border,
    borderRadius: radius.full, overflow: 'hidden',
  },
  progressFill:     { height: '100%', borderRadius: radius.full },
  progressLabel:    { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  // ── Sélection
  selectionContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  stepTitle:        { fontSize: fontSize.h2, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  stepHint:         { fontSize: fontSize.caption, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.md },
  gridContainer:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  // Carte de famille (niveau 1) : filet d'accent à gauche, titre en noir, ligne de
  // définition. Aucun emoji ni pictogramme de visage : un visage a déjà décidé ce
  // qu'est l'émotion, à un patient à qui l'on demande de trouver la sienne (K-4).
  // Deux colonnes, quatre rangées : les 8 familles tiennent sans défilement.
  primaryCard: {
    width: '48%', backgroundColor: colors.card, borderRadius: radius.md,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm + 4,
    gap: 2, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4,
    minHeight: 62, justifyContent: 'center',
    ...shadows.sm,
  },
  primaryLabel:     { fontSize: fontSize.label, fontWeight: '700', color: colors.text },
  primaryDefinition:{ fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 16 },
  cardPressed:      { opacity: 0.9, transform: [{ scale: 0.98 }] },
  // Sortie « Je ne sais pas trop » : bouton fantôme, bordure pointillée. Il ne
  // rivalise pas avec les familles, il reste atteignable.
  skipBtn: {
    borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: colors.border, paddingVertical: spacing.md, minHeight: TOUCH_TARGET,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm,
  },
  skipBtnText:      { fontSize: fontSize.label, fontWeight: '600', color: colors.textMuted },
  stopHint: {
    fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center',
    lineHeight: 17, marginTop: spacing.xs,
  },
  // Bas d'écran des niveaux ≥ 2 : sortie « je ne sais pas » à gauche, validation de
  // la carte dépliée à droite. La seconde n'apparaît que si une carte est dépliée.
  stepActions:      { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  stepContinueBtn: {
    flex: 1, borderRadius: radius.lg, paddingVertical: spacing.md,
    backgroundColor: colors.primary, minHeight: TOUCH_TARGET,
    alignItems: 'center', justifyContent: 'center',
  },
  validateHereBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2,
    borderRadius: radius.lg, borderWidth: 1.5, paddingVertical: spacing.md,
    backgroundColor: colors.card, minHeight: TOUCH_TARGET,
  },
  validateHereText: { fontSize: fontSize.label, fontWeight: '700', color: colors.text },
  validateHereKeep: { fontSize: fontSize.xs, color: colors.textMuted },
  chipsWrap:        { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  listContainer:    { gap: spacing.sm },
  // Carte de nuance (niveaux ≥ 2) : titre, définition, et mots en chips une fois
  // dépliée. Le niveau 3 n'a plus d'écran à lui (K-5).
  optionCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4,
    minHeight: TOUCH_TARGET, gap: spacing.xs,
    ...shadows.sm,
  },
  optionLabel:      { fontSize: fontSize.body, fontWeight: '600', color: colors.text },
  optionDefinition: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 18, marginTop: 2 },
  optionChips:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  // ── Fiche unique (intensité + contexte + note sur un seul écran, K-6)
  sheetSection:     { gap: spacing.sm, marginBottom: spacing.lg },
  sheetSectionLabel: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  // Les 5 crans sur une seule ligne : 10 cibles de 44 px ne tiennent pas sur la
  // largeur d'un téléphone, c'est ce qui a décidé le passage de 1-10 à 1-5.
  intensityRow:     { flexDirection: 'row', gap: spacing.sm },
  intensityAnchors: { flexDirection: 'row', justifyContent: 'space-between' },
  intensityAnchor:  { fontSize: fontSize.xs, color: colors.textMuted },
  otherInput: {
    backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, fontSize: fontSize.label, color: colors.text,
    borderWidth: 1, borderColor: colors.border, minHeight: TOUCH_TARGET,
  },
  // ── Intensité (crans de la fiche unique)
  intensityBtn: {
    flex: 1, minWidth: TOUCH_TARGET, height: TOUCH_TARGET, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card,
  },
  intensityBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  intensityBtnText: { fontSize: fontSize.label, fontWeight: '600', color: colors.text },
  continueBtnText:  { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  // ── Notes
  notesInput: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    fontSize: fontSize.label, color: colors.text, minHeight: 100,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  actionsRow:       { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: TOUCH_TARGET,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText:    { color: colors.textMuted, fontSize: fontSize.caption, fontWeight: '600' },
  // « Enregistrer » via `@ui/Button` (variant primary) ; ce style ne porte que
  // l'occupation de l'espace restant à côté d'« Annuler ».
  saveBtnFlex:      { flex: 1 },
  // Note de bas de page (footer_note)
  infoBox: {
    flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start',
    marginTop: spacing.sm, padding: spacing.sm,
    backgroundColor: colors.neutral, borderRadius: radius.sm,
  },
  footerText:       { fontSize: fontSize.xs, color: colors.textMuted, flex: 1, lineHeight: 17 },
})
