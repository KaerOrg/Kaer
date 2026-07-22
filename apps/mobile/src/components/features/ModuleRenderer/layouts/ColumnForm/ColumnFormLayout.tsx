// ─── Layout `column_form` — formulaire à colonnes hétérogènes (beck_columns…) ─
//
// Pattern « plusieurs enregistrements par module, chacun = un formulaire à
// champs hétérogènes ». Chaque section_id = une colonne. Chaque colonne
// contient un `column_header` et des champs enfants (`parent_field_id`)
// définissant le widget : `column_text_field`, `column_slider_field` ou
// `column_time_field`. Persistance JSON dans `form_entries`. 2 modes : list | entry.
// Conformité MDR 2017/745 : aucune interprétation, simple journal libre.

import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  View, Text, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { colors } from '@theme'
import { collectIndexed, readEnabledGroups, buildColumnSpecs } from '@kaer/shared'
import type { ContentField } from '@services/moduleService'
import {
  getAllFormEntries, generateId, type FormEntry, type FormValue,
} from '../../../../../lib/database'
import { saveFormEntry, deleteFormEntry } from '@services/formEntryService'
import { formatDateNumeric } from '../../../../../lib/dateUtils'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { useToast } from '../../../../../contexts/ToastContext'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import { Button } from '@ui/Button'
import { ColumnFields } from './ColumnFields'
import { RecordCard, type RecordColumnPart } from './RecordCard'
import { NarrativeRecordCard } from './NarrativeRecordCard'
import { DayTimelineCard } from './DayTimelineCard'
import { ChronoLegend } from './ChronoLegend'
import { isTimelineConfig } from './chronoFrise'
import { WizardProgress } from './WizardProgress'
import { isWizardMode, readNarrativeConfig } from './narrativeConfig'
import { styles } from './styles'

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
  /** Config par patient (`patient_modules.config`) — porte `enabled_groups`. */
  patientConfig?: Record<string, unknown> | null
  /** Couleur d'accent (mode ado / thème module) — barre de progression + CTA wizard. */
  accentColor?: string
}

export function ColumnFormLayout({ fields, footer, moduleId, patientConfig, accentColor }: ColumnFormLayoutProps) {
  const t = useModuleTranslation()
  const { showToast } = useToast()
  const { showConfirm } = useConfirmDialog()
  const accent = accentColor ?? colors.primary

  // ── Résolution des champs DB-driven
  const configField = fields.find(f => f.field_type === 'column_form_config')
  const lbl = (key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }
  const requiredKeysAny = useMemo(
    () => collectIndexed(configField?.props ?? {}, 'required_key'),
    [configField]
  )
  // `complete_key_*` = champs dont l'absence marque la fiche « à compléter »
  // (statut de workflow dérivé, jamais stocké).
  const completeKeys = useMemo(
    () => collectIndexed(configField?.props ?? {}, 'complete_key'),
    [configField]
  )
  // Refonte 1B (#145), OPT-IN : wizard « une question à la fois » et carte récit
  // « avant → après ». Absents des autres modules column_form (scroll + puces).
  const wizard = isWizardMode(configField?.props)
  const narrativeConfig = useMemo(
    () => readNarrativeConfig(configField?.props),
    [configField]
  )

  // ── Construction des colonnes (sections triées par sort_order de leur column_header)
  // Une colonne portant `optional_group` n'apparaît que si le praticien a activé
  // ce groupe pour ce patient (patient_modules.config.enabled_groups).
  const columns = useMemo<ColumnSpec[]>(() => {
    const enabledGroups = readEnabledGroups(patientConfig)
    return buildColumnSpecs(fields)
      .filter(({ header }) => {
        if (header.section_id == null) return false
        const group = header.props['optional_group']
        return !group || enabledGroups.includes(group)
      })
      .map(({ header, children }) => ({ sectionId: header.section_id!, header, children }))
  }, [fields, patientConfig])

  // Découpage des colonnes par type de widget — calculé une fois par module (pas
  // par fiche) et partagé par toutes les cartes de la liste (RecordCard mémoïsée).
  const listColumnParts = useMemo<RecordColumnPart[]>(
    () => columns.map(col => ({
      sectionId: col.sectionId,
      accent: col.header.props['color'] ?? colors.primary,
      headerLabelCode: col.header.text_code,
      textChildren: col.children.filter(c => c.field_type === 'column_text_field'),
      sliderChildren: col.children.filter(c => c.field_type === 'column_slider_field'),
      timeChildren: col.children.filter(c => c.field_type === 'column_time_field'),
    })),
    [columns],
  )

  // Journal chronobiologique : quand toutes les colonnes visibles ne portent que
  // des champs horaires (repères d'ancrage), la liste s'affiche en frise 24 h
  // (une carte-jour + légende figée) au lieu de la liste à puces générique. Les
  // autres modules `column_form` (craving_journal : slider + textes) gardent la
  // carte à puces. Détection structurelle → aucun flag de config à ajouter.
  const isTimeline = useMemo(() => isTimelineConfig(listColumnParts), [listColumnParts])

  // ── State — `entry` = formulaire complet, `list` = historique des fiches
  const [mode, setMode] = useState<'list' | 'entry'>('list')
  const [entries, setEntries] = useState<FormEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  // Fiche dépliée en mode liste (textes intégraux + toutes les valeurs) — une à la fois.
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, FormValue>>({})
  const [saving, setSaving] = useState(false)
  // Étape courante du wizard (mode entry_mode=wizard) — une colonne par étape.
  const [stepIndex, setStepIndex] = useState(0)
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

  // Les curseurs ne sont PAS pré-positionnés : aucune valeur n'est écrite tant
  // que le patient n'a pas touché le curseur (pas de faux « 50 » d'ancrage dans
  // les données ni dans les courbes praticien). Seuls les champs texte/horaire
  // sont initialisés à vide.
  const initialValuesFor = useCallback((cols: ColumnSpec[]): Record<string, FormValue> => {
    const init: Record<string, FormValue> = {}
    for (const col of cols) {
      for (const child of col.children) {
        const key = child.props['key']
        if (!key) continue
        if (child.field_type !== 'column_slider_field') init[key] = ''
      }
    }
    return init
  }, [])

  const handleNew = useCallback(() => {
    setEditingId(null)
    setValues(initialValuesFor(columns))
    setEntryDate(new Date())
    setStepIndex(0)
    setMode('entry')
  }, [initialValuesFor, columns])

  const handleEdit = useCallback((entry: FormEntry) => {
    const merged = { ...initialValuesFor(columns), ...entry.values }
    setEditingId(entry.id)
    setValues(merged)
    setEntryDate(new Date(entry.created_at))
    setStepIndex(0)
    setMode('entry')
  }, [initialValuesFor, columns])

  // Écriture d'une valeur — callback stable partagé par ColumnFields (scroll + wizard).
  const handleChangeValue = useCallback((key: string, value: FormValue) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }, [])

  // Capture anti-friction : la dernière saisie sert de base au bouton « comme
  // d'habitude » (le patient reprend ses derniers horaires puis ajuste).
  const lastEntry = useMemo<FormEntry | null>(() => {
    if (entries.length === 0) return null
    return entries.reduce((a, b) => (a.created_at >= b.created_at ? a : b))
  }, [entries])

  // Préremplissage « comme d'habitude » : uniquement à la création d'une fiche
  // (pas en édition), quand une saisie précédente existe.
  const prefillLabel = lbl('prefill_from_last')
  const canPrefill = prefillLabel.length > 0 && editingId === null && lastEntry !== null

  const handlePrefillFromLast = useCallback(() => {
    if (!lastEntry) return
    setValues({ ...initialValuesFor(columns), ...lastEntry.values })
  }, [lastEntry, initialValuesFor, columns])

  const handleOpenDatePicker = useCallback(() => setShowDatePicker(true), [])
  const handleDatePicked = useCallback((_: unknown, picked?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false)
    if (picked) setEntryDate(picked)
  }, [])

  const handleCancelEntry = useCallback(() => {
    setMode('list')
    setEditingId(null)
    setValues({})
    setStepIndex(0)
  }, [])

  // Navigation wizard : avancer d'une étape / reculer (retour à la liste au 1er pas).
  const handleWizardNext = useCallback(() => {
    setStepIndex(i => Math.min(i + 1, columns.length - 1))
  }, [columns.length])
  const handleWizardBack = useCallback(() => {
    if (stepIndex === 0) handleCancelEntry()
    else setStepIndex(i => i - 1)
  }, [stepIndex, handleCancelEntry])

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
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

  // ── Mode entry : wizard (opt-in) OU scroll complet (défaut) ────────────────
  if (mode !== 'list') {
    // Wizard « une question à la fois » — une colonne visible par étape.
    if (wizard) {
      const step = columns[stepIndex]
      const stepAccent = step?.header.props['color'] ?? accent
      const isLastStep = stepIndex >= columns.length - 1
      const questionCode = step?.header.props['question_code']
      const hintCode = step?.header.props['hint_code']
      const noteCode = step?.header.props['note_code']
      const title = step?.header.text_code ? t(step.header.text_code) : ''
      const question = questionCode ? t(questionCode) : title
      // Refonte 1B : la note (« vous indiquerez juste en dessous à quel point vous y
      // croyez ») introduit le curseur de croyance qui la suit. On rend donc d'abord
      // les champs texte, puis la note, puis les champs restants (curseur/horaire).
      const textChildren = step?.children.filter(c => c.field_type === 'column_text_field') ?? []
      const restChildren = step?.children.filter(c => c.field_type !== 'column_text_field') ?? []
      return (
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={88}
        >
          <WizardProgress
            total={columns.length}
            current={stepIndex}
            accent={accent}
            testID="wizard-progress"
          />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.wizardContent}
            keyboardShouldPersistTaps="handled"
          >
            {step ? (
              <View testID={`column-${step.sectionId}`}>
                <Text style={[styles.wizardOverline, { color: stepAccent }]}>
                  {`${t('common.step')} ${stepIndex + 1} · ${title}`}
                </Text>
                {question ? <Text style={styles.wizardQuestion}>{question}</Text> : null}
                {hintCode ? <Text style={styles.wizardHelp}>{t(hintCode)}</Text> : null}
                <ColumnFields
                  fields={textChildren}
                  values={values}
                  moduleId={moduleId}
                  accent={stepAccent}
                  t={t}
                  onChangeValue={handleChangeValue}
                  accentInputBorder
                />
                {noteCode ? (
                  // Encart d'aide teinté à l'accent de l'étape (fond à 10 %, icône
                  // pleine). L'accent est une couleur de thème fixe de la colonne
                  // (config, identique pour tous les patients) — pas un codage de
                  // gravité clinique piloté par la donnée (MDR 2017/745).
                  <View style={[styles.wizardNote, { backgroundColor: stepAccent + '1A' }]} testID="wizard-note">
                    <MaterialCommunityIcons name="information" size={16} color={stepAccent} />
                    <Text style={[styles.wizardNoteText, { color: stepAccent }]}>{t(noteCode)}</Text>
                  </View>
                ) : null}
                {restChildren.length > 0 ? (
                  <ColumnFields
                    fields={restChildren}
                    values={values}
                    moduleId={moduleId}
                    accent={stepAccent}
                    t={t}
                    onChangeValue={handleChangeValue}
                  />
                ) : null}
              </View>
            ) : null}
          </ScrollView>
          <View style={styles.footer}>
            <Button
              variant="ghost"
              onPress={handleWizardBack}
              iconLeft={<MaterialCommunityIcons name="arrow-left" size={20} color={colors.textMuted} />}
              accessibilityLabel={t('common.back')}
              testID="wizard-back"
            />
            {isLastStep ? (
              <Button
                variant="primary"
                style={[styles.footerBtnFlex, { backgroundColor: accent }]}
                label={lbl('save_label') || t('common.save')}
                loading={saving}
                onPress={handleSave}
                iconLeft={<MaterialCommunityIcons name="content-save-outline" size={20} color={colors.white} />}
                testID="save-entry"
              />
            ) : (
              <Button
                variant="primary"
                style={[styles.footerBtnFlex, { backgroundColor: accent }]}
                label={t('common.continue')}
                onPress={handleWizardNext}
                iconRight={<MaterialCommunityIcons name="arrow-right" size={20} color={colors.white} />}
                testID="wizard-next"
              />
            )}
          </View>
        </KeyboardAvoidingView>
      )
    }

    // Scroll complet (défaut) — toutes les colonnes empilées.
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
          {editableDate || canPrefill ? (
            <View style={styles.entryActionsRow}>
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
              {canPrefill ? (
                <Button
                  variant="secondary"
                  style={styles.entryActionBtn}
                  onPress={handlePrefillFromLast}
                  iconLeft={<MaterialCommunityIcons name="backup-restore" size={18} color={colors.primary} />}
                  label={prefillLabel}
                  testID="prefill-from-last"
                />
              ) : null}
            </View>
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
          {columns.map((col, idx) => {
            const colAccent = col.header.props['color'] ?? colors.primary
            // Numérotation dynamique : position parmi les colonnes VISIBLES
            // (les groupes optionnels changent l'ensemble affiché).
            const stepNumber = String(idx + 1)
            const hintCode = col.header.props['hint_code']
            const titleText = col.header.text_code ? t(col.header.text_code) : ''
            const hintText = hintCode ? t(hintCode) : ''
            return (
              <View
                key={col.sectionId}
                style={[styles.section, { borderLeftColor: colAccent }]}
                testID={`column-${col.sectionId}`}
              >
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionBadge, { backgroundColor: colAccent }]}>
                    <Text style={styles.sectionBadgeText}>{stepNumber}</Text>
                  </View>
                  <View style={styles.sectionHeaderText}>
                    {titleText ? <Text style={[styles.sectionTitle, { color: colAccent }]}>{titleText}</Text> : null}
                    {hintText ? <Text style={styles.sectionHint}>{hintText}</Text> : null}
                  </View>
                </View>
                <View style={styles.sectionBody}>
                  <ColumnFields
                    fields={col.children}
                    values={values}
                    moduleId={moduleId}
                    accent={colAccent}
                    t={t}
                    onChangeValue={handleChangeValue}
                  />
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
  const toCompleteLabel = lbl('to_complete_label')
  const showCompletion = toCompleteLabel.length > 0 && completeKeys.length > 0
  return (
    <View style={styles.container}>
      {isTimeline && entries.length > 0 ? <ChronoLegend t={t} /> : null}
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
            {entries.map(entry =>
              isTimeline ? (
                <DayTimelineCard
                  key={entry.id}
                  entry={entry}
                  expanded={expandedId === entry.id}
                  t={t}
                  onToggleExpand={handleToggleExpand}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ) : narrativeConfig ? (
                <NarrativeRecordCard
                  key={entry.id}
                  entry={entry}
                  columnParts={listColumnParts}
                  config={narrativeConfig}
                  expanded={expandedId === entry.id}
                  showCompletion={showCompletion}
                  completeKeys={completeKeys}
                  toCompleteLabel={toCompleteLabel}
                  t={t}
                  onToggleExpand={handleToggleExpand}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ) : (
                <RecordCard
                  key={entry.id}
                  entry={entry}
                  columnParts={listColumnParts}
                  expanded={expandedId === entry.id}
                  showCompletion={showCompletion}
                  completeKeys={completeKeys}
                  toCompleteLabel={toCompleteLabel}
                  t={t}
                  onToggleExpand={handleToggleExpand}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )
            )}
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
