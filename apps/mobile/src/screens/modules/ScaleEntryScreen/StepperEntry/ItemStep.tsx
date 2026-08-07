import React, { useCallback } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { LikertWidget } from '../../../../components/features/ModuleRenderer/fields/widgets/LikertWidget'
import { styles } from './styles'
import type { StepperQuestion } from './types'

export interface ItemStepProps {
  question: StepperQuestion
  /** Rang de l'item dans le questionnaire, à partir de 0. */
  index: number
  value: number | null
  onSelect: (index: number, value: number) => void
  /** Consigne, répétée sur chaque item : c'est la fenêtre temporelle de l'instrument. */
  instructions: readonly string[]
  accentColor?: string
}

/**
 * Un item du questionnaire, seul à l'écran.
 *
 * Conformité MDR : ni le libellé, ni le style, ni la présence d'un élément ne
 * dépendent de la valeur d'une réponse. L'item sur les pensées de mort se rend
 * exactement comme les autres, sans avertissement en amont : signaler un item avant
 * d'y répondre conditionnerait la réponse.
 */
export const ItemStep = React.memo(function ItemStep({
  question, index, value, onSelect, instructions, accentColor,
}: ItemStepProps) {
  const handleSelect = useCallback((v: number) => onSelect(index, v), [onSelect, index])

  return (
    <ScrollView contentContainerStyle={styles.itemContent}>
      {instructions.length > 0 ? (
        <View style={styles.instructions}>
          {instructions.map(line => (
            <Text key={line} style={styles.instructionText}>{line}</Text>
          ))}
        </View>
      ) : null}

      <Text style={styles.questionText}>{question.label}</Text>

      <LikertWidget
        layout="stack"
        options={[...question.options]}
        selected={value}
        onSelect={handleSelect}
        accentColor={accentColor}
      />
    </ScrollView>
  )
})
