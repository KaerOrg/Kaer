import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../../../../../theme'

export const styles = StyleSheet.create({
  container:       { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  // ── Intro
  introCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', gap: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  introTitle:     { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' },
  introText:      { fontSize: 15, color: colors.textMuted, lineHeight: 22, textAlign: 'center' },
  section:        { gap: spacing.sm },
  sectionLabel:   { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  stepsPreviewCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  previewRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  previewBadge:   { width: 28, height: 28, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  previewCount:   { fontSize: 14, fontWeight: '700' },
  previewSense:   { fontSize: 15, color: colors.text, fontWeight: '500' },
  noteCard:       { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', paddingHorizontal: spacing.sm },
  noteText:       { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  startBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  startBtnText:   { fontSize: 16, fontWeight: '700', color: colors.white },
  // ── Guided
  guidedContainer: {
    flex: 1, backgroundColor: colors.background,
    padding: spacing.lg, gap: spacing.lg, justifyContent: 'center',
  },
  progressBar:    { height: 4, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: radius.full },
  progressLabel:  { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  stepCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', gap: spacing.md, borderTopWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  stepIconCircle: { width: 96, height: 96, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  stepCountBadge: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  stepCountText:  { fontSize: 18, fontWeight: '800', color: colors.white },
  stepSense:      { fontSize: 20, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  stepInstruction: { fontSize: 17, color: colors.text, textAlign: 'center', lineHeight: 26, fontWeight: '500' },
  stepTip:        { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20, fontStyle: 'italic' },
  nextBtn: {
    borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  nextBtnText:    { fontSize: 16, fontWeight: '700', color: colors.white },
  cancelBtn:      { alignItems: 'center', paddingVertical: spacing.sm },
  cancelBtnText:  { fontSize: 14, color: colors.textMuted },
  // ── Done
  doneCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', gap: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  doneTitle:      { fontSize: 24, fontWeight: '700', color: colors.text },
  doneText:       { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  restartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: spacing.md, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primaryLight,
  },
  restartBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary },
})
