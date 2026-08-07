import React, { useCallback, useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { styles } from './styles'
import { StepperHeader } from './StepperHeader'
import { ItemStep } from './ItemStep'
import { ReviewStep } from './ReviewStep'
import type { StepperQuestion, StepperStep, Translate } from './types'

/**
 * Délai entre la sélection et le passage à l'item suivant. Assez long pour que la
 * coche soit vue (l'écran ne doit pas se dérober sous le doigt), assez court pour
 * que l'avance reste gratuite. Sans elle, dix items coûteraient vingt taps.
 */
const AUTO_ADVANCE_MS = 300

const FIRST_STEP: StepperStep = { kind: 'item', index: 0, fromReview: false }

export interface StepperEntryProps {
  questions: readonly StepperQuestion[]
  /** Consigne répétée sur chaque item. */
  instructions: readonly string[]
  answers: readonly (number | null)[]
  onAnswer: (index: number, value: number) => void
  onSubmit: () => void
  /** Sortie du questionnaire (retour depuis le tout premier item). */
  onExit: () => void
  /** Libellé du bouton d'envoi, propre au module. */
  submitLabel: string
  saving: boolean
  accentColor?: string
  t: Translate
}

/**
 * Saisie d'une échelle un item par écran, suivie d'une relecture (#409 + #416).
 *
 * Le parti pris répond au straight-lining : empiler les mêmes quatre modalités fait
 * répondre en colonne, on lit le premier item puis on aligne. Un item par écran
 * force à relire. Sur un instrument dont tout l'intérêt est de se comparer à
 * lui-même dans le temps, cela prime sur quelques secondes gagnées.
 *
 * Ce composant ne connaît aucun module : les questions, les modalités et le libellé
 * d'envoi lui arrivent en props. C'est le mode de saisie qui est configuré en base
 * (`scale_meta.entry_mode`), jamais un test sur l'identifiant du module.
 */
export function StepperEntry({
  questions, instructions, answers, onAnswer, onSubmit, onExit,
  submitLabel, saving, accentColor, t,
}: StepperEntryProps) {
  const [step, setStep] = useState<StepperStep>(FIRST_STEP)
  // Le minuteur d'avance automatique ne pilote aucun rendu : une ref, pas un state.
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAdvance = useCallback(() => {
    if (advanceTimer.current !== null) {
      clearTimeout(advanceTimer.current)
      advanceTimer.current = null
    }
  }, [])

  // Un minuteur en vol après démontage écrirait dans un composant disparu.
  useEffect(() => clearAdvance, [clearAdvance])

  const total = questions.length

  const handleSelect = useCallback((index: number, value: number) => {
    onAnswer(index, value)
    // Re-sélectionner avant la fin du délai reprogramme l'avance au lieu d'en
    // empiler une seconde : on change d'avis sans partir deux fois.
    clearAdvance()
    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null
      setStep(prev => {
        if (prev.kind !== 'item') return prev
        // Un item ouvert depuis la relecture y retourne : le patient corrige une
        // réponse et retrouve sa vue d'ensemble, il ne repart pas dans le parcours.
        if (prev.fromReview || prev.index >= total - 1) return { kind: 'review' }
        return { kind: 'item', index: prev.index + 1, fromReview: false }
      })
    }, AUTO_ADVANCE_MS)
  }, [onAnswer, clearAdvance, total])

  const handleBack = useCallback(() => {
    clearAdvance()
    setStep(prev => {
      if (prev.kind === 'review') {
        return total > 0 ? { kind: 'item', index: total - 1, fromReview: false } : prev
      }
      if (prev.fromReview) return { kind: 'review' }
      if (prev.index > 0) return { kind: 'item', index: prev.index - 1, fromReview: false }
      onExit()
      return prev
    })
  }, [clearAdvance, onExit, total])

  const handleEditItem = useCallback((index: number) => {
    clearAdvance()
    setStep({ kind: 'item', index, fromReview: true })
  }, [clearAdvance])

  const handleSubmit = useCallback(() => {
    clearAdvance()
    onSubmit()
  }, [clearAdvance, onSubmit])

  const answeredAll = questions.length > 0 && questions.every((_, i) => answers[i] != null)
  const backLabel = t('common.back')

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {step.kind === 'review' ? (
        <>
          <StepperHeader
            current={null}
            total={total}
            countLabel=""
            title={t('modules.scale_entry.review_title')}
            backLabel={backLabel}
            onBack={handleBack}
            accentColor={accentColor}
          />
          <ReviewStep
            questions={questions}
            answers={answers}
            hint={t('modules.scale_entry.review_hint')}
            submitLabel={submitLabel}
            unansweredLabel={t('modules.scale_entry.unanswered')}
            onEditItem={handleEditItem}
            onSubmit={handleSubmit}
            saving={saving}
            canSubmit={answeredAll}
          />
        </>
      ) : (
        <>
          <StepperHeader
            current={step.index + 1}
            total={total}
            countLabel={t('modules.scale_entry.progress', { current: step.index + 1, total })}
            backLabel={backLabel}
            onBack={handleBack}
            accentColor={accentColor}
          />
          <ItemStep
            question={questions[step.index]}
            index={step.index}
            value={answers[step.index] ?? null}
            onSelect={handleSelect}
            instructions={instructions}
            accentColor={accentColor}
          />
        </>
      )}
    </SafeAreaView>
  )
}
