import React, { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {
  getMedicationAdherenceEntry,
  getAllMedicationAdherenceEntries,
  saveMedicationAdherenceEntry,
  deleteMedicationAdherenceEntry,
  generateId,
  type MedicationAdherenceEntry,
  type AdherenceStatus,
} from '../../lib/database'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { colors, spacing, radius } from '../../theme'
import { formatDateFull, formatDateNumeric } from '../../lib/dateUtils'
import { useTranslation } from 'react-i18next'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { StatusBadge } from '../../components/StatusBadge'

// ─── Métadonnées des statuts ──────────────────────────────────────────────────
// Conformité MDR 2017/745 : affichage neutre, aucune interprétation clinique.

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

function todayISO(): string {
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
    <Pressable
      style={[
        statusStyles.btn,
        selected && { backgroundColor: meta.bgColor, borderColor: meta.color },
      ]}
      onPress={onPress}
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
    </Pressable>
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
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
})

// ─── Carte d'historique ───────────────────────────────────────────────────────

interface HistoryCardProps {
  entry: MedicationAdherenceEntry
  onDelete: () => void
}

function HistoryCard({ entry, onDelete }: HistoryCardProps) {
  const { t } = useTranslation()
  const meta = STATUS_META.find((m) => m.value === entry.status) ?? STATUS_META[2]
  return (
    <View style={histStyles.card}>
      <View style={histStyles.main}>
        <Text style={histStyles.date}>{formatDateNumeric(entry.date)}</Text>
        <View style={[histStyles.badge, { backgroundColor: meta.bgColor }]}>
          <MaterialCommunityIcons name={meta.icon} size={13} color={meta.color} />
          <Text style={[histStyles.badgeText, { color: meta.color }]}>{t(meta.labelKey)}</Text>
        </View>
        {entry.notes ? (
          <Text style={histStyles.notes} numberOfLines={1}>{entry.notes}</Text>
        ) : null}
      </View>
      <Pressable onPress={onDelete} hitSlop={8} accessibilityLabel={t('common.delete')}>
        <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  )
}

const histStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  main: { flex: 1, gap: 4 },
  date: { fontSize: 13, fontWeight: '600', color: colors.text },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  notes: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function MedicationAdherenceScreen() {
  const { t } = useTranslation()
  const { tt, teenColor } = useTeen()
  const patient = useAuthStore((s) => s.patient)
  const todayDate = useMemo(() => todayISO(), [])

  const [tab, setTab] = useState<'today' | 'history'>('today')
  const [selectedStatus, setSelectedStatus] = useState<AdherenceStatus | null>(null)
  const [notes, setNotes] = useState('')
  const [existingId, setExistingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<MedicationAdherenceEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
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
    setLoading(false)
  }, [todayDate])

  useFocusEffect(
    useCallback(() => { loadData() }, [loadData])
  )

  const handleSave = useCallback(async () => {
    if (!selectedStatus) {
      Alert.alert(
        t('modules.medication_adherence.status_missing'),
        t('modules.medication_adherence.status_missing_msg'),
      )
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
      if (patient?.id) {
        await supabase.from('patient_engagement_logs').insert({
          patient_id: patient.id,
          event_type: 'SAVE_MEDICATION_ADHERENCE',
          metadata: {},
        })
      }
      setExistingId(entry.id)
      await loadData()
      Alert.alert(t('common.saved'), t('modules.medication_adherence.saved_message'))
    } catch {
      Alert.alert(t('common.error'), t('common.save_error'))
    } finally {
      setSaving(false)
    }
  }, [selectedStatus, existingId, notes, todayDate, patient, t, loadData])

  const handleDelete = useCallback((entry: MedicationAdherenceEntry) => {
    Alert.alert(
      t('modules.medication_adherence.delete_entry_title'),
      t('common.irreversible'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteMedicationAdherenceEntry(entry.id)
            setHistory(prev => prev.filter(e => e.id !== entry.id))
            if (entry.date === todayDate) {
              setExistingId(null)
              setSelectedStatus(null)
              setNotes('')
            }
          },
        },
      ]
    )
  }, [t, todayDate])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <TeenAccent color={teenColor('medication_adherence')} />

      {/* Onglets */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'today' && styles.tabActive]}
          onPress={() => setTab('today')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'today' }}
        >
          <Text style={[styles.tabText, tab === 'today' && styles.tabTextActive]}>
            {t('modules.medication_adherence.tab_today')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'history' && styles.tabActive]}
          onPress={() => setTab('history')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'history' }}
        >
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            {t('modules.medication_adherence.tab_history')}
          </Text>
          {history.length > 0 && (
            <StatusBadge variant="info" label="" value={history.length} />
          )}
        </Pressable>
      </View>

      {tab === 'today' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date du jour */}
          <View style={styles.dateHeader}>
            <Text style={styles.dateLabel}>{t('modules.medication_adherence.today_label')}</Text>
            <Text style={styles.dateValue}>{formatDateFull(todayDate)}</Text>
          </View>

          {/* Indicateur saisie déjà effectuée */}
          {existingId ? (
            <StatusBadge
              variant="success"
              label={t('modules.medication_adherence.already_saved')}
            />
          ) : null}

          {/* Saisie du statut */}
          <Card>
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
          </Card>

          {/* Notes */}
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>{t('common.notes_optional')}</Text>
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
        </ScrollView>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {history.length === 0 ? (
            <EmptyState
              icon="💊"
              title=""
              description={t('modules.medication_adherence.empty_history')}
            />
          ) : (
            <View style={styles.list}>
              {history.map((entry) => (
                <HistoryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={() => handleDelete(entry)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Footer bouton sauvegarder — uniquement sur l'onglet Aujourd'hui */}
      {tab === 'today' && (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <Pressable
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={existingId ? t('common.update') : t('modules.medication_adherence.save')}
            testID="save-button"
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
          </Pressable>
        </SafeAreaView>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },

  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    gap: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  tabTextActive: { color: colors.primary, fontWeight: '700' },

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

  question: { fontSize: 15, fontWeight: '500', color: colors.text },
  statusRow: { flexDirection: 'row', gap: spacing.sm },

  notesSection: { gap: spacing.xs },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
  },

  list: { gap: spacing.sm },

  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
})
