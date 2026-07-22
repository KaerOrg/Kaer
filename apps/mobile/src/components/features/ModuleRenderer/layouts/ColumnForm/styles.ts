import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@theme'

// Barres d'écart / rail neutres : gris descriptif, jamais une teinte de gravité (MDR).
const RAIL_GREY = colors.border
const MARKER_SIZE = 18
const LEGEND_PILL = 16

export const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: colors.background },
  center:            { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scroll:            { flex: 1 },
  // ── Liste
  listContent:       { padding: spacing.md, paddingBottom: spacing.lg },
  list:              { gap: spacing.sm },
  infoBox:           { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: spacing.md, padding: 10, backgroundColor: '#F3F4F6', borderRadius: 8 },
  footerText:        { fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 17 },
  empty: {
    alignItems: 'center', paddingVertical: spacing.xl * 2, gap: spacing.md,
  },
  emptyTitle:        { fontSize: 20, fontWeight: '600', color: colors.text },
  emptyText: {
    fontSize: 15, color: colors.textMuted, textAlign: 'center',
    lineHeight: 22, paddingHorizontal: spacing.lg,
  },
  recordCard: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
    gap: spacing.xs,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  recordHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.xs,
  },
  // Date + puce « à compléter » (Chip du design system) groupées à gauche.
  recordHeaderLeft: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1,
  },
  recordDate:        { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  recordDateProminent: { fontSize: 15, color: colors.text, fontWeight: '700', textTransform: 'capitalize' },
  recordActions:     { flexDirection: 'row', gap: spacing.sm },
  recordRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  recordDot:         { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  recordText:        { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  recordIntensity:   { color: colors.textMuted, fontSize: 13 },
  // ── Entrée
  entryContent:      { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },
  section: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    padding: spacing.md, paddingBottom: spacing.sm,
  },
  sectionBadge: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionBadgeText:  { fontSize: 13, fontWeight: '700', color: colors.white },
  sectionHeaderText: { flex: 1 },
  sectionTitle:      { fontSize: 15, fontWeight: '700' },
  sectionHint:       { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
  sectionBody: {
    paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm,
  },
  textInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.sm, fontSize: 14, color: colors.text,
    backgroundColor: colors.background,
  },
  // Chips de suggestions (ui/Chip) sous un champ texte — rangée enveloppante.
  suggestions: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs,
  },
  // Champs de choix / chips (column_choice_field, column_chips_field).
  chipsGroupLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase',
    color: colors.textMuted, marginBottom: spacing.xs,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  // ── Actions de saisie (date rétroactive, « comme d'habitude ») — ui/Button
  // compact aligné à gauche (le primitive porte fond/bordure/radius).
  entryActionBtn: { alignSelf: 'flex-start', minHeight: 0, paddingVertical: spacing.sm },
  // Rangée « date rétroactive + comme d'habitude » enveloppante (chip + reprise).
  entryActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  // ── Footer (boutons = ui/Button ; ici uniquement le conteneur + le flex CTA)
  footer: {
    backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
    padding: spacing.md, flexDirection: 'row', gap: spacing.sm,
  },
  // Le CTA principal (enregistrer / nouvelle saisie) occupe l'espace restant.
  footerBtnFlex:     { flex: 1 },

  // ── Wizard (saisie « une question à la fois », opt-in entry_mode=wizard) ────
  // Barre de progression segmentée sous le header natif.
  progress: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs,
    backgroundColor: colors.card,
  },
  progressSegment:   { flex: 1, height: 4, borderRadius: 2 },
  wizardContent:     { padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  // Sur-titre « ÉTAPE n · TITRE », teinté à la couleur de la colonne.
  wizardOverline:    { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  wizardQuestion:    { fontSize: 22, fontWeight: '700', color: colors.text, lineHeight: 29, marginTop: spacing.xs },
  wizardHelp:        { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.xs },
  // Encart d'aide contextuel (ex. « on y reviendra à la fin pour comparer »).
  wizardNote: {
    flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start',
    backgroundColor: colors.background, borderRadius: radius.sm,
    padding: spacing.sm, marginTop: spacing.xs, marginBottom: spacing.xs,
  },
  wizardNoteText:    { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 18 },

  // ── Carte récit (list_card_variant=narrative) ─────────────────────────────
  narrativeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  narrativeTitle:    { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  // Arc « avant → après » : deux valeurs brutes, rendu NEUTRE (MDR 2017/745) —
  // mêmes teintes pour les deux nombres, flèche atténuée, aucune couleur de
  // gravité ni flèche de tendance.
  arcCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: colors.background, borderRadius: radius.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.sm, marginVertical: spacing.xs,
  },
  arcSide:           { alignItems: 'center', gap: 2, flexShrink: 1 },
  arcLabel:          { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  arcValue:          { fontSize: 24, fontWeight: '800', color: colors.text },
  arcCaption:        { fontSize: 12, color: colors.textMuted },
  // Encart « à finir » (ré-évaluation manquante) — statut de workflow neutre.
  arcTodo: {
    flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start',
    backgroundColor: colors.background, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    padding: spacing.sm, marginVertical: spacing.xs,
  },
  arcTodoText:       { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  // Lignes « je pensais » (barrée) / « je me dis » (mise en avant).
  narrativeLine:     { gap: 2, marginTop: spacing.xs },
  narrativeLabel:    { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  narrativeStrikeValue: { fontSize: 14, color: colors.textMuted, lineHeight: 20, textDecorationLine: 'line-through' },
  narrativeReframeValue: { fontSize: 14, color: colors.text, fontWeight: '600', lineHeight: 20 },
  // Dépliage « raisonnement complet » : lignes étiquetées (filet + label couleur).
  expandedBlock:     { gap: spacing.sm, marginTop: spacing.sm },
  labeledLine:       { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' },
  labeledRule:       { width: 3, borderRadius: 2 },
  labeledBody:       { flex: 1, gap: 2 },
  labeledLabel:      { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  labeledValue:      { fontSize: 14, color: colors.text, lineHeight: 20 },

  // ── Journal chronobiologique : légende figée + frise 24 h ──────────────────
  // Légende sous la barre d'onglets : pastilles couleur d'ancre + libellé court.
  legendBar: {
    flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, rowGap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  legendItem:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendPill: {
    width: LEGEND_PILL, height: LEGEND_PILL, borderRadius: LEGEND_PILL / 2,
    justifyContent: 'center', alignItems: 'center',
  },
  legendLabel:       { fontSize: 11, color: colors.textMuted, fontWeight: '500' },

  // Carte d'un jour (radius lg, ombre légère). Date + chevron dans le header.
  friseCard: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  // Rail gris arrondi (h 5) + marqueurs absolus positionnés à l'heure exacte.
  friseRailWrap:     { height: MARKER_SIZE, justifyContent: 'center', marginHorizontal: MARKER_SIZE / 2 },
  friseRail:         { height: 5, borderRadius: 3, backgroundColor: RAIL_GREY },
  friseMarker: {
    position: 'absolute', width: MARKER_SIZE, height: MARKER_SIZE, borderRadius: MARKER_SIZE / 2,
    marginLeft: -MARKER_SIZE / 2, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 1, elevation: 2,
  },
  friseScale:        { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: MARKER_SIZE / 2 },
  friseScaleText:    { fontSize: 10, color: colors.textMuted },
  // Dépli : lignes « icône + libellé + heure ».
  friseDetail:       { gap: spacing.xs, marginTop: spacing.xs },
  friseDetailRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  friseDetailLabel:  { flex: 1, fontSize: 14, color: colors.text },
  friseDetailTime:   { fontSize: 14, color: colors.text, fontWeight: '600', fontVariant: ['tabular-nums'] },
  friseEmpty:        { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
})
