import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  SectionList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react-native'
import type { PsyEduTopic } from '@psytool/shared'
import { fetchTopicsByModule } from '../../services/psyeduService'
import { resolvePsyEduIcon } from '../../components/features/ModuleRenderer/layouts/PsyEdu/iconMap'
import { TeenAccent } from '../../components/features/TeenAccent'
import { DisclaimerBanner } from '../../components/features/DisclaimerBanner'
import { useTeen } from '../../hooks/useTeen'
import { colors, spacing, radius } from '../../theme'
import type { AppStackParamList } from '../../navigation/AppStack'

const MODULE_ID = 'diet_weight_psycho'

type Nav = NativeStackNavigationProp<AppStackParamList>

interface Section {
  key: string
  titleKey: string
  data: PsyEduTopic[]
}

function buildSections(topics: PsyEduTopic[]): Section[] {
  const lifestyle = topics.filter(t => t.sort_order >= 6)
  const medication = topics.filter(t => t.sort_order < 6)
  const sections: Section[] = []
  if (lifestyle.length > 0) {
    sections.push({ key: 'lifestyle', titleKey: `modules.${MODULE_ID}.section_lifestyle`, data: lifestyle })
  }
  if (medication.length > 0) {
    sections.push({ key: 'medication', titleKey: `modules.${MODULE_ID}.section_medication`, data: medication })
  }
  return sections
}

interface TopicRowProps {
  topic: PsyEduTopic
  onPress: () => void
  accentColor: string | undefined
}

const TopicRow = React.memo(function TopicRow({ topic, onPress, accentColor }: TopicRowProps) {
  const { t } = useTranslation('psyedu')
  const { isTeenMode } = useTeen()
  const Icon = resolvePsyEduIcon(topic.icon_name)
  const accent = accentColor ?? colors.primary

  const title = isTeenMode
    ? (t(`${MODULE_ID}.${topic.topic_key}.title`, { ns: 'psyedu_teen', defaultValue: '' }) ||
       t(`${MODULE_ID}.${topic.topic_key}.title`))
    : t(`${MODULE_ID}.${topic.topic_key}.title`)

  const summary = isTeenMode
    ? (t(`${MODULE_ID}.${topic.topic_key}.summary`, { ns: 'psyedu_teen', defaultValue: '' }) ||
       t(`${MODULE_ID}.${topic.topic_key}.summary`))
    : t(`${MODULE_ID}.${topic.topic_key}.summary`)

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      testID={`topic-row-${topic.topic_key}`}
      accessibilityRole="button"
    >
      <View style={[styles.rowIcon, { backgroundColor: accent + '1A' }]}>
        <Icon size={20} color={accent} />
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

export default function DietWeightPsychoScreen() {
  const navigation = useNavigation<Nav>()
  const { t } = useTranslation()
  const { isTeenMode, teenColor } = useTeen()
  const accentColor = teenColor(MODULE_ID)

  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      setLoading(true)
      setError(false)
      fetchTopicsByModule(MODULE_ID)
        .then(topics => {
          if (!cancelled) setSections(buildSections(topics))
        })
        .catch(() => {
          if (!cancelled) setError(true)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
      return () => { cancelled = true }
    }, [])
  )

  if (loading) {
    return (
      <View style={styles.center} testID="dwp-loading">
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center} testID="dwp-error">
        <Text style={styles.errorText}>{t(`modules.${MODULE_ID}.content_not_found`)}</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']} testID="dwp-screen">
      <TeenAccent color={accentColor} />
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <DisclaimerBanner moduleKey={MODULE_ID} isTeenMode={isTeenMode} />
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader} testID={`section-${section.key}`}>
            {t(section.titleKey)}
          </Text>
        )}
        renderItem={({ item }) => (
          <TopicRow
            topic={item}
            accentColor={accentColor}
            onPress={() =>
              navigation.navigate('DietWeightPsychoDetail', {
                topicId: item.id,
                topicKey: item.topic_key,
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorText: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
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
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSummary: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  separator: { height: spacing.xs },
  sectionSeparator: { height: spacing.xs },
})
