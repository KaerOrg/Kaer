// ─── Layout `column_form` — formulaire à colonnes hétérogènes (beck_columns…) ─
//
// Pattern « plusieurs enregistrements par module, chacun = un formulaire à
// champs hétérogènes ». Chaque section_id = une colonne. Chaque colonne
// contient un `column_header` et des champs enfants (`parent_field_id`)
// définissant le widget : `column_text_field`, `column_slider_field` ou
// `column_time_field`. Persistance JSON dans `form_entries`. 2 modes : list | entry.
// Conformité MDR 2017/745 : aucune interprétation, simple journal libre.

import { useState, useCallback, useEffect, useMemo, Fragment } from 'react'
import {

  View, Text, ScrollView, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { colors } from '@theme'
import type { ContentField } from '../../../../../services/moduleService'
import {
  getAllFormEntries, generateId, type FormEntry,
} from '../../../../../lib/database'
import { saveFormEntry, deleteFormEntry } from '../../../../../services/formEntryService'
import { formatDateFull, formatDateNumeric } from '../../../../../lib/dateUtils'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { useToast } from '../../../../../contexts/ToastContext'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import { RatingSelector } from '../../../../ui/RatingSelector'
import { Button } from '../../../../ui/Button'
import { ColumnTimeField } from './ColumnTimeField'
import { styles } from './styles'

const PIP_STEPS_0_100 = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

function buildPipSteps(min: number, max: number, step: number): number[] {
  const steps: number[] = []
  for (let v = min; v <= max; v += step) steps.push(v)
  return steps
}

interface ColumnSpec {
  sectionId: string
  header: ContentField
  children: ContentField[]
}

export interface ColumnFormLayoutProps {
  /** Fields du module (config + colonnes). */
  fields: ContentField[]
  /** Note de bas de page MDR (sources scientifiques) — affichée en mode liste. */
  footer?: ContentField
  /** Identifiant du module — clé de persistance des `form_entries`. */
  moduleId: string
}

export function ColumnFormLayout({ fields, footer, moduleId }: ColumnFormLayoutProps) {
  const t = useModuleTranslation()
  const { showToast } = useToast()
  const { showConfirm } = useConfirmDialog()

  // ── Résolution des champs DB-driven
  const configField = fields.find(f => f.field_type === 'column_form_config')
  const lbl = (key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }
  const requiredKeysProp = configField?.props['required_keys_any'] ?? ''
  const requiredKeysAny = useMemo(
    () => requiredKeysProp.split(',').map(k => k.trim()).filter(Boolean),
    [requiredKeysProp]
  )

  // ── Construction des colonnes (sections triées par sort_order de leur column_header)
  const columns = useMemo<ColumnSpec[]>(() => {
    const headers = fields
      .filter(f => f.field_type === 'column_header' && f.section_id != null)
      .sort((a, b) => a.sort_order - b.sort_order)
    return headers.map(h => ({
      sectionId: h.section_id!,
      header: h,
      children: (h.children ?? []).slice().sort((a, b) => a.sort_order - b.sort_order),
    }))
  }, [fields])

  // ── State
  const [mode, setMode] = useState<'list' | 'entry'>('list')
  const [entries, setEntries] = useState<FormEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string | number>>({})
  const [saving, setSaving] = useState(false)
  // Date de la saisie (saisie rétroactive). Pilotée seulement si `editable_date` activé.
  const [entryDate, setEntryDate] = useState<Date>(() => new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const editableDate = configField?.props['editable_date'] === '1'

  const loadEntries = useCallback(async () => {
    const data = await getAllFormEntries(moduleId)
    setEntries(data)
    setLoading(false)
  }, [moduleId])

  useEffect(() => { loadEntries().catch(() => setLoading(false)) }, [loadEntries])

  const initialValuesForNew = useCallback((): Record<string, string | number> => {
    const init: Record<string, string | number> = {}
    for (const col of columns) {
      for (const child of col.children) {
        const key = child.props['key']
        if (!key) continue
        if (child.field_type === 'column_slider_field') {
          const min = parseInt(child.props['min'] ?? '0', 10)
          const max = parseInt(child.props['max'] ?? '100', 10)
          init[key] = Math.round((min + max) / 2)
        } else {
          init[key] = ''
        }
      }
    }
    return init
  }, [columns])

  const handleNew = useCallback(() => {
    setEditingId(null)
    setValues(initialValuesForNew())
    setEntryDate(new Date())
    setMode('entry')
  }, [initialValuesForNew])

  const handleEdit = useCallback((entry: FormEntry) => {
    const merged = { ...initialValuesForNew(), ...entry.values }
    setEditingId(entry.id)
    setValues(merged)
    setEntryDate(new Date(entry.created_at))
    setMode('entry')
  }, [initialValuesForNew])

  // Capture anti-friction : la dernière saisie sert de base au bouton « comme
  // d'habitude » (le patient reprend ses derniers horaires puis ajuste).
  const lastEntry = useMemo<FormEntry | null>(() => {
    if (entries.length === 0) return null
    return entries.reduce((a, b) => (a.created_at >= b.created_at ? a : b))
  }, [entries])

  const prefillLabel = lbl('prefill_from_last')
  const canPrefill = prefillLabel.length > 0 && editingId === null && lastEntry !== null

  const handlePrefillFromLast = useCallback(() => {
    if (!lastEntry) return
    setValues({ ...initialValuesForNew(), ...lastEntry.values })
  }, [lastEntry, initialValuesForNew])

  const handleOpenDatePicker = useCallback(() => setShowDatePicker(true), [])
  const handleDatePicked = useCallback((_: unknown, picked?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false)
    if (picked) setEntryDate(picked)
  }, [])

  const handleCancelEntry = useCallback(() => {
    setMode('list')
    setEditingId(null)
    setValues({})
  }, [])

  const handleDelete = useCallback((entry: FormEntry) => {
    showConfirm({
      title: lbl('delete_title') || t('common.delete'),
      message: t('common.irreversible'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: async () => {
        await deleteFormEntry(entry.id)
        setEntries(prev => prev.filter(e => e.id !== entry.id))
      },
    })
  }, [lbl, t, showConfirm])

  const handleSave = useCallback(async () => {
    if (requiredKeysAny.length > 0) {
      const ok = requiredKeysAny.some(k => {
        const v = values[k]
        return typeof v === 'string' ? v.trim().length > 0 : v != null
      })
      if (!ok) {
        showToast(lbl('validation_msg') || t('common.error'), 'info')
        return
      }
    }
    setSaving(true)
    try {
      const id = editingId ?? generateId()
      await saveFormEntry({
        id,
        module_id: moduleId,
        values,
        ...(editableDate ? { created_at: entryDate.toISOString() } : {}),
      })
      await loadEntries()
      setMode('list')
      setEditingId(null)
      setValues({})
    } catch {
      showToast(t('common.save_error'), 'error')
    } finally {
      setSaving(false)
    }
  }, [editingId, values, moduleId, requiredKeysAny, editableDate, entryDate, loadEntries, lbl, t, showToast])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  // ── Mode entry
  if (mode === 'entry') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.entryContent}
          keyboardShouldPersistTaps="handled"
        >
          {editableDate ? (
            <Button
              variant="secondary"
              style={styles.entryActionBtn}
              onPress={handleOpenDatePicker}
              iconLeft={<MaterialCommunityIcons name="calendar-outline" size={18} color={colors.primary} />}
              label={`${t('common.entry_date')} : ${formatDateNumeric(entryDate.toISOString())}`}
              testID="entry-date"
            />
          ) : null}
          {showDatePicker ? (
            <DateTimePicker
              value={entryDate}
              mode="date"
              maximumDate={new Date()}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDatePicked}
            />
          ) : null}
          {canPrefill ? (
            <Button
              variant="secondary"
              style={styles.entryActionBtn}
              onPress={handlePrefillFromLast}
              iconLeft={<MaterialCommunityIcons name="history" size={18} color={colors.primary} />}
              label={prefillLabel}
              testID="prefill-from-last"
            />
          ) : null}
          {columns.map((col, idx) => {
            const accent = col.header.props['color'] ?? colors.primary
            const stepNumber = col.header.props['step_number'] ?? String(idx + 1)
            const hintCode = col.header.props['hint_code']
            const titleText = col.header.text_code ? t(col.header.text_code) : ''
            const hintText = hintCode ? t(hintCode) : ''
            return (
              <View
                key={col.sectionId}
                style={[styles.section, { borderLeftColor: accent }]}
                testID={`column-${col.sectionId}`}
              >
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionBadge, { backgroundColor: accent }]}>
                    <Text style={styles.sectionBadgeText}>{stepNumber}</Text>
                  </View>
                  <View style={styles.sectionHeaderText}>
                    {titleText ? <Text style={[styles.sectionTitle, { color: accent }]}>{titleText}</Text> : null}
                    {hintText ? <Text style={styles.sectionHint}>{hintText}</Text> : null}
                  </View>
                </View>
                <View style={styles.sectionBody}>
                  {col.children.map(child => {
                    const key = child.props['key']
                    if (!key) return null
                    const labelOrPlaceholder = child.text_code ? t(child.text_code) : ''
                    if (child.field_type === 'column_text_field') {
                      const multiline = (child.props['multiline'] ?? '1') !== '0'
                      const minHeight = parseInt(child.props['min_height'] ?? (multiline ? '72' : '0'), 10)
                      const value = String(values[key] ?? '')
                      return (
                        <TextInput
                          key={child.id}
                          style={[styles.textInput, multiline && minHeight > 0 && { minHeight }]}
                          placeholder={labelOrPlaceholder}
                          placeholderTextColor={colors.textMuted}
                          value={value}
                          onChangeText={(v) => setValues(prev => ({ ...prev, [key]: v }))}
                          multiline={multiline}
                          textAlignVertical={multiline ? 'top' : 'center'}
                          testID={`field-${key}`}
                        />
                      )
                    }
                    if (child.field_type === 'column_slider_field') {
                      const min = parseInt(child.props['min'] ?? '0', 10)
                      const max = parseInt(child.props['max'] ?? '100', 10)
                      const step = parseInt(child.props['step'] ?? '10', 10)
                      const sliderColor = child.props['color'] ?? accent
                      const steps = (min === 0 && max === 100 && step === 10)
                        ? PIP_STEPS_0_100
                        : buildPipSteps(min, max, step)
                      const numValue = typeof values[key] === 'number' ? (values[key] as number) : Math.round((min + max) / 2)
                      return (
                        <View key={child.id} testID={`slider-${key}`}>
                          <RatingSelector
                            label={labelOrPlaceholder}
                            value={numValue}
                            color={sliderColor}
                            steps={steps}
                            variant="track"
                            showEndLabels
                            onPress={(v) => setValues(prev => ({ ...prev, [key]: v }))}
                          />
                        </View>
                      )
                    }
                    if (child.field_type === 'column_time_field') {
                      const optional = (child.props['optional'] ?? '1') !== '0'
                      const timeValue = typeof values[key] === 'string' ? (values[key] as string) : ''
                      return (
                        <ColumnTimeField
                          key={child.id}
                          fieldKey={key}
                          label={labelOrPlaceholder}
                          value={timeValue}
                          optional={optional}
                          accent={accent}
                          onChange={(next) => setValues(prev => ({ ...prev, [key]: next }))}
                        />
                      )
                    }
                    return null
                  })}
                </View>
              </View>
            )
          })}
        </ScrollView>
        <View style={styles.footer}>
          <Button
            variant="ghost"
            label={t('common.cancel')}
            onPress={handleCancelEntry}
            testID="cancel-entry"
          />
          <Button
            variant="primary"
            style={styles.footerBtnFlex}
            label={lbl('save_label') || t('common.save')}
            loading={saving}
            onPress={handleSave}
            iconLeft={<MaterialCommunityIcons name="content-save-outline" size={20} color={colors.white} />}
            testID="save-entry"
          />
        </View>
      </KeyboardAvoidingView>
    )
  }

  // ── Mode list
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.listContent}
      >
        {entries.length === 0 ? (
          <View style={styles.empty} testID="list-empty">
            <MaterialCommunityIcons name="thought-bubble-outline" size={52} color={colors.border} />
            {lbl('empty_title') ? (
              <Text style={styles.emptyTitle}>{lbl('empty_title')}</Text>
            ) : null}
            {lbl('empty_text') ? (
              <Text style={styles.emptyText}>{lbl('empty_text')}</Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.list}>
            {entries.map(entry => {
              const dateLabel = formatDateFull(entry.created_at)
              return (
                <View key={entry.id} style={styles.recordCard} testID={`record-${entry.id}`}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordDate}>{dateLabel}</Text>
                    <View style={styles.recordActions}>
                      <Button
                        variant="ghost"
                        onPress={() => handleEdit(entry)}
                        iconLeft={<MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />}
                        accessibilityLabel={t('common.modify')}
                        testID={`edit-${entry.id}`}
                      />
                      <Button
                        variant="ghost"
                        onPress={() => handleDelete(entry)}
                        iconLeft={<MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />}
                        accessibilityLabel={t('common.delete')}
                        testID={`delete-${entry.id}`}
                      />
                    </View>
                  </View>
                  {columns.map(col => {
                    const textChildren = col.children.filter(c => c.field_type === 'column_text_field')
                    const sliderChildren = col.children.filter(c => c.field_type === 'column_slider_field')
                    const timeChildren = col.children.filter(c => c.field_type === 'column_time_field')
                    const accent = col.header.props['color'] ?? colors.primary
                    return (
                      <Fragment key={col.sectionId}>
                        {textChildren.map(child => {
                          const key = child.props['key']
                          if (!key) return null
                          const value = entry.values[key]
                          if (typeof value !== 'string' || !value) return null
                          // Trouve un slider associé (intensité/croyance) dans la même colonne pour annoter
                          const slider = sliderChildren[0]
                          const sliderKey = slider?.props['key']
                          const sliderVal = sliderKey ? entry.values[sliderKey] : null
                          return (
                            <View key={child.id} style={styles.recordRow}>
                              <View style={[styles.recordDot, { backgroundColor: accent }]} />
                              <Text style={styles.recordText} numberOfLines={2}>
                                {value}
                                {typeof sliderVal === 'number' ? (
                                  <Text style={styles.recordIntensity}> ({sliderVal}%)</Text>
                                ) : null}
                              </Text>
                            </View>
                          )
                        })}
                        {timeChildren.map(child => {
                          const key = child.props['key']
                          if (!key) return null
                          const value = entry.values[key]
                          if (typeof value !== 'string' || !value) return null
                          const labelText = child.text_code ? t(child.text_code) : ''
                          return (
                            <View key={child.id} style={styles.recordRow} testID={`record-time-${key}`}>
                              <View style={[styles.recordDot, { backgroundColor: accent }]} />
                              <Text style={styles.recordText} numberOfLines={1}>
                                {labelText ? <Text style={styles.recordIntensity}>{labelText} </Text> : null}
                                {value}
                              </Text>
                            </View>
                          )
                        })}
                      </Fragment>
                    )
                  })}
                </View>
              )
            })}
          </View>
        )}
        {footer != null && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
            <Text style={styles.footerText}>{t(footer.text_code ?? '')}</Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          variant="primary"
          style={styles.footerBtnFlex}
          label={lbl('new_btn_label') || t('common.add')}
          onPress={handleNew}
          iconLeft={<MaterialCommunityIcons name="plus" size={22} color={colors.white} />}
          testID="new-entry"
        />
      </View>
    </View>
  )
}
