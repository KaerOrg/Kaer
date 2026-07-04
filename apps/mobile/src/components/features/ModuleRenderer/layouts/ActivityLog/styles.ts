import { StyleSheet } from 'react-native'
import { colors, spacing, radius, shadows } from '@theme'

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

  // List / Week
  listContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 96 },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  dayList: { gap: spacing.sm },
  dayListTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  dayListTitleToday: { color: colors.primary },
  todayEmptyText: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },

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
  recordScores: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
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

  // Suggestions / activités co-construites
  suggestionGroup: { gap: spacing.xs, marginTop: spacing.xs },
  suggestionGroupTitle: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  valueText: { fontSize: 13, color: colors.primary, fontStyle: 'italic' },

  notesInput: { fontSize: 15, color: colors.text, minHeight: 72, lineHeight: 22 },

  // Feuille d'évaluation à la complétion (« C'était comment ? »)
  sheetBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetBackdropTap: { flex: 1 },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    ...shadows.md,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  sheetActivity: { fontSize: 14, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
})
