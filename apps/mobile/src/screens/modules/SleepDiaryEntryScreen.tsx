import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { SafeAreaView } from 'react-native-safe-area-context'
import DateTimePicker from '@react-native-community/datetimepicker'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import { AppStackParamList } from '../../navigation/AppStack'
import {
  getSleepEntry,
  saveSleepEntry,
  deleteSleepEntry,
  generateId,
  SleepEntry,
  computeSleepEfficiency,
} from '../../lib/database'
import Button from '../../components/Button'
import { colors, spacing, radius } from '../../theme'
import { formatDateFull } from '../../lib/dateUtils'
import { useTranslation } from 'react-i18next'

type Route = RouteProp<AppStackParamList, 'SleepDiaryEntry'>

// Formate une Date en "HH:MM"
function toHHMM(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// Crée un objet Date depuis "HH:MM" (date = aujourd'hui)
function fromHHMM(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}


// Composant de sélection d'heure avec affichage du picker natif
function TimeField({
  label,
  value,
  onChange,
}: {
  label: string
  value: Date
  onChange: (date: Date) => void
}) {
  const { t } = useTranslation()
  const [showPicker, setShowPicker] = useState(false)

  const handleChange = (_: unknown, date?: Date) => {
    // Sur Android, le picker se ferme automatiquement après sélection
    if (Platform.OS === 'android') setShowPicker(false)
    if (date) onChange(date)
  }

  return (
    <View style={timeStyles.container}>
      <Text style={timeStyles.label}>{label}</Text>
      <TouchableOpacity
        style={timeStyles.button}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="clock-outline" size={20} color={colors.textMuted} />
        <Text style={timeStyles.value}>{toHHMM(value)}</Text>
        <Text style={timeStyles.hint}>{t('modules.sleep_diary.tap_to_modify')}</Text>
      </TouchableOpacity>

      {/* iOS : picker inline ; Android : dialog modal */}
      {showPicker && (
        <DateTimePicker
          value={value}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
      {/* Sur iOS, bouton pour confirmer et fermer */}
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
  value: { fontSize: 22, fontWeight: '700', color: colors.primary },
  hint: { fontSize: 13, color: colors.textMuted, marginLeft: spacing.xs },
  confirm: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  confirmText: { color: colors.primary, fontWeight: '600' },
})

// Saisie directe en minutes avec conversion heures affichée en dessous
function MinutesInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  const { t } = useTranslation()
  const [text, setText] = useState(value > 0 ? String(value) : '')

  const handleChange = (raw: string) => {
    setText(raw)
    const parsed = parseInt(raw, 10)
    if (!isNaN(parsed) && parsed >= 0) onChange(parsed)
    else if (raw === '') onChange(0)
  }

  const hours = Math.floor(value / 60)
  const mins = value % 60
  const conversion =
    value === 0 ? null
    : hours > 0 && mins > 0 ? `= ${hours}h${String(mins).padStart(2, '0')}`
    : hours > 0 ? `= ${hours}h00`
    : null

  return (
    <View style={minuteStyles.container}>
      <Text style={minuteStyles.label}>{label}</Text>
      <View style={minuteStyles.row}>
        <TextInput
          style={minuteStyles.input}
          value={text}
          onChangeText={handleChange}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.border}
          maxLength={3}
          returnKeyType="done"
        />
        <Text style={minuteStyles.unit}>{t('modules.sleep_diary.minutes_unit')}</Text>
        {conversion && <Text style={minuteStyles.conversion}>{conversion}</Text>}
      </View>
    </View>
  )
}

const minuteStyles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    width: 72,
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textAlign: 'center',
  },
  unit: { fontSize: 15, color: colors.textMuted },
  conversion: { fontSize: 15, fontWeight: '600', color: colors.primary },
})

// Compteur pour le nombre de réveils
function Counter({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <View style={counterStyles.container}>
      <Text style={counterStyles.label}>{label}</Text>
      <View style={counterStyles.row}>
        <TouchableOpacity
          style={[counterStyles.btn, value <= min && counterStyles.btnDisabled]}
          onPress={() => value > min && onChange(value - 1)}
          activeOpacity={0.7}
        >
          <Text style={counterStyles.btnText}>−</Text>
        </TouchableOpacity>
        <Text style={counterStyles.value}>{value}</Text>
        <TouchableOpacity
          style={[counterStyles.btn, value >= max && counterStyles.btnDisabled]}
          onPress={() => value < max && onChange(value + 1)}
          activeOpacity={0.7}
        >
          <Text style={counterStyles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const counterStyles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  btn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 24, fontWeight: '300', color: colors.text, lineHeight: 28 },
  value: { fontSize: 28, fontWeight: '700', color: colors.text, minWidth: 40, textAlign: 'center' },
})

// Sélecteur d'étoiles pour la qualité
function StarRating({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number) => void
}) {
  const { t } = useTranslation()
  const labels = [
    t('modules.sleep_diary.quality_very_bad'),
    t('modules.sleep_diary.quality_bad'),
    t('modules.sleep_diary.quality_average'),
    t('modules.sleep_diary.quality_good'),
    t('modules.sleep_diary.quality_excellent'),
  ]
  return (
    <View style={starStyles.container}>
      <Text style={starStyles.label}>{t('modules.sleep_diary.quality_label')}</Text>
      <View style={starStyles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name={n <= (value ?? 0) ? 'star' : 'star-outline'}
              size={36}
              color={n <= (value ?? 0) ? colors.stars : colors.border}
            />
          </TouchableOpacity>
        ))}
      </View>
      {value !== null && (
        <Text style={starStyles.ratingLabel}>{labels[value - 1]}</Text>
      )}
    </View>
  )
}

const starStyles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  stars: { flexDirection: 'row', gap: spacing.sm },
  ratingLabel: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function SleepDiaryEntryScreen() {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const navigation = useNavigation()

  // La date de la nuit à saisir (par défaut : hier)
  const targetDate = route.params?.date ?? (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
  })()

  // Valeurs du formulaire
  const [existingId, setExistingId] = useState<string | null>(null)
  const [bedtime, setBedtime] = useState(new Date(new Date().setHours(23, 0, 0, 0)))
  const [wakeTime, setWakeTime] = useState(new Date(new Date().setHours(7, 0, 0, 0)))
  const [onsetMinutes, setOnsetMinutes] = useState(0)
  const [awakenings, setAwakenings] = useState(0)
  const [awakeningsDuration, setAwakeningsDuration] = useState(0)
  const [nightmares, setNightmares] = useState(false)
  const [quality, setQuality] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Calcul temps réel de l'efficacité du sommeil
  const se = computeSleepEfficiency(toHHMM(bedtime), toHHMM(wakeTime), onsetMinutes, awakeningsDuration)
  const seColor = se === null ? colors.danger : se >= 85 ? colors.success : se >= 70 ? '#F59E0B' : colors.danger

  // Si une entrée existe déjà pour cette date, la pré-remplit
  useEffect(() => {
    getSleepEntry(targetDate).then((entry: SleepEntry | null) => {
      if (entry) {
        setExistingId(entry.id)
        if (entry.bedtime) setBedtime(fromHHMM(entry.bedtime))
        if (entry.wake_time) setWakeTime(fromHHMM(entry.wake_time))
        setOnsetMinutes(entry.sleep_onset_minutes ?? 0)
        setAwakenings(entry.awakenings ?? 0)
        setAwakeningsDuration(entry.awakenings_duration_minutes ?? 0)
        setNightmares(!!entry.nightmares)
        setQuality(entry.quality)
        setNotes(entry.notes ?? '')
      }
    })
  }, [targetDate])

  const handleSave = async () => {
    if (quality === null) {
      Alert.alert(t('modules.sleep_diary.quality_missing'), t('modules.sleep_diary.quality_missing_msg'))
      return
    }
    setSaving(true)
    try {
      await saveSleepEntry({
        id: existingId ?? generateId(),
        date: targetDate,
        bedtime: toHHMM(bedtime),
        wake_time: toHHMM(wakeTime),
        sleep_onset_minutes: onsetMinutes,
        awakenings,
        awakenings_duration_minutes: awakeningsDuration,
        nightmares: nightmares ? 1 : 0,
        quality,
        notes: notes.trim() || null,
      })
      navigation.goBack()
    } catch {
      Alert.alert(t('common.error'), t('common.save_error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (!existingId) return
    Alert.alert(
      t('modules.sleep_diary.delete_entry'),
      t('common.irreversible'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteSleepEntry(existingId)
            navigation.goBack()
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* En-tête avec la date */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateLabel}>{t('modules.sleep_diary.date_label')}</Text>
          <Text style={styles.dateValue}>{formatDateFull(targetDate)}</Text>
        </View>

        {/* Section horaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.sleep_diary.section_schedule')}</Text>
          <View style={styles.card}>
            <TimeField
              label={t('modules.sleep_diary.bedtime_label')}
              value={bedtime}
              onChange={setBedtime}
            />
            <View style={styles.divider} />
            <TimeField
              label={t('modules.sleep_diary.wake_time_label')}
              value={wakeTime}
              onChange={setWakeTime}
            />
            <View style={styles.divider} />
            <MinutesInput
              label={t('modules.sleep_diary.onset_label')}
              value={onsetMinutes}
              onChange={setOnsetMinutes}
            />
          </View>
        </View>

        {/* Section réveils */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.sleep_diary.section_awakenings')}</Text>
          <View style={styles.card}>
            <Counter
              label={t('modules.sleep_diary.awakenings_label')}
              value={awakenings}
              onChange={setAwakenings}
            />
            <View style={styles.divider} />
            <MinutesInput
              label={t('modules.sleep_diary.awakenings_duration_label')}
              value={awakeningsDuration}
              onChange={setAwakeningsDuration}
            />
          </View>
        </View>

        {/* Section cauchemars */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.sleep_diary.section_nightmares')}</Text>
          <TouchableOpacity
            style={[styles.card, styles.toggleRow]}
            onPress={() => setNightmares(!nightmares)}
            activeOpacity={0.75}
          >
            <View style={styles.toggleLeft}>
              <MaterialCommunityIcons
                name="ghost"
                size={22}
                color={nightmares ? colors.danger : colors.textMuted}
              />
              <Text style={styles.toggleLabel}>{t('modules.sleep_diary.nightmares_label')}</Text>
            </View>
            <View style={[styles.toggleSwitch, nightmares && styles.toggleSwitchOn]}>
              <View style={[styles.toggleThumb, nightmares && styles.toggleThumbOn]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section qualité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.sleep_diary.section_quality')}</Text>
          <View style={styles.card}>
            <StarRating value={quality} onChange={setQuality} />
          </View>
        </View>

        {/* Notes libres */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('common.notes_optional')}</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('common.notes_placeholder')}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Efficacité du sommeil — calculée en temps réel */}
        {se !== null && (
          <View style={[styles.seCard, { borderColor: seColor }]}>
            <View style={styles.seRow}>
              <MaterialCommunityIcons name="sleep" size={20} color={seColor} />
              <Text style={styles.seTitle}>{t('modules.sleep_diary.sleep_efficiency')}</Text>
              <Text style={[styles.seScore, { color: seColor }]}>{se} %</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <Button
          label={existingId ? t('modules.sleep_diary.update_entry') : t('modules.sleep_diary.save_night')}
          onPress={handleSave}
          loading={saving}
        />
        {existingId && (
          <Button label={t('modules.sleep_diary.delete_entry')} onPress={handleDelete} variant="danger" />
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
  dateLabel: { fontSize: 13, fontWeight: '600', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
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
  notesInput: {
    fontSize: 15,
    color: colors.text,
    minHeight: 90,
    lineHeight: 22,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchOn: {
    backgroundColor: colors.danger,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  seCard: {
    borderWidth: 2,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.card,
    gap: spacing.xs,
  },
  seRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  seTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  seScore: {
    fontSize: 24,
    fontWeight: '800',
  },
  seSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 18,
  },
})
