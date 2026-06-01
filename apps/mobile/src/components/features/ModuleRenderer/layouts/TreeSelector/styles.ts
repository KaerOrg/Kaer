import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../../../../../theme'

export const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  // ── Bouton démarrer (mode historique)
  startBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  startBtnText:     { fontSize: 16, fontWeight: '700', color: colors.white },
  // ── Historique
  historyContent:   { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  introCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  introText:        { flex: 1, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  section:          { gap: spacing.sm },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  empty:            { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  emptyTitle:       { fontSize: 18, fontWeight: '600', color: colors.text },
  emptyText:        { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  // ── Carte d'entrée
  entryCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    borderLeftWidth: 4, gap: spacing.xs,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  entryHeader:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  entryIcon: {
    width: 36, height: 36, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  entryLabels:      { flex: 1, gap: 2 },
  entryPrimary:     { fontSize: 15, fontWeight: '700' },
  entrySecondary:   { fontSize: 13, color: colors.textMuted },
  entryRight:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  intensityBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full,
  },
  intensityText:    { fontSize: 12, fontWeight: '700' },
  entryNotes: {
    fontSize: 13, color: colors.textMuted, fontStyle: 'italic',
    lineHeight: 18, marginTop: spacing.xs,
  },
  entryDate:        { fontSize: 11, color: colors.border, marginTop: 2 },
  // ── En-tête mode sélection
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm,
  },
  backBtn:          { padding: spacing.xs },
  progressContainer:{ flex: 1, gap: spacing.xs },
  progressTrack: {
    height: 4, backgroundColor: colors.border,
    borderRadius: radius.full, overflow: 'hidden',
  },
  progressFill:     { height: '100%', borderRadius: radius.full },
  progressLabel:    { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  // ── Sélection
  selectionContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  stepTitle:        { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  stepHint:         { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.md },
  gridContainer:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  primaryCard: {
    width: '47%', backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', gap: spacing.sm, borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  primaryIconCircle: {
    width: 56, height: 56, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryLabel:     { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  listContainer:    { gap: spacing.sm },
  optionCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  optionLabel:      { fontSize: 16, fontWeight: '600' },
  // ── Intensité
  intensityCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', gap: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    marginBottom: spacing.md,
  },
  intensityDisplay: {
    flexDirection: 'row', alignItems: 'baseline', gap: 4,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.lg,
  },
  intensityValue:   { fontSize: 48, fontWeight: '800' },
  intensityMax:     { fontSize: 20, color: colors.textMuted, fontWeight: '600' },
  intensityBtns: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center',
  },
  intensityBtn: {
    width: 44, height: 44, borderRadius: radius.full, borderWidth: 1.5,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card,
  },
  intensityBtnText: { fontSize: 15, fontWeight: '600', color: colors.text },
  intensityBtnTextActive: { color: colors.white },
  continueBtn: {
    borderRadius: radius.lg, paddingVertical: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  continueBtnText:  { fontSize: 16, fontWeight: '700', color: colors.white },
  // ── Notes
  summaryCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    borderLeftWidth: 4, gap: spacing.xs, marginBottom: spacing.md,
  },
  summaryPrimary:   { fontSize: 15, fontWeight: '700' },
  summaryMeta:      { fontSize: 13, color: colors.textMuted },
  notesInput: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    fontSize: 15, color: colors.text, minHeight: 100,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  actionsRow:       { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText:    { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  saveBtn: {
    flex: 1, borderRadius: radius.lg, paddingVertical: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  saveBtnText:      { fontSize: 16, fontWeight: '700', color: colors.white },
  btnDisabled:      { opacity: 0.6 },
  // Note de bas de page (footer_note)
  infoBox:          { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: spacing.sm, padding: 10, backgroundColor: '#F3F4F6', borderRadius: 8 },
  footerText:       { fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 17 },
})
