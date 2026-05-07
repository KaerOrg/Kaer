// ─── Layout — journal d'activités (behavioral_activation…) ──────────────────
//
// Pattern « plusieurs activités par jour, planifiées ou réalisées, notées
// selon deux dimensions brutes (Plaisir / Maîtrise) ». 3 modes internes :
// list | entry | month. Mode list = liste groupée par date. Mode entry =
// formulaire date + label + suggestions + toggle réalisée + 2 sliders
// (plaisir/maîtrise) + notes. Mode month = grille calendrier avec points
// done/planned + filtre par jour sélectionné.
// Persistance dans la table SQLite dédiée `activity_records`.
// Conformité MDR 2017/745 : valeurs brutes uniquement, pas de seuil ni
// d'interprétation. La couleur des points = convention d'affichage des
// statuts done/planned saisis, pas un score clinique.

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View, Text, Pressable, ScrollView, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '../../../../theme'
import {
  getAllActivityRecords, getActivityRecord, saveActivityRecord, deleteActivityRecord,
  generateId, type ActivityRecord,
} from '../../../../lib/database'
import { formatDateFull } from '../../../../lib/dateUtils'
import { logEvent, type EngagementEventType } from '../../../../services/engagementService'
import { useAuthStore } from '../../../../store/authStore'
import { useModuleT } from '../../../../hooks/useModuleT'
import { PipPicker } from '../../../PipPicker'
import type { ContentField } from '../../../../services/moduleService'
import { ActivityListCard } from './ActivityListCard'
import { alStyles } from './styles'

const WEEKDAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function formatLongMonth(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}

function buildPipSteps(min: number, max: number, step: number): number[] {
  const steps: number[] = []
  for (let v = min; v <= max; v += step) steps.push(v)
  return steps
}

export interface ActivityLogLayoutProps {
  fields: ContentField[]
  moduleId: string
}

export function ActivityLogLayout({ fields, moduleId: _moduleId }: ActivityLogLayoutProps) {
  const t = useModuleT()
  const patient = useAuthStore(s => s.patient)

  // ── Résolution des champs DB-driven
  const ft = useCallback((type: string): string => {
    const f = fields.find(field => field.field_type === type)
    return f?.text_code ? t(f.text_code) : ''
  }, [fields, t])

  const configField = fields.find(f => f.field_type === 'activity_log_config')
  const engagementEventType = (configField?.props['engagement_event_type'] ?? '') as EngagementEventType | ''
  const pleasureMin = parseInt(configField?.props['pleasure_min'] ?? '0', 10)
  const pleasureMax = parseInt(configField?.props['pleasure_max'] ?? '10', 10)
  const pleasureStep = parseInt(configField?.props['pleasure_step'] ?? '1', 10)
  const masteryMin = parseInt(configField?.props['mastery_min'] ?? '0', 10)
  const masteryMax = parseInt(configField?.props['mastery_max'] ?? '10', 10)
  const masteryStep = parseInt(configField?.props['mastery_step'] ?? '1', 10)
  const pleasureColor = configField?.props['pleasure_color'] ?? '#059669'
  const masteryColor = configField?.props['mastery_color'] ?? '#4F46E5'
  const dotDoneColor = configField?.props['dot_done_color'] ?? colors.success
  const dotPlannedColor = configField?.props['dot_planned_color'] ?? colors.primary
  const localeProp = configField?.props['locale'] ?? 'fr-FR'

  const pleasureSteps = useMemo(
    () => buildPipSteps(pleasureMin, pleasureMax, pleasureStep),
    [pleasureMin, pleasureMax, pleasureStep]
  )
  const masterySteps = useMemo(
    () => buildPipSteps(masteryMin, masteryMax, masteryStep),
    [masteryMin, masteryMax, masteryStep]
  )

  const suggestionFields = useMemo(
    () => fields
      .filter(f => f.field_type === 'activity_log_suggestion')
      .sort((a, b) => a.sort_order - b.sort_order),
    [fields]
  )

  // ── State
  const [mode, setMode] = useState<'list' | 'entry' | 'month'>('list')
  const [records, setRecords] = useState<ActivityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Mode entry
  const [editingId, setEditingId] = useState<string | null>(null)
  const [entryDate, setEntryDate] = useState<Date>(() => new Date())
  const [label, setLabel] = useState('')
  const [pleasure, setPleasure] = useState(Math.round((pleasureMin + pleasureMax) / 2))
  const [mastery, setMastery] = useState(Math.round((masteryMin + masteryMax) / 2))
  const [done, setDone] = useState(false)
  const [notes, setNotes] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Mode month
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // ── Loaders
  const loadRecords = useCallback(async () => {
    const data = await getAllActivityRecords()
    setRecords(data)
    setLoading(false)
  }, [])

  useEffect(() => { void loadRecords() }, [loadRecords])

  // ── Navigation
  const handleNew = useCallback(() => {
    setEditingId(null)
    setEntryDate(new Date())
    setLabel('')
    setPleasure(Math.round((pleasureMin + pleasureMax) / 2))
    setMastery(Math.round((masteryMin + masteryMax) / 2))
    setDone(false)
    setNotes('')
    setMode('entry')
  }, [pleasureMin, pleasureMax, masteryMin, masteryMax])

  const handleEdit = useCallback(async (recordId: string) => {
    const r = await getActivityRecord(recordId)
    if (!r) return
    setEditingId(r.id)
    setEntryDate(new Date(`${r.date}T00:00:00`))
    setLabel(r.label)
    setPleasure(r.pleasure)
    setMastery(r.mastery)
    setDone(r.done === 1)
    setNotes(r.notes ?? '')
    setMode('entry')
  }, [])

  const handleBackToList = useCallback(() => {
    setMode('list')
    setEditingId(null)
  }, [])

  // ── Save / delete / toggle
  const handleSave = useCallback(async () => {
    if (!label.trim()) {
      Alert.alert(
        ft('activity_log_name_missing_title') || t('common.error'),
        ft('activity_log_name_missing_msg'),
      )
      return
    }
    setSaving(true)
    try {
      const isCreation = editingId == null
      const id = editingId ?? generateId()
      await saveActivityRecord({
        id,
        date: entryDate.toISOString().slice(0, 10),
        label: label.trim(),
        pleasure,
        mastery,
        done: done ? 1 : 0,
        notes: notes.trim() || null,
      })
      if (patient?.id && engagementEventType && isCreation) {
        await logEvent(patient.id, engagementEventType as EngagementEventType, {})
      }
      await loadRecords()
      setMode('list')
      setEditingId(null)
    } catch {
      Alert.alert(t('common.error'), t('common.save_error'))
    } finally {
      setSaving(false)
    }
  }, [label, editingId, entryDate, pleasure, mastery, done, notes, patient, engagementEventType, loadRecords, ft, t])

  const handleDelete = useCallback(() => {
    if (!editingId) return
    Alert.alert(
      ft('activity_log_delete_title') || t('common.delete'),
      t('common.irreversible'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteActivityRecord(editingId)
            await loadRecords()
            setMode('list')
            setEditingId(null)
          },
        },
      ]
    )
  }, [editingId, loadRecords, ft, t])

  const handleDeleteFromList = useCallback((record: ActivityRecord) => {
    Alert.alert(
      ft('activity_log_delete_title') || t('common.delete'),
      `"${record.label}"`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteActivityRecord(record.id)
            await loadRecords()
          },
        },
      ]
    )
  }, [loadRecords, ft, t])

  const handleToggleDone = useCallback(async (record: ActivityRecord) => {
    await saveActivityRecord({
      id: record.id,
      date: record.date,
      label: record.label,
      pleasure: record.pleasure,
      mastery: record.mastery,
      done: record.done === 1 ? 0 : 1,
      notes: record.notes,
    })
    await loadRecords()
  }, [loadRecords])

  // ── Month nav
  const goPrevMonth = useCallback(() => {
    setMonthAnchor(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }, [])

  const goNextMonth = useCallback(() => {
    setMonthAnchor(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }, [])

  if (loading) {
    return <View style={alStyles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  // ── MODE ENTRY ──────────────────────────────────────────────────────────
  if (mode === 'entry') {
    const saveLabel = editingId
      ? (ft('activity_log_update_label') || t('common.update'))
      : (ft('activity_log_save_label') || t('common.save'))
    const dateValueText = entryDate.toLocaleDateString(localeProp, {
      weekday: 'long', day: 'numeric', month: 'long',
    })

    return (
      <KeyboardAvoidingView
        style={alStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
        testID="activity-log-entry"
      >
        <View style={alStyles.entryHeaderBar}>
          <Pressable
            onPress={handleBackToList}
            style={alStyles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={ft('activity_log_back_label') || t('common.back')}
            testID="entry-back-button"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={alStyles.entryContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date */}
          <View style={alStyles.section}>
            <Text style={alStyles.sectionLabel}>{ft('activity_log_date_label')}</Text>
            <View style={alStyles.card}>
              <TouchableOpacity
                style={alStyles.dateBtn}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                testID="date-btn"
              >
                <MaterialCommunityIcons name="calendar-outline" size={20} color={colors.textMuted} />
                <Text style={alStyles.dateValue}>{dateValueText}</Text>
              </TouchableOpacity>
              {showDatePicker ? (
                <DateTimePicker
                  value={entryDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, date) => {
                    if (Platform.OS === 'android') setShowDatePicker(false)
                    if (date) setEntryDate(date)
                  }}
                />
              ) : null}
              {showDatePicker && Platform.OS === 'ios' ? (
                <Pressable style={alStyles.confirmBtn} onPress={() => setShowDatePicker(false)}>
                  <Text style={alStyles.confirmBtnText}>{ft('activity_log_date_confirm_label') || t('common.ok')}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Activité */}
          <View style={alStyles.section}>
            <Text style={alStyles.sectionLabel}>{ft('activity_log_section_activity_title')}</Text>
            <View style={alStyles.card}>
              <TextInput
                style={alStyles.labelInput}
                value={label}
                onChangeText={setLabel}
                placeholder={ft('activity_log_activity_placeholder')}
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                testID="label-input"
              />
            </View>
            {suggestionFields.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={alStyles.chipList}
                keyboardShouldPersistTaps="handled"
              >
                {suggestionFields.map(s => {
                  const text = s.text_code ? t(s.text_code) : ''
                  if (!text) return null
                  const active = label === text
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[alStyles.chip, active && alStyles.chipActive]}
                      onPress={() => setLabel(active ? '' : text)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={text}
                      testID={`suggestion-${s.id}`}
                    >
                      <Text style={[alStyles.chipText, active && alStyles.chipTextActive]}>{text}</Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            ) : null}
          </View>

          {/* Statut réalisée */}
          <Pressable
            style={[alStyles.doneRow, done && alStyles.doneRowActive]}
            onPress={() => setDone(!done)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done }}
            testID="done-toggle"
          >
            <MaterialCommunityIcons
              name={done ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
              size={24}
              color={done ? colors.success : colors.textMuted}
            />
            <Text style={[alStyles.doneLabel, done && { color: colors.success }]}>
              {done ? ft('activity_log_done_label') : ft('activity_log_mark_done_label')}
            </Text>
          </Pressable>

          {/* Évaluation */}
          <View style={alStyles.section}>
            <Text style={alStyles.sectionLabel}>{ft('activity_log_section_evaluation_title')}</Text>
            <View style={alStyles.card}>
              <PipPicker
                label={ft('activity_log_pleasure_label')}
                sublabel={ft('activity_log_pleasure_sublabel')}
                value={pleasure}
                steps={pleasureSteps}
                color={pleasureColor}
                variant="track"
                showEndLabels
                onPress={setPleasure}
              />
              <View style={alStyles.cardDivider} />
              <PipPicker
                label={ft('activity_log_mastery_label')}
                sublabel={ft('activity_log_mastery_sublabel')}
                value={mastery}
                steps={masterySteps}
                color={masteryColor}
                variant="track"
                showEndLabels
                onPress={setMastery}
              />
            </View>
          </View>

          {/* Notes */}
          <View style={alStyles.section}>
            <Text style={alStyles.sectionLabel}>{ft('activity_log_section_notes_title') || t('common.notes_optional')}</Text>
            <View style={alStyles.card}>
              <TextInput
                style={alStyles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder={ft('activity_log_notes_placeholder') || t('common.notes_placeholder')}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                testID="notes-input"
              />
            </View>
          </View>

          <Pressable
            style={[alStyles.saveBtn, saving && alStyles.btnDisabled]}
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
                <Text style={alStyles.saveBtnText}>{saveLabel}</Text>
              </>
            )}
          </Pressable>
          {editingId ? (
            <Pressable
              style={alStyles.deleteBtn}
              onPress={handleDelete}
              accessibilityRole="button"
              accessibilityLabel={ft('activity_log_delete_label') || t('common.delete')}
              testID="delete-button"
            >
              <Text style={alStyles.deleteBtnText}>{ft('activity_log_delete_label') || t('common.delete')}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  // ── MODE MONTH ──────────────────────────────────────────────────────────
  if (mode === 'month') {
    const year = monthAnchor.getFullYear()
    const m = monthAnchor.getMonth()
    const totalDays = new Date(year, m + 1, 0).getDate()
    let offset = new Date(year, m, 1).getDay() - 1
    if (offset < 0) offset = 6
    const cells: (number | null)[] = [
      ...Array(offset).fill(null),
      ...Array.from({ length: totalDays }, (_, i) => i + 1),
    ]
    while (cells.length % 7 !== 0) cells.push(null)

    const dayMap = new Map<string, { done: number; planned: number }>()
    for (const r of records) {
      const d = new Date(`${r.date}T00:00:00`)
      if (d.getFullYear() === year && d.getMonth() === m) {
        const cur = dayMap.get(r.date) ?? { done: 0, planned: 0 }
        if (r.done === 1) cur.done += 1
        else cur.planned += 1
        dayMap.set(r.date, cur)
      }
    }

    const today = new Date()
    const isCurrentMonth = year === today.getFullYear() && m === today.getMonth()
    const monthLabel = formatLongMonth(monthAnchor, localeProp)
    const monthDone = [...dayMap.values()].reduce((acc, v) => acc + v.done, 0)
    const monthPlanned = [...dayMap.values()].reduce((acc, v) => acc + v.planned, 0)

    const dayRecords = selectedDay
      ? records.filter(r => r.date === selectedDay)
      : []

    return (
      <View style={alStyles.container} testID="activity-log-month">
        <View style={alStyles.monthNav}>
          <Pressable
            onPress={handleBackToList}
            style={alStyles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={ft('activity_log_back_label') || t('common.back')}
            testID="month-back-button"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Pressable onPress={goPrevMonth} style={alStyles.navBtn} accessibilityRole="button" testID="month-prev">
            <MaterialCommunityIcons name="chevron-left" size={26} color={colors.primary} />
          </Pressable>
          <Text style={alStyles.monthTitle}>{monthLabel}</Text>
          <Pressable onPress={goNextMonth} style={alStyles.navBtn} accessibilityRole="button" testID="month-next">
            <MaterialCommunityIcons name="chevron-right" size={26} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={alStyles.monthContent}>
          <View style={alStyles.calendarCard}>
            <View style={alStyles.calendarHeader}>
              {WEEKDAYS_SHORT.map((d, i) => (
                <Text key={i} style={alStyles.weekday}>{d}</Text>
              ))}
            </View>
            {Array.from({ length: cells.length / 7 }, (_, rowIdx) => (
              <View key={rowIdx} style={alStyles.calendarRow}>
                {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
                  if (!day) return <View key={colIdx} style={alStyles.calendarCell} />
                  const mm = String(m + 1).padStart(2, '0')
                  const dd = String(day).padStart(2, '0')
                  const dateStr = `${year}-${mm}-${dd}`
                  const acts = dayMap.get(dateStr)
                  const isToday = isCurrentMonth && day === today.getDate()
                  const isSelected = selectedDay === dateStr
                  return (
                    <Pressable
                      key={colIdx}
                      style={[
                        alStyles.calendarCell,
                        alStyles.calendarCellPressable,
                        isSelected && alStyles.calendarCellSelected,
                        !isSelected && acts != null && alStyles.calendarCellHasActivity,
                        !isSelected && isToday && alStyles.calendarCellToday,
                      ]}
                      onPress={() => setSelectedDay(prev => prev === dateStr ? null : dateStr)}
                      accessibilityRole="button"
                      testID={`day-${dateStr}`}
                    >
                      <Text style={[
                        alStyles.dayNum,
                        isToday && !isSelected && alStyles.dayNumToday,
                        isSelected && alStyles.dayNumSelected,
                      ]}>
                        {day}
                      </Text>
                      {acts != null ? (
                        <View style={alStyles.dots}>
                          {acts.done > 0 ? <View style={[alStyles.dot, { backgroundColor: dotDoneColor }]} /> : null}
                          {acts.planned > 0 ? <View style={[alStyles.dot, { backgroundColor: dotPlannedColor }]} /> : null}
                        </View>
                      ) : null}
                    </Pressable>
                  )
                })}
              </View>
            ))}
            <View style={alStyles.legendRow}>
              <View style={alStyles.legendItem}>
                <View style={[alStyles.legendDot, { backgroundColor: dotDoneColor }]} />
                <Text style={alStyles.legendText}>{ft('activity_log_legend_done_label')}</Text>
              </View>
              <View style={alStyles.legendItem}>
                <View style={[alStyles.legendDot, { backgroundColor: dotPlannedColor }]} />
                <Text style={alStyles.legendText}>{ft('activity_log_legend_planned_label')}</Text>
              </View>
              {(monthDone > 0 || monthPlanned > 0) ? (
                <Text style={alStyles.legendStat} testID="month-stats">
                  {monthDone} · {monthPlanned}
                </Text>
              ) : null}
            </View>
          </View>

          {selectedDay == null ? (
            <View style={alStyles.monthHint}>
              <MaterialCommunityIcons name="gesture-tap" size={24} color={colors.textMuted} />
              <Text style={alStyles.monthHintText}>{ft('activity_log_month_hint_tap')}</Text>
            </View>
          ) : dayRecords.length === 0 ? (
            <View style={alStyles.monthHint}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={24} color={colors.textMuted} />
              <Text style={alStyles.monthHintText}>{ft('activity_log_month_hint_empty')}</Text>
            </View>
          ) : (
            <View style={alStyles.dayList}>
              <Text style={alStyles.dayListTitle}>{formatDateFull(selectedDay)}</Text>
              {dayRecords.map(r => (
                <ActivityListCard
                  key={r.id}
                  record={r}
                  onToggleDone={() => handleToggleDone(r)}
                  onEdit={() => handleEdit(r.id)}
                  onDelete={() => handleDeleteFromList(r)}
                  ft={ft}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    )
  }

  // ── MODE LIST ───────────────────────────────────────────────────────────
  // Groupage par date
  const groups = new Map<string, ActivityRecord[]>()
  for (const r of records) {
    const list = groups.get(r.date) ?? []
    list.push(r)
    groups.set(r.date, list)
  }
  const groupedDates = [...groups.keys()].sort((a, b) => b.localeCompare(a))

  return (
    <View style={alStyles.container} testID="activity-log-list">
      {/* Tab bar Liste / Mois */}
      <View style={alStyles.tabBar}>
        <Pressable
          style={[alStyles.tab, alStyles.tabActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: true }}
          testID="tab-list"
        >
          <MaterialCommunityIcons name="format-list-bulleted" size={16} color={colors.primary} />
          <Text style={[alStyles.tabText, alStyles.tabTextActive]}>{ft('activity_log_tab_list_label')}</Text>
        </Pressable>
        <Pressable
          style={alStyles.tab}
          onPress={() => { setSelectedDay(null); setMode('month') }}
          accessibilityRole="tab"
          accessibilityState={{ selected: false }}
          testID="tab-month"
        >
          <MaterialCommunityIcons name="calendar-month-outline" size={16} color={colors.textMuted} />
          <Text style={alStyles.tabText}>{ft('activity_log_tab_month_label')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={alStyles.listContent}>
        {records.length === 0 ? (
          <View style={alStyles.empty} testID="list-empty">
            <MaterialCommunityIcons name="run-fast" size={52} color={colors.border} />
            {ft('activity_log_empty_title') ? (
              <Text style={alStyles.emptyTitle}>{ft('activity_log_empty_title')}</Text>
            ) : null}
            {ft('activity_log_empty_text') ? (
              <Text style={alStyles.emptyText}>{ft('activity_log_empty_text')}</Text>
            ) : null}
          </View>
        ) : (
          groupedDates.map(date => (
            <View key={date} style={alStyles.dayList}>
              <Text style={alStyles.dayListTitle}>{formatDateFull(date)}</Text>
              {groups.get(date)!.map(r => (
                <ActivityListCard
                  key={r.id}
                  record={r}
                  onToggleDone={() => handleToggleDone(r)}
                  onEdit={() => handleEdit(r.id)}
                  onDelete={() => handleDeleteFromList(r)}
                  ft={ft}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <Pressable
        style={alStyles.fab}
        onPress={handleNew}
        accessibilityRole="button"
        accessibilityLabel={ft('activity_log_add_btn') || t('common.add')}
        testID="fab-add-button"
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.white} />
      </Pressable>
    </View>
  )
}
