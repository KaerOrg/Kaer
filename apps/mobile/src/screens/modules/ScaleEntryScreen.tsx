import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import { fetchModuleFields, type ContentField } from '../../services/moduleService'
import { saveScaleEntry, generateId } from '../../lib/database'
import { SCALE_SCORING } from '../../lib/scaleScoring'
import { FieldRenderer } from '../../components/features/ModuleRenderer/FieldRenderer'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius } from '../../theme'
import { useTeen } from '../../hooks/useTeen'

type Nav = NativeStackNavigationProp<AppStackParamList>
type RouteT = RouteProp<AppStackParamList, 'ScaleEntry'>

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; fields: ContentField[] }

export default function ScaleEntryScreen() {
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<RouteT>()
  const { scale_id } = params
  const { isTeenMode, teenColor } = useTeen()
  const { t } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const accentColor = teenColor(scale_id)

  const config = SCALE_SCORING[scale_id]
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [textInputValues, setTextInputValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const isMounted = useRef(true)

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

  useEffect(() => { void loadFields() }, [loadFields])

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
      const remaining = totalItems - answeredCount
      Alert.alert(
        t('common.error'),
        `${remaining} question${remaining > 1 ? 's' : ''} sans réponse.`
      )
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
      id: generateId(),
      scale_id,
      answers: answers as number[],
      total_score: totalScore,
      subscale_scores: subscaleScores,
      created_at: new Date().toISOString(),
    })
    if (isMounted.current) setSaving(false)
    navigation.goBack()
  }, [allAnswered, answers, config, navigation, scale_id, t, totalItems, answeredCount])

  if (loadState.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (loadState.status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{loadState.message}</Text>
        <Pressable style={styles.retryBtn} onPress={loadFields}>
          <Text style={styles.retryText}>{t('common.back')}</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
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

        <View style={styles.footer}>
          <Text style={styles.progress}>
            {t(`modules.${scale_id}.progress`, {
              answered: answeredCount,
              total: totalItems,
            })}
          </Text>
          <Pressable
            style={[
              styles.submitBtn,
              !allAnswered && styles.submitBtnDisabled,
              isTeenMode && accentColor != null && allAnswered && { backgroundColor: accentColor },
            ]}
            onPress={handleSubmit}
            disabled={saving || !allAnswered}
          >
            <Text style={styles.submitBtnText}>
              {saving ? t('common.saving') : t(`modules.${scale_id}.submit`)}
            </Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  container: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  footer: { gap: spacing.sm, marginTop: 4 },
  progress: { textAlign: 'center', fontSize: 13, color: colors.textMuted },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 16, alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: colors.border },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  errorText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { color: colors.white, fontWeight: '600' },
})
