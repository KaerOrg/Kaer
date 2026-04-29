import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ChevronRight, Moon, Apple, Footprints } from 'lucide-react-native'
import i18next from 'i18next'
import { useTranslation } from 'react-i18next'
import { AppStackParamList } from '../../navigation/AppStack'
import { fetchTopicsByModule } from '../../services/psyeduService'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'
import { colors, spacing, radius } from '../../theme'
import type { PsyEduTopic } from 'shared'

type Nav = NativeStackNavigationProp<AppStackParamList>
type RouteProps = RouteProp<AppStackParamList, 'PsyEduModule'>

type LucideIcon = React.ComponentType<{ size?: number; color?: string }>

const LUCIDE_ICONS: Record<string, LucideIcon> = { Moon, Apple, Footprints }

interface TopicRowProps {
  topic: PsyEduTopic
  moduleKey: string
  onPress: () => void
}

const TopicRow = React.memo(function TopicRow({ topic, moduleKey, onPress }: TopicRowProps) {
  const Icon = LUCIDE_ICONS[topic.icon_name]
  const title = i18next.t(`${moduleKey}.${topic.topic_key}.title`, { ns: 'psyedu' })
  const summary = i18next.t(`${moduleKey}.${topic.topic_key}.summary`, { ns: 'psyedu' })

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

export default function PsyEduModuleScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<RouteProps>()
  const { moduleKey } = route.params
  const { t } = useTranslation()
  const { teenColor } = useTeen()

  const [topics, setTopics] = useState<PsyEduTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchTopicsByModule(moduleKey)
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
  }, [moduleKey, t])

  const handlePress = useCallback(
    (topic: PsyEduTopic) => {
      const topicTitle = i18next.t(`${moduleKey}.${topic.topic_key}.title`, { ns: 'psyedu' })
      navigation.navigate('DietWeightPsychoDetail', { topicId: topic.id, topicTitle })
    },
    [navigation, moduleKey]
  )

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

  const count = topics.length

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <TeenAccent color={teenColor(moduleKey)} />
      <FlatList
        data={topics}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>{t(`modules.${moduleKey}.label`)}</Text>
            <Text style={styles.subheading}>
              {count === 1
                ? t(`modules.${moduleKey}.topics_count_one`, { count })
                : t(`modules.${moduleKey}.topics_count_other`, { count })}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TopicRow topic={item} moduleKey={moduleKey} onPress={() => handlePress(item)} />
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  header: { marginBottom: spacing.md, marginTop: spacing.lg },
  heading: { fontSize: 28, fontWeight: '700', color: colors.text },
  subheading: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
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
