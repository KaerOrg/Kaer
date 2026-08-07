import { StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize } from '@theme'

export const styles = StyleSheet.create({
  // ── Variant 'list' (radio classique)
  list:        { gap: spacing.xs },
  row:         { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  dot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dotInner:    { width: 10, height: 10, borderRadius: 5 },
  rowText:     { flex: 1 },
  label:       { fontSize: 15, fontWeight: '600', color: colors.text },
  sublabel:    { fontSize: 13, color: colors.textMuted, marginTop: 1 },
  // ── Variant 'pills'
  pillsRow:    { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: radius.sm, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.card,
  },
  pillLabel:       { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  pillLabelActive: { color: colors.white },
  // ── Variant 'grid' (colonnes Likert : largeurs égales, label centré multiligne)
  gridRow:     { flexDirection: 'row', gap: 6 },
  gridOption: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  gridLabel:       { fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 15 },
  gridLabelActive: { color: colors.white, fontWeight: '600' },
  // ── Variant 'stack' (rangées pleine largeur, saisie un item par écran)
  // `minHeight: 52` tient la cible tactile de 44 pt même sur un libellé d'une seule
  // ligne ; la bordure garde la même épaisseur active ou non, pour qu'une sélection
  // ne décale pas la liste sous le doigt.
  stack:       { gap: spacing.xs },
  stackOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  // Le libellé prend la place restante et passe à la ligne : aucune troncature,
  // c'est le stimulus de l'item.
  stackLabel:       { flex: 1, fontSize: fontSize.label, color: colors.text, lineHeight: 21 },
  stackLabelActive: { fontWeight: '700' },
})
