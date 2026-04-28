import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppStackParamList } from '../../navigation/AppStack'
import { fetchModuleFields, type ModuleFieldsResult } from '../../lib/moduleService'
import { FieldRenderer } from '../../components/ModuleRenderer'
import { colors, spacing } from '../../theme'

type Props = NativeStackScreenProps<AppStackParamList, 'ModuleContent'>

export default function ModuleContentScreen({ route }: Props) {
  const { moduleType } = route.params
  const { t } = useTranslation()
  const [result, setResult] = useState<ModuleFieldsResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchModuleFields(moduleType).then(r => {
      setResult(r)
      setLoading(false)
    })
  }, [moduleType])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  const description = t(`module.${moduleType}.description`, { defaultValue: '' })

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
        {result && result.preview_kind !== 'coming_soon' ? (
          <FieldRenderer preview_kind={result.preview_kind} fields={result.fields} />
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
