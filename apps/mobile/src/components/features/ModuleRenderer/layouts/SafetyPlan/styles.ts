import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@theme'

export const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.background },
  scroll:        { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  headerTitle:   { fontSize: 18, fontWeight: '700', color: colors.text },
  card:          { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  stepHeader:    { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  stepIconBg:    { width: 42, height: 42, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  stepInfo:      { flex: 1 },
  stepNumber:    { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepTitle:     { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 1 },
  stepContent:   { borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md, gap: spacing.xs },
  stepHint:      { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing.xs },
  item:          { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  itemText:      { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  emptyStep:     { fontSize: 13, color: colors.textMuted },
})
