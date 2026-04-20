import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {
  getMedicationAdherenceEntry,
  getAllMedicationAdherenceEntries,
  saveMedicationAdherenceEntry,
  generateId,
  type MedicationAdherenceEntry,
  type AdherenceStatus,
} from '../../lib/database'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { colors, spacing, radius } from '../../theme'
import { useTranslation } from 'react-i18next'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'

// ─── Métadonnées des statuts de prise ────────────────────────────────────────
// Affichage neutre : le statut est un fait déclaré par le patient, sans jugement.
// Conformité MDR 2017/745 : aucune couleur d'alerte, aucune interprétation.

type StatusMeta = {
  readonly value: AdherenceStatus
  readonly labelKey: string
  readonly icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']
  readonly color: string
  readonly bgColor: string
}

const STATUS_META: ReadonlyArray<StatusMeta> = [
  {
    value: 'taken',
    labelKey: 'modules.medication_adherence.status_taken',
    icon: 'check-circle-outline',
    color: colors.success,
    bgColor: '#ECFDF5',
  },
  {
    value: 'partial',
    labelKey: 'modules.medication_adherence.status_partial',
    icon: 'circle-half-full',
    color: colors.warning,
    bgColor: '#FFFBEB',
  },
  {
    value: 'missed',
    labelKey: 'modules.medication_adherence.status_missed',
    icon: 'circle-outline',
    color: colors.textMuted,
    bgColor: '#F3F4F6',
  },
] as const

// Formate la date pour l'affichage : "Lundi 14 avril 2026"
function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Formate la date en court : "14/04/2026"
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Retourne la date du jour au format YYYY-MM-DD
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Bouton de statut ─────────────────────────────────────────────────────────

interface StatusButtonProps {
  meta: StatusMeta
  selected: boolean
  onPress: () => void
}

function StatusButton({ meta, selected, onPress }: StatusButtonProps) {
  const { t } = useTranslation()
  return (
    <TouchableOpacity
      style={[
        statusStyles.btn,
        selected && { backgroundColor: meta.bgColor, borderColor: meta.color },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={t(meta.labelKey)}
    >
      <MaterialCommunityIcons
        name={meta.icon}
        size={22}
        color={selected ? meta.color : colors.border}
      />
      <Text style={[statusStyles.label, selected && { color: meta.color }]}>
        {t(meta.labelKey)}
      </Text>
    </TouchableOpacity>
  )
}

const statusStyles = StyleSheet.create({
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
})

// ─── Ligne d'historique ───────────────────────────────────────────────────────

interface HistoryRowProps {
  entry: MedicationAdherenceEntry
}

function HistoryRow({ entry }: HistoryRowProps) {
  const { t } = useTranslation()
  const meta = STATUS_META.find((m) => m.value === entry.status) ?? STATUS_META[2]
  return (
    <View style={historyStyles.row}>
      <View style={historyStyles.dateCol}>
        <Text style={historyStyles.date}>{formatShortDate(entry.date)}</Text>
      </View>
      <View style={[historyStyles.statusBadge, { backgroundColor: meta.bgColor }]}>
        <MaterialCommunityIcons name={meta.icon} size={14} color={meta.color} />
        <Text style={[historyStyles.statusText, { color: meta.color }]}>{t(meta.labelKey)}</Text>
      </View>
      {entry.notes ? (
        <Text style={historyStyles.notes} numberOfLines={1}>
          {entry.notes}
        </Text>
      ) : null}
    </View>
  )
}

const historyStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateCol: { width: 80 },
  date: { fontSize: 13, color: colors.textMuted },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  notes: { flex: 1, fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function MedicationAdherenceScreen() {
  const { t } = useTranslation()
  const { tt, teenColor } = useTeen()
  const patient = useAuthStore((s) => s.patient)
  const todayDate = today()

  // État du formulaire du jour
  const [selectedStatus, setSelectedStatus] = useState<AdherenceStatus | null>(null)
  const [notes, setNotes] = useState('')
  const [existingId, setExistingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Historique
  const [history, setHistory] = useState<MedicationAdherenceEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  // ── Chargement de l'entrée du jour + historique ───────────────────────────

  const loadData = useCallback(async () => {
    setLoadingHistory(true)
    const [todayEntry, entries] = await Promise.all([
      getMedicationAdherenceEntry(todayDate),
      getAllMedicationAdherenceEntries(30),
    ])
    if (todayEntry) {
      setExistingId(todayEntry.id)
      setSelectedStatus(todayEntry.status)
      setNotes(todayEntry.notes ?? '')
    } else {
      setExistingId(null)
      setSelectedStatus(null)
      setNotes('')
    }
    setHistory(entries)
    setLoadingHistory(false)
  }, [todayDate])

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [loadData])
  )

  // ── Sauvegarde ────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!selectedStatus) {
      Alert.alert(t('modules.medication_adherence.status_missing'), t('modules.medication_adherence.status_missing_msg'))
      return
    }
    setSaving(true)
    try {
      const entry: Omit<MedicationAdherenceEntry, 'created_at'> = {
        id: existingId ?? generateId(),
        date: todayDate,
        status: selectedStatus,
        notes: notes.trim() || null,
      }
      await saveMedicationAdherenceEntry(entry)

      // Signal d'observance anonymisé vers Supabase (aucune donnée clinique)
      if (patient?.id) {
        await supabase.from('patient_engagement_logs').insert({
          patient_id: patient.id,
          event_type: 'SAVE_MEDICATION_ADHERENCE',
          metadata: {},
        })
      }

      setExistingId(entry.id)
      await loadData()
      Alert.alert(t('common.saved'), t('common.saved'))
    } catch {
      Alert.alert(t('common.error'), t('common.save_error'))
    } finally {
      setSaving(false)
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <TeenAccent color={teenColor('medication_adherence')} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* En-tête */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateLabel}>{t('modules.medication_adherence.today_label')}</Text>
          <Text style={styles.dateValue}>{formatFullDate(todayDate)}</Text>
        </View>

        {/* Saisie du jour */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.medication_adherence.section_today')}</Text>
          <View style={styles.card}>
            <Text style={styles.question}>
              {tt('medication_adherence', 'intro') || t('modules.medication_adherence.intro')}
            </Text>
            <View style={styles.statusRow}>
              {STATUS_META.map((meta) => (
                <StatusButton
                  key={meta.value}
                  meta={meta}
                  selected={selectedStatus === meta.value}
                  onPress={() => setSelectedStatus(meta.value)}
                />
              ))}
            </View>
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
              placeholder={t('modules.medication_adherence.notes_placeholder')}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Bouton enregistrer */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={existingId ? t('common.update') : t('modules.medication_adherence.save')}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-outline" size={20} color={colors.white} />
              <Text style={styles.saveBtnText}>
                {existingId ? t('common.update') : t('modules.medication_adherence.save')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Historique */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.medication_adherence.history_30')}</Text>
          <View style={styles.card}>
            {loadingHistory ? (
              <ActivityIndicator color={colors.primary} />
            ) : history.length === 0 ? (
              <Text style={styles.emptyHistory}>{t('modules.medication_adherence.empty_history')}</Text>
            ) : (
              history.map((entry) => (
                <HistoryRow key={entry.id} entry={entry} />
              ))
            )}
          </View>
        </View>
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

  question: { fontSize: 15, fontWeight: '500', color: colors.text },
  statusRow: { flexDirection: 'row', gap: spacing.sm },

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

  emptyHistory: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
    fontStyle: 'italic',
  },
})
