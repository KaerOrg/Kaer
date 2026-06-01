import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../../../../../theme'

export const styles = StyleSheet.create({
  container:       { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  infoBox:         { flexDirection: 'row', gap: 6, alignItems: 'flex-start', padding: 10, backgroundColor: '#F3F4F6', borderRadius: 8 },
  footerText:      { fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 17 },
  emptyCenter:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md, minHeight: 300 },
  emptyTitle:      { fontSize: 20, fontWeight: '600', color: colors.text, textAlign: 'center' },
  emptyText:       { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  // Disclaimer
  warningCard: {
    backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 1,
    borderRadius: radius.lg, padding: spacing.md,
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
  },
  warningText:     { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 },
  // Sections
  section:         { gap: spacing.sm },
  sectionLabel:    { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionHint:     { fontSize: 13, color: colors.textMuted, marginTop: -spacing.xs },
  // Scénario
  scenarioCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    borderLeftWidth: 4, borderLeftColor: colors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    gap: spacing.sm,
  },
  scenarioIcon:    { alignSelf: 'flex-start' },
  scenarioText:    { fontSize: 16, color: colors.text, lineHeight: 26 },
  // Étapes
  stepsCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  stepRow:         { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  stepBadge:       { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  stepBadgeText:   { fontSize: 11, fontWeight: '700', color: colors.primary },
  stepText:        { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  // Scénario original
  collapsibleHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
  },
  collapsibleLabel: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  originalCard:    { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.border },
  originalText:    { fontSize: 14, color: colors.textMuted, lineHeight: 22 },
  // Sons
  soundsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  soundBtn: {
    flex: 1, minWidth: '28%', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: spacing.md, backgroundColor: colors.card,
    borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  soundBtnActive:      { backgroundColor: colors.primary, borderColor: colors.primary },
  soundBtnUnavailable: { opacity: 0.5 },
  soundLabel:          { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },
  soundLabelActive:    { color: colors.white },
  soundLabelMuted:     { color: colors.textMuted },
  soundComingSoon:     { fontSize: 9, color: colors.textMuted, fontStyle: 'italic' },
})
