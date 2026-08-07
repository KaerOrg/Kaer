import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, fontSize } from '@theme'

export interface SourceCitationProps {
  /** Citation des auteurs de l'instrument. Rien n'est rendu si elle est vide. */
  citation: string
  /**
   * Attribution de la traduction, ou `null` s'il n'y a aucun tiers à attribuer.
   * `null` est le cas nominal : aucune ligne, aucun séparateur, aucun espace parasite.
   */
  translationAttribution?: string | null
}

/**
 * Mention de source d'un instrument clinique (#417, Q-13). Pendant mobile du composant
 * web du même nom : les deux rendent la même chose, lue au même endroit en base.
 *
 * **C'est une obligation de licence, pas un ornement.** Elle doit être rendue partout
 * où les items de l'instrument sont montrés à un humain. Elle vivait jusqu'ici
 * accrochée à d'autres contenus : il suffisait d'y déplacer un bloc, geste anodin en
 * apparence, pour qu'elle disparaisse sans que personne ne s'en aperçoive.
 *
 * Ne porte **que** les mentions dues. La recommandation clinique
 * (`scale_meta.reference_label`) est un argument de crédibilité et vit ailleurs, au
 * moment du choix du praticien : les empiler abîmerait les deux.
 *
 * Pas de texte en dur ici : tout arrive en props, depuis `scale_meta`. Chaque échelle
 * a sa propre formule, et coder une formule dans un écran est exactement ce qui a fait
 * tomber deux échelles à l'audit des droits.
 */
export const SourceCitation = React.memo(function SourceCitation({
  citation, translationAttribution = null,
}: SourceCitationProps) {
  const trimmed = citation.trim()
  if (trimmed.length === 0) return null

  return (
    <View style={styles.block} testID="source-citation">
      <Text style={styles.citation}>{trimmed}</Text>
      {translationAttribution != null ? (
        <Text style={styles.translation}>{translationAttribution}</Text>
      ) : null}
    </View>
  )
})

const styles = StyleSheet.create({
  // Sobre, en pied, sans emphase : on l'affiche parce qu'on y est tenu. Le `gap` ne
  // s'applique qu'entre enfants présents, donc aucune ligne vide sans attribution.
  block: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  citation:    { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 17 },
  translation: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 17, fontStyle: 'italic' },
})
