import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppStackParamList } from '../../../navigation/AppStack'
import {
  fetchModuleFields,
  type ModuleFieldsResult,
  type PreviewKind,
} from '@services/moduleService'
import { getPlanItems } from '@services/planItemService'
import { hasSetupFallback, resolveInitialPreviewKind } from './initialPreviewKind'
import { moduleQueries } from '../../../hooks/queries'
import { useRefreshOnFocus } from '../../../hooks/useRefreshOnFocus'
import { FieldRenderer } from '../../../components/features/ModuleRenderer'
import { TeenAccent } from '../../../components/features/TeenAccent'
import { useTeen } from '../../../hooks/useTeen'
import { useAuthStore } from '../../../store/authStore'
import { colors, spacing } from '@theme'

type Props = NativeStackScreenProps<AppStackParamList, 'ModuleContent'>

const SELF_MANAGED_LAYOUTS = new Set([
  'guided_exercise',
  'editable_steps',
  'safety_plan',
  'daily_checkin',
  'column_form',
  'tree_selector',
  'sleep_journal',
  'activity_log',
  'exposure_tracker',
  'decision_grid',
  'patient_scenario',
  'psyedu',
  'psyedu_library',
  'tabbed',
  'chrono_month',
  'breathing_pacer',
])

// Layouts qui ont besoin de la config patient (patient_modules.config).
// column_form : groupes de colonnes optionnelles activés par le praticien
// (config.enabled_groups, ex. « examen des preuves » sur beck_columns).
const CONFIG_LAYOUTS = new Set(['patient_scenario', 'psyedu_library', 'column_form'])

export default function ModuleContentScreen({ route, navigation }: Props) {
  const { moduleType, previewKindOverride } = route.params
  const { t } = useTranslation()
  const { teenColor } = useTeen()

  useEffect(() => {
    navigation.setOptions({ title: t(`modules.${moduleType}.label`) })
  }, [moduleType, t, navigation])
  const accentColor = teenColor(moduleType)
  const patient = useAuthStore((s) => s.patient)
  const [result, setResult] = useState<ModuleFieldsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  // Bascule « config-first quand vide » : `null` tant que l'état du plan n'est pas connu.
  const [hasEntries, setHasEntries] = useState<boolean | null>(null)

  const loadFields = useCallback(() => {
    setLoading(true)
    setLoadError(false)
    fetchModuleFields(moduleType)
      .then(r => {
        setResult(r)
        setLoading(false)
      })
      .catch(() => {
        setLoadError(true)
        setLoading(false)
      })
  }, [moduleType])

  useEffect(() => {
    loadFields()
  }, [loadFields])

  // Ouverture nue (sans override) d'un layout à setup-fallback (ex. safety_plan) :
  // on route vers le paramétrage tant que le plan est vide. Un override explicite (roue
  // crantée → édition, retour consultation) court-circuite toujours cette bascule.
  const baseKind = result?.preview_kind
  const setupFallbackKind =
    previewKindOverride == null && baseKind != null && hasSetupFallback(baseKind) ? baseKind : null
  const needsEntryCheck = setupFallbackKind != null

  // Lecture FRAÎCHE de l'état du plan à chaque montage (comme les layouts safety_plan /
  // editable_steps) : évite un cache périmé qui rouvrirait le paramétrage après une
  // première saisie. Décision prise AVANT le rendu → pas de clignotement.
  useEffect(() => {
    if (!needsEntryCheck) return
    let active = true
    getPlanItems(moduleType)
      .then(items => { if (active) setHasEntries(items.length > 0) })
      // Lecture impossible : garder la consultation nominale (dégradation gracieuse,
      // comme les layouts qui restent sur les étapes vides + numéros d'urgence).
      .catch(() => { if (active) setHasEntries(true) })
    return () => { active = false }
  }, [needsEntryCheck, moduleType])

  // Layout effectif : override > bascule setup-fallback > preview_kind du module.
  const previewKind: PreviewKind | undefined =
    previewKindOverride ??
    (setupFallbackKind != null
      ? (hasEntries == null ? undefined : resolveInitialPreviewKind(setupFallbackKind, hasEntries))
      : baseKind)
  const needsConfig = previewKind != null && CONFIG_LAYOUTS.has(previewKind)

  // Config patient : seulement pour les layouts de CONFIG_LAYOUTS, rafraîchie au focus.
  // (fetchModuleFields a son propre cache service ; seule cette config y échappe.)
  const patientConfigQuery = useQuery({
    ...moduleQueries.patientModuleConfig(patient?.id, moduleType),
    enabled: needsConfig && patient != null,
  })
  const patientConfig: Record<string, unknown> | null | undefined =
    needsConfig ? (patientConfigQuery.isSuccess ? patientConfigQuery.data : undefined) : undefined

  const refetchPatientConfig = useCallback(() => {
    if (needsConfig) void patientConfigQuery.refetch()
  }, [needsConfig, patientConfigQuery])
  useRefreshOnFocus(refetchPatientConfig)

  if (loading || (needsEntryCheck && hasEntries == null) || (needsConfig && patientConfig === undefined)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('common.load_error')}</Text>
        <Pressable style={styles.retryBtn} onPress={loadFields}>
          <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
        </Pressable>
      </View>
    )
  }

  // Layouts qui gèrent leur propre scroll / structure — rendu sans ScrollView externe.
  // Le bandeau disclaimer est rendu par FieldRenderer (field `disclaimer_banner`) — ne
  // pas le dupliquer ici.
  if (result != null && previewKind != null && SELF_MANAGED_LAYOUTS.has(previewKind)) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <TeenAccent color={accentColor} />
        <FieldRenderer
          preview_kind={previewKind}
          fields={result.fields}
          accentColor={accentColor}
          moduleId={moduleType}
          patientConfig={patientConfig ?? null}
        />
      </SafeAreaView>
    )
  }

  const description = t(`module.${moduleType}.description`, { defaultValue: '' })

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
        {result != null && previewKind != null && previewKind !== 'coming_soon' ? (
          <FieldRenderer
            preview_kind={previewKind}
            fields={result.fields}
            accentColor={accentColor}
          />
        ) : (
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonText}>{t('home.coming_soon')}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: colors.background },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  content:         { padding: spacing.lg, paddingBottom: spacing.xl },
  description:     { fontSize: 14, color: colors.textMuted, lineHeight: 22, marginBottom: spacing.lg },
  comingSoon:      { alignItems: 'center', paddingVertical: spacing.xl },
  comingSoonText:  { fontSize: 15, color: colors.textMuted },
  errorText:       { fontSize: 15, color: colors.textMuted, marginBottom: spacing.lg, textAlign: 'center', paddingHorizontal: spacing.xl },
  retryBtn:        { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.primary, borderRadius: 8 },
  retryBtnText:    { color: colors.white, fontWeight: '600' },
})
