import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../../../../../theme'

export const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: colors.background },
  center:            { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scroll:            { flex: 1 },
  // ── Liste
  listContent:       { padding: spacing.md, paddingBottom: spacing.lg },
  list:              { gap: spacing.sm },
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
  recordDate:        { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
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
  // ── Champ horaire
  timeContainer:    { gap: spacing.xs },
  timeLabelRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    minHeight: 18,
  },
  timeLabel:        { fontSize: 13, fontWeight: '600', color: colors.text },
  timeButton: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  timeButtonEmpty:  { borderStyle: 'dashed' },
  timeValue: {
    fontSize: 16, fontWeight: '600', color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  timePlaceholder:  { fontSize: 14, color: colors.textMuted },
  timeConfirm: {
    alignSelf: 'flex-end', paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, marginTop: spacing.xs,
    borderRadius: radius.sm, backgroundColor: colors.primary,
  },
  timeConfirmText:  { color: colors.white, fontSize: 13, fontWeight: '600' },
  // ── Footer
  footer: {
    backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
    padding: spacing.md, flexDirection: 'row', gap: spacing.sm,
  },
  saveBtn: {
    flex: 1, backgroundColor: colors.primary, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm + 2,
  },
  saveBtnText:       { color: colors.white, fontSize: 16, fontWeight: '700' },
  cancelBtn: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText:     { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  newBtn: {
    flex: 1, backgroundColor: colors.primary, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm + 2,
  },
  newBtnText:        { color: colors.white, fontSize: 16, fontWeight: '700' },
  btnDisabled:       { opacity: 0.6 },
})
