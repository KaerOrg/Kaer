import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'

// ─── Suggestions d'activités ──────────────────────────────────────────────────

const ACTIVITY_SUGGESTIONS = [
  'Marche / promenade',
  'Faire ses courses',
  'Sport / salle de sport',
  'Vélo',
  'Yoga',
  'Méditation',
  'Lecture',
  'Cuisine',
  'Appel à un proche',
  'Sortie au café',
  'Jardinage',
  'Musique',
  'Film / série',
  'Bain relaxant',
  'Rangement / ménage',
  'Dessin / peinture',
  'Jeu de société',
  'Écriture / journal',
  'Natation',
  'Courir',
]
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import DateTimePicker from '@react-native-community/datetimepicker'
import {
  getActivityRecord,
  saveActivityRecord,
  generateId,
  type ActivityRecord,
} from '../../lib/database'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius } from '../../theme'
import { PipPicker } from '../../components/PipPicker'
import { useTranslation } from 'react-i18next'

type RouteType = RouteProp<AppStackParamList, 'BehavioralActivationEntry'>


// ─── Sélecteur de date ────────────────────────────────────────────────────────

function DateField({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const { t } = useTranslation()
  const [showPicker, setShowPicker] = useState(false)

  const handleChange = (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false)
    if (date) onChange(date)
  }

  return (
    <View style={dateStyles.container}>
      <Text style={dateStyles.label}>{t('modules.behavioral_activation.date_label')}</Text>
      <TouchableOpacity
        style={dateStyles.button}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="calendar-outline" size={20} color={colors.textMuted} />
        <Text style={dateStyles.value}>
          {value.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          locale="fr-FR"
        />
      )}
      {showPicker && Platform.OS === 'ios' && (
        <TouchableOpacity style={dateStyles.confirm} onPress={() => setShowPicker(false)}>
          <Text style={dateStyles.confirmText}>{t('modules.behavioral_activation.date_confirm')}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const dateStyles = StyleSheet.create({
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
  value: { fontSize: 15, fontWeight: '500', color: colors.text },
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

export default function BehavioralActivationEntryScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const route = useRoute<RouteType>()
  const patient = useAuthStore((s) => s.patient)

  const recordId = route.params?.recordId ?? null

  const [date, setDate] = useState(new Date())
  const [label, setLabel] = useState('')
  const [pleasure, setPleasure] = useState(5)
  const [mastery, setMastery] = useState(5)
  const [done, setDone] = useState(false)
  const [notes, setNotes] = useState('')
  const [existingId, setExistingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Pré-remplissage si édition
  useEffect(() => {
    if (!recordId) return
    getActivityRecord(recordId).then((r) => {
      if (!r) return
      setExistingId(r.id)
      setDate(new Date(r.date + 'T00:00:00'))
      setLabel(r.label)
      setPleasure(r.pleasure)
      setMastery(r.mastery)
      setDone(r.done === 1)
      setNotes(r.notes ?? '')
    })
  }, [recordId])

  const handleSave = async () => {
    if (!label.trim()) {
      Alert.alert(t('modules.behavioral_activation.name_missing'), t('modules.behavioral_activation.name_missing_msg'))
      return
    }
    setSaving(true)
    try {
      const record: Omit<ActivityRecord, 'created_at'> = {
        id: existingId ?? generateId(),
        date: date.toISOString().slice(0, 10),
        label: label.trim(),
        pleasure,
        mastery,
        done: done ? 1 : 0,
        notes: notes.trim() || null,
      }
      await saveActivityRecord(record)

      if (patient?.id) {
        await supabase.from('patient_engagement_logs').insert({
          patient_id: patient.id,
          event_type: 'SAVE_BEHAVIORAL_ACTIVATION',
          metadata: {},
        })
      }

      navigation.goBack()
    } catch {
      Alert.alert(t('common.error'), t('common.save_error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date */}
          <View style={styles.card}>
            <DateField value={date} onChange={setDate} />
          </View>

          {/* Nom de l'activité */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('modules.behavioral_activation.section_activity')}</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.labelInput}
                value={label}
                onChangeText={setLabel}
                placeholder={t('modules.behavioral_activation.activity_placeholder')}
                placeholderTextColor={colors.textMuted}
                autoFocus={!recordId}
                returnKeyType="done"
              />
            </View>
            {/* Suggestions rapides */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={suggestStyles.list}
              keyboardShouldPersistTaps="handled"
            >
              {ACTIVITY_SUGGESTIONS.map((s) => {
                const active = label === s
                return (
                  <TouchableOpacity
                    key={s}
                    style={[suggestStyles.chip, active && suggestStyles.chipActive]}
                    onPress={() => setLabel(active ? '' : s)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={s}
                  >
                    <Text style={[suggestStyles.chipText, active && suggestStyles.chipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          {/* Statut réalisée */}
          <TouchableOpacity
            style={[styles.doneRow, done && styles.doneRowActive]}
            onPress={() => setDone(!done)}
            activeOpacity={0.75}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done }}
          >
            <MaterialCommunityIcons
              name={done ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
              size={24}
              color={done ? colors.success : colors.textMuted}
            />
            <Text style={[styles.doneLabel, done && { color: colors.success }]}>
              {done ? t('modules.behavioral_activation.done_label') : t('modules.behavioral_activation.mark_done')}
            </Text>
          </TouchableOpacity>

          {/* Plaisir */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('modules.behavioral_activation.section_evaluation')}</Text>
            <View style={styles.card}>
              <PipPicker
                label={t('modules.behavioral_activation.pleasure_label')}
                sublabel={t('modules.behavioral_activation.pleasure_sublabel')}
                value={pleasure}
                steps={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                color="#059669"
                variant="track"
                showEndLabels
                onPress={setPleasure}
              />
              <View style={styles.divider} />
              <PipPicker
                label={t('modules.behavioral_activation.mastery_label')}
                sublabel={t('modules.behavioral_activation.mastery_sublabel')}
                value={mastery}
                steps={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                color="#4F46E5"
                variant="track"
                showEndLabels
                onPress={setMastery}
              />
            </View>
          </View>

          {/* Notes */}
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
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Bouton sauvegarder */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save-outline" size={20} color={colors.white} />
                <Text style={styles.saveBtnText}>
                  {existingId ? t('common.update') : t('modules.behavioral_activation.save')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const suggestStyles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },

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

  labelInput: {
    fontSize: 16,
    color: colors.text,
    minHeight: 44,
  },

  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  doneRowActive: {
    borderColor: colors.success,
    backgroundColor: '#ECFDF5',
  },
  doneLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textMuted,
  },

  notesInput: {
    fontSize: 15,
    color: colors.text,
    minHeight: 72,
    lineHeight: 22,
  },

  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
})
