import { StyleSheet } from 'react-native'
import { colors, spacing, radius, shadows } from '@theme'

export const etStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.sm, borderRadius: radius.md,
  },
  tabActive: { backgroundColor: colors.primaryLight },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.primary },

  // List — padding bas ≥ hauteur du FAB (56) + marge, pour ne masquer aucune carte.
  listContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  // Placeholder « aucune séance » du détail (le reste passe par ui/EmptyState).
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  // ── État vide (écran 0) — illustration escalier pastel (icon de ui/EmptyState) ─
  emptyStairs: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, height: 72, marginBottom: spacing.sm },
  emptyStep: { width: 26, borderRadius: radius.sm },
  emptyCheck: {
    width: 26, height: 26, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center', marginLeft: 2, marginBottom: 2,
  },

  // Entry card
  entryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardHeaderLeft: { flex: 1, gap: 2 },
  cardSituation: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardDate: { fontSize: 12, color: colors.textMuted },
  cardActions: { flexDirection: 'row', gap: spacing.sm, marginLeft: spacing.sm },
  cardSuds: { gap: 4 },
  cardChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  cardChip: {
    backgroundColor: colors.primary + '18',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  cardChipText: { fontSize: 11, color: colors.primary, fontWeight: '500' },
  cardNotes: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },

  // SudsBar
  sudsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sudsLabel: { fontSize: 12, color: colors.textMuted, width: 48 },
  sudsTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  sudsFill: { height: '100%', borderRadius: radius.full },
  sudsValue: { fontSize: 13, fontWeight: '700', minWidth: 28, textAlign: 'right' },
  sudsPending: { fontSize: 13, color: colors.border, marginLeft: spacing.xs },

  // FAB — CTA flottant (ui/Button + override de positionnement).
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    paddingHorizontal: spacing.lg,
    height: 56,
    borderRadius: radius.full,
    ...shadows.lg,
  },

  // Entry form
  entryHeaderBar: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn: {
    width: 44, height: 44, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  entryContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  section: { gap: spacing.sm },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },

  // Situation picker
  toggle: { flexDirection: 'row', gap: spacing.xs },
  toggleBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  toggleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText: { fontSize: 13, color: colors.textMuted },
  toggleTextActive: { color: colors.white, fontWeight: '600' },
  catalogueList: { gap: spacing.xs },
  catalogueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  catalogueItemSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '0F' },
  catalogueItemLabel: { flex: 1, fontSize: 14, color: colors.text },
  catalogueItemLabelSelected: { color: colors.primary, fontWeight: '600' },
  catalogueEmpty: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.sm },
  freeInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    textAlignVertical: 'top',
    minHeight: 64,
  },

  // SUDs picker (entry form)
  sudsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sudsHeaderLeft: { flex: 1, gap: 2 },
  sudsHeaderLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  sudsHeaderHint: { fontSize: 12, color: colors.textMuted },
  sudsValueBox: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  sudsValueBig: { fontSize: 22, fontWeight: '800' },
  sudsValueNull: { fontSize: 22, fontWeight: '800', color: colors.textMuted },
  sudsValueMax: { fontSize: 12, color: colors.textMuted },
  sudsLegend: { fontSize: 12.5, color: colors.textMuted },
  skipBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  skipText: { fontSize: 12.5, color: colors.textMuted, textDecorationLine: 'underline' },

  // Strategies
  stratHint: { fontSize: 12, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '14' },
  chipText: { fontSize: 13, color: colors.textMuted },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  customStratInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },

  // Notes
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 72,
    textAlignVertical: 'top',
  },

  // CTA pleine largeur (ui/Button + étirement) — save de formulaire / detail.
  ctaBtn: { alignSelf: 'stretch', marginTop: spacing.xs },

  // Situations panel
  panelContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  panelCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  panelTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  panelHint: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  panelAddRow: { flexDirection: 'row', gap: spacing.sm },
  panelInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  panelAddBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelEmpty: { fontSize: 13, color: colors.border, textAlign: 'center', paddingVertical: spacing.sm },
  panelList: { gap: spacing.xs },
  panelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  panelItemLabel: { flex: 1, fontSize: 13, color: colors.text },
  infoBox:        { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 12, marginHorizontal: spacing.md, marginBottom: 4, padding: 10, backgroundColor: colors.neutral, borderRadius: radius.sm },
  footerText:     { fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 17 },

  // ── Parcours unifié — échelle (ladder), la carte = ui/Card ──────────────
  ladderTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ladderRowTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  // Barre de difficulté proportionnelle — teal clair, aucune valence.
  ladderDiffTrack: { height: 6, borderRadius: radius.full, backgroundColor: colors.neutral, overflow: 'hidden' },
  ladderDiffFill: { height: '100%', borderRadius: radius.full },
  ladderRowMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  // Contraste WCAG AA : gris assombri (≥ 4,5:1) pour les textes secondaires.
  ladderMetaText: { flex: 1, fontSize: 12.5, color: colors.textMuted },
  ladderSessions: { fontSize: 12.5, color: colors.textMuted },
  // Fond teinté dérivé de la couleur de texte (alpha) — cf. LadderList.
  lastPeakChip: {
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: radius.full,
  },
  lastPeakChipText: { fontSize: 11.5, fontWeight: '700' },
  notTriedText: { fontSize: 12.5, color: colors.textMuted },

  // ── En-tête de niveau (detail / form) ───────────────────────────────────
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },

  // ── Detail — courbe + historique ────────────────────────────────────────
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyTitle: {
    fontSize: 12.5, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: spacing.md, marginBottom: spacing.xs,
  },
  // Layout only — surface (bg/bordure/radius) fournie par ui/Card.
  difficultyCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.xs, paddingLeft: spacing.md, paddingRight: spacing.xs,
  },
  difficultyText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },

  // ── Step form ───────────────────────────────────────────────────────────
  stepInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 56,
    textAlignVertical: 'top',
  },

  // ── Exposure form — texte prédiction / résultat ─────────────────────────
  predictInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 64,
    textAlignVertical: 'top',
  },

  // ── Exposure form — sélecteur de date (ui/Button secondary, aligné à gauche) ─
  dateFieldBtn: { alignSelf: 'stretch', justifyContent: 'flex-start' },
  dateConfirmAlign: { alignSelf: 'flex-end', marginTop: spacing.xs },

  // ── Exposure form — brouillon / suppression ─────────────────────────────
  draftHint: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  deleteAlign: { alignSelf: 'center', marginTop: spacing.xs },
})
