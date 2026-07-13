import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { ChevronRight, ChevronLeft } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import type { PsyEduTopic, PsyEduBlock } from '@kaer/shared'
import { fetchTopicsByModule, fetchBlocksByTopic } from '@services/psyeduService'
import { PsyEduBlockRenderer } from '../../../PsyEduBlockRenderer'
import { useAuthStore } from '../../../../../store/authStore'
import { colors, spacing, radius } from '@theme'
import { resolvePsyEduIcon } from './iconMap'
import { topicTitle, topicSummary, sortBlocks } from './psyeduLocalize'

interface Props {
  moduleId: string
}

export function PsyEduLayout({ moduleId }: Props) {
  const { t } = useTranslation()
  const isTeenMode = useAuthStore(s => s.teenMode)

  const [topics, setTopics] = useState<readonly PsyEduTopic[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedTopic, setSelectedTopic] = useState<PsyEduTopic | null>(null)
  const [blocks, setBlocks] = useState<readonly PsyEduBlock[]>([])
  const [blocksLoading, setBlocksLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const list = await fetchTopicsByModule(moduleId)
        if (!cancelled) setTopics(list)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [moduleId])

  const handleSelect = useCallback(async (topic: PsyEduTopic) => {
    setSelectedTopic(topic)
    setBlocks([])
    setBlocksLoading(true)
    try {
      const data = await fetchBlocksByTopic(topic.id)
      setBlocks(sortBlocks(data))
    } finally {
      setBlocksLoading(false)
    }
  }, [])

  const handleBack = useCallback(() => {
    setSelectedTopic(null)
    setBlocks([])
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (selectedTopic) {
    const Icon = resolvePsyEduIcon(selectedTopic.icon_name)
    const title = topicTitle(selectedTopic, isTeenMode)
    const summary = topicSummary(selectedTopic, isTeenMode)
    return (
      <View style={styles.container} testID="psyedu-detail">
        <View style={styles.detailHeader}>
          <Pressable onPress={handleBack} hitSlop={8} testID="psyedu-back" accessibilityRole="button">
            <ChevronLeft size={22} color={colors.text} />
          </Pressable>
          <View style={styles.detailIcon}>
            <Icon size={20} color={colors.primary} />
          </View>
          <Text style={styles.detailTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.detailContent}>
          {/* Bandeau d'intro teinté : grande tuile d'icône + titre + phrase d'accroche. */}
          <View style={styles.introBanner}>
            <View style={styles.introIcon}>
              <Icon size={28} color={colors.primary} />
            </View>
            <Text style={styles.introTitle}>{title}</Text>
            {summary ? <Text style={styles.introText}>{summary}</Text> : null}
          </View>
          {blocksLoading ? (
            <ActivityIndicator color={colors.primary} testID="psyedu-blocks-loading" />
          ) : (
            <PsyEduBlockRenderer blocks={blocks} accentColor={colors.primary} />
          )}
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.container} testID="psyedu-list">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.listContent}>
        {topics.length === 0 ? (
          <View style={styles.empty} testID="psyedu-empty">
            <Text style={styles.emptyText}>{t('common.no_entries_yet')}</Text>
          </View>
        ) : (
          topics.map(topic => {
            const Icon = resolvePsyEduIcon(topic.icon_name)
            const title = topicTitle(topic, isTeenMode)
            const summary = topicSummary(topic, isTeenMode)
            return (
              <Pressable
                key={topic.id}
                style={({ pressed }) => [styles.card, pressed && styles.rowPressed]}
                onPress={() => handleSelect(topic)}
                testID={`psyedu-topic-${topic.topic_key}`}
                accessibilityRole="button"
              >
                <View style={styles.cardTop}>
                  <View style={styles.rowIcon}>
                    <Icon size={22} color={colors.primary} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{title}</Text>
                    {summary ? (
                      <Text style={styles.rowSummary} numberOfLines={2}>
                        {summary}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.readLink}>{t('common.read_sheet')}</Text>
                  <ChevronRight size={16} color={colors.primary} />
                </View>
              </Pressable>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  // ── List
  listContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg },
  empty: { alignItems: 'center', paddingVertical: spacing.xl * 2 },
  emptyText: { fontSize: 14, color: colors.textMuted },
  // Carte de fiche : tuile d'icône teintée + titre + résumé, pied « Lire la fiche → ».
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm,
  },
  readLink: { fontSize: 13, fontWeight: '700', color: colors.primary },
  rowPressed: { opacity: 0.7 },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '18',
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  rowSummary: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  // ── Bandeau d'intro (lecture de fiche)
  introBanner: {
    backgroundColor: colors.primary + '14',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  introIcon: {
    width: 52, height: 52, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card, marginBottom: spacing.xs,
  },
  introTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  introText: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },
  // ── Detail
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '18',
  },
  detailTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  detailContent: { padding: spacing.md, paddingBottom: spacing.xl },
})
