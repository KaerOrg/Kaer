import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import DateTimePicker from '@react-native-community/datetimepicker'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../../../navigation/AppStack'
import { Button } from '@ui/Button'
import { useToast } from '../../../contexts/ToastContext'
import { useAuthStore } from '../../../store/authStore'
import {
  getRoutinesForModule, getPatientModuleRef,
  createPatientRoutine, deletePatientRoutine, updateRoutineDays,
  updateTimeOverride, pauseRoutine, resumeRoutine,
  type NotificationRoutine,
} from '@services/notificationService'
import { colors, spacing, fontSize } from '@theme'
import { ReminderCard } from './ReminderCard'
import { toDraft, newDraft, toggleDay, type ReminderDraft } from './reminderDraft'
import { buildSavePlan, isEmptyPlan } from './savePlan'

// ─── Écran « Rappels » d'un module (E7, #257) ────────────────────────────────
//
// Le rythme initial est posé en séance avec le praticien, puis il appartient au
// patient. Sans sollicitation, un module n'est ouvert qu'en pic de crise : biais
// d'échantillonnage massif côté soignant, et surtout aucune répétition, or c'est la
// répétition qui entraîne la granularité. Ce n'est pas du confort, c'est le mécanisme.
//
// Conformité MDR 2017/745 : un rappel est un HORAIRE. Il n'est jamais déclenché par
// le contenu d'une saisie, son texte ne varie pas, et rien ici ne commente ce que le
// patient a écrit. C'est une exigence de code, pas un texte à lui afficher.
//
// Le patient bouge tout localement (heure, jours, pause, ajout, suppression) ; un
// seul « Enregistrer » applique le minimum d'écritures (`buildSavePlan`).

type Props = NativeStackScreenProps<AppStackParamList, 'ModuleReminders'>

const DAY_KEYS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'] as const

function timeToDate(hhmm: string): Date {
  const [h = 9, m = 0] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

function dateToTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export default function ModuleRemindersScreen({ route, navigation }: Props) {
  const { moduleType } = route.params
  const { t } = useTranslation()
  const { showToast } = useToast()
  const patient = useAuthStore(s => s.patient)

  const [loaded, setLoaded] = useState<NotificationRoutine[]>([])
  const [drafts, setDrafts] = useState<ReminderDraft[]>([])
  const [moduleRef, setModuleRef] = useState<{ id: string; practitioner_id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [pickerKey, setPickerKey] = useState<string | null>(null)

  useEffect(() => {
    navigation.setOptions({ title: t('notifications.reminders_title') })
  }, [navigation, t])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!patient) return
      const ref = await getPatientModuleRef(patient.id, moduleType)
      const routines = ref ? await getRoutinesForModule(ref.id) : []
      if (cancelled) return
      setModuleRef(ref)
      setLoaded(routines)
      setDrafts(routines.map(toDraft))
      setExpandedKey(routines.length > 0 ? routines[0].id : null)
      setLoading(false)
    }
    void load().catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [patient, moduleType])

  const dayLabels = useMemo(
    () => DAY_KEYS.map(key => t(`notifications.day_${key}`)),
    [t],
  )

  const cardTexts = useMemo(() => ({
    tapToChange: t('notifications.tap_to_change'),
    everyDay: t('notifications.every_day'),
    paused: t('notifications.paused_label'),
    shifted: t('notifications.reminder_shifted'),
    deleteBtn: t('notifications.delete_reminder'),
    dayLabels,
    daysA11y: t('notifications.days_label'),
    pauseA11y: t('notifications.pause'),
  }), [t, dayLabels])

  const handleToggleExpanded = useCallback((key: string) => {
    setExpandedKey(prev => (prev === key ? null : key))
  }, [])

  const handlePressTime = useCallback((key: string) => {
    setPickerKey(prev => (prev === key ? null : key))
  }, [])

  const handleToggleDay = useCallback((key: string, day: number) => {
    setDrafts(prev => prev.map(d => (d.key === key ? toggleDay(d, day) : d)))
  }, [])

  const handleTogglePaused = useCallback((key: string) => {
    setDrafts(prev => prev.map(d => (d.key === key ? { ...d, paused: !d.paused } : d)))
  }, [])

  const handleDelete = useCallback((key: string) => {
    setDrafts(prev => prev.filter(d => d.key !== key))
    setExpandedKey(prev => (prev === key ? null : prev))
    setPickerKey(prev => (prev === key ? null : prev))
  }, [])

  const handleAdd = useCallback(() => {
    // Clé locale stable : l'index suffit, la liste ne se réordonne pas.
    setDrafts(prev => {
      const draft = newDraft(`new-${prev.length}-${prev.filter(d => d.id == null).length}`)
      setExpandedKey(draft.key)
      return [...prev, draft]
    })
  }, [])

  const handlePickerChange = useCallback((_: unknown, date?: Date) => {
    const key = pickerKey
    if (Platform.OS === 'android') setPickerKey(null)
    if (!date || key == null) return
    const time = dateToTime(date)
    setDrafts(prev => prev.map(d => (d.key === key ? { ...d, time } : d)))
  }, [pickerKey])

  const handleSave = useCallback(async () => {
    if (!patient || !moduleRef) return
    const plan = buildSavePlan(loaded, drafts)
    if (isEmptyPlan(plan)) { navigation.goBack(); return }

    setSaving(true)
    try {
      for (const id of plan.deleted) await deletePatientRoutine(id, patient.id)
      for (const { id, time } of plan.timeChanged) await updateTimeOverride(id, patient.id, time)
      for (const { id, days } of plan.daysChanged) await updateRoutineDays(id, patient.id, days)
      for (const { id, paused } of plan.pauseChanged) {
        if (paused) await pauseRoutine(id, patient.id, moduleType)
        else await resumeRoutine(id, patient.id)
      }
      for (const draft of plan.created) {
        await createPatientRoutine({
          patientModuleId: moduleRef.id,
          patientId: patient.id,
          practitionerId: moduleRef.practitioner_id,
          timeOfDay: draft.time,
          daysOfWeek: draft.days,
        })
      }
      showToast(t('notifications.reminders_saved'), 'success')
      navigation.goBack()
    } catch {
      showToast(t('common.error_generic'), 'error')
    } finally {
      setSaving(false)
    }
  }, [patient, moduleRef, loaded, drafts, moduleType, navigation, showToast, t])

  const pickerDraft = drafts.find(d => d.key === pickerKey) ?? null

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('notifications.reminders_question')}</Text>

        {drafts.length === 0 ? (
          <Text style={styles.empty}>{t('notifications.reminders_empty')}</Text>
        ) : null}

        {drafts.map(draft => (
          <ReminderCard
            key={draft.key}
            draft={draft}
            expanded={expandedKey === draft.key}
            onToggleExpanded={handleToggleExpanded}
            onPressTime={handlePressTime}
            onToggleDay={handleToggleDay}
            onTogglePaused={handleTogglePaused}
            onDelete={handleDelete}
            texts={cardTexts}
          />
        ))}

        {pickerDraft ? (
          <View style={styles.picker}>
            <DateTimePicker
              value={timeToDate(pickerDraft.time)}
              mode="time"
              is24Hour
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handlePickerChange}
            />
          </View>
        ) : null}

        <Button
          variant="secondary"
          label={t('notifications.add_reminder')}
          onPress={handleAdd}
          iconLeft={<MaterialCommunityIcons name="plus" size={16} color={colors.primary} />}
          testID="reminder-add"
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          variant="primary"
          label={t('common.save')}
          loading={saving}
          onPress={() => void handleSave()}
          testID="reminder-save"
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.h2,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  empty: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  picker: { alignItems: 'center' },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
})
