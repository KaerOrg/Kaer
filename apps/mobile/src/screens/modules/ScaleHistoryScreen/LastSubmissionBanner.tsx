import React from 'react'
import { View, Text } from 'react-native'
import { homeStyles as styles } from './homeStyles'

export interface LastSubmissionBannerProps {
  /** Intitulé du bloc, ex. « Dernier envoi ». */
  label: string
  /** Date du dernier envoi, déjà formatée. */
  date: string
  /**
   * Ligne d'accusé de lecture, déjà formatée, ou `null` s'il n'y en a pas.
   * L'accusé arrive avec QW-2 : d'ici là, la ligne n'existe pas. Pas de placeholder,
   * pas de ligne fantôme : l'information absente ne s'affiche pas.
   */
  readNotice: string | null
}

/**
 * Bandeau du dernier envoi, en tête de l'accueil du module (#408).
 *
 * Conformité MDR : il annonce une DATE, jamais un score, jamais un écart. Sa couleur
 * est un accent d'identité fixe et ne dépend d'aucune réponse du patient.
 */
export const LastSubmissionBanner = React.memo(function LastSubmissionBanner({
  label, date, readNotice,
}: LastSubmissionBannerProps) {
  return (
    <View style={styles.banner} testID="last-submission-banner">
      <Text style={styles.bannerLabel}>{label}</Text>
      <Text style={styles.bannerDate}>{date}</Text>
      {readNotice != null ? <Text style={styles.bannerRead}>{readNotice}</Text> : null}
    </View>
  )
})
