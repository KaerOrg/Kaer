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
} from '../../lib/database'
import Button from '../../components/Button'
import { colors, spacing, radius } from '../../theme'

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

// Formate la date pour l'affichage : "Lundi 7 avril 2025"
function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
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
        <Text style={timeStyles.hint}>Appuyer pour modifier</Text>
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
          <Text style={timeStyles.confirmText}>Confirmer</Text>
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
  const labels = ['Très mauvaise', 'Mauvaise', 'Moyenne', 'Bonne', 'Excellente']
  return (
    <View style={starStyles.container}>
      <Text style={starStyles.label}>Qualité de la nuit</Text>
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
  const [quality, setQuality] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Si une entrée existe déjà pour cette date, la pré-remplit
  useEffect(() => {
    getSleepEntry(targetDate).then((entry: SleepEntry | null) => {
      if (entry) {
        setExistingId(entry.id)
        if (entry.bedtime) setBedtime(fromHHMM(entry.bedtime))
        if (entry.wake_time) setWakeTime(fromHHMM(entry.wake_time))
        setOnsetMinutes(entry.sleep_onset_minutes ?? 0)
        setAwakenings(entry.awakenings ?? 0)
        setQuality(entry.quality)
        setNotes(entry.notes ?? '')
      }
    })
  }, [targetDate])

  const handleSave = async () => {
    if (quality === null) {
      Alert.alert('Qualité manquante', 'Veuillez évaluer la qualité de votre nuit (les étoiles).')
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
        quality,
        notes: notes.trim() || null,
      })
      navigation.goBack()
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer la saisie. Réessayez.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (!existingId) return
    Alert.alert(
      'Supprimer cette saisie ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
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
          <Text style={styles.dateLabel}>Nuit du</Text>
          <Text style={styles.dateValue}>{formatFullDate(targetDate)}</Text>
        </View>

        {/* Section horaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horaires</Text>
          <View style={styles.card}>
            <TimeField
              label="Heure du coucher"
              value={bedtime}
              onChange={setBedtime}
            />
            <View style={styles.divider} />
            <TimeField
              label="Heure du lever"
              value={wakeTime}
              onChange={setWakeTime}
            />
            <View style={styles.divider} />
            <Counter
              label="Temps pour s'endormir (minutes)"
              value={onsetMinutes}
              onChange={setOnsetMinutes}
              max={120}
            />
          </View>
        </View>

        {/* Section réveils */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Réveils nocturnes</Text>
          <View style={styles.card}>
            <Counter
              label="Nombre de fois réveillé(e)"
              value={awakenings}
              onChange={setAwakenings}
            />
          </View>
        </View>

        {/* Section qualité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ressenti</Text>
          <View style={styles.card}>
            <StarRating value={quality} onChange={setQuality} />
          </View>
        </View>

        {/* Notes libres */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (facultatif)</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Rêves, stress, médicaments... notez ce qui vous semble utile."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Actions */}
        <Button
          label={existingId ? 'Mettre à jour' : 'Enregistrer ma nuit'}
          onPress={handleSave}
          loading={saving}
        />
        {existingId && (
          <Button label="Supprimer cette saisie" onPress={handleDelete} variant="danger" />
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
})
