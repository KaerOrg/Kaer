import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize } from '@theme'

export interface DueBadgeProps {
  /** Libellé déjà formaté, ex. « À remplir avant le 5 août ». */
  label: string
}

/**
 * Pastille d'échéance sur la carte d'un module (#414).
 *
 * ⚠️ **Une date, affichée. Rien d'autre.** Pas de compte à rebours, pas de rouge, pas
 * de « en retard ». Faire dire à l'app « vous êtes en retard » serait un jugement
 * adressé à quelqu'un dont le biais interprétatif négatif fait partie du tableau
 * clinique, et ce serait du contenu piloté par une donnée patient.
 *
 * Côté praticien, `computeScheduleStatus` calcule bien un `overdueDays`, et c'est
 * légitime là-bas : un constat de calendrier adressé à un professionnel. **Il ne
 * traverse pas jusqu'ici**, et cette pastille ne le reçoit même pas en prop, pour
 * qu'on ne puisse pas s'en servir sans y penser.
 */
export const DueBadge = React.memo(function DueBadge({ label }: DueBadgeProps) {
  return <Text style={styles.badge} testID="module-due-badge">{label}</Text>
})

const styles = StyleSheet.create({
  // Teinte de marque, la même quelle que soit la date : elle identifie une échéance,
  // elle n'en qualifie pas l'urgence.
  badge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    // `primaryPale` + `primaryDark` : le couple de marque déjà défini pour du texte
    // sombre sur fond turquoise clair. La maquette proposait un #E8F3F3 très proche ;
    // on prend le token plutôt que d'en ajouter un quasi-doublon.
    backgroundColor: colors.primaryPale,
    color: colors.primaryDark,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
})
