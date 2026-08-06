import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { fetchModuleFields, type ContentField } from '@services/moduleService'
import { getScaleEntryById, generateId, type ScaleEntry } from '../../../lib/database'
import { saveScaleEntry } from '@services/scaleEntryService'
import { FieldRenderer } from '../../../components/features/ModuleRenderer/FieldRenderer'
import { AppStackParamList } from '../../../navigation/AppStack'
import { colors, spacing } from '@theme'
import { Button } from '@ui/Button'
import { ScreenLoader } from '@ui/ScreenLoader'
import { useToast } from '../../../contexts/ToastContext'
import { useScaleScreen } from '../../../hooks/useScaleScreen'
import { StepperEntry } from './StepperEntry'
import { buildStepperQuestions, readEntryMode, readInstructions } from './entryConfig'

type Nav = NativeStackNavigationProp<AppStackParamList>
type RouteT = RouteProp<AppStackParamList, 'ScaleEntry'>

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; fields: ContentField[] }

export default function ScaleEntryScreen() {
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<RouteT>()
  const { scale_id, entry_id } = params
  const isEditing = entry_id != null
  const { config, accentColor, activeColor, t } = useScaleScreen(scale_id)
  const { showToast } = useToast()

  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [textInputValues, setTextInputValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const isMounted = useRef(true)
  // Horodatage de la saisie en cours d'édition. Une passation porte la date à
  // laquelle elle a été remplie et cette date ne se change pas : antidater ne
  // recrée pas la fenêtre de deux semaines que l'instrument mesure (#409).
  const editedCreatedAt = useRef<string | null>(null)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const loadFields = useCallback(async () => {
    setLoadState({ status: 'loading' })
    try {
      const result = await fetchModuleFields(scale_id)
      if (!isMounted.current) return
      const questions = result.fields
        .filter(f => f.field_type === 'scale_question' || f.field_type === 'scale_slider_question')
        .sort((a, b) => a.sort_order - b.sort_order)
      setAnswers(Array(questions.length).fill(null))
      setLoadState({ status: 'ready', fields: result.fields })
    } catch {
      if (!isMounted.current) return
      setLoadState({ status: 'error', message: t('common.error') })
    }
  }, [scale_id, t])

  // Load fields first, then pre-fill from existing entry if editing
  useEffect(() => { void loadFields() }, [loadFields])

  useEffect(() => {
    if (!isEditing || !entry_id) return
    getScaleEntryById(entry_id).then((existing: ScaleEntry | null) => {
      if (!existing || !isMounted.current) return
      setAnswers(existing.answers.map(v => v ?? null))
      editedCreatedAt.current = existing.created_at
    }).catch(() => {/* silent — entry not found, keep empty form */})
  }, [entry_id, isEditing])

  const handleAnswer = useCallback((index: number, value: number) => {
    setAnswers(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }, [])

  const handleTextInput = useCallback((fieldId: string, value: string) => {
    setTextInputValues(prev => ({ ...prev, [fieldId]: value }))
  }, [])

  const answeredCount = answers.filter(a => a !== null).length
  const totalItems = config?.items_count ?? answers.length
  const allAnswered = answeredCount === totalItems

  const handleSubmit = useCallback(async () => {
    if (!allAnswered) {
      // Pluriel délégué à i18next (clés `_one` / `_other`) : la règle d'accord
      // n'est pas la même d'une langue à l'autre, elle n'a rien à faire ici.
      showToast(t('common.unanswered_count', { count: totalItems - answeredCount }), 'info')
      return
    }
    if (config == null) return
    setSaving(true)
    const totalScore = config.computeScore(answers)
    let subscaleScores: Record<string, number | string> | null =
      config.computeSubscaleScores?.(answers) ?? null

    if (loadState.status === 'ready') {
      const extraFields = loadState.fields.filter(
        f => f.field_type === 'scale_number_input' || f.field_type === 'scale_text_input'
      )
      if (extraFields.length > 0) {
        const extras: Record<string, number | string> = {}
        for (const f of extraFields) {
          const key = (f.props['subscale_key'] as string | undefined) ?? f.id
          const raw = (textInputValues[f.id] ?? '').trim()
          if (f.field_type === 'scale_number_input') {
            const parsed = raw !== '' ? parseInt(raw, 10) : 0
            extras[key] = isNaN(parsed) ? 0 : Math.min(
              parseInt((f.props['max'] as string | undefined) ?? '9999', 10),
              Math.max(parseInt((f.props['min'] as string | undefined) ?? '0', 10), parsed)
            )
          } else {
            extras[key] = raw
          }
        }
        subscaleScores = { ...(subscaleScores ?? {}), ...extras }
      }
    }

    await saveScaleEntry({
      id: entry_id ?? generateId(),
      scale_id,
      answers: answers as number[],
      total_score: totalScore,
      subscale_scores: subscaleScores,
      // Horodatage d'ÉVÉNEMENT (l'instant de la passation), seul cas où l'UTC est
      // légitime : ce n'est pas une date métier choisie par le patient.
      created_at: editedCreatedAt.current ?? new Date().toISOString(),
    })
    if (isMounted.current) setSaving(false)
    navigation.goBack()
  }, [allAnswered, answers, config, entry_id, navigation, scale_id, totalItems, answeredCount, loadState, textInputValues, showToast, t])

  const handleExit = useCallback(() => navigation.goBack(), [navigation])

  const submitBtnStyle = useMemo<ViewStyle>(() => ({ backgroundColor: activeColor }), [activeColor])

  const fields = loadState.status === 'ready' ? loadState.fields : null
  const entryMode = useMemo(() => readEntryMode(fields), [fields])
  const stepperQuestions = useMemo(
    () => (entryMode === 'one_per_screen' && fields ? buildStepperQuestions(fields, t) : []),
    [entryMode, fields, t],
  )
  const instructions = useMemo(
    () => (entryMode === 'one_per_screen' && fields ? readInstructions(fields, t) : []),
    [entryMode, fields, t],
  )

  useEffect(() => {
    // L'écran par item porte sa propre progression : l'en-tête natif ferait doublon.
    navigation.setOptions(
      entryMode === 'one_per_screen'
        ? { headerShown: false }
        : { headerShown: true, title: isEditing ? t('common.modify') : t('common.new_entry', { defaultValue: '' }) },
    )
  }, [entryMode, isEditing, navigation, t])

  if (loadState.status === 'loading') {
    return <ScreenLoader />
  }

  if (loadState.status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{loadState.message}</Text>
        <Button label={t('common.back')} onPress={loadFields} />
      </View>
    )
  }

  if (entryMode === 'one_per_screen' && stepperQuestions.length > 0) {
    return (
      <StepperEntry
        questions={stepperQuestions}
        instructions={instructions}
        answers={answers}
        onAnswer={handleAnswer}
        onSubmit={handleSubmit}
        onExit={handleExit}
        submitLabel={t(`modules.${scale_id}.submit`)}
        saving={saving}
        accentColor={activeColor}
        t={t}
      />
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Progression — sticky en haut, toujours visible pendant la saisie */}
      <View style={styles.progressBar}>
        <Text style={styles.progress}>
          {t(`modules.${scale_id}.progress`, { answered: answeredCount, total: totalItems })}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <FieldRenderer
          preview_kind="questionnaire"
          fields={loadState.fields}
          questionnaire={{
            answers,
            onAnswer: handleAnswer,
            textInputValues,
            onTextInput: handleTextInput,
            accentColor: accentColor ?? undefined,
          }}
        />
      </ScrollView>

      {/* Bouton Enregistrer — sticky en bas, toujours accessible */}
      <View style={styles.bottomBar}>
        <Button
          label={isEditing ? t('common.save_changes') : t(`modules.${scale_id}.submit`)}
          onPress={handleSubmit}
          loading={saving}
          disabled={!allAnswered}
          style={submitBtnStyle}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  container: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  progressBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progress: { textAlign: 'center', fontSize: 13, fontWeight: '600', color: colors.textMuted },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  errorText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 16 },
})
