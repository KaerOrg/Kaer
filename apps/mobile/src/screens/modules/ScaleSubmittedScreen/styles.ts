import { StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize } from '@theme'

export const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },

  // ── Confirmation d'envoi
  // La pastille est neutre : elle confirme un ENVOI, elle ne qualifie pas ce qui a
  // été envoyé. Aucune couleur de gravité nulle part sur cet écran (MDR 2017/745).
  checkChip: {
    width: 44, height: 44, borderRadius: radius.full,
    backgroundColor: colors.neutral, alignItems: 'center', justifyContent: 'center',
  },
  title:    { fontSize: fontSize.h2, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.label, color: colors.textMuted, lineHeight: 22 },

  // ── Bloc de ressources, SOUS la confirmation : il n'est pas l'événement de l'écran
  separator:    { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  resourcesHint: { fontSize: fontSize.caption, color: colors.textMuted, marginBottom: spacing.xs },
  resources:    { gap: spacing.sm },

  // ── Tuile du plan de sécurité
  planCard:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  planText:     { flex: 1, gap: 2 },
  planTitle:    { fontSize: fontSize.label, fontWeight: '700', color: colors.text },
  planSubtitle: { fontSize: fontSize.sm, color: colors.textMuted },

  footer: { marginTop: spacing.lg },
})
