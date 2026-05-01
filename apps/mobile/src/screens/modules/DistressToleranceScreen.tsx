import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import {
  BookOpen, Zap, Wind, Heart, Star, Scale, ChevronRight, ChevronDown, Info,
} from 'lucide-react-native'
import i18next from 'i18next'
import { useTranslation } from 'react-i18next'
import { AppStackParamList } from '../../navigation/AppStack'
import { fetchTopicsByModule, fetchBlocksByTopic } from '../../services/psyeduService'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'
import { PsyEduBlockRenderer } from '../../components/PsyEduBlockRenderer'
import { colors, spacing, radius } from '../../theme'
import type { PsyEduTopic, PsyEduBlock } from 'shared'

type Nav = NativeStackNavigationProp<AppStackParamList>
type Tab = 'fiches' | 'crisis'
type LucideIcon = React.ComponentType<{ size?: number; color?: string }>

const LUCIDE_ICONS: Record<string, LucideIcon> = {
  BookOpen, Zap, Wind, Heart, Star, Scale,
}

// ─── Composant : bandeau disclaimer ──────────────────────────────────────────

function DisclaimerBanner({ isTeenMode }: { isTeenMode: boolean }) {
  const { t } = useTranslation()
  const ns = isTeenMode ? 'teen' : 'common'
  return (
    <View style={styles.disclaimer}>
      <Info size={14} color={colors.primary} style={styles.disclaimerIcon} />
      <Text style={styles.disclaimerText}>
        {t('modules.distress_tolerance.disclaimer', { ns })}
      </Text>
    </View>
  )
}

// ─── Composant : ligne topic (onglet Fiches) ──────────────────────────────────

interface TopicRowProps {
  topic: PsyEduTopic
  onPress: () => void
}

const TopicRow = React.memo(function TopicRow({ topic, onPress }: TopicRowProps) {
  const Icon = LUCIDE_ICONS[topic.icon_name]
  const title = i18next.t(`distress_tolerance.${topic.topic_key}.title`, { ns: 'psyedu' })
  const summary = i18next.t(`distress_tolerance.${topic.topic_key}.summary`, { ns: 'psyedu' })

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardIcon}>
        {Icon ? <Icon size={24} color={colors.primary} /> : null}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSummary}>{summary}</Text>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
  )
})

// ─── Composant : carte accordion (onglet En crise) ───────────────────────────

interface CrisisCardProps {
  topic: PsyEduTopic
  blocks: PsyEduBlock[]
  isExpanded: boolean
  onToggle: () => void
}

const CrisisCard = React.memo(function CrisisCard({
  topic, blocks, isExpanded, onToggle,
}: CrisisCardProps) {
  const Icon = LUCIDE_ICONS[topic.icon_name]
  const title = i18next.t(`distress_tolerance.${topic.topic_key}.title`, { ns: 'psyedu' })
  const contentBlocks = useMemo(
    () => blocks.filter(b => b.block_type !== 'heading'),
    [blocks],
  )

  return (
    <View style={[styles.crisisCard, isExpanded && styles.crisisCardExpanded]}>
      <Pressable
        style={({ pressed }) => [
          styles.crisisHeader,
          isExpanded && styles.crisisHeaderExpanded,
          pressed && styles.cardPressed,
        ]}
        onPress={onToggle}
      >
        <View style={styles.cardIcon}>
          {Icon ? <Icon size={22} color={isExpanded ? colors.white : colors.primary} /> : null}
        </View>
        <Text style={[styles.crisisTitle, isExpanded && styles.crisisTitleExpanded]}>
          {title}
        </Text>
        {isExpanded
          ? <ChevronDown size={18} color={colors.white} />
          : <ChevronRight size={18} color={colors.textMuted} />}
      </Pressable>
      {isExpanded && (
        <View style={styles.crisisBody}>
          <PsyEduBlockRenderer blocks={contentBlocks} />
        </View>
      )}
    </View>
  )
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function DistressToleranceScreen() {
  const navigation = useNavigation<Nav>()
  const { t } = useTranslation()
  const { isTeenMode, teenColor } = useTeen()

  const [activeTab, setActiveTab] = useState<Tab>('fiches')
  const [topics, setTopics] = useState<PsyEduTopic[]>([])
  const [loadingTopics, setLoadingTopics] = useState(true)
  const [topicsError, setTopicsError] = useState<string | null>(null)

  const [crisisBlocks, setCrisisBlocks] = useState<Map<string, readonly PsyEduBlock[]>>(new Map())
  const [loadingCrisis, setLoadingCrisis] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const crisisLoadedRef = useRef(false)

  useEffect(() => {
    let active = true
    fetchTopicsByModule('distress_tolerance')
      .then((data) => {
        if (!active) return
        setTopics(data)
        setLoadingTopics(false)
      })
      .catch(() => {
        if (!active) return
        setTopicsError(t('common.error'))
        setLoadingTopics(false)
      })
    return () => { active = false }
  }, [t])

  useEffect(() => {
    if (activeTab !== 'crisis' || crisisLoadedRef.current || topics.length === 0) return
    crisisLoadedRef.current = true
    const techniqueTopics = topics.filter(tp => tp.topic_key !== 'intro')
    setLoadingCrisis(true)
    Promise.all(techniqueTopics.map(tp => fetchBlocksByTopic(tp.id)))
      .then((results) => {
        const map = new Map<string, readonly PsyEduBlock[]>()
        techniqueTopics.forEach((tp, i) => {
          map.set(tp.id, results[i].filter(b => b.section_key === 'how'))
        })
        setCrisisBlocks(map)
      })
      .finally(() => setLoadingCrisis(false))
  }, [activeTab, topics])

  const handleTopicPress = useCallback((topic: PsyEduTopic) => {
    const topicTitle = i18next.t(`distress_tolerance.${topic.topic_key}.title`, { ns: 'psyedu' })
    navigation.navigate('DistressToleranceDetail', { topicId: topic.id, topicTitle })
  }, [navigation])

  const handleToggle = useCallback((topicId: string) => {
    setExpandedId(prev => prev === topicId ? null : topicId)
  }, [])

  const techniqueTopics = useMemo(
    () => topics.filter(tp => tp.topic_key !== 'intro'),
    [topics],
  )

  // ─── Onglet Fiches ────────────────────────────────────────────────────────

  const renderFichesTab = () => {
    if (loadingTopics) {
      return <ActivityIndicator style={styles.center} color={colors.primary} />
    }
    if (topicsError) {
      return <Text style={styles.errorText}>{topicsError}</Text>
    }
    return (
      <FlatList
        data={topics}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TopicRow topic={item} onPress={() => handleTopicPress(item)} />
        )}
      />
    )
  }

  // ─── Onglet En crise ──────────────────────────────────────────────────────

  const renderCrisisTab = () => {
    if (loadingTopics || loadingCrisis) {
      return <ActivityIndicator style={styles.center} color={colors.primary} />
    }
    return (
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.crisisIntro}>
          {t('modules.distress_tolerance.crisis_hint')}
        </Text>
        {techniqueTopics.map((topic) => (
          <CrisisCard
            key={topic.id}
            topic={topic}
            blocks={crisisBlocks.get(topic.id) ?? []}
            isExpanded={expandedId === topic.id}
            onToggle={() => handleToggle(topic.id)}
          />
        ))}
      </ScrollView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <TeenAccent color={teenColor('distress_tolerance')} />

      <DisclaimerBanner isTeenMode={isTeenMode} />

      {/* Segment control */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'fiches' && styles.tabActive]}
          onPress={() => setActiveTab('fiches')}
        >
          <Text style={[styles.tabText, activeTab === 'fiches' && styles.tabTextActive]}>
            {t('modules.distress_tolerance.tab_fiches')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'crisis' && styles.tabActive]}
          onPress={() => setActiveTab('crisis')}
        >
          <Text style={[styles.tabText, activeTab === 'crisis' && styles.tabTextActive]}>
            {t('modules.distress_tolerance.tab_crisis')}
          </Text>
        </Pressable>
      </View>

      {activeTab === 'fiches' ? renderFichesTab() : renderCrisisTab()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl },
  errorText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', margin: spacing.xl },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
  },
  disclaimerIcon: { marginTop: 2 },
  disclaimerText: { flex: 1, fontSize: 12, color: colors.primary, lineHeight: 18 },

  // Segment control
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.white },

  // Listes communes
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },

  // Carte topic psyedu (onglet Fiches)
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: { opacity: 0.75 },
  cardIcon: { width: 40, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardSummary: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  // Carte accordion (onglet En crise)
  crisisIntro: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  crisisCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  crisisCardExpanded: {
    shadowOpacity: 0.12,
    elevation: 4,
  },
  crisisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
  },
  crisisHeaderExpanded: {
    backgroundColor: colors.primary,
  },
  crisisTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  crisisTitleExpanded: { color: colors.white },
  crisisBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
})
