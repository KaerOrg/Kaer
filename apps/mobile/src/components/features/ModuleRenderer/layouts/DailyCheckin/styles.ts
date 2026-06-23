import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@theme'

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
  tabBadge: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
  },
  tabBadgeText:     { color: colors.white, fontSize: 11, fontWeight: '700' },
  // ── Date du jour
  dateHeader: {
    backgroundColor: colors.primaryLight, borderRadius: radius.lg,
    padding: spacing.md, gap: 2,
  },
  dateLabel: {
    fontSize: 13, fontWeight: '600', color: colors.primary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  dateValue:        { fontSize: 18, fontWeight: '700', color: colors.text },
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
  // ── Notes
  notesSection:     { gap: spacing.xs },
  notesLabel: {
    fontSize: 13, fontWeight: '600', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  notesInput: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    fontSize: 14, color: colors.text, minHeight: 80,
  },
  // ── Liste historique
  list:             { gap: spacing.sm },
  empty:            { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText:        { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  histCard: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  histMain:         { flex: 1, gap: 4 },
  histDate:         { fontSize: 13, fontWeight: '600', color: colors.text },
  histBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full,
  },
  histBadgeText:    { fontSize: 12, fontWeight: '600' },
  histNotes:        { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  // ── Footer
  footer: {
    backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
    padding: spacing.md,
  },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm + 2,
  },
  saveBtnDisabled:  { opacity: 0.6 },
  saveBtnText:      { color: colors.white, fontSize: 16, fontWeight: '700' },
})
