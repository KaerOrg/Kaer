import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../../../../../theme'

export const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scroll:           { flex: 1 },
  content:          { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },
  // ── Onglets
  tabs: {
    flexDirection: 'row', backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.sm + 2, gap: spacing.xs,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive:        { borderBottomColor: colors.primary },
  tabText:          { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  tabTextActive:    { color: colors.primary, fontWeight: '700' },
  // ── Date du jour
  dateHeader: {
    backgroundColor: colors.primaryLight, borderRadius: radius.lg,
    padding: spacing.md, gap: 2,
  },
  dateLabel: {
    fontSize: 13, fontWeight: '600', color: colors.primary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  dateValue:        { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  dateNavRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateNavBtn:       { padding: spacing.xs },
  dateNavBtnDisabled: { opacity: 0.35 },
  dateNavCenter:    { flex: 1, alignItems: 'center', gap: 2 },
  // ── Badge "déjà saisi"
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.successLight, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, alignSelf: 'flex-start',
  },
  savedBadgeText:   { fontSize: 13, color: colors.success, fontWeight: '600' },
  // ── Question + boutons de statut
  questionCard: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  questionText:     { fontSize: 15, fontWeight: '500', color: colors.text },
  statusRow:        { flexDirection: 'row', gap: spacing.sm },
  statusBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    paddingVertical: spacing.md, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card,
  },
  statusLabel:      { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  // ── Boutons de statut compacts (par molécule)
  statusRowCompact: { flexDirection: 'row', gap: spacing.xs },
  statusBtnCompact: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card,
  },
  // ── Section générique
  sectionLabel: {
    fontSize: 13, fontWeight: '600', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  // ── Motifs (chips via ui/Chip)
  chipsRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  // ── Pont effets indésirables (ui/Button variant=secondary size=sm)
  bridgeBtnSelf:    { alignSelf: 'flex-start' },
  // ── Notes
  notesSection:     { gap: spacing.xs },
  notesInput: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    fontSize: 14, color: colors.text, minHeight: 80,
  },
  // ── Détail par molécule (carte)
  molToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  molToggleText:    { fontSize: 14, fontWeight: '600', color: colors.text },
  molCard: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.sm, gap: spacing.xs,
  },
  molHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  molName:          { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  molPoso:          { fontSize: 12, color: colors.textMuted },
  molKindBadge: {
    paddingHorizontal: spacing.xs + 2, paddingVertical: 2, borderRadius: radius.full,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
  },
  molKindText:      { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  // ── Liste médicaments (onglet meds)
  list:             { gap: spacing.sm },
  empty:            { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText:        { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  medRow: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  medRowMain:       { flex: 1, gap: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary,
    borderRadius: radius.md, paddingVertical: spacing.sm + 2,
  },
  addBtnText:       { fontSize: 14, fontWeight: '700', color: colors.primary },
  // ── Streak
  streak: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
  },
  streakText:       { fontSize: 14, fontWeight: '700', color: colors.text },
  // ── Footer
  footer: {
    backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
    padding: spacing.md,
  },
  // ── Modal éditeur médicament
  modalBackdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.lg, gap: spacing.md,
  },
  modalTitle:       { fontSize: 18, fontWeight: '700', color: colors.text },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    fontSize: 15, color: colors.text,
  },
  modalActions:     { flexDirection: 'row', gap: spacing.sm },
  modalAction:      { flex: 1 },
})
