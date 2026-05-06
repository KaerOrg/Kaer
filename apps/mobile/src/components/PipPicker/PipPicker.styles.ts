import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../../theme'

export const styles = StyleSheet.create({
  container: { gap: spacing.sm },

  // ── Header ─────────────────────────────────────────────────────────────────
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  label:    { fontSize: 14, fontWeight: '600', color: colors.text },
  sublabel: { fontSize: 12, color: colors.textMuted },
  value:    { fontSize: 28, fontWeight: '800' },

  // ── variant='track' ────────────────────────────────────────────────────────
  track:    { flexDirection: 'row', gap: 4, alignItems: 'center' },
  trackPip: { flex: 1, height: 12, borderRadius: radius.full, backgroundColor: colors.border },

  // ── variant='numbered' ─────────────────────────────────────────────────────
  pips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  numberedPip: {
    width: 44,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipText:         { fontSize: 13, color: colors.textMuted },
  pipTextSelected: { color: colors.white, fontWeight: '700' },

  // ── End labels ─────────────────────────────────────────────────────────────
  endLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  endLabel:  { fontSize: 11, color: colors.textMuted },
})
