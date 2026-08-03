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
  primary:   { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primaryLight, borderWidth: 1.5, borderColor: colors.primary },
  ghost:     { backgroundColor: 'transparent' },
  danger:    { backgroundColor: colors.dangerLight, borderWidth: 1, borderColor: colors.danger },
  // Alerte pleine : réservée aux secours vitaux (15, 114), là où l'appel doit se voir
  // avant tout le reste. Fond `dangerText` (#DC2626) et non `danger` (#EF4444) : c'est
  // le seul des deux rouges qui porte un libellé blanc à ≈ 4,8:1, donc AA.
  dangerSolid: { backgroundColor: colors.dangerText },
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
  // Libellé sombre sur le turquoise de marque : `colors.primary` (#6dbfc3) avec du
  // blanc échoue AA (≈ 2.1:1) ; `colors.text` le porte à ≈ 8:1. Cf. packages/shared/src/theme.ts.
  primaryLabel:   { color: colors.text },
  secondaryLabel: { color: colors.primary },
  ghostLabel:     { color: colors.primary },
  dangerLabel:    { color: colors.danger },
  dangerSolidLabel: { color: colors.white },
  ghostDangerLabel: { color: colors.danger },
})
