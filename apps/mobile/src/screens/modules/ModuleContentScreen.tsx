import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppStackParamList } from '../../navigation/AppStack'
import {
  fetchModuleFields,
  fetchPatientModuleConfig,
  type ModuleFieldsResult,
} from '../../services/moduleService'
import { FieldRenderer } from '../../components/ModuleRenderer'
import { useTeen } from '../../hooks/useTeen'
import { useAuthStore } from '../../store/authStore'
import { colors, spacing } from '../../theme'

type Props = NativeStackScreenProps<AppStackParamList, 'ModuleContent'>

const SELF_MANAGED_LAYOUTS = new Set([
  'guided_exercise',
  'editable_steps',
  'timed_tap_exercise',
  'daily_checkin',
  'column_form',
  'tree_selector',
  'sleep_journal',
  'patient_scenario',
])

export default function ModuleContentScreen({ route }: Props) {
  const { moduleType } = route.params
  const { t } = useTranslation()
  const { teenColor } = useTeen()
  const accentColor = teenColor(moduleType)
  const patient = useAuthStore((s) => s.patient)
  const [result, setResult] = useState<ModuleFieldsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [patientConfig, setPatientConfig] = useState<Record<string, unknown> | null | undefined>(undefined)

  useEffect(() => {
    fetchModuleFields(moduleType).then(r => {
      setResult(r)
      setLoading(false)
    })
  }, [moduleType])

  const loadPatientConfig = useCallback(async () => {
    if (!patient) return
    setPatientConfig(await fetchPatientModuleConfig(patient.id, moduleType))
  }, [patient, moduleType])

  useEffect(() => {
    if (result?.preview_kind === 'patient_scenario') {
      void loadPatientConfig()
    }
  }, [result?.preview_kind, loadPatientConfig])

  useFocusEffect(
    useCallback(() => {
      if (result?.preview_kind === 'patient_scenario') {
        void loadPatientConfig()
      }
    }, [result?.preview_kind, loadPatientConfig])
  )

  const isPatientScenario = result?.preview_kind === 'patient_scenario'

  if (loading || (isPatientScenario && patientConfig === undefined)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  // Layouts qui gèrent leur propre scroll / structure — rendu sans ScrollView externe
  if (result != null && SELF_MANAGED_LAYOUTS.has(result.preview_kind)) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <FieldRenderer
          preview_kind={result.preview_kind}
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
        {result != null && result.preview_kind !== 'coming_soon' ? (
          <FieldRenderer
            preview_kind={result.preview_kind}
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
})
