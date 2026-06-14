import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react-native'
import i18next from 'i18next'
import { useTranslation } from 'react-i18next'
import type { PsyEduTopic, PsyEduBlock, PsyEduTheme } from '@psytool/shared'
import {
  fetchTopicsByIds,
  fetchThemes,
  fetchBlocksByTopic,
  markTopicRead,
} from '../../../../../services/psyeduService'
import { PsyEduBlockRenderer } from '../../../PsyEduBlockRenderer'
import { useAuthStore } from '../../../../../store/authStore'
import { colors, spacing, radius } from '../../../../../theme'
import { resolvePsyEduIcon } from '../PsyEdu/iconMap'
import { topicTitle, topicSummary, sortBlocks } from '../PsyEdu/psyeduLocalize'

interface UnlockedTopicEntry {
  topic_id: string
  is_read: boolean
  unlocked_at: string
}

interface Props {
  patientConfig: Record<string, unknown> | null
}

function readUnlocked(config: Record<string, unknown> | null): UnlockedTopicEntry[] {
  const raw = (config as { unlocked_topics?: UnlockedTopicEntry[] } | null)?.unlocked_topics
  return Array.isArray(raw) ? raw : []
}

function themeLabel(themeId: string): string {
  const key = `theme.${themeId}`
  return i18next.exists(key, { ns: 'psyedu' }) ? i18next.t(key, { ns: 'psyedu' }) : ''
}

export function PsyEduLibraryLayout({ patientConfig }: Props) {
  const { t } = useTranslation()
  const isTeenMode = useAuthStore(s => s.teenMode)
  const patient = useAuthStore(s => s.patient)

  const unlocked = useMemo(() => readUnlocked(patientConfig), [patientConfig])

  const [topics, setTopics] = useState<readonly PsyEduTopic[]>([])
  const [themes, setThemes] = useState<readonly PsyEduTheme[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const [selectedTopic, setSelectedTopic] = useState<PsyEduTopic | null>(null)
  const [blocks, setBlocks] = useState<readonly PsyEduBlock[]>([])
  const [blocksLoading, setBlocksLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const ids = unlocked.map(u => u.topic_id)
        const [topicList, themeList] = await Promise.all([fetchTopicsByIds(ids), fetchThemes()])
        if (cancelled) return
        setTopics(topicList)
        setThemes(themeList)
        setReadIds(new Set(unlocked.filter(u => u.is_read).map(u => u.topic_id)))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [unlocked])

  const grouped = useMemo(() => {
    return themes
      .map(theme => ({
        theme,
        topics: topics.filter(tp => tp.theme_id === theme.id),
      }))
      .filter(group => group.topics.length > 0)
  }, [themes, topics])

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

  const handleMarkRead = useCallback(async (topicId: string) => {
    if (!patient) return
    setReadIds(prev => new Set(prev).add(topicId))
    await markTopicRead(patient.id, topicId)
  }, [patient])

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
    const isRead = readIds.has(selectedTopic.id)
    return (
      <View style={styles.container} testID="psyedu-library-detail">
        <View style={styles.detailHeader}>
          <Pressable onPress={handleBack} hitSlop={8} testID="psyedu-library-back" accessibilityRole="button">
            <ChevronLeft size={22} color={colors.text} />
          </Pressable>
          <View style={styles.detailIcon}>
            <Icon size={20} color={colors.primary} />
          </View>
          <Text style={styles.detailTitle} numberOfLines={2}>{title}</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.detailContent}>
          {blocksLoading ? (
            <ActivityIndicator color={colors.primary} testID="psyedu-library-blocks-loading" />
          ) : (
            <>
              <PsyEduBlockRenderer blocks={blocks} accentColor={colors.primary} />
              {isRead ? (
                <View style={styles.readDone} testID="psyedu-library-read-done">
                  <CheckCircle2 size={18} color={colors.success} />
                  <Text style={styles.readDoneText}>{t('modules.psychoeducation.already_read')}</Text>
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.readBtn, pressed && styles.rowPressed]}
                  onPress={() => handleMarkRead(selectedTopic.id)}
                  testID="psyedu-library-mark-read"
                  accessibilityRole="button"
                >
                  <Text style={styles.readBtnText}>{t('modules.psychoeducation.mark_as_read')}</Text>
                </Pressable>
              )}
            </>
          )}
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.container} testID="psyedu-library-list">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.listContent}>
        {grouped.length === 0 ? (
          <View style={styles.empty} testID="psyedu-library-empty">
            <Text style={styles.emptyText}>{t('modules.psychoeducation.empty_text')}</Text>
          </View>
        ) : (
          grouped.map(({ theme, topics: themeTopics }) => (
            <View key={theme.id} style={styles.themeGroup}>
              <Text style={styles.themeTitle}>{themeLabel(theme.id)}</Text>
              {themeTopics.map(topic => {
                const Icon = resolvePsyEduIcon(topic.icon_name)
                const title = topicTitle(topic, isTeenMode)
                const summary = topicSummary(topic, isTeenMode)
                const isRead = readIds.has(topic.id)
                return (
                  <Pressable
                    key={topic.id}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                    onPress={() => handleSelect(topic)}
                    testID={`psyedu-library-topic-${topic.topic_key}`}
                    accessibilityRole="button"
                  >
                    <View style={styles.rowIcon}>
                      <Icon size={20} color={colors.primary} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{title}</Text>
                      {summary ? (
                        <Text style={styles.rowSummary} numberOfLines={2}>{summary}</Text>
                      ) : null}
                    </View>
                    {isRead ? (
                      <CheckCircle2 size={18} color={colors.success} testID={`psyedu-library-read-${topic.topic_key}`} />
                    ) : (
                      <ChevronRight size={18} color={colors.textMuted} />
                    )}
                  </Pressable>
                )
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  listContent: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.lg },
  themeGroup: { gap: spacing.sm },
  themeTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl * 2 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.lg },
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
  readBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  readBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  readDone: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  readDoneText: { color: colors.success, fontWeight: '600', fontSize: 14 },
})
