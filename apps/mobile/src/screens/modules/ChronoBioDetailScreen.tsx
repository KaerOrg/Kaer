import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, RouteProp } from '@react-navigation/native'
import i18next from 'i18next'
import { useTranslation } from 'react-i18next'
import { AppStackParamList } from '../../navigation/AppStack'
import { fetchBlocksByTopic } from '../../services/psyeduService'
import { PsyEduBlockRenderer } from '../../components/PsyEduBlockRenderer'
import { TeenAccent } from '../../components/TeenAccent'
import { useTeen } from '../../hooks/useTeen'
import { colors, spacing } from '../../theme'
import type { PsyEduBlock, PsyEduSectionKey } from 'shared'

type RouteProps = RouteProp<AppStackParamList, 'ChronoBioDetail'>

const SECTION_ORDER: Record<PsyEduSectionKey, number> = { why: 0, how: 1, sources: 2 }

interface SectionGroup {
  key: PsyEduSectionKey
  blocks: PsyEduBlock[]
}

function groupAndSort(blocks: readonly PsyEduBlock[]): SectionGroup[] {
  const map = new Map<PsyEduSectionKey, PsyEduBlock[]>()
  for (const block of blocks) {
    const key = block.section_key as PsyEduSectionKey
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(block)
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => a.sort_order - b.sort_order)
  }
  return [...map.entries()]
    .sort(([a], [b]) => (SECTION_ORDER[a] ?? 99) - (SECTION_ORDER[b] ?? 99))
    .map(([key, blks]) => ({ key, blocks: blks }))
}

export default function ChronoBioDetailScreen() {
  const route = useRoute<RouteProps>()
  const { topicId } = route.params
  const { t } = useTranslation()
  const { teenColor } = useTeen()

  const [sectionGroups, setSectionGroups] = useState<SectionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchBlocksByTopic(topicId)
      .then((blocks) => {
        if (!active) return
        setSectionGroups(groupAndSort(blocks))
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError(t('common.error'))
        setLoading(false)
      })
    return () => { active = false }
  }, [topicId, t])

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <TeenAccent color={teenColor('chronobiology_tracker')} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sectionGroups.map((group) => (
          <View key={group.key} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {i18next.t(`section.${group.key}`, { ns: 'psyedu' })}
            </Text>
            <PsyEduBlockRenderer blocks={group.blocks} />
          </View>
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  scrollContent: { padding: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  bottomSpacer: { height: 40 },
})
