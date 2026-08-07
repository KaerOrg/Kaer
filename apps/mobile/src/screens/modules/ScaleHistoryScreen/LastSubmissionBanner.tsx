import React from 'react'
import { View, Text } from 'react-native'
import { homeStyles as styles } from './homeStyles'

export interface LastSubmissionBannerProps {
  /** Intitulé du bloc, ex. « Dernier envoi ». */
  label: string
  /** Date du dernier envoi, déjà formatée. */
  date: string
}

/**
 * Bandeau du dernier envoi, en tête de l'accueil du module (#408).
 *
 * Conformité MDR : il annonce une DATE, jamais un score, jamais un écart. Sa couleur
 * est un accent d'identité fixe et ne dépend d'aucune réponse du patient.
 *
 * **Pas d'accusé de lecture ici.** Le champ existait, il a été retiré : le patient
 * remplit le questionnaire parce que son soignant le lui a prescrit, et l'échange a
 * lieu en séance. Surtout, une ligne « Vu le … » qui apparaît une fois puis plus
 * ensuite fait lire quelque chose dans son absence, et un biais d'interprétation
 * négatif fait partie du tableau clinique qu'on suit ici. Le retour humain qui compte
 * est la consigne écrite par le soignant (#421), pas un horodatage automatique.
 * L'accusé reste enregistré et visible côté praticien.
 */
export const LastSubmissionBanner = React.memo(function LastSubmissionBanner({
  label, date,
}: LastSubmissionBannerProps) {
  return (
    <View style={styles.banner} testID="last-submission-banner">
      <Text style={styles.bannerLabel}>{label}</Text>
      <Text style={styles.bannerDate}>{date}</Text>
    </View>
  )
})
