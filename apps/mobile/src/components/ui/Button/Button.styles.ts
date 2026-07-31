import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@theme'

export const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Tailles (dimensions only) ───────────────────────────────────────────
  md: { paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.lg, minHeight: 50 },
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 36 },
  // ── Variantes (couleurs only) ───────────────────────────────────────────
  //
  // Contraste AA (#274). Les teintes CLAIRES de la charte (`primary` #6dbfc3,
  // `danger` #EF4444) sont superbes en fond, en filet ou en pastille, mais elles
  // échouent le seuil de 4,5:1 dès qu'elles portent ou reçoivent du texte :
  // blanc sur `primary` plafonne à 2,12:1, `primary` sur `primaryLight` à 1,95:1.
  // Les variantes foncées (`primaryDark`, `dangerDark`) sont donc employées partout
  // où il y a du texte, et le turquoise clair reste sur tout le reste.
  // `Button.contrast.test.ts` fige chaque couple.
  primary:   { backgroundColor: colors.primaryDark },
  // Bordure passée en foncé elle aussi : à 1,95:1 le filet clair ne se distinguait
  // pas de son fond (seuil non textuel : 3:1).
  secondary: { backgroundColor: colors.primaryLight, borderWidth: 1.5, borderColor: colors.primaryDark },
  ghost:     { backgroundColor: 'transparent' },
  danger:    { backgroundColor: colors.dangerLight, borderWidth: 1, borderColor: colors.danger },
  // Destructif discret : aucun habillage, seul le libellé porte la couleur d'alerte.
  ghostDanger: { backgroundColor: 'transparent' },
  disabled:   { opacity: 0.5 },
  withIcon:   { flexDirection: 'row', gap: spacing.xs },
  // Mode icône seule : annule le « chrome » CTA (hauteur min + padding large).
  iconOnly:   { minHeight: 0, paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  // Colonne label + sublabel (bouton à deux lignes) — alignée à gauche.
  textColumn:     { alignItems: 'flex-start' },
  label:          { fontWeight: '600' },
  labelMd:        { fontSize: 16 },
  labelSm:        { fontSize: 14 },
  sublabel:       { fontSize: 12, fontWeight: '400', opacity: 0.85, marginTop: 1 },
  primaryLabel:   { color: colors.white },
  secondaryLabel: { color: colors.primaryDark },
  ghostLabel:     { color: colors.primaryDark },
  // `dangerText` (#DC2626) ne suffit pas sur le fond rosé : 3,95:1. `dangerDark`
  // y atteint 5,3:1.
  dangerLabel:    { color: colors.dangerDark },
  ghostDangerLabel: { color: colors.dangerDark },
})
