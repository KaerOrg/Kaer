// ─── Layout — exposition graduée (fear_thermometer…) ───────────────────────
//
// Pattern « SUDs avant/après + catalogue de situations + stratégies de coping ».
// 3 modes internes : list | entry | situations.
//   - list        : tab bar Saisies / Situations + liste des entries SUDs
//                   avec barres avant/après, FAB Nouvelle saisie
//   - entry       : formulaire (situation picker + SUDs avant + stratégies +
//                   SUDs après optionnel + notes)
//   - situations  : sous-mode du tab Situations — gestion du catalogue
//                   (input + liste avec delete)
//
// Persistance dans les tables SQLite dédiées `fear_situations` et
// `fear_entries` (existantes — aucune migration nécessaire).
//
// Conformité MDR 2017/745 : SUDs 0–100 affichés bruts, sans label
// interprétatif. Couleurs avant (rouge) / après (vert) = convention
// d'affichage de l'ordre temporel saisi, pas un score clinique.
//
// L'événement d'engagement (ex. SAVE_FEAR_ENTRY) est émis uniquement à la
// création d'une entry (jamais à l'édition).

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View, Text, Pressable, ScrollView, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '../../../../theme'
import {
  getAllFearEntries, getFearEntry, saveFearEntry, deleteFearEntry,
  getAllFearSituations, saveFearSituation, deleteFearSituation,
  generateId,
  type FearEntry, type FearSituation,
} from '../../../../lib/database'
import { logEvent, type EngagementEventType } from '../../../../services/engagementService'
import { useAuthStore } from '../../../../store/authStore'
import { useModuleT } from '../../../../hooks/useModuleT'
import { PipPicker } from '../../../PipPicker'
import type { ContentField } from '../../../../services/moduleService'
import { EntryListCard } from './EntryListCard'
import { etStyles } from './styles'

function buildSudsSteps(min: number, max: number, step: number): number[] {
  const out: number[] = []
  for (let v = min; v <= max; v += step) out.push(v)
  return out
}

function serializeStrategies(selectedKeys: string[], custom: string | null): string {
  return JSON.stringify({ selected: selectedKeys, custom: custom ?? '' })
}

function deserializeStrategies(raw: string): { selected: string[]; custom: string } {
  try {
    const parsed = JSON.parse(raw)
    const selected = Array.isArray(parsed.selected) ? parsed.selected.map(String) : []
    const custom = typeof parsed.custom === 'string' ? parsed.custom : ''
    return { selected, custom }
  } catch {
    return { selected: [], custom: '' }
  }
}

export interface ExposureTrackerLayoutProps {
  fields: ContentField[]
  moduleId: string
}

export function ExposureTrackerLayout({ fields }: ExposureTrackerLayoutProps) {
  const t = useModuleT()
  const patient = useAuthStore(s => s.patient)

  // ── Field resolution helpers ─────────────────────────────────────────────
  const ft = useCallback((type: string): string => {
    const f = fields.find(field => field.field_type === type)
    return f?.text_code ? t(f.text_code) : ''
  }, [fields, t])

  const configField = useMemo(() => fields.find(f => f.field_type === 'exposure_tracker_config'), [fields])
  const engagementEventType = (configField?.props['engagement_event_type'] ?? '') as EngagementEventType | ''
  const sudsMin = parseInt(configField?.props['suds_min'] ?? '0', 10)
  const sudsMax = parseInt(configField?.props['suds_max'] ?? '100', 10)
  const sudsStep = parseInt(configField?.props['suds_step'] ?? '10', 10)
  const sudsDefaultBefore = parseInt(configField?.props['suds_default_before'] ?? '50', 10)
  const beforeColor = configField?.props['suds_before_color'] ?? colors.danger
  const afterColor = configField?.props['suds_after_color'] ?? colors.success

  const sudsSteps = useMemo(
    () => buildSudsSteps(sudsMin, sudsMax, sudsStep),
    [sudsMin, sudsMax, sudsStep]
  )

  const strategyFields = useMemo(
    () => fields
      .filter(f => f.field_type === 'exposure_tracker_strategy')
      .sort((a, b) => a.sort_order - b.sort_order),
    [fields]
  )

  const strategyLabelByKey = useMemo(() => {
    const map = new Map<string, string>()
    for (const f of strategyFields) {
      const label = f.text_code ? t(f.text_code) : ''
      if (label) map.set(f.id, label)
    }
    return map
  }, [strategyFields, t])

  // ── State ────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<'entries' | 'situations'>('entries')
  const [mode, setMode] = useState<'list' | 'entry'>('list')
  const [entries, setEntries] = useState<FearEntry[]>([])
  const [situations, setSituations] = useState<FearSituation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Entry mode state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [situationId, setSituationId] = useState<string | null>(null)
  const [situationFreeText, setSituationFreeText] = useState('')
  const [situationPickerMode, setSituationPickerMode] = useState<'catalogue' | 'free'>('catalogue')
  const [sudsBefore, setSudsBefore] = useState<number>(sudsDefaultBefore)
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([])
  const [customStrategy, setCustomStrategy] = useState('')
  const [sudsAfter, setSudsAfter] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  // Situations panel state
  const [newSituationLabel, setNewSituationLabel] = useState('')

  // ── Loaders ──────────────────────────────────────────────────────────────
  const reloadAll = useCallback(async () => {
    const [e, s] = await Promise.all([getAllFearEntries(), getAllFearSituations()])
    setEntries(e)
    setSituations(s)
    setLoading(false)
  }, [])

  useEffect(() => { void reloadAll() }, [reloadAll])

  // ── Entry navigation ─────────────────────────────────────────────────────
  const resetEntryForm = useCallback(() => {
    setEditingId(null)
    setSituationId(null)
    setSituationFreeText('')
    setSituationPickerMode(situations.length > 0 ? 'catalogue' : 'free')
    setSudsBefore(sudsDefaultBefore)
    setSelectedStrategies([])
    setCustomStrategy('')
    setSudsAfter(null)
    setNotes('')
  }, [situations.length, sudsDefaultBefore])

  const handleNew = useCallback(() => {
    resetEntryForm()
    setMode('entry')
  }, [resetEntryForm])

  const handleEdit = useCallback(async (entryId: string) => {
    const existing = await getFearEntry(entryId)
    if (!existing) return
    setEditingId(existing.id)
    setSituationId(existing.situation_id)
    setSituationFreeText(existing.situation_id ? '' : existing.situation_label)
    setSituationPickerMode(existing.situation_id ? 'catalogue' : 'free')
    setSudsBefore(existing.suds_before)
    const { selected, custom } = deserializeStrategies(existing.strategies)
    setSelectedStrategies(selected)
    setCustomStrategy(custom)
    setSudsAfter(existing.suds_after)
    setNotes(existing.notes ?? '')
    setMode('entry')
  }, [])

  const handleBackToList = useCallback(() => {
    setMode('list')
    setEditingId(null)
  }, [])

  // ── Save / delete entry ──────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const resolvedLabel = situationId
      ? (situations.find(s => s.id === situationId)?.label ?? null)
      : situationFreeText.trim() || null

    if (!resolvedLabel) {
      Alert.alert(
        ft('exposure_tracker_situation_missing_title') || t('common.error'),
        ft('exposure_tracker_situation_missing_msg'),
      )
      return
    }

    setSaving(true)
    try {
      const isCreation = editingId == null
      const id = editingId ?? generateId()
      const customTrim = customStrategy.trim() || null
      const entry: Omit<FearEntry, 'created_at'> = {
        id,
        date: new Date().toISOString().slice(0, 10),
        situation_id: situationId,
        situation_label: resolvedLabel,
        suds_before: sudsBefore,
        strategies: serializeStrategies(selectedStrategies, customTrim),
        custom_strategy: customTrim,
        suds_after: sudsAfter,
        notes: notes.trim() || null,
      }
      await saveFearEntry(entry)
      if (patient?.id && engagementEventType && isCreation) {
        await logEvent(patient.id, engagementEventType as EngagementEventType, {})
      }
      await reloadAll()
      setMode('list')
      setEditingId(null)
    } catch {
      Alert.alert(t('common.error'), t('common.save_error'))
    } finally {
      setSaving(false)
    }
  }, [
    situationId, situations, situationFreeText, sudsBefore, selectedStrategies,
    customStrategy, sudsAfter, notes, editingId, patient, engagementEventType,
    reloadAll, ft, t,
  ])

  const handleDeleteFromEntry = useCallback(() => {
    if (!editingId) return
    Alert.alert(
      ft('exposure_tracker_delete_entry_title') || t('common.delete'),
      t('common.irreversible'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive',
          onPress: async () => {
            await deleteFearEntry(editingId)
            await reloadAll()
            setMode('list')
            setEditingId(null)
          },
        },
      ]
    )
  }, [editingId, reloadAll, ft, t])

  const handleDeleteFromList = useCallback((entry: FearEntry) => {
    Alert.alert(
      ft('exposure_tracker_delete_entry_title') || t('common.delete'),
      `"${entry.situation_label}"`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive',
          onPress: async () => {
            await deleteFearEntry(entry.id)
            await reloadAll()
          },
        },
      ]
    )
  }, [reloadAll, ft, t])

  // ── Situations panel ─────────────────────────────────────────────────────
  const handleAddSituation = useCallback(async () => {
    const trimmed = newSituationLabel.trim()
    if (!trimmed) return
    const s = { id: generateId(), label: trimmed }
    await saveFearSituation(s)
    setSituations(prev => [...prev, { ...s, created_at: new Date().toISOString() }])
    setNewSituationLabel('')
  }, [newSituationLabel])

  const handleDeleteSituation = useCallback((sit: FearSituation) => {
    Alert.alert(
      ft('exposure_tracker_situation_delete_title') || t('common.delete'),
      `"${sit.label}"`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive',
          onPress: async () => {
            await deleteFearSituation(sit.id)
            setSituations(prev => prev.filter(p => p.id !== sit.id))
          },
        },
      ]
    )
  }, [ft, t])

  // ── Strategy chip resolution for cards ───────────────────────────────────
  const resolveStrategyLabels = useCallback((entry: FearEntry): string[] => {
    const { selected, custom } = deserializeStrategies(entry.strategies)
    const labels = selected.map(key => strategyLabelByKey.get(key) ?? key)
    if (custom.trim()) labels.push(custom.trim())
    return labels
  }, [strategyLabelByKey])

  if (loading) {
    return (
      <View style={etStyles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  // ── MODE ENTRY ───────────────────────────────────────────────────────────
  if (mode === 'entry') {
    const saveLabel = editingId
      ? (ft('exposure_tracker_update_label') || t('common.update'))
      : (ft('exposure_tracker_save_label') || t('common.save'))

    return (
      <KeyboardAvoidingView
        style={etStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
        testID="exposure-tracker-entry"
      >
        <View style={etStyles.entryHeaderBar}>
          <Pressable
            onPress={handleBackToList}
            style={etStyles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={ft('exposure_tracker_back_label') || t('common.back')}
            testID="entry-back-button"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={etStyles.entryContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Situation */}
          <View style={etStyles.section}>
            <Text style={etStyles.sectionLabel}>{ft('exposure_tracker_section_trigger_title')}</Text>
            <View style={etStyles.card}>
              <View style={etStyles.toggle}>
                {situations.length > 0 ? (
                  <Pressable
                    style={[etStyles.toggleBtn, situationPickerMode === 'catalogue' && etStyles.toggleBtnActive]}
                    onPress={() => { setSituationPickerMode('catalogue'); setSituationFreeText('') }}
                    testID="toggle-catalogue"
                  >
                    <Text style={[etStyles.toggleText, situationPickerMode === 'catalogue' && etStyles.toggleTextActive]}>
                      {ft('exposure_tracker_situation_mode_catalogue')}
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={[etStyles.toggleBtn, situationPickerMode === 'free' && etStyles.toggleBtnActive]}
                  onPress={() => { setSituationPickerMode('free'); setSituationId(null) }}
                  testID="toggle-free"
                >
                  <Text style={[etStyles.toggleText, situationPickerMode === 'free' && etStyles.toggleTextActive]}>
                    {ft('exposure_tracker_situation_mode_free')}
                  </Text>
                </Pressable>
              </View>
              {situationPickerMode === 'catalogue' ? (
                situations.length === 0 ? (
                  <Text style={etStyles.catalogueEmpty}>{ft('exposure_tracker_situation_catalogue_empty')}</Text>
                ) : (
                  <View style={etStyles.catalogueList}>
                    {situations.map(s => {
                      const selected = situationId === s.id
                      return (
                        <Pressable
                          key={s.id}
                          style={[etStyles.catalogueItem, selected && etStyles.catalogueItemSelected]}
                          onPress={() => setSituationId(s.id === situationId ? null : s.id)}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: selected }}
                          testID={`situation-${s.id}`}
                        >
                          <MaterialCommunityIcons
                            name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                            size={16}
                            color={selected ? colors.primary : colors.textMuted}
                          />
                          <Text
                            style={[etStyles.catalogueItemLabel, selected && etStyles.catalogueItemLabelSelected]}
                            numberOfLines={2}
                          >
                            {s.label}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                )
              ) : (
                <TextInput
                  style={etStyles.freeInput}
                  placeholder={ft('exposure_tracker_situation_free_placeholder')}
                  placeholderTextColor={colors.textMuted}
                  value={situationFreeText}
                  onChangeText={(v) => { setSituationFreeText(v); setSituationId(null) }}
                  multiline
                  numberOfLines={2}
                  testID="situation-free-input"
                />
              )}
            </View>
          </View>

          {/* SUDs avant */}
          <View style={etStyles.section}>
            <Text style={etStyles.sectionLabel}>{ft('exposure_tracker_section_before_title')}</Text>
            <View style={etStyles.card}>
              <View style={etStyles.sudsHeader}>
                <View style={etStyles.sudsHeaderLeft}>
                  <Text style={etStyles.sudsHeaderLabel}>{ft('exposure_tracker_suds_before_label')}</Text>
                  {ft('exposure_tracker_suds_before_hint') ? (
                    <Text style={etStyles.sudsHeaderHint}>{ft('exposure_tracker_suds_before_hint')}</Text>
                  ) : null}
                </View>
                <View style={etStyles.sudsValueBox}>
                  <Text style={[etStyles.sudsValueBig, { color: beforeColor }]}>{sudsBefore}</Text>
                  <Text style={etStyles.sudsValueMax}>{`/${sudsMax}`}</Text>
                </View>
              </View>
              <PipPicker
                value={sudsBefore}
                steps={sudsSteps}
                color={beforeColor}
                label={ft('exposure_tracker_suds_before_label')}
                variant="numbered"
                showHeader={false}
                onPress={(v) => setSudsBefore(v)}
              />
            </View>
          </View>

          {/* Stratégies */}
          <View style={etStyles.section}>
            <Text style={etStyles.sectionLabel}>{ft('exposure_tracker_section_strategies_title')}</Text>
            <View style={etStyles.card}>
              {ft('exposure_tracker_strategies_hint') ? (
                <Text style={etStyles.stratHint}>{ft('exposure_tracker_strategies_hint')}</Text>
              ) : null}
              <View style={etStyles.chips}>
                {strategyFields.map(s => {
                  const text = s.text_code ? t(s.text_code) : ''
                  if (!text) return null
                  const active = selectedStrategies.includes(s.id)
                  return (
                    <Pressable
                      key={s.id}
                      style={[etStyles.chip, active && etStyles.chipActive]}
                      onPress={() => {
                        setSelectedStrategies(prev =>
                          active ? prev.filter(k => k !== s.id) : [...prev, s.id]
                        )
                      }}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={text}
                      testID={`strategy-${s.id}`}
                    >
                      {active ? (
                        <MaterialCommunityIcons name="check" size={13} color={colors.primary} />
                      ) : null}
                      <Text style={[etStyles.chipText, active && etStyles.chipTextActive]}>{text}</Text>
                    </Pressable>
                  )
                })}
              </View>
              <TextInput
                style={etStyles.customStratInput}
                placeholder={ft('exposure_tracker_strategy_custom_placeholder')}
                placeholderTextColor={colors.textMuted}
                value={customStrategy}
                onChangeText={setCustomStrategy}
                testID="custom-strategy-input"
              />
            </View>
          </View>

          {/* SUDs après — optionnel */}
          <View style={etStyles.section}>
            <Text style={etStyles.sectionLabel}>{ft('exposure_tracker_section_after_title')}</Text>
            <View style={etStyles.card}>
              <View style={etStyles.sudsHeader}>
                <View style={etStyles.sudsHeaderLeft}>
                  <Text style={etStyles.sudsHeaderLabel}>{ft('exposure_tracker_suds_after_label')}</Text>
                  {ft('exposure_tracker_suds_after_hint') ? (
                    <Text style={etStyles.sudsHeaderHint}>{ft('exposure_tracker_suds_after_hint')}</Text>
                  ) : null}
                </View>
                <View style={etStyles.sudsValueBox}>
                  {sudsAfter === null ? (
                    <Text style={etStyles.sudsValueNull}>—</Text>
                  ) : (
                    <Text style={[etStyles.sudsValueBig, { color: afterColor }]}>{sudsAfter}</Text>
                  )}
                  <Text style={etStyles.sudsValueMax}>{`/${sudsMax}`}</Text>
                </View>
              </View>
              <PipPicker
                value={sudsAfter}
                steps={sudsSteps}
                color={afterColor}
                label={ft('exposure_tracker_suds_after_label')}
                variant="numbered"
                showHeader={false}
                onPress={(v) => setSudsAfter(v)}
              />
              <Pressable
                style={etStyles.skipBtn}
                onPress={() => setSudsAfter(null)}
                accessibilityRole="button"
                accessibilityLabel={ft('exposure_tracker_suds_skip_later')}
                testID="suds-after-skip"
              >
                <Text style={[etStyles.skipText, sudsAfter === null && { color: afterColor, fontWeight: '700' }]}>
                  {sudsAfter === null
                    ? ft('exposure_tracker_suds_skip_null')
                    : ft('exposure_tracker_suds_skip_later')}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Notes */}
          <View style={etStyles.section}>
            <Text style={etStyles.sectionLabel}>{ft('exposure_tracker_section_notes_title') || t('common.notes_optional')}</Text>
            <View style={etStyles.card}>
              <TextInput
                style={etStyles.notesInput}
                placeholder={ft('exposure_tracker_notes_placeholder') || t('common.notes_placeholder')}
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                testID="notes-input"
              />
            </View>
          </View>

          <Pressable
            style={[etStyles.saveBtn, saving && etStyles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={saveLabel}
            testID="save-button"
          >
            {saving ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save-outline" size={20} color={colors.white} />
                <Text style={etStyles.saveBtnText}>{saveLabel}</Text>
              </>
            )}
          </Pressable>
          {editingId ? (
            <Pressable
              style={etStyles.deleteBtn}
              onPress={handleDeleteFromEntry}
              accessibilityRole="button"
              accessibilityLabel={ft('exposure_tracker_delete_label') || t('common.delete')}
              testID="delete-button"
            >
              <Text style={etStyles.deleteBtnText}>{ft('exposure_tracker_delete_label') || t('common.delete')}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  // ── MODE LIST (avec tabs Saisies / Situations) ───────────────────────────
  return (
    <View style={etStyles.container} testID="exposure-tracker-list">
      <View style={etStyles.tabBar}>
        <Pressable
          style={[etStyles.tab, tab === 'entries' && etStyles.tabActive]}
          onPress={() => setTab('entries')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'entries' }}
          testID="tab-entries"
        >
          <MaterialCommunityIcons
            name="thermometer"
            size={16}
            color={tab === 'entries' ? colors.primary : colors.textMuted}
          />
          <Text style={[etStyles.tabText, tab === 'entries' && etStyles.tabTextActive]}>
            {ft('exposure_tracker_tab_entries_label')}
          </Text>
        </Pressable>
        <Pressable
          style={[etStyles.tab, tab === 'situations' && etStyles.tabActive]}
          onPress={() => setTab('situations')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'situations' }}
          testID="tab-situations"
        >
          <MaterialCommunityIcons
            name="map-marker-multiple-outline"
            size={16}
            color={tab === 'situations' ? colors.primary : colors.textMuted}
          />
          <Text style={[etStyles.tabText, tab === 'situations' && etStyles.tabTextActive]}>
            {ft('exposure_tracker_tab_situations_label')}
          </Text>
        </Pressable>
      </View>

      {tab === 'entries' ? (
        <>
          <ScrollView contentContainerStyle={etStyles.listContent}>
            {entries.length === 0 ? (
              <View style={etStyles.empty} testID="list-empty">
                <MaterialCommunityIcons name="thermometer" size={52} color={colors.border} />
                {ft('exposure_tracker_empty_title') ? (
                  <Text style={etStyles.emptyTitle}>{ft('exposure_tracker_empty_title')}</Text>
                ) : null}
                {ft('exposure_tracker_empty_text') ? (
                  <Text style={etStyles.emptyText}>{ft('exposure_tracker_empty_text')}</Text>
                ) : null}
              </View>
            ) : (
              entries.map(e => (
                <EntryListCard
                  key={e.id}
                  entry={e}
                  strategyLabels={resolveStrategyLabels(e)}
                  beforeColor={beforeColor}
                  afterColor={afterColor}
                  beforeLabel={ft('exposure_tracker_entry_suds_before_label') || ft('exposure_tracker_suds_before_label')}
                  afterLabel={ft('exposure_tracker_entry_suds_after_label') || ft('exposure_tracker_suds_after_label')}
                  onEdit={() => handleEdit(e.id)}
                  onDelete={() => handleDeleteFromList(e)}
                />
              ))
            )}
          </ScrollView>
          <Pressable
            style={etStyles.fab}
            onPress={handleNew}
            accessibilityRole="button"
            accessibilityLabel={ft('exposure_tracker_add_btn') || t('common.add')}
            testID="fab-add-button"
          >
            <MaterialCommunityIcons name="thermometer-plus" size={22} color={colors.white} />
            <Text style={etStyles.fabText}>{ft('exposure_tracker_add_btn') || t('common.add')}</Text>
          </Pressable>
        </>
      ) : (
        <ScrollView contentContainerStyle={etStyles.panelContent}>
          <View style={etStyles.panelCard}>
            <Text style={etStyles.panelTitle}>{ft('exposure_tracker_situations_panel_title')}</Text>
            {ft('exposure_tracker_situations_panel_hint') ? (
              <Text style={etStyles.panelHint}>{ft('exposure_tracker_situations_panel_hint')}</Text>
            ) : null}
            <View style={etStyles.panelAddRow}>
              <TextInput
                style={etStyles.panelInput}
                placeholder={ft('exposure_tracker_situation_placeholder')}
                placeholderTextColor={colors.textMuted}
                value={newSituationLabel}
                onChangeText={setNewSituationLabel}
                returnKeyType="done"
                onSubmitEditing={handleAddSituation}
                testID="new-situation-input"
              />
              <Pressable
                style={etStyles.panelAddBtn}
                onPress={handleAddSituation}
                accessibilityRole="button"
                accessibilityLabel={t('common.add')}
                testID="add-situation-btn"
              >
                <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
              </Pressable>
            </View>
            {situations.length === 0 ? (
              <Text style={etStyles.panelEmpty}>{ft('exposure_tracker_situation_empty')}</Text>
            ) : (
              <View style={etStyles.panelList}>
                {situations.map(s => (
                  <View key={s.id} style={etStyles.panelItem} testID={`panel-situation-${s.id}`}>
                    <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.primary} />
                    <Text style={etStyles.panelItemLabel} numberOfLines={1}>{s.label}</Text>
                    <Pressable
                      onPress={() => handleDeleteSituation(s)}
                      hitSlop={8}
                      accessibilityLabel={`${t('common.delete')} ${s.label}`}
                      testID={`delete-situation-${s.id}`}
                    >
                      <MaterialCommunityIcons name="close" size={14} color={colors.textMuted} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  )
}
