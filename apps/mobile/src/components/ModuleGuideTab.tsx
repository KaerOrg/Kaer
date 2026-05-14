import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { fetchTopicsByModule, fetchBlocksByTopic } from '../services/psyeduService'
import { PsyEduBlockRenderer } from './PsyEduBlockRenderer'
import { groupAndSortBlocks, type SectionGroup } from '../utils/psyeduUtils'
import { colors, spacing } from '../theme'
import i18next from 'i18next'

interface Props {
  moduleKey: string
  accentColor?: string
}

export function ModuleGuideTab({ moduleKey, accentColor }: Props) {
  const { t } = useTranslation()
  const accent = accentColor ?? colors.primary
  const [sectionGroups, setSectionGroups] = useState<SectionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const topics = await fetchTopicsByModule(moduleKey)
        const guideTopic = topics.find((t) => t.topic_key === 'guide')
        if (!guideTopic) {
          if (active) setError(t('common.guide_not_found'))
          return
        }
        const blocks = await fetchBlocksByTopic(guideTopic.id)
        if (active) setSectionGroups(groupAndSortBlocks(blocks))
      } catch {
        if (active) setError(t('common.error'))
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [moduleKey, t])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={accent} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {sectionGroups.map((group, idx) => (
        <View key={group.key} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionIndex, { color: accent }]}>
              {idx + 1}/{sectionGroups.length}
            </Text>
            <Text style={[styles.sectionTitle, { color: accent }]}>
              {i18next.t(`section.${group.key}`, { ns: 'psyedu' })}
            </Text>
          </View>
          <PsyEduBlockRenderer blocks={group.blocks} accentColor={accent} />
        </View>
      ))}
      <View style={styles.bottomSpacer} />
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  container: {
    paddingTop: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionIndex: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  bottomSpacer: { height: 48 },
})
