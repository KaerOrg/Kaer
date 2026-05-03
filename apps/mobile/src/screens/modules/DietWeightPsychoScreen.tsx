import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import {
  Info, Pill, Zap, SmilePlus, HeartPulse,
  Moon, Apple, Footprints,
  ChevronRight,
} from 'lucide-react-native'
import i18next from 'i18next'
import { useTranslation } from 'react-i18next'
import { AppStackParamList } from '../../navigation/AppStack'
import { fetchTopicsByModule } from '../../services/psyeduService'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'
import { colors, spacing, radius } from '../../theme'
import type { PsyEduTopic } from 'shared'

type Nav = NativeStackNavigationProp<AppStackParamList>
type LucideIcon = React.ComponentType<{ size?: number; color?: string }>

const LUCIDE_ICONS: Record<string, LucideIcon> = {
  Info, Pill, Zap, SmilePlus, HeartPulse, Moon, Apple, Footprints,
}

const LIFESTYLE_KEYS = new Set(['sleep_chrono', 'nutrition_brain', 'gentle_activity'])

interface Section {
  title: string
  data: PsyEduTopic[]
}

// ─── Composant : ligne topic ──────────────────────────────────────────────────

interface TopicRowProps {
  topic: PsyEduTopic
  onPress: () => void
}

const TopicRow = React.memo(function TopicRow({ topic, onPress }: TopicRowProps) {
  const Icon = LUCIDE_ICONS[topic.icon_name]
  const title = i18next.t(`diet_weight_psycho.${topic.topic_key}.title`, { ns: 'psyedu' })
  const summary = i18next.t(`diet_weight_psycho.${topic.topic_key}.summary`, { ns: 'psyedu' })

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

// ─── Composant : en-tête de section ──────────────────────────────────────────

const SectionHeader = React.memo(function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function DietWeightPsychoScreen() {
  const navigation = useNavigation<Nav>()
  const { t } = useTranslation()
  const { teenColor } = useTeen()

  const [topics, setTopics] = useState<PsyEduTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchTopicsByModule('diet_weight_psycho')
      .then((data) => {
        if (!active) return
        setTopics(data)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError(t('common.error'))
        setLoading(false)
      })
    return () => { active = false }
  }, [t])

  const handlePress = useCallback(
    (topic: PsyEduTopic) => {
      const topicTitle = i18next.t(`diet_weight_psycho.${topic.topic_key}.title`, { ns: 'psyedu' })
      navigation.navigate('DietWeightPsychoDetail', { topicId: topic.id, topicKey: topic.topic_key, topicTitle })
    },
    [navigation],
  )

  const sections = useMemo((): Section[] => {
    const lifestyle = topics.filter(tp => LIFESTYLE_KEYS.has(tp.topic_key))
    const medication = topics.filter(tp => !LIFESTYLE_KEYS.has(tp.topic_key))
    const result: Section[] = []
    if (lifestyle.length > 0) {
      result.push({ title: t('modules.diet_weight_psycho.section_lifestyle'), data: lifestyle })
    }
    if (medication.length > 0) {
      result.push({ title: t('modules.diet_weight_psycho.section_medication'), data: medication })
    }
    return result
  }, [topics, t])

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
      <TeenAccent color={teenColor('diet_weight_psycho')} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} />
        )}
        renderItem={({ item }) => (
          <TopicRow topic={item} onPress={() => handlePress(item)} />
        )}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.md },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
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
  errorText: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
})
