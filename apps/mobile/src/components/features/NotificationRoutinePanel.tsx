import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { colors, spacing, radius, fontSize } from '@theme'
import {
  getRoutinesForModule,
  getAllRoutinesForPatient,
  pauseRoutine,
  resumeRoutine,
  updateTimeOverride,
  type NotificationRoutine,
  type NotificationRoutineWithModule,
} from '../../services/notificationService'

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeStringToDate(hhmm: string): Date {
  const [h = 8, m = 0] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

function dateToTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const DAY_ISO_TO_KEY: Record<number, string> = {
  1: 'lun', 2: 'mar', 3: 'mer', 4: 'jeu', 5: 'ven', 6: 'sam', 7: 'dim',
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ModuleProps {
  /** Mode par module : affiche uniquement les routines de ce module */
  patientModuleId: string
  patientId: string
  moduleType: string
}

interface AllProps {
  /** Mode global : affiche toutes les routines du patient (ProfileScreen) */
  patientId: string
  patientModuleId?: undefined
}

type Props = ModuleProps | AllProps

// ── RoutineItem ───────────────────────────────────────────────────────────────

interface RoutineItemProps {
  routine: NotificationRoutine
  loading: boolean
  onPause?: () => void
  onResume?: () => void
  onTimeChange?: (v: string) => void
  moduleLabel?: string
}

function RoutineItem({
  routine,
  loading,
  onPause,
  onResume,
  onTimeChange,
  moduleLabel,
}: RoutineItemProps) {
  const { t } = useTranslation()
  const effectiveTime = routine.patient_time_override ?? routine.time_of_day
  const [pickerDate, setPickerDate] = useState(() => timeStringToDate(effectiveTime))
  const [showPicker, setShowPicker] = useState(false)

  const dayLabels = routine.days_of_week
    .map(d => t(`notifications.day_${DAY_ISO_TO_KEY[d] ?? ''}`))
    .join(' · ')

  const formattedTime = dateToTimeString(pickerDate)
  const isCustom = routine.patient_time_override != null

  const handlePickerChange = useCallback((_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false)
    if (!date) { setShowPicker(false); return }
    setPickerDate(date)
    const newTime = dateToTimeString(date)
    if (newTime !== effectiveTime) {
      onTimeChange?.(newTime)
    }
  }, [effectiveTime, onTimeChange])

  return (
    <View style={[itemStyles.row, routine.patient_paused && itemStyles.rowPaused]}>
      <View style={itemStyles.info}>
        {moduleLabel != null && (
          <Text style={itemStyles.moduleLabel}>{moduleLabel}</Text>
        )}

        <Text style={itemStyles.days}>{dayLabels}</Text>

        {!routine.patient_paused && (
          <Pressable
            style={itemStyles.timeRow}
            onPress={() => setShowPicker(v => !v)}
            accessibilityLabel={t('notifications.tap_to_change')}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color={colors.primary}
            />
            <Text style={itemStyles.timeValue}>{formattedTime}</Text>
            {isCustom && (
              <View style={itemStyles.customBadge}>
                <Text style={itemStyles.customBadgeText}>
                  {t('notifications.custom_time')}
                </Text>
              </View>
            )}
          </Pressable>
        )}

        {showPicker && !routine.patient_paused && (
          <View style={itemStyles.pickerWrapper}>
            {Platform.OS === 'ios' && (
              <Pressable
                style={itemStyles.doneBtn}
                onPress={() => setShowPicker(false)}
              >
                <Text style={itemStyles.doneBtnText}>{t('common.close')}</Text>
              </Pressable>
            )}
            <DateTimePicker
              value={pickerDate}
              mode="time"
              is24Hour
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handlePickerChange}
            />
          </View>
        )}

        {routine.practitioner_note != null && (
          <Text style={itemStyles.note}>{routine.practitioner_note}</Text>
        )}

        {routine.patient_paused && (
          <Text style={itemStyles.pausedLabel}>
            {t('notifications.paused_label')}
          </Text>
        )}
      </View>

      <View style={itemStyles.actions}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : routine.patient_paused ? (
          <Pressable style={itemStyles.btn} onPress={onResume}>
            <Text style={itemStyles.btnText}>{t('notifications.resume')}</Text>
          </Pressable>
        ) : (
          <Pressable style={[itemStyles.btn, itemStyles.btnPause]} onPress={onPause}>
            <Text style={[itemStyles.btnText, itemStyles.btnPauseText]}>
              {t('notifications.pause')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const itemStyles = StyleSheet.create({
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
  rowPaused: { opacity: 0.55 },
  info: { flex: 1, gap: 4 },
  moduleLabel: {
    fontSize: fontSize.caption,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  days: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: colors.textMuted,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  customBadge: {
    backgroundColor: colors.primary + '18',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  customBadgeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  pickerWrapper: { marginTop: 4 },
  doneBtn: { alignSelf: 'flex-end', padding: 4 },
  doneBtnText: {
    fontSize: fontSize.caption,
    fontWeight: '700',
    color: colors.primary,
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
  actions: { flexShrink: 0, justifyContent: 'center' },
  btn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnText: {
    fontSize: fontSize.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  btnPause: { borderColor: colors.border },
  btnPauseText: { color: colors.textMuted },
})

// ── Panel principal ───────────────────────────────────────────────────────────

export function NotificationRoutinePanel(props: Props) {
  const { t } = useTranslation()
  const { patientId, patientModuleId } = props
  const moduleType = 'patientModuleId' in props && props.patientModuleId != null
    ? props.moduleType
    : undefined

  const [routines, setRoutines] = useState<NotificationRoutineWithModule[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let data: NotificationRoutineWithModule[]
    if (patientModuleId != null) {
      const raw = await getRoutinesForModule(patientModuleId)
      data = raw.filter(r => r.is_active).map(r => ({ ...r, module_type: moduleType ?? '' }))
    } else {
      data = await getAllRoutinesForPatient(patientId)
    }
    setRoutines(data)
    setLoading(false)
  }, [patientId, patientModuleId, moduleType])

  useEffect(() => { load().catch(() => setLoading(false)) }, [load])

  const handlePause = useCallback(async (routine: NotificationRoutineWithModule) => {
    setActionId(routine.id)
    await pauseRoutine(routine.id, patientId, routine.module_type)
    await load()
    setActionId(null)
  }, [patientId, load])

  const handleResume = useCallback(async (routineId: string) => {
    setActionId(routineId)
    await resumeRoutine(routineId, patientId)
    await load()
    setActionId(null)
  }, [patientId, load])

  const handleTimeChange = useCallback(async (routineId: string, value: string) => {
    await updateTimeOverride(routineId, patientId, value || null)
    await load()
  }, [patientId, load])

  const activeRoutines = useMemo(() => routines.filter(r => !r.patient_paused), [routines])
  const pausedRoutines = useMemo(() => routines.filter(r => r.patient_paused), [routines])

  // Mode par module : retourne null discret si aucune routine
  if (!loading && routines.length === 0 && patientModuleId != null) return null

  return (
    <View style={panelStyles.container}>
      <Text style={panelStyles.sectionTitle}>{t('notifications.panel_title')}</Text>

      {loading ? (
        <View style={panelStyles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : routines.length === 0 ? (
        // Mode global uniquement : message vide
        <Text style={panelStyles.empty}>{t('notifications.all_empty')}</Text>
      ) : (
        <>
          {activeRoutines.map(routine => (
            <RoutineItem
              key={routine.id}
              routine={routine}
              loading={actionId === routine.id}
              moduleLabel={patientModuleId == null ? t(`modules.${routine.module_type}.label`) : undefined}
              onPause={() => void handlePause(routine)}
              onTimeChange={v => void handleTimeChange(routine.id, v)}
            />
          ))}

          {pausedRoutines.map(routine => (
            <RoutineItem
              key={routine.id}
              routine={routine}
              loading={actionId === routine.id}
              moduleLabel={patientModuleId == null ? t(`modules.${routine.module_type}.label`) : undefined}
              onResume={() => void handleResume(routine.id)}
            />
          ))}
        </>
      )}
    </View>
  )
}

const panelStyles = StyleSheet.create({
  container: { gap: spacing.sm },
  center: { padding: spacing.md, alignItems: 'center' },
  sectionTitle: {
    fontSize: fontSize.caption,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
})
