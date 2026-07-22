import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { Button } from '@ui/Button'
import { colors, spacing } from '@theme'
import { useTeen } from '../../../../../hooks/useTeen'
import { generateId } from '../../../../../lib/database'
import { saveDefusionSession, type DefusionTechnique } from '@services/defusionService'
import {
  defusionReaderReducer,
  INITIAL_READER_STATE,
  type DefusionMeasure,
} from './defusionReaderMachine'
import { InputStep } from './steps/InputStep'
import { MeasureStep } from './steps/MeasureStep'
import { WordRepetitionExercise } from './steps/WordRepetitionExercise'
import { LinguisticDistancingExercise } from './steps/LinguisticDistancingExercise'
import { FinishStep } from './steps/FinishStep'

export interface DefusionReaderProps {
  technique: DefusionTechnique
  moduleId: string
  accent: string
  onClose: () => void
}

const WORD_MAX_LENGTH = 40
const THOUGHT_MAX_LENGTH = 240
const PALIER_KEYS = ['palier_1', 'palier_2', 'palier_3'] as const

/**
 * Lecteur plein écran des deux techniques de défusion (rendu dans une modale par
 * `DefusionLayout`). La logique de transition vit dans `defusionReaderReducer` (pur,
 * testé) ; ce composant l'habille : header conditionnel (X de fermeture seulement en
 * saisie et mesure-avant), étapes techniques, et enregistrement de la séance à
 * l'entrée dans l'étape « fin ».
 */
export function DefusionReader({ technique, moduleId, accent, onClose }: DefusionReaderProps) {
  const { isTeenMode } = useTeen()
  const { t } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const mk = useCallback((key: string) => `modules.${moduleId}.${key}`, [moduleId])

  const [state, dispatch] = useReducer(defusionReaderReducer, INITIAL_READER_STATE)
  const savedRef = useRef(false)

  const isWordRepetition = technique === 'word_repetition'

  // Enregistrement à l'entrée dans « fin » (une seule fois ; ré-armé au restart).
  useEffect(() => {
    if (state.step === 'input') { savedRef.current = false; return }
    if (state.step !== 'finish' || savedRef.current) return
    savedRef.current = true
    void saveDefusionSession({
      id: generateId(),
      technique,
      word_or_thought: state.wordOrThought,
      duration_seconds: state.durationSeconds,
      discomfort_before: state.before?.discomfort ?? null,
      belief_before: state.before?.belief ?? null,
      discomfort_after: state.after?.discomfort ?? null,
      belief_after: state.after?.belief ?? null,
    }).catch(() => { /* échec non bloquant : la séance reste affichée */ })
  }, [state, technique])

  const paliers = useMemo(
    () => PALIER_KEYS.map((key) => t(mk(key), { thought: state.wordOrThought })),
    [t, mk, state.wordOrThought],
  )

  const remainingLabel = useCallback(
    (seconds: number) => t(mk('exercise_remaining'), { count: seconds }),
    [t, mk],
  )

  // Callbacks stables passés aux étapes (dispatch est stable — deps vides).
  const handleSetInput = useCallback((value: string) => dispatch({ type: 'set_input', value }), [])
  const handleSubmitInput = useCallback(() => dispatch({ type: 'submit_input' }), [])
  const handleSubmitBefore = useCallback(
    (measure: DefusionMeasure | null) => dispatch({ type: 'submit_before', measure }),
    [],
  )
  const handleFinishExercise = useCallback(
    (durationSeconds: number) => dispatch({ type: 'finish_exercise', durationSeconds }),
    [],
  )
  const handleSubmitAfter = useCallback(
    (measure: DefusionMeasure | null) => dispatch({ type: 'submit_after', measure }),
    [],
  )
  const handleRestart = useCallback(() => dispatch({ type: 'restart' }), [])

  const stopConfirm = useMemo(
    () => ({
      title: t(mk('stop_confirm_title')),
      message: t(mk('stop_confirm_msg')),
      confirmLabel: t(mk('stop')),
    }),
    [t, mk],
  )

  const finishLabels = useMemo(
    () => ({
      title: t(mk('finish_title')),
      colBefore: t(mk('finish_col_before')),
      colAfter: t(mk('finish_col_after')),
      rowDiscomfort: t(mk('measure_discomfort')),
      rowBelief: t(mk('measure_belief')),
      durationLabel: t(mk('finish_duration')),
      note: t(mk('finish_note')),
      closeLabel: t('common.close'),
      redoLabel: t(mk('finish_redo')),
      skipped: t(mk('measure_skipped')),
    }),
    [t, mk],
  )

  const showClose = state.step === 'input' || state.step === 'before'

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      {showClose ? (
        <View style={styles.header}>
          <Button
            variant="ghost"
            onPress={onClose}
            iconLeft={<MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />}
            accessibilityLabel={t('common.close')}
            testID="defusion-close"
          />
        </View>
      ) : null}

      <View style={styles.body}>
        {state.step === 'input' ? (
          <InputStep
            value={state.wordOrThought}
            onChange={handleSetInput}
            onContinue={handleSubmitInput}
            multiline={!isWordRepetition}
            maxLength={isWordRepetition ? WORD_MAX_LENGTH : THOUGHT_MAX_LENGTH}
            title={t(mk(isWordRepetition ? 'word_input_title' : 'thought_input_title'))}
            placeholder={t(mk(isWordRepetition ? 'word_input_placeholder' : 'thought_input_placeholder'))}
            privacyNote={t(mk('input_privacy'))}
            continueLabel={t(mk('continue'))}
            accent={accent}
          />
        ) : null}

        {state.step === 'before' ? (
          <MeasureStep
            title={t(mk('measure_before_title'))}
            discomfortLabel={t(mk('measure_discomfort'))}
            beliefLabel={t(mk('measure_belief'))}
            continueLabel={t(mk('continue'))}
            skipLabel={t(mk('skip_step'))}
            accent={accent}
            onSubmit={handleSubmitBefore}
          />
        ) : null}

        {state.step === 'exercise' && isWordRepetition ? (
          <WordRepetitionExercise
            word={state.wordOrThought}
            accent={accent}
            instruction={t(mk('exercise_instruction'))}
            remainingLabel={remainingLabel}
            pauseLabel={t(mk('pause'))}
            resumeLabel={t(mk('resume'))}
            stopLabel={t(mk('stop'))}
            pausedLabel={t(mk('paused'))}
            confirm={stopConfirm}
            onDone={handleFinishExercise}
          />
        ) : null}

        {state.step === 'exercise' && !isWordRepetition ? (
          <LinguisticDistancingExercise
            paliers={paliers}
            accent={accent}
            instruction={t(mk('distancing_instruction'))}
            nextLabel={t(mk('next_palier'))}
            finishLabel={t(mk('finish_exercise'))}
            onDone={handleFinishExercise}
          />
        ) : null}

        {state.step === 'after' ? (
          <MeasureStep
            title={t(mk('measure_after_title'))}
            discomfortLabel={t(mk('measure_discomfort'))}
            beliefLabel={t(mk('measure_belief'))}
            continueLabel={t(mk('continue'))}
            skipLabel={t(mk('skip_step'))}
            accent={accent}
            onSubmit={handleSubmitAfter}
          />
        ) : null}

        {state.step === 'finish' ? (
          <FinishStep
            before={state.before}
            after={state.after}
            durationSeconds={state.durationSeconds}
            accent={accent}
            labels={finishLabels}
            onClose={onClose}
            onRedo={handleRestart}
          />
        ) : null}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.sm, paddingTop: spacing.xs },
  body: { flex: 1 },
})
