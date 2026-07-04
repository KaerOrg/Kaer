// ─── Layout — journal d'activités (behavioral_activation…) ──────────────────
//
// Cycle prédire/faire/constater : le patient planifie des activités (P/M
// attendus, prédiction), les réalise, puis note P/M ressentis. 3 modes :
// week (défaut, unité de planification) | list (historique) | entry (formulaire).
// Les activités co-construites en consultation (patient_modules.config.
// ba_activities) sont proposées en premier ; les suggestions du seed sont
// groupées par domaine de vie (fields activity_log_domain, prop `domain`).
// Persistance dans la table SQLite dédiée `activity_records` + sync outbox.
// Conformité MDR 2017/745 : valeurs brutes uniquement, pas de seuil ni
// d'interprétation ; « non renseigné » (null) est un état légitime.

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import type { BAConfiguredActivity } from '@kaer/shared'
import {
  getAllActivityRecords, getActivityRecord, generateId, type ActivityRecord,
} from '../../../../../lib/database'
import { saveActivityRecord, deleteActivityRecord } from '@services/activityRecordService'
import { fetchBAActivities } from '@services/baActivitiesService'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { useToast } from '../../../../../contexts/ToastContext'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import { useAuthStore } from '../../../../../store/authStore'
import type { ContentField } from '@services/moduleService'
import {
  parseActivityLogConfig, collectDomains, collectSuggestions, groupSuggestionsByDomain,
} from './activityLogConfig'
import type { ActivityDraft } from './types'
import { WeekView } from './WeekView'
import { ListView } from './ListView'
import { EntryForm } from './EntryForm'
import { CompletionSheet } from './CompletionSheet'
import { alStyles } from './styles'

export interface ActivityLogLayoutProps {
  fields: ContentField[]
  moduleId: string
}

export function ActivityLogLayout({ fields, moduleId: _moduleId }: ActivityLogLayoutProps) {
  const t = useModuleTranslation()
  const { showToast } = useToast()
  const { showConfirm } = useConfirmDialog()
  const patientId = useAuthStore(s => s.patient?.id)

  const configField = useMemo(() => fields.find(f => f.field_type === 'activity_log_config'), [fields])

  // ── Labels UI — lus depuis les props de activity_log_config
  const lbl = useCallback((key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }, [configField, t])

  const config = useMemo(
    () => parseActivityLogConfig(configField, { successColor: colors.success, primaryColor: colors.primary }),
    [configField],
  )
  const domains = useMemo(() => collectDomains(fields, t), [fields, t])
  const suggestionGroups = useMemo(
    () => groupSuggestionsByDomain(collectSuggestions(fields, t), domains),
    [fields, t, domains],
  )

  // ── State
  const [mode, setMode] = useState<'week' | 'list' | 'entry'>('week')
  const [records, setRecords] = useState<ActivityRecord[]>([])
  const [myActivities, setMyActivities] = useState<BAConfiguredActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ActivityRecord | null>(null)
  // Activité en cours de complétion : cocher réalisée ouvre la feuille
  // « C'était comment ? » — c'est LE moment de la notation des ressentis.
  const [completingRecord, setCompletingRecord] = useState<ActivityRecord | null>(null)

  // ── Loaders
  const loadRecords = useCallback(async () => {
    const data = await getAllActivityRecords()
    setRecords(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadRecords().catch(() => setLoading(false)) }, [loadRecords])

  // Activités co-construites : setup en ligne, silencieux hors connexion.
  useEffect(() => {
    if (!patientId) return
    fetchBAActivities(patientId).then(setMyActivities).catch(() => {})
  }, [patientId])

  // ── Navigation
  const handleNew = useCallback(() => {
    setEditingRecord(null)
    setMode('entry')
  }, [])

  const handleEdit = useCallback(async (recordId: string) => {
    const r = await getActivityRecord(recordId)
    if (!r) return
    setEditingRecord(r)
    setMode('entry')
  }, [])

  const handleBack = useCallback(() => {
    setEditingRecord(null)
    setMode('week')
  }, [])

  const showWeek = useCallback(() => setMode('week'), [])
  const showList = useCallback(() => setMode('list'), [])

  // ── Save / delete / toggle
  const handleSave = useCallback(async (draft: ActivityDraft) => {
    if (!draft.label) {
      showToast(lbl('name_missing_msg') || t('common.error'), 'info')
      return
    }
    setSaving(true)
    try {
      await saveActivityRecord({
        id: draft.id ?? generateId(),
        date: draft.date,
        label: draft.label,
        expected_pleasure: draft.expected_pleasure,
        expected_mastery: draft.expected_mastery,
        pleasure: draft.pleasure,
        mastery: draft.mastery,
        done: draft.done ? 1 : 0,
        notes: draft.notes.length > 0 ? draft.notes : null,
        planned_time: draft.planned_time,
        domain_id: draft.domain_id,
        config_activity_id: draft.config_activity_id,
      })
      await loadRecords()
      setEditingRecord(null)
      setMode('week')
    } catch {
      showToast(t('common.save_error'), 'error')
    } finally {
      setSaving(false)
    }
  }, [loadRecords, lbl, t, showToast])

  const handleDeleteEditing = useCallback(() => {
    if (!editingRecord) return
    showConfirm({
      title: lbl('delete_title') || t('common.delete'),
      message: t('common.irreversible'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: async () => {
        await deleteActivityRecord(editingRecord.id)
        await loadRecords()
        setEditingRecord(null)
        setMode('week')
      },
    })
  }, [editingRecord, loadRecords, lbl, t, showConfirm])

  const handleDeleteFromList = useCallback((record: ActivityRecord) => {
    showConfirm({
      title: lbl('delete_title') || t('common.delete'),
      message: `"${record.label}"`,
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: async () => {
        await deleteActivityRecord(record.id)
        await loadRecords()
      },
    })
  }, [loadRecords, lbl, t, showConfirm])

  // Enregistre un changement de statut, avec ou sans ressentis.
  const persistCompletion = useCallback(async (
    record: ActivityRecord,
    done: 0 | 1,
    pleasure: number | null,
    mastery: number | null,
  ) => {
    await saveActivityRecord({
      id: record.id,
      date: record.date,
      label: record.label,
      expected_pleasure: record.expected_pleasure,
      expected_mastery: record.expected_mastery,
      pleasure,
      mastery,
      done,
      notes: record.notes,
      planned_time: record.planned_time,
      domain_id: record.domain_id,
      config_activity_id: record.config_activity_id,
    })
    await loadRecords()
  }, [loadRecords])

  // Cocher réalisée depuis une carte : on ouvre la feuille d'évaluation
  // (« C'était comment ? ») — rien n'est enregistré tant que le patient n'a
  // pas choisi Enregistrer, Passer, ou refermé. Décocher reste immédiat.
  const handleToggleDone = useCallback((record: ActivityRecord) => {
    if (record.done === 1) {
      void persistCompletion(record, 0, null, null)
      return
    }
    setCompletingRecord(record)
  }, [persistCompletion])

  const handleCompletionSave = useCallback(async (pleasure: number | null, mastery: number | null) => {
    if (!completingRecord) return
    await persistCompletion(completingRecord, 1, pleasure, mastery)
    setCompletingRecord(null)
  }, [completingRecord, persistCompletion])

  const handleCompletionSkip = useCallback(async () => {
    if (!completingRecord) return
    await persistCompletion(completingRecord, 1, null, null)
    setCompletingRecord(null)
  }, [completingRecord, persistCompletion])

  const handleCompletionCancel = useCallback(() => setCompletingRecord(null), [])

  if (loading) {
    return <View style={alStyles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  // ── MODE ENTRY ──────────────────────────────────────────────────────────
  if (mode === 'entry') {
    return (
      <EntryForm
        key={editingRecord?.id ?? 'new'}
        editingRecord={editingRecord}
        config={config}
        lbl={lbl}
        suggestionGroups={suggestionGroups}
        myActivities={myActivities}
        saving={saving}
        onSave={handleSave}
        onDelete={editingRecord ? handleDeleteEditing : null}
        onBack={handleBack}
      />
    )
  }

  // ── MODES WEEK / LIST ───────────────────────────────────────────────────
  return (
    <View style={alStyles.container}>
      {/* Tab bar Semaine / Liste */}
      <View style={alStyles.tabBar}>
        <Pressable
          style={[alStyles.tab, mode === 'week' && alStyles.tabActive]}
          onPress={showWeek}
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === 'week' }}
          testID="tab-week"
        >
          <MaterialCommunityIcons
            name="calendar-week"
            size={16}
            color={mode === 'week' ? colors.primary : colors.textMuted}
          />
          <Text style={[alStyles.tabText, mode === 'week' && alStyles.tabTextActive]}>{lbl('tab_week_label')}</Text>
        </Pressable>
        <Pressable
          style={[alStyles.tab, mode === 'list' && alStyles.tabActive]}
          onPress={showList}
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === 'list' }}
          testID="tab-list"
        >
          <MaterialCommunityIcons
            name="format-list-bulleted"
            size={16}
            color={mode === 'list' ? colors.primary : colors.textMuted}
          />
          <Text style={[alStyles.tabText, mode === 'list' && alStyles.tabTextActive]}>{lbl('tab_list_label')}</Text>
        </Pressable>
      </View>

      {mode === 'week' ? (
        <WeekView
          records={records}
          lbl={lbl}
          locale={config.locale}
          onEdit={handleEdit}
          onToggleDone={handleToggleDone}
          onDelete={handleDeleteFromList}
        />
      ) : (
        <ListView
          records={records}
          lbl={lbl}
          onEdit={handleEdit}
          onToggleDone={handleToggleDone}
          onDelete={handleDeleteFromList}
        />
      )}

      <Pressable
        style={alStyles.fab}
        onPress={handleNew}
        accessibilityRole="button"
        accessibilityLabel={lbl('add_btn') || t('common.add')}
        testID="fab-add-button"
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.white} />
      </Pressable>

      {completingRecord ? (
        <CompletionSheet
          record={completingRecord}
          config={config}
          lbl={lbl}
          onSave={handleCompletionSave}
          onSkip={handleCompletionSkip}
          onCancel={handleCompletionCancel}
        />
      ) : null}
    </View>
  )
}
