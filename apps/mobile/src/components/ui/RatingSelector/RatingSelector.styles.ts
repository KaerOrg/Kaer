import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@theme'

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

  // ── variant='track' + continuous (jauge proportionnelle, affichage) ─────────
  gauge:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  gaugeTrack: { flex: 1, height: 4, flexDirection: 'row', borderRadius: radius.full, backgroundColor: colors.border, overflow: 'visible' },
  gaugeFill:  { height: 4, borderRadius: radius.full, opacity: 0.5, position: 'relative' },
  gaugeEmpty: { height: 4, borderRadius: radius.full, backgroundColor: colors.border },
  gaugeThumb: { position: 'absolute', width: 12, height: 12, borderRadius: 6, opacity: 0.6, top: -4, right: -6 },
  gaugeValue: { fontSize: 11, fontWeight: '600', minWidth: 32, textAlign: 'right' },

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

  // ── variant='icon' ─────────────────────────────────────────────────────────
  icons: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' },

  // ── End labels ─────────────────────────────────────────────────────────────
  endLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  endLabel:  { fontSize: 11, color: colors.textMuted },
})
