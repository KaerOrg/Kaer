import { StyleSheet } from 'react-native'
import { spacing, radius, fontSize } from '@theme'

// Couleurs de l'écran de session, codées en dur et assumées.
//
// C'est un CHOIX D'ÉCRAN, pas le chantier « dark mode » global : le thème ne bouge
// nulle part ailleurs. Les ajouter aux tokens partagés les rendrait disponibles
// partout, ce qui n'est pas voulu tant que le mode sombre n'est pas traité pour
// l'app entière (epic #195).
export const SESSION_COLORS = {
  gradientTop: '#0F3237',
  gradientMid: '#14454B',
  gradientBottom: '#175055',
  orbInner: '#A8E4DE',
  orbOuter: '#58B5B4',
  glow: 'rgba(120,214,208,0.5)',
  text: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.72)',
  textFaint: 'rgba(255,255,255,0.45)',
  track: 'rgba(255,255,255,0.22)',
  control: 'rgba(255,255,255,0.14)',
} as const

/** Diamètre de l'orbe, en points. */
export const ORB_SIZE = 210

export const sessionStyles = StyleSheet.create({
  screen: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: spacing.lg },

  // ── Haut : progression et temps restant ────────────────────────────────────
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.md },
  progressWrap: { flex: 1, flexShrink: 1 },
  remaining: { fontSize: fontSize.caption, color: SESSION_COLORS.textDim, fontVariant: ['tabular-nums'] },

  // ── Centre : orbe, décompte, phase ─────────────────────────────────────────
  center: { alignItems: 'center', gap: spacing.lg },
  orbWrap: { width: ORB_SIZE, height: ORB_SIZE, alignItems: 'center', justifyContent: 'center' },
  countdown: {
    position: 'absolute',
    fontSize: 56,
    fontWeight: '200',
    color: SESSION_COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  phaseVerb: { fontSize: 28, fontWeight: '300', color: SESSION_COLORS.text, textAlign: 'center' },
  cycleLine: { fontSize: fontSize.caption, color: SESSION_COLORS.textFaint, textAlign: 'center' },

  // ── Bas : commandes ────────────────────────────────────────────────────────
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  controlBtn: {
    width: 48, height: 48, borderRadius: radius.full,
    backgroundColor: SESSION_COLORS.control, borderWidth: 0,
  },
  controlBtnLarge: {
    width: 60, height: 60, borderRadius: radius.full,
    backgroundColor: SESSION_COLORS.control, borderWidth: 0,
  },
  bottom: { gap: spacing.md, paddingBottom: spacing.lg },
  hapticHint: { fontSize: fontSize.xs, color: SESSION_COLORS.textFaint, textAlign: 'center' },
})
