import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import DateTimePicker from '@react-native-community/datetimepicker'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { AppStackParamList } from '../../navigation/AppStack'
import {
  getChronoEntryByDate,
  saveChronoEntry,
  deleteChronoEntry,
  generateId,
  ChronoEntry,
} from '../../lib/database'
import Button from '../../components/Button'
import { colors, spacing, radius } from '../../theme'

type Route = RouteProp<AppStackParamList, 'ChronoBioEntry'>

// Formate une Date en "HH:MM"
function toHHMM(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// Crée un objet Date depuis "HH:MM"
function fromHHMM(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

// Formate la date pour l'affichage
function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Valeurs par défaut pour chaque ancrage (initialisation au premier tap)
const ANCHOR_DEFAULTS: Record<string, [number, number]> = {
  wake_time:     [7, 0],
  first_meal:    [7, 30],
  main_activity: [9, 0],
  last_meal:     [19, 0],
  bedtime:       [23, 0],
}

function makeDefaultDate(anchor: string): Date {
  const [h, m] = ANCHOR_DEFAULTS[anchor] ?? [9, 0]
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

// Champ horaire optionnel — null = non renseigné
function OptionalTimeField({
  label,
  anchor,
  value,
  onChange,
  onClear,
}: {
  label: string
  anchor: string
  value: Date | null
  onChange: (date: Date) => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  const [showPicker, setShowPicker] = useState(false)

  const handlePress = useCallback(() => {
    if (!value) onChange(makeDefaultDate(anchor))
    setShowPicker(true)
  }, [value, anchor, onChange])

  const handleChange = useCallback((_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false)
    if (date) onChange(date)
  }, [onChange])

  return (
    <View style={timeStyles.container}>
      <View style={timeStyles.labelRow}>
        <Text style={timeStyles.label}>{label}</Text>
        {value !== null && (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="close-circle-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[timeStyles.button, value === null && timeStyles.buttonEmpty]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="clock-outline"
          size={20}
          color={value !== null ? colors.primary : colors.textMuted}
        />
        {value !== null ? (
          <>
            <Text style={timeStyles.value}>{toHHMM(value)}</Text>
            <Text style={timeStyles.hint}>{t('modules.sleep_diary.tap_to_modify')}</Text>
          </>
        ) : (
          <Text style={timeStyles.placeholder}>{t('modules.chrono_bio.tap_to_add')}</Text>
        )}
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={value ?? makeDefaultDate(anchor)}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
      {showPicker && Platform.OS === 'ios' && (
        <TouchableOpacity
          style={timeStyles.confirm}
          onPress={() => setShowPicker(false)}
        >
          <Text style={timeStyles.confirmText}>{t('modules.sleep_diary.confirm_label')}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const timeStyles = StyleSheet.create({
  container: { gap: spacing.xs },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  button: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  buttonEmpty: { borderStyle: 'dashed' },
  value: { fontSize: 22, fontWeight: '700', color: colors.primary },
  hint: { fontSize: 13, color: colors.textMuted, marginLeft: spacing.xs },
  placeholder: { fontSize: 15, color: colors.textMuted, fontStyle: 'italic' },
  confirm: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  confirmText: { color: colors.primary, fontWeight: '600' },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function ChronoBioEntryScreen() {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const navigation = useNavigation()

  const { date } = route.params

  const [existingId, setExistingId] = useState<string | null>(null)
  const [wakeTime, setWakeTime] = useState<Date | null>(null)
  const [firstMeal, setFirstMeal] = useState<Date | null>(null)
  const [mainActivity, setMainActivity] = useState<Date | null>(null)
  const [lastMeal, setLastMeal] = useState<Date | null>(null)
  const [bedtime, setBedtime] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getChronoEntryByDate(date).then((entry: ChronoEntry | null) => {
      if (!entry) return
      setExistingId(entry.id)
      if (entry.wake_time)     setWakeTime(fromHHMM(entry.wake_time))
      if (entry.first_meal)    setFirstMeal(fromHHMM(entry.first_meal))
      if (entry.main_activity) setMainActivity(fromHHMM(entry.main_activity))
      if (entry.last_meal)     setLastMeal(fromHHMM(entry.last_meal))
      if (entry.bedtime)       setBedtime(fromHHMM(entry.bedtime))
    })
  }, [date])

  const handleSave = useCallback(async () => {
    const hasAtLeastOne = [wakeTime, firstMeal, mainActivity, lastMeal, bedtime].some(Boolean)
    if (!hasAtLeastOne) {
      Alert.alert(
        t('modules.chrono_bio.no_anchor_title'),
        t('modules.chrono_bio.no_anchor_msg')
      )
      return
    }
    setSaving(true)
    try {
      await saveChronoEntry({
        id: existingId ?? generateId(),
        date,
        wake_time:     wakeTime     ? toHHMM(wakeTime)     : null,
        first_meal:    firstMeal    ? toHHMM(firstMeal)    : null,
        main_activity: mainActivity ? toHHMM(mainActivity) : null,
        last_meal:     lastMeal     ? toHHMM(lastMeal)     : null,
        bedtime:       bedtime      ? toHHMM(bedtime)      : null,
        created_at:    new Date().toISOString(),
      })
      navigation.goBack()
    } catch {
      Alert.alert(t('common.error'), t('common.save_error'))
    } finally {
      setSaving(false)
    }
  }, [existingId, date, wakeTime, firstMeal, mainActivity, lastMeal, bedtime, t, navigation])

  const handleDelete = useCallback(() => {
    if (!existingId) return
    Alert.alert(
      t('modules.chrono_bio.delete_entry'),
      t('common.irreversible'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteChronoEntry(existingId)
            navigation.goBack()
          },
        },
      ]
    )
  }, [existingId, t, navigation])

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.dateHeader}>
          <Text style={styles.dateLabel}>{t('modules.chrono_bio.date_label')}</Text>
          <Text style={styles.dateValue}>{formatFullDate(date)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.chrono_bio.section_anchors')}</Text>
          <View style={styles.card}>
            <OptionalTimeField
              label={t('modules.chrono_bio.wake_time')}
              anchor="wake_time"
              value={wakeTime}
              onChange={setWakeTime}
              onClear={() => setWakeTime(null)}
            />
            <View style={styles.divider} />
            <OptionalTimeField
              label={t('modules.chrono_bio.first_meal')}
              anchor="first_meal"
              value={firstMeal}
              onChange={setFirstMeal}
              onClear={() => setFirstMeal(null)}
            />
            <View style={styles.divider} />
            <OptionalTimeField
              label={t('modules.chrono_bio.main_activity')}
              anchor="main_activity"
              value={mainActivity}
              onChange={setMainActivity}
              onClear={() => setMainActivity(null)}
            />
            <View style={styles.divider} />
            <OptionalTimeField
              label={t('modules.chrono_bio.last_meal')}
              anchor="last_meal"
              value={lastMeal}
              onChange={setLastMeal}
              onClear={() => setLastMeal(null)}
            />
            <View style={styles.divider} />
            <OptionalTimeField
              label={t('modules.chrono_bio.bedtime')}
              anchor="bedtime"
              value={bedtime}
              onChange={setBedtime}
              onClear={() => setBedtime(null)}
            />
          </View>
        </View>

        <Text style={styles.hint}>{t('modules.chrono_bio.optional_hint')}</Text>

        <Button
          label={existingId ? t('modules.chrono_bio.update_entry') : t('modules.chrono_bio.save_entry')}
          onPress={handleSave}
          loading={saving}
        />
        {existingId && (
          <Button
            label={t('modules.chrono_bio.delete_entry')}
            onPress={handleDelete}
            variant="danger"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  dateHeader: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  divider: { height: 1, backgroundColor: colors.border },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
})
