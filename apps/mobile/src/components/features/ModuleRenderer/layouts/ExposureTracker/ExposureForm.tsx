import React, { useState } from 'react'
import {
  View, Text, Pressable, ScrollView, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '../../../../../theme'
import type { FearEntry, FearSituation } from '../../../../../lib/database'
import type { ExposureConfig, ExposureDraft } from './types'
import { deserializeStrategies } from './exposureLogic'
import { SudsField } from './SudsField'
import { etStyles } from './styles'

/** 'YYYY-MM-DD' → Date locale (midi pour éviter les décalages de fuseau). */
function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0)
}

/** Date → 'YYYY-MM-DD' en heure locale. */
function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export interface StrategyOption {
  id: string
  label: string
}

export interface ExposureFormProps {
  step: FearSituation
  existing: FearEntry | null
  config: ExposureConfig
  sudsSteps: number[]
  strategyOptions: StrategyOption[]
  saving: boolean
  lbl: (k: string, opts?: Record<string, string | number>) => string
  tCommon: (k: string) => string
  onBack: () => void
  onSave: (draft: ExposureDraft) => void
  onDelete: () => void
}

/**
 * Formulaire d'exposition vécu comme une expérience (modèle d'inhibitory learning) :
 * AVANT « ce que je redoute » + angoisse anticipée → PENDANT pic → APRÈS angoisse
 * finale + « ce qui s'est passé ». MDR : aucune comparaison ni conclusion automatique.
 */
export function ExposureForm({
  step, existing, config, sudsSteps, strategyOptions, saving, lbl, tCommon, onBack, onSave, onDelete,
}: ExposureFormProps) {
  const initialStrategies = existing ? deserializeStrategies(existing.strategies) : { selected: [], custom: '' }

  const [entryDate, setEntryDate] = useState<Date>(() => (existing ? parseISODate(existing.date) : new Date()))
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [expectation, setExpectation] = useState(existing?.expectation_text ?? '')
  const [sudsBefore, setSudsBefore] = useState<number>(existing?.suds_before ?? config.sudsDefaultBefore)
  const [sudsPeak, setSudsPeak] = useState<number | null>(existing?.suds_peak ?? null)
  const [sudsAfter, setSudsAfter] = useState<number | null>(existing?.suds_after ?? null)
  const [outcome, setOutcome] = useState(existing?.outcome_text ?? '')
  const [selected, setSelected] = useState<string[]>(initialStrategies.selected)
  const [custom, setCustom] = useState(initialStrategies.custom)
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const submit = () => {
    onSave({
      date: toISODate(entryDate),
      suds_before: sudsBefore,
      suds_peak: sudsPeak,
      suds_after: sudsAfter,
      expectation_text: expectation.trim() || null,
      outcome_text: outcome.trim() || null,
      selectedStrategies: selected,
      customStrategy: custom.trim() || null,
      notes: notes.trim() || null,
    })
  }

  return (
    <KeyboardAvoidingView
      style={etStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
      testID="exposure-form"
    >
      <View style={etStyles.entryHeaderBar}>
        <Pressable onPress={onBack} style={etStyles.backBtn} accessibilityLabel={tCommon('common.back')} testID="exposure-back">
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={etStyles.headerTitle} numberOfLines={1}>{step.label}</Text>
      </View>

      <ScrollView contentContainerStyle={etStyles.entryContent} keyboardShouldPersistTaps="handled">
        {/* DATE — éditable (saisie possible le lendemain) */}
        <View style={etStyles.section}>
          <Text style={etStyles.sectionLabel}>{lbl('exposure_date')}</Text>
          <Pressable
            style={etStyles.dateBtn}
            onPress={() => setShowDatePicker(true)}
            accessibilityRole="button"
            testID="exposure-date-btn"
          >
            <MaterialCommunityIcons name="calendar-outline" size={20} color={colors.textMuted} />
            <Text style={etStyles.dateValue}>
              {entryDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </Pressable>
          {showDatePicker ? (
            <DateTimePicker
              value={entryDate}
              mode="date"
              maximumDate={new Date()}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, d) => {
                if (Platform.OS === 'android') setShowDatePicker(false)
                if (d) setEntryDate(d)
              }}
            />
          ) : null}
          {showDatePicker && Platform.OS === 'ios' ? (
            <Pressable style={etStyles.dateConfirmBtn} onPress={() => setShowDatePicker(false)} testID="exposure-date-confirm">
              <Text style={etStyles.dateConfirmText}>{tCommon('common.ok')}</Text>
            </Pressable>
          ) : null}
        </View>

        {/* AVANT */}
        <View style={etStyles.section}>
          <Text style={etStyles.sectionLabel}>{lbl('exposure_section_before')}</Text>
          <Text style={etStyles.stratHint}>{lbl('scale_hint')}</Text>
          <View style={etStyles.card}>
            <Text style={etStyles.sudsHeaderLabel}>{lbl('expectation_label')}</Text>
            <TextInput
              style={etStyles.predictInput}
              value={expectation}
              onChangeText={setExpectation}
              placeholder={lbl('expectation_placeholder')}
              placeholderTextColor={colors.textMuted}
              multiline
              testID="expectation-input"
            />
          </View>
          <SudsField
            label={lbl('suds_anticipated')}
            value={sudsBefore}
            max={config.sudsMax}
            color={config.beforeColor}
            sudsSteps={sudsSteps}
            onChange={(v) => setSudsBefore(v ?? config.sudsMin)}
            testID="suds-before-field"
          />
        </View>

        {/* PENDANT */}
        <View style={etStyles.section}>
          <Text style={etStyles.sectionLabel}>{lbl('exposure_section_during')}</Text>
          <SudsField
            label={lbl('suds_peak')}
            hint={lbl('suds_peak_hint')}
            value={sudsPeak}
            max={config.sudsMax}
            color={config.peakColor}
            sudsSteps={sudsSteps}
            onChange={setSudsPeak}
            skip={{ label: lbl('suds_skip_later'), activeLabel: lbl('suds_skip_null') }}
            testID="suds-peak-field"
          />
        </View>

        {/* APRÈS */}
        <View style={etStyles.section}>
          <Text style={etStyles.sectionLabel}>{lbl('exposure_section_after')}</Text>
          <SudsField
            label={lbl('suds_final')}
            value={sudsAfter}
            max={config.sudsMax}
            color={config.afterColor}
            sudsSteps={sudsSteps}
            onChange={setSudsAfter}
            skip={{ label: lbl('suds_skip_later'), activeLabel: lbl('suds_skip_null') }}
            testID="suds-after-field"
          />
          <View style={etStyles.card}>
            <Text style={etStyles.sudsHeaderLabel}>{lbl('outcome_label')}</Text>
            <TextInput
              style={etStyles.predictInput}
              value={outcome}
              onChangeText={setOutcome}
              placeholder={lbl('outcome_placeholder')}
              placeholderTextColor={colors.textMuted}
              multiline
              testID="outcome-input"
            />
          </View>
        </View>

        {/* STRATÉGIES */}
        <View style={etStyles.section}>
          <Text style={etStyles.sectionLabel}>{lbl('section_strategies')}</Text>
          <View style={etStyles.card}>
            <Text style={etStyles.stratHint}>{lbl('strategies_hint')}</Text>
            <View style={etStyles.chips}>
              {strategyOptions.map(opt => {
                const active = selected.includes(opt.id)
                return (
                  <Pressable
                    key={opt.id}
                    style={[etStyles.chip, active && etStyles.chipActive]}
                    onPress={() => setSelected(prev => active ? prev.filter(k => k !== opt.id) : [...prev, opt.id])}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={opt.label}
                    testID={`strategy-${opt.id}`}
                  >
                    {active ? <MaterialCommunityIcons name="check" size={13} color={colors.primary} /> : null}
                    <Text style={[etStyles.chipText, active && etStyles.chipTextActive]}>{opt.label}</Text>
                  </Pressable>
                )
              })}
            </View>
            <TextInput
              style={etStyles.customStratInput}
              value={custom}
              onChangeText={setCustom}
              placeholder={lbl('strategy_custom_placeholder')}
              placeholderTextColor={colors.textMuted}
              testID="custom-strategy-input"
            />
          </View>
        </View>

        {/* NOTES */}
        <View style={etStyles.section}>
          <Text style={etStyles.sectionLabel}>{lbl('section_notes')}</Text>
          <View style={etStyles.card}>
            <TextInput
              style={etStyles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder={lbl('notes_placeholder')}
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              testID="notes-input"
            />
          </View>
        </View>

        <Pressable
          style={[etStyles.saveBtn, saving && etStyles.btnDisabled]}
          onPress={submit}
          disabled={saving}
          accessibilityRole="button"
          testID="exposure-save"
        >
          {saving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-outline" size={20} color={colors.white} />
              <Text style={etStyles.saveBtnText}>{existing ? tCommon('common.update') : tCommon('common.save')}</Text>
            </>
          )}
        </Pressable>
        {existing ? (
          <Pressable style={etStyles.deleteBtn} onPress={onDelete} accessibilityRole="button" testID="exposure-delete">
            <Text style={etStyles.deleteBtnText}>{tCommon('common.delete')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
