import React from 'react'
import { Text } from 'react-native'
import { Card } from '@ui/Card'
import { homeStyles as styles } from './homeStyles'

export interface ModuleIntroCardProps {
  /** Lignes de présentation, déjà résolues et interpolées, dans l'ordre d'affichage. */
  lines: readonly string[]
}

/**
 * Carte de présentation affichée tant qu'aucune passation n'a été envoyée (#408).
 *
 * Un vide est une occasion de dire POURQUOI : combien de questions, sur quelle
 * période, et à qui les réponses partent. C'est ce que l'ancien « Rien pour l'instant »
 * ne disait pas.
 *
 * La consigne du soignant et son nom arrivent avec QW-4. D'ici là, les lignes qui en
 * dépendent sont formulées sans nom : pas de placeholder, pas de ligne fantôme.
 */
export const ModuleIntroCard = React.memo(function ModuleIntroCard({ lines }: ModuleIntroCardProps) {
  return (
    <Card variant="default" style={styles.intro} testID="module-intro-card">
      {lines.map(line => (
        <Text key={line} style={styles.introLine}>{line}</Text>
      ))}
    </Card>
  )
})
