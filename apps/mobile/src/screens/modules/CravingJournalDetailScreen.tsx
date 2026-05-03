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
import { useTeen } from '../../hooks/useTeen'
import { TOPIC_VISUAL } from './cravingFicheData'
import { colors, spacing, radius } from '../../theme'
import type { PsyEduBlock, PsyEduSectionKey } from 'shared'

type RouteProps = RouteProp<AppStackParamList, 'CravingJournalDetail'>

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

export default function CravingJournalDetailScreen() {
  const route = useRoute<RouteProps>()
  const { topicId, topicKey } = route.params
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

  const visual = TOPIC_VISUAL[topicKey]
  const title   = i18next.t(`craving_journal.${topicKey}.title`,   { ns: 'psyedu' })
  const tagline = i18next.t(`craving_journal.${topicKey}.summary`, { ns: 'psyedu' })
  const accentColor = visual?.color ?? teenColor('craving_journal') ?? colors.primary

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        {visual && (
          <View style={[styles.header, { backgroundColor: visual.color }]}>
            <View style={styles.iconWrap}>
              <visual.Icon size={44} color={colors.white} />
            </View>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerTagline}>{tagline}</Text>
          </View>
        )}
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
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* En-tête coloré */}
        {visual && (
          <View style={[styles.header, { backgroundColor: visual.color }]}>
            <View style={styles.iconWrap}>
              <visual.Icon size={44} color={colors.white} />
            </View>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerTagline}>{tagline}</Text>
          </View>
        )}

        {/* Point clé — carte flottante */}
        {visual && (
          <View style={styles.keyInsightWrapper}>
            <View style={[styles.keyInsightCard, { borderLeftColor: accentColor }]}>
              <Text style={[styles.keyInsightLabel, { color: accentColor }]}>POINT CLÉ</Text>
              <Text style={styles.keyInsightText}>{visual.keyInsight}</Text>
            </View>
          </View>
        )}

        {/* Blocs de contenu depuis Supabase */}
        <View style={styles.content}>
          {sectionGroups.map((group) => (
            <View key={group.key} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: accentColor }]}>
                {i18next.t(`section.${group.key}`, { ns: 'psyedu' })}
              </Text>
              <PsyEduBlockRenderer blocks={group.blocks} />
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl },
  errorText: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },

  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: 52,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  headerTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },

  keyInsightWrapper: {
    paddingHorizontal: spacing.lg,
    marginTop: -32,
    marginBottom: spacing.md,
  },
  keyInsightCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  keyInsightLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  keyInsightText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 24,
  },

  content: { paddingHorizontal: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  bottomSpacer: { height: 48 },
})
