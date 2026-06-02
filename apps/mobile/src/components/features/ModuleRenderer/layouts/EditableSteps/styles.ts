import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../../../../../theme'

export const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  scroll:          { flex: 1 },
  scrollContent:   { padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  card:            { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  stepHeader:      { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  stepIconBg:      { width: 42, height: 42, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  stepInfo:        { flex: 1 },
  stepNumber:      { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepTitle:       { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 1 },
  stepRight:       { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  badge:           { backgroundColor: colors.primary, borderRadius: radius.full, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText:       { color: '#fff', fontSize: 11, fontWeight: '700' },
  stepContent:     { borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md, gap: spacing.sm },
  stepHint:        { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing.xs },
  emergencyBar:    { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  emergencyRow:    { flexDirection: 'row', padding: spacing.sm, gap: spacing.sm },
  emergencyBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: radius.md, gap: spacing.sm },
  emergencyNumber: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 18 },
  emergencyLabel:  { color: 'rgba(255,255,255,0.8)', fontSize: 11, lineHeight: 14 },
})
