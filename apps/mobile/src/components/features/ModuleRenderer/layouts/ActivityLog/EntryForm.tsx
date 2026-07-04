import React, { useCallback, useMemo, useState } from 'react'
import {
  View, Text, ScrollView, TextInput, Platform, KeyboardAvoidingView, TouchableOpacity, Pressable,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Button } from '@ui/Button'
import { RatingSelector } from '@ui/RatingSelector'
import { SegmentedControl, type SegmentOption } from '@ui/SegmentedControl'
import { TimePicker } from '@ui/TimePicker'
import { PickChip } from './PickChip'
import type { BAConfiguredActivity } from '@kaer/shared'
import type { ActivityRecord } from '../../../../../lib/database'
import type { ActivityLogConfig } from './activityLogConfig'
import type { ActivityDraft, DomainItem, LabelFn, SuggestionItem } from './types'
import { alStyles } from './styles'

type EntryStatus = 'planned' | 'done'

export interface EntryFormProps {
  /** Enregistrement en cours d'édition, ou null en création. */
  editingRecord: ActivityRecord | null
  config: ActivityLogConfig
  lbl: LabelFn
  suggestionGroups: { domain: DomainItem | null; items: SuggestionItem[] }[]
  myActivities: BAConfiguredActivity[]
  saving: boolean
  onSave: (draft: ActivityDraft) => void
  onDelete: (() => void) | null
  onBack: () => void
}

/**
 * Formulaire d'activité. Le statut est EXPLICITE (« Je la prévois » /
 * « Je l'ai déjà faite ») : on n'évalue jamais une activité pas encore faite.
 * - Prévue : quoi + quand, c'est tout. La notation des ressentis viendra au
 *   moment de cocher réalisée (CompletionSheet).
 * - Déjà faite : les sliders ressentis s'affichent directement.
 * Aucune valeur par défaut : « non renseigné » (null) est un état légitime ;
 * re-taper le pip sélectionné efface la note. Les activités co-construites en
 * consultation sont proposées en premier, avec la phrase « valeur » du patient.
 * Affichage brut, aucune interprétation (MDR 2017/745).
 */
export function EntryForm({
  editingRecord, config, lbl, suggestionGroups, myActivities, saving, onSave, onDelete, onBack,
}: EntryFormProps) {
  const [status, setStatus] = useState<EntryStatus>(editingRecord?.done === 1 ? 'done' : 'planned')
  const [entryDate, setEntryDate] = useState<Date>(() =>
    editingRecord ? new Date(`${editingRecord.date}T00:00:00`) : new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [plannedTime, setPlannedTime] = useState(editingRecord?.planned_time ?? '')
  const [label, setLabel] = useState(editingRecord?.label ?? '')
  const [domainId, setDomainId] = useState<string | null>(editingRecord?.domain_id ?? null)
  const [configActivityId, setConfigActivityId] = useState<string | null>(editingRecord?.config_activity_id ?? null)
  const [pleasure, setPleasure] = useState<number | null>(editingRecord?.pleasure ?? null)
  const [mastery, setMastery] = useState<number | null>(editingRecord?.mastery ?? null)
  const [notes, setNotes] = useState(editingRecord?.notes ?? '')

  const statusOptions = useMemo<SegmentOption<EntryStatus>[]>(() => [
    { value: 'planned', label: lbl('status_planned_label') },
    { value: 'done', label: lbl('status_done_label') },
  ], [lbl])

  const selectedActivity = useMemo(
    () => myActivities.find(a => a.id === configActivityId) ?? null,
    [myActivities, configActivityId],
  )

  const handleLabelChange = useCallback((text: string) => {
    setLabel(text)
    // Saisie libre : l'activité n'est plus rattachée à une entrée co-construite.
    setConfigActivityId(null)
    setDomainId(null)
  }, [])

  const handlePickMyActivity = useCallback((activityId: string) => {
    const activity = myActivities.find(a => a.id === activityId)
    if (!activity) return
    const active = configActivityId === activity.id
    setConfigActivityId(active ? null : activity.id)
    setDomainId(active ? null : activity.domain_id)
    setLabel(active ? '' : activity.label)
  }, [myActivities, configActivityId])

  const allSuggestions = useMemo(
    () => suggestionGroups.flatMap(g => g.items),
    [suggestionGroups],
  )

  const handlePickSuggestion = useCallback((suggestionId: string) => {
    const suggestion = allSuggestions.find(s => s.id === suggestionId)
    if (!suggestion) return
    const active = label === suggestion.text && configActivityId == null
    setConfigActivityId(null)
    setDomainId(active ? null : suggestion.domainId)
    setLabel(active ? '' : suggestion.text)
  }, [allSuggestions, label, configActivityId])

  // Re-taper le pip sélectionné efface la note (retour à « non renseigné »).
  const handlePleasurePress = useCallback((value: number) => {
    setPleasure(prev => (prev === value ? null : value))
  }, [])
  const handleMasteryPress = useCallback((value: number) => {
    setMastery(prev => (prev === value ? null : value))
  }, [])

  const handleSave = useCallback(() => {
    onSave({
      id: editingRecord?.id ?? null,
      date: entryDate.toISOString().slice(0, 10),
      label: label.trim(),
      // Colonnes conservées en base (legacy) : plus de saisie de prédiction dans l'app.
      expected_pleasure: editingRecord?.expected_pleasure ?? null,
      expected_mastery: editingRecord?.expected_mastery ?? null,
      pleasure: status === 'done' ? pleasure : null,
      mastery: status === 'done' ? mastery : null,
      done: status === 'done',
      notes: notes.trim(),
      planned_time: status === 'planned' && plannedTime.length > 0 ? plannedTime : null,
      domain_id: domainId,
      config_activity_id: configActivityId,
    })
  }, [
    onSave, editingRecord, entryDate, label,
    pleasure, mastery, status, notes, plannedTime, domainId, configActivityId,
  ])

  const saveLabel = editingRecord ? lbl('update_label') : lbl('save_label')
  const dateValueText = entryDate.toLocaleDateString(config.locale, {
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
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />}
          accessibilityLabel={lbl('back_label')}
          onPress={onBack}
          testID="entry-back-button"
        />
      </View>
      <ScrollView contentContainerStyle={alStyles.entryContent} keyboardShouldPersistTaps="handled">
        {/* Statut explicite : on n'évalue jamais une activité pas encore faite */}
        <SegmentedControl
          options={statusOptions}
          value={status}
          onChange={setStatus}
          accessibilityLabel={lbl('status_planned_label')}
          testID="status-segment"
        />

        {/* Activité */}
        <View style={alStyles.section}>
          <Text style={alStyles.sectionLabel}>{lbl('section_activity_title')}</Text>
          <View style={alStyles.card}>
            <TextInput
              style={alStyles.labelInput}
              value={label}
              onChangeText={handleLabelChange}
              placeholder={lbl('activity_placeholder')}
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              testID="label-input"
            />
          </View>

          {myActivities.length > 0 ? (
            <View style={alStyles.suggestionGroup}>
              <Text style={alStyles.suggestionGroupTitle}>{lbl('my_activities_title')}</Text>
              <View style={alStyles.chipWrap}>
                {myActivities.map(activity => (
                  <PickChip
                    key={activity.id}
                    id={activity.id}
                    label={activity.label}
                    selected={configActivityId === activity.id}
                    onPick={handlePickMyActivity}
                    testID={`my-activity-${activity.id}`}
                  />
                ))}
              </View>
              {selectedActivity?.value_text ? (
                <Text style={alStyles.valueText} testID="linked-value">
                  {lbl('linked_value_prefix')} : {selectedActivity.value_text}
                </Text>
              ) : null}
            </View>
          ) : null}

          {suggestionGroups.map(group => (
            <View key={group.domain?.id ?? 'none'} style={alStyles.suggestionGroup}>
              {group.domain ? (
                <Text style={alStyles.suggestionGroupTitle}>{group.domain.label}</Text>
              ) : null}
              <View style={alStyles.chipWrap}>
                {group.items.map(s => (
                  <PickChip
                    key={s.id}
                    id={s.id}
                    label={s.text}
                    selected={label === s.text && configActivityId == null}
                    onPick={handlePickSuggestion}
                    testID={`suggestion-${s.id}`}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Date + heure prévue */}
        <View style={alStyles.section}>
          <Text style={alStyles.sectionLabel}>{lbl('date_label')}</Text>
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
                <Text style={alStyles.confirmBtnText}>{lbl('date_confirm_label')}</Text>
              </Pressable>
            ) : null}
            {status === 'planned' ? (
              <TimePicker
                value={plannedTime}
                onChange={setPlannedTime}
                label={lbl('planned_time_label')}
                placeholder={lbl('planned_time_label')}
                confirmLabel={lbl('date_confirm_label')}
                clearable
                clearLabel={lbl('planned_time_clear_label')}
                testID="planned-time"
              />
            ) : null}
          </View>
        </View>

        {/* Déjà faite : les ressentis, directement */}
        {status === 'done' ? (
          <View style={alStyles.section}>
            <Text style={alStyles.sectionLabel}>{lbl('section_felt_title')}</Text>
            <View style={alStyles.card}>
              <RatingSelector
                label={lbl('pleasure_label')}
                sublabel={lbl('pleasure_sublabel')}
                value={pleasure}
                steps={config.pleasureSteps}
                color={config.pleasureColor}
                variant="track"
                showEndLabels
                testIdPrefix="pleasure"
                onPress={handlePleasurePress}
              />
              <View style={alStyles.cardDivider} />
              <RatingSelector
                label={lbl('mastery_label')}
                sublabel={lbl('mastery_sublabel')}
                value={mastery}
                steps={config.masterySteps}
                color={config.masteryColor}
                variant="track"
                showEndLabels
                testIdPrefix="mastery"
                onPress={handleMasteryPress}
              />
            </View>
          </View>
        ) : null}

        {/* Notes */}
        <View style={alStyles.section}>
          <Text style={alStyles.sectionLabel}>{lbl('section_notes_title')}</Text>
          <View style={alStyles.card}>
            <TextInput
              style={alStyles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder={lbl('notes_placeholder')}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              testID="notes-input"
            />
          </View>
        </View>

        <Button
          label={saveLabel}
          onPress={handleSave}
          loading={saving}
          iconLeft={<MaterialCommunityIcons name="content-save-outline" size={20} color={colors.white} />}
          accessibilityLabel={saveLabel}
          testID="save-button"
        />
        {onDelete ? (
          <Button
            variant="ghost"
            size="sm"
            label={lbl('delete_label')}
            onPress={onDelete}
            accessibilityLabel={lbl('delete_label')}
            testID="delete-button"
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
