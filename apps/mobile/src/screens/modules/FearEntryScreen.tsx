import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {
  getAllFearSituations,
  getFearEntry,
  saveFearEntry,
  generateId,
  COPING_STRATEGIES,
  serializeStrategies,
  deserializeStrategies,
  type FearEntry,
  type FearSituation,
  type CopingStrategy,
} from '../../lib/database'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from 'react-i18next'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius } from '../../theme'
import { PipPicker } from '../../components/PipPicker'

type Nav = NativeStackNavigationProp<AppStackParamList>
type Route = RouteProp<AppStackParamList, 'FearEntry'>

// ─── Curseur SUDs 0–100 ───────────────────────────────────────────────────────
// Chiffre brut uniquement — aucun label interprétatif (conformité MDR 2017/745)

interface SudsPickerProps {
  label: string
  hint?: string
  value: number | null
  accentColor?: string
  nullable?: boolean
  onChange: (v: number | null) => void
}

function SudsPicker({ label, hint, value, accentColor = colors.primary, nullable = false, onChange }: SudsPickerProps) {
  const { t } = useTranslation()
  const steps = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

  return (
    <View style={pickerStyles.container}>
      <View style={pickerStyles.header}>
        <View style={pickerStyles.headerLeft}>
          <Text style={pickerStyles.label}>{label}</Text>
          {hint && <Text style={pickerStyles.hint}>{hint}</Text>}
        </View>
        <View style={pickerStyles.valueBox}>
          {value === null ? (
            <Text style={pickerStyles.valueNull}>—</Text>
          ) : (
            <Text style={[pickerStyles.value, { color: accentColor }]}>{value}</Text>
          )}
          <Text style={pickerStyles.valueMax}>/100</Text>
        </View>
      </View>

      <PipPicker
        value={value}
        steps={steps}
        color={accentColor}
        label={label}
        variant="numbered"
        showHeader={false}
        onPress={onChange}
      />

      {nullable && (
        <Pressable
          style={pickerStyles.skipBtn}
          onPress={() => onChange(null)}
          accessibilityRole="button"
          accessibilityLabel={t('modules.fear_thermometer.suds_skip_later')}
        >
          <Text style={[pickerStyles.skipText, value === null && { color: accentColor, fontWeight: '700' }]}>
            {value === null ? t('modules.fear_thermometer.suds_skip_null') : t('modules.fear_thermometer.suds_skip_later')}
          </Text>
        </Pressable>
      )}
    </View>
  )
}

const pickerStyles = StyleSheet.create({
  container: { gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1, gap: 2 },
  label: { fontSize: 14, fontWeight: '700', color: colors.text },
  hint: { fontSize: 12, color: colors.textMuted },
  valueBox: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  value: { fontSize: 22, fontWeight: '800' },
  valueNull: { fontSize: 22, fontWeight: '800', color: colors.textMuted },
  valueMax: { fontSize: 12, color: colors.textMuted },
skipBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  skipText: { fontSize: 12, color: colors.textMuted, textDecorationLine: 'underline' },
})

// ─── Sélecteur de situation ───────────────────────────────────────────────────

interface SituationPickerProps {
  situations: FearSituation[]
  selectedId: string | null
  freeText: string
  onSelectId: (id: string | null) => void
  onChangeFreeText: (text: string) => void
}

function SituationPicker({ situations, selectedId, freeText, onSelectId, onChangeFreeText }: SituationPickerProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'catalogue' | 'free'>(situations.length > 0 ? 'catalogue' : 'free')

  useEffect(() => {
    if (selectedId) setMode('catalogue')
  }, [selectedId])

  return (
    <View style={sitStyles.container}>
      <Text style={sitStyles.label}>{t('modules.fear_thermometer.section_trigger')}</Text>

      {/* Toggle catalogue / texte libre */}
      <View style={sitStyles.toggle}>
        {situations.length > 0 && (
          <Pressable
            style={[sitStyles.toggleBtn, mode === 'catalogue' && sitStyles.toggleBtnActive]}
            onPress={() => { setMode('catalogue'); onChangeFreeText('') }}
          >
            <Text style={[sitStyles.toggleText, mode === 'catalogue' && sitStyles.toggleTextActive]}>
              {t('modules.fear_thermometer.situation_mode_catalogue')}
            </Text>
          </Pressable>
        )}
        <Pressable
          style={[sitStyles.toggleBtn, mode === 'free' && sitStyles.toggleBtnActive]}
          onPress={() => { setMode('free'); onSelectId(null) }}
        >
          <Text style={[sitStyles.toggleText, mode === 'free' && sitStyles.toggleTextActive]}>
            {t('modules.fear_thermometer.situation_mode_free')}
          </Text>
        </Pressable>
      </View>

      {mode === 'catalogue' ? (
        <View style={sitStyles.list}>
          {situations.map((s) => (
            <Pressable
              key={s.id}
              style={[sitStyles.item, selectedId === s.id && sitStyles.itemSelected]}
              onPress={() => onSelectId(s.id === selectedId ? null : s.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedId === s.id }}
            >
              <MaterialCommunityIcons
                name={selectedId === s.id ? 'radiobox-marked' : 'radiobox-blank'}
                size={16}
                color={selectedId === s.id ? colors.primary : colors.textMuted}
              />
              <Text
                style={[sitStyles.itemLabel, selectedId === s.id && sitStyles.itemLabelSelected]}
                numberOfLines={2}
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
          {situations.length === 0 && (
            <Text style={sitStyles.empty}>{t('modules.fear_thermometer.situation_catalogue_empty')}</Text>
          )}
        </View>
      ) : (
        <TextInput
          style={sitStyles.input}
          placeholder={t('modules.fear_thermometer.situation_free_placeholder')}
          placeholderTextColor={colors.textMuted}
          value={freeText}
          onChangeText={onChangeFreeText}
          multiline
          numberOfLines={2}
          testID="situation-free-input"
        />
      )}
    </View>
  )
}

const sitStyles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: { fontSize: 14, fontWeight: '700', color: colors.text },
  toggle: { flexDirection: 'row', gap: spacing.xs },
  toggleBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  toggleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText: { fontSize: 13, color: colors.textMuted },
  toggleTextActive: { color: colors.white, fontWeight: '600' },
  list: { gap: spacing.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  itemSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '0F' },
  itemLabel: { flex: 1, fontSize: 14, color: colors.text },
  itemLabelSelected: { color: colors.primary, fontWeight: '600' },
  empty: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    textAlignVertical: 'top',
    minHeight: 64,
  },
})

// ─── Sélecteur de stratégies ──────────────────────────────────────────────────

interface StrategyPickerProps {
  selected: CopingStrategy[]
  custom: string
  onChangeSelected: (s: CopingStrategy[]) => void
  onChangeCustom: (s: string) => void
}

function StrategyPicker({ selected, custom, onChangeSelected, onChangeCustom }: StrategyPickerProps) {
  const { t } = useTranslation()
  const toggle = (strategy: CopingStrategy) => {
    if (selected.includes(strategy)) {
      onChangeSelected(selected.filter((s) => s !== strategy))
    } else {
      onChangeSelected([...selected, strategy])
    }
  }

  return (
    <View style={stratStyles.container}>
      <Text style={stratStyles.label}>{t('modules.fear_thermometer.strategies_label')}</Text>
      <Text style={stratStyles.hint}>{t('modules.fear_thermometer.strategies_hint')}</Text>

      <View style={stratStyles.chips}>
        {COPING_STRATEGIES.map((strategy) => {
          const active = selected.includes(strategy)
          return (
            <Pressable
              key={strategy}
              style={[stratStyles.chip, active && stratStyles.chipActive]}
              onPress={() => toggle(strategy)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={strategy}
            >
              {active && (
                <MaterialCommunityIcons name="check" size={13} color={colors.primary} />
              )}
              <Text style={[stratStyles.chipText, active && stratStyles.chipTextActive]}>
                {strategy}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <TextInput
        style={stratStyles.input}
        placeholder={t('modules.fear_thermometer.strategy_custom_placeholder')}
        placeholderTextColor={colors.textMuted}
        value={custom}
        onChangeText={onChangeCustom}
        testID="custom-strategy-input"
      />
    </View>
  )
}

const stratStyles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: { fontSize: 14, fontWeight: '700', color: colors.text },
  hint: { fontSize: 12, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '14' },
  chipText: { fontSize: 13, color: colors.textMuted },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
})

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.container}>
      <View style={sectionStyles.header}>
        <View style={sectionStyles.dot} />
        <Text style={sectionStyles.title}>{title}</Text>
      </View>
      <View style={sectionStyles.body}>{children}</View>
    </View>
  )
}

const sectionStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  title: { fontSize: 13, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  body: { padding: spacing.md },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function FearEntryScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const entryId = route.params?.entryId
  const isEdit = !!entryId

  const userId = useAuthStore()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  const [situations, setSituations] = useState<FearSituation[]>([])
  const [situationId, setSituationId] = useState<string | null>(null)
  const [situationFreeText, setSituationFreeText] = useState('')
  const [sudsBefore, setSudsBefore] = useState<number>(50)
  const [selectedStrategies, setSelectedStrategies] = useState<CopingStrategy[]>([])
  const [customStrategy, setCustomStrategy] = useState('')
  const [sudsAfter, setSudsAfter] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  // Chargement initial : catalogue + entrée existante si mode édition
  useEffect(() => {
    async function load() {
      const [sits, existing] = await Promise.all([
        getAllFearSituations(),
        isEdit ? getFearEntry(entryId!) : Promise.resolve(null),
      ])
      setSituations(sits)

      if (existing) {
        setSituationId(existing.situation_id)
        setSituationFreeText(existing.situation_id ? '' : existing.situation_label)
        setSudsBefore(existing.suds_before)
        const { selected, custom } = deserializeStrategies(existing.strategies)
        setSelectedStrategies(selected)
        setCustomStrategy(custom)
        setSudsAfter(existing.suds_after)
        setNotes(existing.notes ?? '')
      }
      setLoading(false)
    }
    load()
  }, [entryId, isEdit])

  // Résolution du libellé de situation
  const resolvedSituationLabel = useCallback((): string | null => {
    if (situationId) {
      return situations.find((s) => s.id === situationId)?.label ?? null
    }
    return situationFreeText.trim() || null
  }, [situationId, situations, situationFreeText])

  const handleSave = useCallback(async () => {
    const label = resolvedSituationLabel()
    if (!label) {
      Alert.alert(t('modules.fear_thermometer.situation_missing'), t('modules.fear_thermometer.situation_missing_msg'))
      return
    }

    setSaving(true)
    try {
      const entry: Omit<FearEntry, 'created_at'> = {
        id: isEdit ? entryId! : generateId(),
        date: new Date().toISOString().slice(0, 10),
        situation_id: situationId,
        situation_label: label,
        suds_before: sudsBefore,
        strategies: serializeStrategies(selectedStrategies, customStrategy.trim() || null),
        custom_strategy: customStrategy.trim() || null,
        suds_after: sudsAfter,
        notes: notes.trim() || null,
      }

      await saveFearEntry(entry)

      // Signal d'observance anonymisé — aucune donnée clinique
      try {
        await supabase.from('patient_engagement_logs').insert({
          patient_id: userId,
          event_type: 'SAVE_FEAR_ENTRY',
          metadata: { module: 'fear_thermometer' },
        })
      } catch {
        // Signal non critique, erreur ignorée
      }

      Alert.alert(
        isEdit ? t('modules.fear_thermometer.saved_updated') : t('common.saved'),
        isEdit ? t('modules.fear_thermometer.saved_updated_msg') : t('modules.fear_thermometer.saved_new_msg'),
      )
      navigation.goBack()
    } catch {
      Alert.alert(t('common.error'), t('modules.fear_thermometer.save_error_msg'))
    } finally {
      setSaving(false)
    }
  }, [
    resolvedSituationLabel, situationId, sudsBefore, selectedStrategies,
    customStrategy, sudsAfter, notes, isEdit, entryId, userId, navigation,
  ])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* 1. Situation */}
        <Section title={t('modules.fear_thermometer.section_trigger')}>
          <SituationPicker
            situations={situations}
            selectedId={situationId}
            freeText={situationFreeText}
            onSelectId={setSituationId}
            onChangeFreeText={(v) => { setSituationFreeText(v); setSituationId(null) }}
          />
        </Section>

        {/* 2. SUDs avant */}
        <Section title={t('modules.fear_thermometer.section_before')}>
          <SudsPicker
            label={t('modules.fear_thermometer.suds_before')}
            hint={t('modules.fear_thermometer.suds_hint_before')}
            value={sudsBefore}
            accentColor="#EF4444"
            onChange={(v) => setSudsBefore(v ?? 0)}
          />
        </Section>

        {/* 3. Stratégies */}
        <Section title={t('modules.fear_thermometer.section_strategies')}>
          <StrategyPicker
            selected={selectedStrategies}
            custom={customStrategy}
            onChangeSelected={setSelectedStrategies}
            onChangeCustom={setCustomStrategy}
          />
        </Section>

        {/* 4. SUDs après — optionnel */}
        <Section title={t('modules.fear_thermometer.section_after')}>
          <SudsPicker
            label={t('modules.fear_thermometer.suds_after')}
            hint={t('modules.fear_thermometer.suds_hint_after')}
            value={sudsAfter}
            accentColor="#059669"
            nullable
            onChange={setSudsAfter}
          />
        </Section>

        {/* 5. Notes libres */}
        <Section title={t('modules.fear_thermometer.section_notes')}>
          <TextInput
            style={styles.notesInput}
            placeholder={t('modules.fear_thermometer.notes_placeholder')}
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            testID="notes-input"
          />
        </Section>

      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={isEdit ? t('common.update') : t('modules.fear_thermometer.save')}
          testID="save-button"
        >
          {saving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="thermometer-check" size={20} color={colors.white} />
              <Text style={styles.saveBtnText}>{isEdit ? t('common.update') : t('modules.fear_thermometer.save')}</Text>
            </>
          )}
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 72,
    textAlignVertical: 'top',
  },
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
