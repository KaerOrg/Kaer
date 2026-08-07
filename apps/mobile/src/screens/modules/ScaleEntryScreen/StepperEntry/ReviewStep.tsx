import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { Button } from '@ui/Button'
import { styles } from './styles'
import { ReviewRow } from './ReviewRow'
import type { StepperQuestion } from './types'

export interface ReviewStepProps {
  questions: readonly StepperQuestion[]
  answers: readonly (number | null)[]
  hint: string
  submitLabel: string
  unansweredLabel: string
  onEditItem: (index: number) => void
  onSubmit: () => void
  saving: boolean
  /** Envoi possible seulement quand tous les items ont une réponse. */
  canSubmit: boolean
}

/**
 * Relecture avant envoi (#416, Q-12).
 *
 * Elle rend deux choses que la saisie un item par écran fait perdre : la vue
 * d'ensemble, et la possibilité de se corriger. Elle rend surtout l'envoi
 * EXPLICITE : tout le reste du parcours avance automatiquement, aucune réponse ne
 * doit partir sur un tap accidentel.
 *
 * Conformité MDR : aucun total, aucune couleur, aucun tri par valeur, aucune ligne
 * mise en avant. L'item sur les pensées de mort se lit comme les neuf autres.
 */
export const ReviewStep = React.memo(function ReviewStep({
  questions, answers, hint, submitLabel, unansweredLabel, onEditItem, onSubmit, saving, canSubmit,
}: ReviewStepProps) {
  return (
    <ScrollView contentContainerStyle={styles.reviewContent}>
      <Text style={styles.reviewHint}>{hint}</Text>

      <View style={styles.reviewList}>
        {questions.map((question, index) => {
          const value = answers[index] ?? null
          const chosen = value === null
            ? null
            : question.options.find(o => o.value === value)?.label ?? null
          return (
            <ReviewRow
              key={question.id}
              index={index}
              label={question.label}
              answerLabel={chosen}
              unansweredLabel={unansweredLabel}
              onPress={onEditItem}
            />
          )
        })}
      </View>

      <View style={styles.submitBar}>
        <Button label={submitLabel} onPress={onSubmit} loading={saving} disabled={!canSubmit} />
      </View>
    </ScrollView>
  )
})
