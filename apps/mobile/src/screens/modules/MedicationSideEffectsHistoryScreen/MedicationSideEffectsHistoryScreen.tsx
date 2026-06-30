import { useCallback, useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TextInput } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { DimensionTrackerView, type DimensionTrackerConfig } from '../../../components/features/DimensionTrackerView'
import { AppStackParamList } from '../../../navigation/AppStack'
import { colors, spacing, radius } from '@theme'
import { useTeen } from '../../../hooks/useTeen'
import { useAuthStore } from '../../../store/authStore'
import {
  SIDE_EFFECT_CATALOG,
  SIDE_EFFECT_CATALOG_BY_KEY,
  CUSTOM_EFFECT_PALETTE,
  isCustomKey,
  makeCustomKey,
  type TrackedEffect,
} from '../../../lib/sideEffectsCatalog'
import { fetchTrackedEffects, updateTrackedEffects } from '@services/sideEffectsConfigService'

const SCALE_ID = 'medication_side_effects'
const MODULE_COLOR = '#8B5CF6'

type Nav = NativeStackNavigationProp<AppStackParamList>

// Suivi des effets indésirables — coquille du tracker générique multi-dimensions.
// Les effets suivis sont PARAMÉTRABLES par patient (config partagée praticien↔patient
// dans patient_modules.config). On n'affiche que les effets concernés + effets perso.
export default function MedicationSideEffectsHistoryScreen() {
  const navigation = useNavigation<Nav>()
  const { isTeenMode, teenColor } = useTeen()
  const { t } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const accentColor = teenColor(SCALE_ID) ?? MODULE_COLOR
  const patient = useAuthStore(s => s.patient)

  const [tracked, setTracked] = useState<TrackedEffect[]>([])
  const [showConfig, setShowConfig] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const customLabelRef = useRef('')
  const [customDraft, setCustomDraft] = useState('')

  const reload = useCallback(async () => {
    if (!patient?.id) return
    const list = await fetchTrackedEffects(patient.id)
    setTracked(list)
  }, [patient?.id])

  useFocusEffect(useCallback(() => { void reload() }, [reload]))

  // Libellé/couleur résolus pour chaque effet suivi (fixe via i18n+catalogue, perso via config)
  const resolved = useMemo(() => tracked.map(e => {
    if (isCustomKey(e.key) || e.custom) {
      return { key: e.key, label: e.label ?? '', color: e.color ?? accentColor, custom: true }
    }
    const cat = SIDE_EFFECT_CATALOG_BY_KEY[e.key]
    return {
      key: e.key,
      label: cat ? t(`modules.${SCALE_ID}.${cat.dimLabelKey}`) : e.key,
      color: cat?.color ?? accentColor,
      custom: false,
    }
  }), [tracked, t, accentColor])

  const activeEntryEffects = useMemo(
    () => resolved.map(r => ({ key: r.key, label: r.label, color: r.color })),
    [resolved]
  )

  const config: DimensionTrackerConfig = useMemo(() => {
    const dimensionColors: Record<string, string> = {}
    const dimensionLabels: Record<string, string> = {}
    const dimensionChipLabels: Record<string, string> = {}
    for (const r of resolved) {
      dimensionColors[r.key] = r.color
      if (r.custom) {
        dimensionLabels[r.key] = r.label
        dimensionChipLabels[r.key] = r.label
      }
    }
    return {
      scaleId: SCALE_ID,
      moduleColor: MODULE_COLOR,
      yMax: 10,
      ranges: ['7J', '1M', '3M', '1A'],
      dimensionKeys: resolved.map(r => r.key),
      dimensionColors,
      dimensionLabels,
      dimensionChipLabels,
      emptyIcon: 'pill',
      onConfigure: () => setShowConfig(true),
      onNewEntry: () => navigation.navigate('MedicationSideEffectsEntry', { effects: activeEntryEffects }),
      onEditEntry: (entry_id: string) =>
        navigation.navigate('MedicationSideEffectsEntry', { effects: activeEntryEffects, entry_id }),
    }
  }, [resolved, activeEntryEffects, navigation])

  // ── Config modal ──────────────────────────────────────────────────────────
  const trackedKeys = useMemo(() => new Set(tracked.map(e => e.key)), [tracked])

  const persist = useCallback(async (next: TrackedEffect[]) => {
    if (!patient?.id) return
    setTracked(next)
    setSavingConfig(true)
    await updateTrackedEffects(patient.id, next)
    setSavingConfig(false)
  }, [patient?.id])

  const toggleFixed = useCallback((key: string) => {
    const exists = tracked.some(e => e.key === key)
    const next = exists ? tracked.filter(e => e.key !== key) : [...tracked, { key }]
    void persist(next)
  }, [tracked, persist])

  const addCustom = useCallback(() => {
    const label = customLabelRef.current.trim()
    if (label.length === 0) return
    const usedColors = tracked.filter(e => e.color).length
    const color = CUSTOM_EFFECT_PALETTE[usedColors % CUSTOM_EFFECT_PALETTE.length]
    const next: TrackedEffect[] = [...tracked, { key: makeCustomKey(), custom: true, label, color }]
    customLabelRef.current = ''
    setCustomDraft('')
    void persist(next)
  }, [tracked, persist])

  const removeEffect = useCallback((key: string) => {
    void persist(tracked.filter(e => e.key !== key))
  }, [tracked, persist])

  const customEffects = tracked.filter(e => isCustomKey(e.key) || e.custom)

  return (
    <>
      <DimensionTrackerView config={config} />

      <Modal visible={showConfig} transparent animationType="slide" onRequestClose={() => setShowConfig(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t(`modules.${SCALE_ID}.config_title`)}</Text>
              <Pressable onPress={() => setShowConfig(false)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.sheetHint}>{t(`modules.${SCALE_ID}.config_hint`)}</Text>

            <ScrollView style={styles.sheetScroll} contentContainerStyle={{ gap: 6, paddingBottom: spacing.md }}>
              {SIDE_EFFECT_CATALOG.map(cat => {
                const checked = trackedKeys.has(cat.key)
                return (
                  <Pressable key={cat.key} style={styles.row} onPress={() => toggleFixed(cat.key)} accessibilityRole="checkbox" accessibilityState={{ checked }}>
                    <View style={[styles.dot, { backgroundColor: cat.color }]} />
                    <Text style={styles.rowLabel}>{t(`modules.${SCALE_ID}.${cat.dimLabelKey}`)}</Text>
                    <MaterialCommunityIcons
                      name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={22}
                      color={checked ? accentColor : colors.border}
                    />
                  </Pressable>
                )
              })}

              {customEffects.length > 0 && (
                <Text style={styles.sectionLabel}>{t(`modules.${SCALE_ID}.config_custom_title`)}</Text>
              )}
              {customEffects.map(e => (
                <View key={e.key} style={styles.row}>
                  <View style={[styles.dot, { backgroundColor: e.color ?? accentColor }]} />
                  <Text style={styles.rowLabel}>{e.label}</Text>
                  <Pressable onPress={() => removeEffect(e.key)} hitSlop={8} accessibilityLabel={t('common.delete')}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                placeholder={t(`modules.${SCALE_ID}.config_add_placeholder`)}
                placeholderTextColor={colors.textMuted}
                defaultValue={customDraft}
                onChangeText={v => { customLabelRef.current = v }}
                maxLength={40}
                returnKeyType="done"
                onSubmitEditing={addCustom}
              />
              <Pressable style={[styles.addBtn, { backgroundColor: accentColor }]} onPress={addCustom}>
                <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
              </Pressable>
            </View>

            <Pressable style={[styles.doneBtn, { backgroundColor: accentColor }]} onPress={() => setShowConfig(false)} disabled={savingConfig}>
              <Text style={styles.doneBtnText}>{t('common.save')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '85%',
    gap: spacing.sm,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  sheetHint: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  sheetScroll: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowLabel: { flex: 1, fontSize: 14, color: colors.text },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  addBtn: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  doneBtn: { borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: spacing.xs },
  doneBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
})
