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
import { PsyEduDetailHeader } from '../../components/PsyEduDetailHeader'
import { useTeen } from '../../hooks/useTeen'
import { groupAndSortBlocks, SectionGroup } from '../../utils/psyeduUtils'
import { TOPIC_VISUAL } from './distressToleranceFicheData'
import { colors, spacing } from '../../theme'

type RouteProps = RouteProp<AppStackParamList, 'DistressToleranceDetail'>

const SECTION_LABELS: Record<string, string> = { why: 'Pourquoi', how: 'Comment', sources: 'Sources' }

export default function DistressToleranceDetailScreen() {
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
        setSectionGroups(groupAndSortBlocks(blocks))
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
  const accentColor = visual?.color ?? teenColor('distress_tolerance') ?? colors.primary
  const title   = i18next.t(`distress_tolerance.${topicKey}.title`,   { ns: 'psyedu' })
  const tagline = i18next.t(`distress_tolerance.${topicKey}.summary`, { ns: 'psyedu' })

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        {visual && (
          <PsyEduDetailHeader
            title={title}
            tagline={tagline}
            Icon={visual.Icon}
            accentColor={accentColor}
            keyInsight={visual.keyInsight}
          />
        )}
        <View style={styles.center}>
          <ActivityIndicator color={accentColor} />
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

        {visual && (
          <PsyEduDetailHeader
            title={title}
            tagline={tagline}
            Icon={visual.Icon}
            accentColor={accentColor}
            keyInsight={visual.keyInsight}
          />
        )}

        <View style={styles.content}>
          {sectionGroups.map((group, idx) => (
            <View key={group.key} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionIndex, { color: accentColor }]}>
                  {idx + 1}/{sectionGroups.length}
                </Text>
                <Text style={[styles.sectionTitle, { color: accentColor }]}>
                  {i18next.t(`section.${group.key}`, { ns: 'psyedu' })}
                </Text>
              </View>
              <PsyEduBlockRenderer blocks={group.blocks} accentColor={accentColor} />
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
  content: { paddingHorizontal: spacing.lg },
  section: { marginBottom: spacing.lg },
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
