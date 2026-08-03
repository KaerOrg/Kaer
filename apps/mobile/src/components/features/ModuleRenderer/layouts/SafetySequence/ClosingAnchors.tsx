// ─── Écran de clôture : « Ce qui me donne envie de tenir » (P-11) ────────────
//
// Les raisons de vivre s'affichent comme du CONTENU : une grande photo, deux
// petites, et la phrase du patient en grande typographie. Rien d'autre.
//
// **C'est l'écran le plus exposé à la tentation d'une mesure de fin de parcours**, et
// il n'en porte aucune : pas d'échelle, pas de score, pas de « comment vous
// sentez-vous maintenant ? », pas d'émoticône d'état. Une question notée en sortie de
// crise serait une mesure, donc une bascule réglementaire. Rien n'est écrit, rien
// n'est compté.
//
// Aucune affordance d'édition : ni pointillé, ni crayon, ni appui long. La vue est en
// lecture seule ; l'édition appartient à la vue Édition du module.
//
// Pas de guillemets autour de la phrase : c'est la phrase du patient, pas une citation.
//
// Composant PRÉSENTATIONNEL : les ancres lui arrivent par props, il ne va pas les
// chercher.

import React from 'react'
import { View, Text } from 'react-native'
import { Image } from 'expo-image'
import { styles } from './styles'

export interface ClosingAnchorsProps {
  /** URI locales des photos d'ancrage, dans l'ordre choisi par le patient. */
  photos: readonly string[]
  /** Phrase d'ancrage, telle que le patient l'a écrite. */
  phrase: string
}

export const ClosingAnchors = React.memo(function ClosingAnchors({ photos, phrase }: ClosingAnchorsProps) {
  const [lead, ...rest] = photos

  return (
    <View style={styles.closing}>
      {lead != null ? (
        <Image source={{ uri: lead }} style={styles.closingLeadPhoto} contentFit="cover" testID="closing-photo-lead" />
      ) : null}

      {rest.length > 0 ? (
        <View style={styles.closingPhotoRow}>
          {rest.map(uri => (
            <Image key={uri} source={{ uri }} style={styles.closingPhoto} contentFit="cover" testID="closing-photo" />
          ))}
        </View>
      ) : null}

      {phrase !== '' ? (
        <View style={styles.closingPhrasePanel} testID="closing-phrase">
          <Text style={styles.closingPhrase}>{phrase}</Text>
        </View>
      ) : null}
    </View>
  )
})
