import React from 'react'
import { View, Text } from 'react-native'
import { Card } from '@ui/Card'
import { Disclosure } from '@ui/Disclosure'
import { homeStyles as styles } from './homeStyles'

export interface ScoreLine {
  id: string
  /** Date de la passation, déjà formatée. */
  date: string
  /** Total, déjà arrondi selon la précision de l'échelle. */
  value: string
  /** Borne haute, ex. « / 27 ». */
  max: string
}

export interface ScoreDisclosureProps {
  label: string
  lines: readonly ScoreLine[]
  /** Note de bas de bloc rappelant ce que ces totaux ne sont pas. */
  note: string
  open: boolean
  onToggle: (open: boolean) => void
}

/**
 * Totaux des passations, sous un dépli replié par défaut (#408).
 *
 * Conformité MDR, et c'est tout l'objet de ce composant :
 * - le score n'est **jamais** visible sans une action explicite du patient ;
 * - **aucun écart** n'est calculé ni affiché. « 4 points de moins sur combien ? » est
 *   sans réponse pour le patient, et « 4 points de plus » tombe sur quelqu'un seul, le
 *   soir, dont le biais interprétatif négatif fait partie du tableau clinique ;
 * - aucune couleur, aucune flèche, aucun adjectif ne qualifie un total. Tous se
 *   rendent identiquement, dans l'ordre du temps, jamais triés par valeur.
 *
 * Le patient fait la comparaison lui-même s'il le veut : ce n'est plus l'app qui la
 * lui met sous les yeux.
 */
export const ScoreDisclosure = React.memo(function ScoreDisclosure({
  label, lines, note, open, onToggle,
}: ScoreDisclosureProps) {
  return (
    <Disclosure label={label} open={open} onToggle={onToggle} testID="score-disclosure">
      <Card variant="default" style={styles.scoreCard}>
        {lines.map(line => (
          <View key={line.id} style={styles.scoreRow}>
            <Text style={styles.scoreDate}>{line.date}</Text>
            <Text style={styles.scoreValue}>
              {line.value}
              <Text style={styles.scoreMax}> {line.max}</Text>
            </Text>
          </View>
        ))}
        <Text style={styles.scoreNote}>{note}</Text>
      </Card>
    </Disclosure>
  )
})
