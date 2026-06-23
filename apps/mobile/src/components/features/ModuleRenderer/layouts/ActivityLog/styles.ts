import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@theme'

export const alStyles = StyleSheet.create({
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

  // List
  listContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 96 },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  dayList: { gap: spacing.sm },
  dayListTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  // Record card
  recordCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  recordCardDone: { opacity: 0.7 },
  checkbox: { width: 32, alignItems: 'center' },
  recordContent: { flex: 1, gap: 4 },
  recordLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  recordLabelDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  recordScores: { flexDirection: 'row', gap: spacing.xs },
  scorePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.background, borderRadius: radius.sm,
    paddingHorizontal: spacing.xs, paddingVertical: 2,
  },
  scorePillKey: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  scorePillVal: { fontSize: 12, fontWeight: '700', color: colors.primary },
  recordNotes: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  recordActions: { gap: spacing.sm, alignItems: 'center' },

  // FAB
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56, height: 56, borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },

  // Entry
  entryHeaderBar: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    flexDirection: 'row', alignItems: 'center',
  },
  entryContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  backBtn: {
    width: 44, height: 44, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
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
  cardDivider: { height: 1, backgroundColor: colors.border },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dateValue: { fontSize: 15, fontWeight: '500', color: colors.text },
  confirmBtn: {
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    padding: spacing.sm, alignItems: 'center',
  },
  confirmBtnText: { color: colors.primary, fontWeight: '600' },
  labelInput: { fontSize: 16, color: colors.text, minHeight: 44 },
  chipList: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  doneRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1.5, borderColor: colors.border,
  },
  doneRowActive: { borderColor: colors.success, backgroundColor: '#ECFDF5' },
  doneLabel: { fontSize: 15, fontWeight: '500', color: colors.textMuted },
  notesInput: { fontSize: 15, color: colors.text, minHeight: 72, lineHeight: 22 },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: spacing.sm + 4,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  deleteBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  deleteBtnText: { color: colors.danger, fontSize: 14, fontWeight: '600' },

  // Month
  monthNav: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  monthTitle: {
    flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700',
    color: colors.text, textTransform: 'capitalize',
  },
  monthContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },

  // Calendar
  calendarCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, gap: spacing.sm,
  },
  calendarHeader: { flexDirection: 'row' },
  calendarRow: { flexDirection: 'row' },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  calendarCellPressable: { borderRadius: radius.full },
  calendarCellSelected: { backgroundColor: colors.primary },
  calendarCellHasActivity: { backgroundColor: colors.primaryLight },
  calendarCellToday: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.full },
  weekday: {
    width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, fontWeight: '700',
    color: colors.textMuted, textTransform: 'uppercase', paddingBottom: spacing.xs,
  },
  dayNum: { fontSize: 13, fontWeight: '500', color: colors.text },
  dayNumToday: { color: colors.primary, fontWeight: '700' },
  dayNumSelected: { color: colors.white, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 2, justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: radius.full },
  legendRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: radius.full },
  legendText: { fontSize: 11, color: colors.textMuted },
  legendStat: { fontSize: 11, color: colors.textMuted, marginLeft: 'auto' },
  monthHint: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.lg, justifyContent: 'center',
  },
  monthHintText: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
})
