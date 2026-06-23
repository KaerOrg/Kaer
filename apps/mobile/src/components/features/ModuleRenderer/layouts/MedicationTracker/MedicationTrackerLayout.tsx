// ─── Layout `medication_tracker` — suivi d'observance médicamenteuse ─────────
//
// Trois onglets : Aujourd'hui (check global + détail par molécule + motif + notes),
// Calendrier (mois passif + série « jours renseignés »), Mes médicaments (liste
// fond/PRN co-éditée patient↔praticien). Persistance : daily_entries (statut global
// du jour) + medication_intakes (détail par molécule) en SQLite local + sync outbox.
// La liste de molécules vit dans patient_modules.config.medications (en ligne).
//
// Conformité MDR 2017/745 : pastilles neutres fournies par la base, aucun taux
// d'observance, aucune alerte conditionnelle, aucune tendance. Le code affiche les
// faits déclarés par le patient — il ne conclut jamais.

import { useState, useCallback, useEffect, useMemo } from 'react'
import { View, Text, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import type { Medication } from '@kaer/shared'
import { colors } from '@theme'
import { Button } from '../../../../ui/Button'
import type { ContentField } from '../../../../../services/moduleService'
import { getDailyEntry, getAllDailyEntries, generateId, type DailyEntry } from '../../../../../lib/database'
import { saveDailyEntry } from '../../../../../services/dailyEntryService'
import { getMedicationIntakes, saveMedicationIntake, type MedicationIntake } from '../../../../../services/medicationIntakeService'
import { fetchMedications, updateMedications } from '../../../../../services/medicationListService'
import { formatDateFull } from '../../../../../lib/dateUtils'
import { useTeen } from '../../../../../hooks/useTeen'
import { useAuthStore } from '../../../../../store/authStore'
import { useToast } from '../../../../../contexts/ToastContext'
import type { AppStackParamList } from '../../../../../navigation/AppStack'
import { TodayTab } from './TodayTab'
import { CalendarTab } from './CalendarTab'
import { MedicationsTab } from './MedicationsTab'
import { computeLoggedStreak, shiftDate } from './streakUtils'
import type { StatusMeta, ReasonMeta, IconName, IntakeState } from './types'
import { styles } from './styles'

export interface MedicationTrackerLayoutProps {
  fields: ContentField[]
  moduleId: string
}

type Tab = 'today' | 'calendar' | 'meds'
type Nav = NativeStackNavigationProp<AppStackParamList>

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function MedicationTrackerLayout({ fields, moduleId: moduleIdProp }: MedicationTrackerLayoutProps) {
  const { isTeenMode } = useTeen()
  const { t, i18n } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const { showToast } = useToast()
  const navigation = useNavigation<Nav>()
  const patientId = useAuthStore(s => s.patient?.id)

  // moduleId dérivé des fields (règle config-first) — le prop du dispatcher peut être vide.
  const moduleId = useMemo(() => fields[0]?.module_id ?? moduleIdProp, [fields, moduleIdProp])

  // ── Config DB-driven
  const configField = useMemo(() => fields.find(f => f.field_type === 'medication_tracker_config'), [fields])
  const lbl = useCallback((key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }, [configField, t])

  const statusOptions = useMemo<StatusMeta[]>(() => fields
    .filter(f => f.field_type === 'daily_status_option')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(f => ({
      value: f.props['value'] ?? '',
      label: f.text_code ? t(f.text_code) : (f.props['value'] ?? ''),
      icon: (f.props['icon'] ?? 'circle-outline') as IconName,
      color: f.props['color'] ?? colors.textMuted,
      bgColor: f.props['bg_color'] ?? colors.background,
    })), [fields, t])

  const reasonOptions = useMemo<ReasonMeta[]>(() => fields
    .filter(f => f.field_type === 'medication_reason_option')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(f => ({
      value: f.props['value'] ?? '',
      label: f.text_code ? t(f.text_code) : (f.props['value'] ?? ''),
      icon: (f.props['icon'] ?? 'circle-outline') as IconName,
      linksModule: f.props['links_module'] ?? null,
    })), [fields, t])

  const statusByValue = useMemo(() => new Map(statusOptions.map(s => [s.value, s])), [statusOptions])

  // Légende du calendrier : une entrée par statut (couleur + libellé).
  const legendItems = useMemo(() => statusOptions.map(s => ({ color: s.color, label: s.label })), [statusOptions])

  const kindLabel = useCallback(
    (kind: Medication['kind']) => lbl(kind === 'prn' ? 'med_kind_prn' : 'med_kind_maintenance'),
    [lbl],
  )

  // ── State
  const today = useMemo(() => todayISO(), [])
  // Date en cours d'édition dans l'onglet « Aujourd'hui » — modifiable pour
  // permettre de renseigner un jour oublié (jamais dans le futur).
  const [selectedDate, setSelectedDate] = useState(() => todayISO())
  const [tab, setTab] = useState<Tab>('today')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingId, setExistingId] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [history, setHistory] = useState<DailyEntry[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [intakes, setIntakes] = useState<Map<string, IntakeState>>(new Map())

  const loadData = useCallback(async () => {
    const [dayEntry, hist, intakeRows, meds] = await Promise.all([
      getDailyEntry(moduleId, selectedDate),
      getAllDailyEntries(moduleId, 60),
      getMedicationIntakes(moduleId, selectedDate),
      patientId ? fetchMedications(patientId) : Promise.resolve<Medication[]>([]),
    ])
    if (dayEntry) {
      setExistingId(dayEntry.id)
      setSelectedStatus(dayEntry.status)
      setSelectedReason(dayEntry.reason)
      setNotes(dayEntry.notes ?? '')
    } else {
      setExistingId(null)
      setSelectedStatus(null)
      setSelectedReason(null)
      setNotes('')
    }
    setHistory(hist)
    setMedications(meds)
    setIntakes(new Map(intakeRows.map((r: MedicationIntake) => [r.medication_id, { id: r.id, status: r.status, reason: r.reason }])))
    setLoading(false)
  }, [moduleId, selectedDate, patientId])

  useEffect(() => { loadData().catch(() => setLoading(false)) }, [loadData])

  // ── Dérivations
  // Motif demandé dès que le statut déclaré n'est pas le premier (« pris »).
  const showReasons = selectedStatus != null && selectedStatus !== statusOptions[0]?.value
  const showBridge = useMemo(
    () => reasonOptions.find(r => r.value === selectedReason)?.linksModule === 'medication_side_effects',
    [reasonOptions, selectedReason],
  )

  const streakCount = useMemo(
    () => computeLoggedStreak(new Set(history.map(h => h.date)), today),
    [history, today],
  )
  const streakLabel = t(
    `modules.${moduleId}.${streakCount > 1 ? 'streak_plural' : 'streak'}`,
    { count: streakCount },
  )

  // Pastille neutre par jour renseigné (couleur du statut déclaré).
  const dayMarkers = useMemo(() => {
    const map = new Map<string, { color: string; label: string }>()
    for (const h of history) {
      if (!h.status) continue
      const meta = statusByValue.get(h.status)
      map.set(h.date, { color: meta?.color ?? colors.textMuted, label: meta?.label ?? h.status })
    }
    return map
  }, [history, statusByValue])

  // ── Handlers
  const canGoNextDay = selectedDate < today
  const goPrevDay = useCallback(() => setSelectedDate(d => shiftDate(d, -1)), [])
  const goNextDay = useCallback(() => setSelectedDate(d => (d < today ? shiftDate(d, 1) : d)), [today])

  const handleSelectStatus = useCallback((value: string) => {
    setSelectedStatus(value)
    if (value === statusOptions[0]?.value) setSelectedReason(null)
  }, [statusOptions])

  const handleSave = useCallback(async () => {
    if (!selectedStatus) {
      showToast(lbl('status_missing_msg') || t('common.error'), 'info')
      return
    }
    setSaving(true)
    try {
      const entry: Omit<DailyEntry, 'created_at'> = {
        id: existingId ?? generateId(),
        module_id: moduleId,
        date: selectedDate,
        status: selectedStatus,
        reason: showReasons ? selectedReason : null,
        notes: notes.trim() || null,
      }
      await saveDailyEntry(entry)
      setExistingId(entry.id)
      await loadData()
      const savedMsg = lbl('saved_message')
      if (savedMsg) showToast(savedMsg, 'success')
    } catch {
      showToast(t('common.save_error'), 'error')
    } finally {
      setSaving(false)
    }
  }, [selectedStatus, existingId, moduleId, selectedDate, showReasons, selectedReason, notes, loadData, lbl, t, showToast])

  const handleSetMoleculeStatus = useCallback(async (medicationId: string, status: string) => {
    const existing = intakes.get(medicationId)
    const intake: Omit<MedicationIntake, 'created_at'> = {
      id: existing?.id ?? generateId(),
      module_id: moduleId,
      date: selectedDate,
      medication_id: medicationId,
      status,
      reason: existing?.reason ?? null,
    }
    // Optimiste : reflète immédiatement, puis persiste + sync.
    setIntakes(prev => new Map(prev).set(medicationId, { id: intake.id, status, reason: intake.reason }))
    try {
      await saveMedicationIntake(intake)
    } catch {
      showToast(t('common.save_error'), 'error')
    }
  }, [intakes, moduleId, selectedDate, showToast, t])

  const handleSaveMeds = useCallback(async (next: Medication[]) => {
    if (!patientId) return
    setMedications(next)
    const { ok } = await updateMedications(patientId, next)
    if (!ok) showToast(t('common.save_error'), 'error')
  }, [patientId, showToast, t])

  const handleOpenBridge = useCallback(() => {
    navigation.navigate('MedicationSideEffectsHistory')
  }, [navigation])

  const TABS = useMemo<Array<{ id: Tab; label: string }>>(() => [
    { id: 'today', label: lbl('tab_today_label') },
    { id: 'calendar', label: lbl('tab_calendar_label') },
    { id: 'meds', label: lbl('tab_meds_label') },
  ], [lbl])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  const saveLabel = existingId ? (lbl('update_label') || t('common.update')) : (lbl('save_label') || t('common.save'))

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <View style={styles.tabs}>
        {TABS.map(item => (
          <Pressable
            key={item.id}
            style={[styles.tab, tab === item.id && styles.tabActive]}
            onPress={() => setTab(item.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === item.id }}
            testID={`tab-${item.id}`}
          >
            <Text style={[styles.tabText, tab === item.id && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'today' ? (
        <TodayTab
          todayLabel={lbl('today_label')}
          dateValue={formatDateFull(selectedDate)}
          isToday={selectedDate === today}
          canGoNext={canGoNextDay}
          onPrevDay={goPrevDay}
          onNextDay={goNextDay}
          alreadySaved={existingId != null}
          alreadySavedLabel={lbl('already_saved_label')}
          question={lbl('question')}
          statusOptions={statusOptions}
          selectedStatus={selectedStatus}
          onSelectStatus={handleSelectStatus}
          showReasons={showReasons}
          reasonPrompt={lbl('reason_prompt')}
          reasonOptions={reasonOptions}
          selectedReason={selectedReason}
          onSelectReason={setSelectedReason}
          showBridge={showBridge}
          bridgeLabel={lbl('side_effects_bridge_label')}
          onOpenBridge={handleOpenBridge}
          medications={medications}
          perMoleculeLabel={lbl('per_molecule_label')}
          intakes={intakes}
          onSetMoleculeStatus={handleSetMoleculeStatus}
          kindLabel={kindLabel}
          notesLabel={lbl('notes_label') || t('common.notes_optional')}
          notesPlaceholder={lbl('notes_placeholder')}
          notes={notes}
          onChangeNotes={setNotes}
        />
      ) : null}

      {tab === 'calendar' ? (
        <CalendarTab
          dayMarkers={dayMarkers}
          streakCount={streakCount}
          streakLabel={streakLabel}
          daysLabel={lbl('calendar_days_label')}
          legendLabel={lbl('calendar_legend_label')}
          legendItems={legendItems}
          locale={i18n.language}
          accentColor={colors.primary}
        />
      ) : null}

      {tab === 'meds' ? (
        <MedicationsTab
          medications={medications}
          kindLabel={kindLabel}
          labels={{
            title: lbl('meds_title'),
            empty: lbl('meds_empty'),
            add: lbl('meds_add_label'),
            name: lbl('med_name_label'),
            posology: lbl('med_posology_label'),
            kindMaintenance: lbl('med_kind_maintenance'),
            kindPrn: lbl('med_kind_prn'),
            save: t('common.save'),
            cancel: t('common.cancel'),
            editTitle: lbl('meds_add_label'),
            addTitle: lbl('meds_add_label'),
            deleteTitle: lbl('delete_title') || t('common.delete'),
            deleteMessage: t('common.irreversible'),
            deleteConfirm: t('common.delete'),
          }}
          onSave={handleSaveMeds}
        />
      ) : null}

      {tab === 'today' ? (
        <View style={styles.footer}>
          <Button
            label={saveLabel}
            onPress={handleSave}
            loading={saving}
            iconLeft={<MaterialCommunityIcons name="content-save-outline" size={20} color={colors.white} />}
            testID="save-button"
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  )
}
