import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, spacing, radius, fontSize } from '../theme'
import {
  getRoutinesForModule,
  pauseRoutine,
  resumeRoutine,
  updateTimeOverride,
  type NotificationRoutine,
} from '../services/notificationService'

interface Props {
  patientModuleId: string
  patientId: string
  moduleType: string
}

const DAY_ISO_TO_KEY: Record<number, string> = {
  1: 'lun', 2: 'mar', 3: 'mer', 4: 'jeu', 5: 'ven', 6: 'sam', 7: 'dim',
}

export function NotificationRoutinePanel({ patientModuleId, patientId, moduleType }: Props) {
  const { t } = useTranslation()
  const [routines, setRoutines] = useState<NotificationRoutine[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getRoutinesForModule(patientModuleId)
    setRoutines(data.filter(r => r.is_active))
    setLoading(false)
  }, [patientModuleId])

  useEffect(() => { void load() }, [load])

  const handlePause = useCallback(async (routineId: string) => {
    setActionId(routineId)
    await pauseRoutine(routineId, patientId, moduleType)
    await load()
    setActionId(null)
  }, [patientId, moduleType, load])

  const handleResume = useCallback(async (routineId: string) => {
    setActionId(routineId)
    await resumeRoutine(routineId, patientId)
    await load()
    setActionId(null)
  }, [patientId, load])

  const handleTimeChange = useCallback(async (routineId: string, value: string) => {
    const trimmed = value.trim() || null
    await updateTimeOverride(routineId, patientId, trimmed)
    await load()
  }, [patientId, load])

  const activeRoutines = useMemo(
    () => routines.filter(r => !r.patient_paused),
    [routines]
  )
  const pausedRoutines = useMemo(
    () => routines.filter(r => r.patient_paused),
    [routines]
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (routines.length === 0) return null

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('notifications.panel_title')}</Text>

      {activeRoutines.map(routine => (
        <RoutineItem
          key={routine.id}
          routine={routine}
          loading={actionId === routine.id}
          onPause={() => void handlePause(routine.id)}
          onTimeChange={(v) => void handleTimeChange(routine.id, v)}
          t={t}
        />
      ))}

      {pausedRoutines.map(routine => (
        <RoutineItem
          key={routine.id}
          routine={routine}
          loading={actionId === routine.id}
          onResume={() => void handleResume(routine.id)}
          t={t}
        />
      ))}
    </View>
  )
}

interface RoutineItemProps {
  routine: NotificationRoutine
  loading: boolean
  onPause?: () => void
  onResume?: () => void
  onTimeChange?: (v: string) => void
  t: (k: string) => string
}

function RoutineItem({ routine, loading, onPause, onResume, onTimeChange, t }: RoutineItemProps) {
  const effectiveTime = routine.patient_time_override ?? routine.time_of_day
  const [localTime, setLocalTime] = useState(effectiveTime)

  const dayLabels = routine.days_of_week
    .map(d => t(`notifications.day_${DAY_ISO_TO_KEY[d] ?? ''}`))
    .join(', ')

  const handleBlur = useCallback(() => {
    if (localTime !== effectiveTime) {
      onTimeChange?.(localTime)
    }
  }, [localTime, effectiveTime, onTimeChange])

  return (
    <View style={[styles.row, routine.patient_paused ? styles.rowPaused : null]}>
      <View style={styles.rowInfo}>
        <Text style={styles.days}>{dayLabels}</Text>

        {!routine.patient_paused && (
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>{t('notifications.my_time_label')}</Text>
            <TextInput
              style={styles.timeInput}
              value={localTime}
              onChangeText={setLocalTime}
              onBlur={handleBlur}
              placeholder="HH:MM"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        )}

        {routine.practitioner_note ? (
          <Text style={styles.note}>{routine.practitioner_note}</Text>
        ) : null}

        {routine.patient_paused ? (
          <Text style={styles.pausedLabel}>{t('notifications.paused_label')}</Text>
        ) : null}
      </View>

      <View style={styles.rowActions}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : routine.patient_paused ? (
          <Pressable style={styles.actionBtn} onPress={onResume}>
            <Text style={styles.actionBtnText}>{t('notifications.resume')}</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.actionBtn, styles.actionBtnPause]} onPress={onPause}>
            <Text style={[styles.actionBtnText, styles.actionBtnPauseText]}>{t('notifications.pause')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  center: {
    padding: spacing.md,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.caption,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  rowPaused: {
    opacity: 0.55,
  },
  rowInfo: {
    flex: 1,
    gap: 4,
  },
  days: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeLabel: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  timeInput: {
    fontSize: fontSize.caption,
    color: colors.primary,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: 0,
    paddingHorizontal: 2,
    minWidth: 44,
  },
  note: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  pausedLabel: {
    fontSize: fontSize.caption,
    color: '#f59e0b',
    fontWeight: '600',
  },
  rowActions: {
    flexShrink: 0,
    justifyContent: 'center',
  },
  actionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionBtnText: {
    fontSize: fontSize.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  actionBtnPause: {
    borderColor: colors.border,
  },
  actionBtnPauseText: {
    color: colors.textMuted,
  },
})
