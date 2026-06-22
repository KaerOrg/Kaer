import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator, ScrollView, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import type { PsyEduBlock } from '@kaer/shared'
import { fetchBlocksByTopic } from '../../services/psyeduService'
import { PsyEduBlockRenderer } from '../../components/features/PsyEduBlockRenderer'
import { TeenAccent } from '../../components/features/TeenAccent'
import { useTeen } from '../../hooks/useTeen'
import { colors, spacing } from '../../theme'
import type { AppStackParamList } from '../../navigation/AppStack'

const SECTION_ORDER: Readonly<Record<string, number>> = { why: 0, how: 1, sources: 2 }

function sortBlocks(blocks: readonly PsyEduBlock[]): PsyEduBlock[] {
  return [...blocks].sort((a, b) => {
    const sd = (SECTION_ORDER[a.section_key] ?? 99) - (SECTION_ORDER[b.section_key] ?? 99)
    return sd !== 0 ? sd : a.sort_order - b.sort_order
  })
}

type Props = NativeStackScreenProps<AppStackParamList, 'MotivationalBalanceDetail'>

export default function MotivationalBalanceDetailScreen({ route }: Props) {
  const { topicId } = route.params
  const { t } = useTranslation()
  const { teenColor } = useTeen()
  const accentColor = teenColor('motivational_balance')

  const [blocks, setBlocks] = useState<PsyEduBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchBlocksByTopic(topicId)
      .then(data => { if (!cancelled) setBlocks(sortBlocks(data)) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [topicId])

  if (loading) {
    return (
      <View style={styles.center} testID="mb-detail-loading">
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center} testID="mb-detail-error">
        <Text style={styles.errorText}>
          {t('modules.motivational_balance.content_not_found', { defaultValue: 'Contenu introuvable.' })}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']} testID="mb-detail-screen">
      <TeenAccent color={accentColor} />
      <ScrollView contentContainerStyle={styles.content}>
        <PsyEduBlockRenderer blocks={blocks} accentColor={accentColor ?? colors.primary} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.background, padding: spacing.lg,
  },
  errorText: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
})
