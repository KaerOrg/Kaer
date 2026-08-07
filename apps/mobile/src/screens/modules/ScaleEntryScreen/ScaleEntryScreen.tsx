import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { fetchModuleFields, type ContentField } from '@services/moduleService'
import { getScaleEntryById, generateId } from '../../../lib/database'
import { saveScaleEntry } from '@services/scaleEntryService'
import { loadDraft, saveDraft, discardDraft } from '@services/scaleDraftService'
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
  const { scale_id, entry_id, resume } = params
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
      // Les deux chargements partent ensemble et sont appliqués d'un bloc. Les séparer
      // en deux effets laissait une course : la saisie existante pouvait remplacer le
      // tableau dimensionné sur les items posés, ou être écrasée par lui selon l'ordre
      // d'arrivée. La saisie ne serait alors ni de la bonne taille ni pré-remplie.
      const [result, existing, draft] = await Promise.all([
        fetchModuleFields(scale_id),
        // Une saisie absente n'est pas une erreur : on ouvre alors un formulaire vide.
        entry_id != null ? getScaleEntryById(entry_id).catch(() => null) : Promise.resolve(null),
        // Le brouillon (#412) ne concerne qu'une saisie NEUVE : rouvrir une passation
        // déjà envoyée part de ses propres réponses, pas d'un brouillon resté en route.
        entry_id == null && resume ? loadDraft(scale_id).catch(() => null) : Promise.resolve(null),
      ])
      if (!isMounted.current) return
      const questions = result.fields
        .filter(f => f.field_type === 'scale_question' || f.field_type === 'scale_slider_question')
        .sort((a, b) => a.sort_order - b.sort_order)
      // Le tableau est TOUJOURS dimensionné sur les items posés en base. Une passation
      // enregistrée avant l'arrivée d'un item en porte moins : les cases manquantes
      // restent nulles, elles ne décalent aucune réponse et la saisie ne se croit pas
      // complète (#410, rétrocompatibilité). Un brouillon suit la même règle : le
      // questionnaire a pu gagner un item depuis qu'il a été commencé.
      const next: (number | null)[] = Array(questions.length).fill(null)
      const restored = existing?.answers ?? draft?.answers ?? []
      restored.forEach((value: number | null, index: number) => {
        if (index < next.length) next[index] = value ?? null
      })
      if (existing) editedCreatedAt.current = existing.created_at
      setAnswers(next)
      setLoadState({ status: 'ready', fields: result.fields })
    } catch {
      if (!isMounted.current) return
      setLoadState({ status: 'error', message: t('common.error') })
    }
  }, [scale_id, entry_id, resume, t])

  useEffect(() => { void loadFields() }, [loadFields])

  const handleAnswer = useCallback((index: number, value: number) => {
    setAnswers(prev => {
      const next = [...prev]
      next[index] = value
      // Brouillon local écrit à CHAQUE réponse (#412) : c'est un appui qui peut être
      // le dernier avant un appel entrant. Écriture au fil de l'eau, jamais attendue :
      // un brouillon qui échoue ne doit pas bloquer la saisie en cours.
      // Édition d'une passation déjà envoyée : rien à brouillonner, elle est en base.
      if (entry_id == null) void saveDraft(scale_id, next, index).catch(() => {})
      return next
    })
  }, [scale_id, entry_id])

  const handleTextInput = useCallback((fieldId: string, value: string) => {
    setTextInputValues(prev => ({ ...prev, [fieldId]: value }))
  }, [])

  // Deux notions distinctes, et les confondre est exactement le bug silencieux que
  // #410 signale. Un questionnaire peut POSER plus d'items qu'il n'en COTE : le PHQ-9
  // pose dix questions et n'additionne que les neuf premières, l'item 10 mesurant le
  // retentissement fonctionnel hors score.
  //   - `posedItems`  vient des fields en base, c'est ce que le patient doit remplir ;
  //   - `scoredItems` vient de `SCALE_SCORING`, c'est ce qui entre dans le total.
  // La complétion se juge sur les items POSÉS, sinon la saisie se croirait finie à
  // neuf réponses sur dix.
  const answeredCount = answers.filter(a => a !== null).length
  const posedItems = answers.length
  const scoredItems = config?.items_count ?? answers.length
  const allAnswered = answeredCount === posedItems && posedItems > 0

  const handleSubmit = useCallback(async () => {
    if (!allAnswered) {
      // Pluriel délégué à i18next (clés `_one` / `_other`) : la règle d'accord
      // n'est pas la même d'une langue à l'autre, elle n'a rien à faire ici.
      showToast(t('common.unanswered_count', { count: posedItems - answeredCount }), 'info')
      return
    }
    if (config == null) return
    setSaving(true)
    // Le calcul ne voit QUE les items cotés : un item posé au-delà gonflerait le total
    // et casserait la comparabilité avec les passations antérieures. La troncature est
    // faite ici, une fois, plutôt que dans chaque `computeScore`, pour qu'aucune
    // échelle future ne puisse rater la distinction.
    const totalScore = config.computeScore(answers.slice(0, scoredItems))
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
    // La passation est enregistrée : le brouillon n'a plus d'objet. Purgé APRÈS
    // l'enregistrement, jamais avant, pour qu'un échec d'envoi laisse de quoi reprendre.
    await discardDraft(scale_id).catch(() => {})
    if (isMounted.current) setSaving(false)
    navigation.goBack()
  }, [allAnswered, answers, config, entry_id, navigation, scale_id, posedItems, scoredItems, answeredCount, loadState, textInputValues, showToast, t])

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
          {t(`modules.${scale_id}.progress`, { answered: answeredCount, total: posedItems })}
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
