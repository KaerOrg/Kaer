import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { ChevronRight, ChevronLeft } from 'lucide-react-native'
import i18next from 'i18next'
import { useTranslation } from 'react-i18next'
import type { PsyEduTopic, PsyEduBlock } from '@psytool/shared'
import { fetchTopicsByModule, fetchBlocksByTopic } from '../../../../services/psyeduService'
import { PsyEduBlockRenderer } from '../../../PsyEduBlockRenderer'
import { useAuthStore } from '../../../../store/authStore'
import { colors, spacing, radius } from '../../../../theme'
import { resolvePsyEduIcon } from './iconMap'

const SECTION_ORDER: Readonly<Record<string, number>> = { why: 0, how: 1, sources: 2 }

interface Props {
  moduleId: string
}

function localizeKey(key: string, isTeenMode: boolean): string {
  if (isTeenMode && i18next.exists(key, { ns: 'psyedu_teen' })) {
    return i18next.t(key, { ns: 'psyedu_teen' })
  }
  if (i18next.exists(key, { ns: 'psyedu' })) {
    return i18next.t(key, { ns: 'psyedu' })
  }
  return ''
}

function topicTitle(t: PsyEduTopic, isTeenMode: boolean): string {
  return localizeKey(`${t.module_key}.${t.topic_key}.title`, isTeenMode)
}

function topicSummary(t: PsyEduTopic, isTeenMode: boolean): string {
  return localizeKey(`${t.module_key}.${t.topic_key}.summary`, isTeenMode)
}

function sortBlocks(blocks: readonly PsyEduBlock[]): PsyEduBlock[] {
  return [...blocks].sort((a, b) => {
    const sectionDelta = (SECTION_ORDER[a.section_key] ?? 99) - (SECTION_ORDER[b.section_key] ?? 99)
    if (sectionDelta !== 0) return sectionDelta
    return a.sort_order - b.sort_order
  })
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
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => handleSelect(topic)}
                testID={`psyedu-topic-${topic.topic_key}`}
                accessibilityRole="button"
              >
                <View style={styles.rowIcon}>
                  <Icon size={20} color={colors.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{title}</Text>
                  {summary ? (
                    <Text style={styles.rowSummary} numberOfLines={2}>
                      {summary}
                    </Text>
                  ) : null}
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowPressed: { opacity: 0.7 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '18',
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSummary: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
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
