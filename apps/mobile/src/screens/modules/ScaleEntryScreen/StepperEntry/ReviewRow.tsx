import React, { useCallback } from 'react'
import { Text } from 'react-native'
import { Card } from '@ui/Card'
import { styles } from './styles'

export interface ReviewRowProps {
  /** Rang de l'item, à partir de 0. Affiché en 1-indexé. */
  index: number
  label: string
  /** Modalité choisie, ou `null` si l'item n'a pas de réponse. */
  answerLabel: string | null
  /** Texte affiché à la place de la modalité quand l'item est sans réponse. */
  unansweredLabel: string
  onPress: (index: number) => void
}

/**
 * Une ligne de la relecture : le libellé de l'item en petit, la modalité choisie en
 * gras dessous. La ligne entière est tappable et renvoie à l'écran de cet item.
 *
 * Conformité MDR : la ligne se rend identiquement quelle que soit la valeur choisie,
 * et l'ordre est celui du questionnaire, jamais un tri par réponse.
 */
export const ReviewRow = React.memo(function ReviewRow({
  index, label, answerLabel, unansweredLabel, onPress,
}: ReviewRowProps) {
  const handlePress = useCallback(() => onPress(index), [onPress, index])

  return (
    <Card onPress={handlePress} style={styles.reviewRow} accessibilityLabel={label}>
      <Text style={styles.reviewLabel} numberOfLines={1}>
        {index + 1}. {label}
      </Text>
      <Text style={answerLabel != null ? styles.reviewAnswer : styles.reviewUnanswered}>
        {answerLabel ?? unansweredLabel}
      </Text>
    </Card>
  )
})
