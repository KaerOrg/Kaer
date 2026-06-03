import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useTranslation } from 'react-i18next'
import { fetchModuleFields, type ContentField } from '../../services/moduleService'
import { getScaleEntryById, getLatestScaleEntry, generateId, type ScaleEntry } from '../../lib/database'
import { saveScaleEntry } from '../../services/scaleEntryService'
import { logScaleSubmission } from '../../services/notificationService'
import { useAuthStore } from '../../store/authStore'
import { SCALE_SCORING } from '../../lib/scaleScoring'
import { FieldRenderer } from '../../components/features/ModuleRenderer/FieldRenderer'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius } from '../../theme'
import { useTeen } from '../../hooks/useTeen'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useToast } from '../../contexts/ToastContext'

type Nav = NativeStackNavigationProp<AppStackParamList>
type RouteT = RouteProp<AppStackParamList, 'ScaleEntry'>

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; fields: ContentField[] }

function formatEntryDate(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function ScaleEntryScreen() {
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<RouteT>()
  const { scale_id, entry_id } = params
  const isEditing = entry_id != null
  const { isTeenMode, teenColor } = useTeen()
  const { t, i18n } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const { showToast } = useToast()
  const accentColor = teenColor(scale_id)

  const { patient } = useAuthStore()
  const config = SCALE_SCORING[scale_id]
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [textInputValues, setTextInputValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [entryDate, setEntryDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [lastEntry, setLastEntry] = useState<ScaleEntry | null>(null)
  const [reuseApplied, setReuseApplied] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? t('common.modify') : t('common.new_entry', { defaultValue: '' }),
    })
  }, [isEditing, navigation, t])

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

  // Charger la dernière saisie pour le bouton "Reprendre les valeurs" (nouveau seulement)
  useEffect(() => {
    if (isEditing) return
    getLatestScaleEntry(scale_id).then(entry => {
      if (isMounted.current) setLastEntry(entry)
    }).catch(() => {})
  }, [scale_id, isEditing])

  useEffect(() => {
    if (!isEditing || !entry_id) return
    getScaleEntryById(entry_id).then(existing => {
      if (!existing || !isMounted.current) return
      setAnswers(existing.answers.map(v => v ?? null))
      setEntryDate(new Date(existing.created_at))
    }).catch(() => {/* silent — entry not found, keep empty form */})
  }, [entry_id, isEditing])

  const handleReuseLastEntry = useCallback(() => {
    if (!lastEntry) return
    setAnswers(lastEntry.answers.map(v => (typeof v === 'number' ? v : null)))
    setReuseApplied(true)
  }, [lastEntry])

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

  const handleDateChange = useCallback((_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false)
    if (date) setEntryDate(date)
  }, [])

  const answeredCount = answers.filter(a => a !== null).length
  const totalItems = config?.items_count ?? answers.length
  const allAnswered = answeredCount === totalItems

  const handleSubmit = useCallback(async () => {
    if (!allAnswered) {
      const remaining = totalItems - answeredCount
      showToast(`${remaining} question${remaining > 1 ? 's' : ''} sans réponse.`, 'info')
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
      created_at: entryDate.toISOString(),
    })
    if (patient && !isEditing) {
      logScaleSubmission(patient.id, scale_id)
    }
    if (isMounted.current) setSaving(false)
    navigation.goBack()
  }, [allAnswered, answers, config, entry_id, entryDate, navigation, scale_id, t, totalItems, answeredCount, loadState, textInputValues])

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

  const activeColor = accentColor ?? colors.primary

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Date row — toujours visible, permet de corriger la date */}
        <Pressable
          style={styles.dateRow}
          onPress={() => setShowDatePicker(v => !v)}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="calendar-edit" size={18} color={activeColor} />
          <Text style={styles.dateLabelText}>{t('common.entry_date')}</Text>
          <Text style={[styles.dateValue, { color: activeColor }]}>
            {formatEntryDate(entryDate, i18n.language)}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textMuted} />
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={entryDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        )}

        {!isEditing && lastEntry != null && !reuseApplied && (
          <Pressable
            style={[styles.reuseBtn, { borderColor: activeColor + '40', backgroundColor: activeColor + '08' }]}
            onPress={handleReuseLastEntry}
          >
            <MaterialCommunityIcons name="content-copy" size={14} color={activeColor} />
            <Text style={[styles.reuseBtnText, { color: activeColor }]}>
              {t('common.reuse_last_values', {
                date: new Date(lastEntry.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
              })}
            </Text>
          </Pressable>
        )}

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
              { backgroundColor: activeColor },
              !allAnswered && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={saving || !allAnswered}
          >
            <Text style={styles.submitBtnText}>
              {saving
                ? t('common.saving')
                : isEditing
                  ? t('common.save_changes')
                  : t(`modules.${scale_id}.submit`)}
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateLabelText: { fontSize: 13, color: colors.textMuted, flex: 0 },
  dateValue: { flex: 1, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  footer: { gap: spacing.sm, marginTop: 4 },
  progress: { textAlign: 'center', fontSize: 13, color: colors.textMuted },
  submitBtn: {
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: colors.border },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  errorText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { color: colors.white, fontWeight: '600' },
  reuseBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, alignSelf: 'flex-start' },
  reuseBtnText: { fontSize: 13, fontWeight: '600' },
})
