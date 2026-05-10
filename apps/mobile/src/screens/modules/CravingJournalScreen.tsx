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
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ChevronRight, Plus } from 'lucide-react-native'
import i18next from 'i18next'
import { useTranslation } from 'react-i18next'
import { AppStackParamList } from '../../navigation/AppStack'
import { fetchTopicsByModule } from '../../services/psyeduService'
import { listCravingEntries, type CravingEntry } from '../../lib/database'
import { TOPIC_VISUAL } from './cravingFicheData'
import { DisclaimerBanner } from '../../components/DisclaimerBanner'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'
import { colors, spacing, radius } from '../../theme'
import type { PsyEduTopic } from 'shared'

type Nav = NativeStackNavigationProp<AppStackParamList>
type Tab = 'fiches' | 'journal'

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  )
}

// ─── Carte fiche psychoéducative ──────────────────────────────────────────────

interface FicheCardProps {
  topic: PsyEduTopic
  onPress: () => void
}

const FicheCard = React.memo(function FicheCard({ topic, onPress }: FicheCardProps) {
  const visual = TOPIC_VISUAL[topic.topic_key]
  if (!visual) return null

  const { Icon } = visual
  const title   = i18next.t(`craving_journal.${topic.topic_key}.title`,   { ns: 'psyedu' })
  const tagline = i18next.t(`craving_journal.${topic.topic_key}.summary`, { ns: 'psyedu' })

  return (
    <Pressable
      style={({ pressed }) => [styles.ficheCard, pressed && styles.ficheCardPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={[styles.ficheBar, { backgroundColor: visual.color }]} />
      <View style={styles.ficheBody}>
        <View style={styles.ficheHeader}>
          <View style={[styles.ficheIconCircle, { backgroundColor: visual.colorLight }]}>
            <Icon size={20} color={visual.color} />
          </View>
          <View style={styles.ficheTitles}>
            <Text style={styles.ficheTitle}>{title}</Text>
            <Text style={styles.ficheTagline} numberOfLines={1}>{tagline}</Text>
          </View>
        </View>
        <View style={[styles.ficheInsightRow, { borderLeftColor: visual.color }]}>
          <Text style={styles.ficheInsightText} numberOfLines={2}>
            💡  {visual.keyInsight}
          </Text>
        </View>
        <View style={styles.ficheFooter}>
          <Text style={[styles.ficheReadText, { color: visual.color }]}>Lire la fiche</Text>
          <ChevronRight size={14} color={visual.color} />
        </View>
      </View>
    </Pressable>
  )
})

// ─── Ligne entrée journal ─────────────────────────────────────────────────────

interface EntryRowProps {
  entry: CravingEntry
  onPress: () => void
}

const EntryRow = React.memo(function EntryRow({ entry, onPress }: EntryRowProps) {
  const { t } = useTranslation()
  return (
    <Pressable
      style={({ pressed }) => [styles.entryRow, pressed && styles.entryRowPressed]}
      onPress={onPress}
    >
      <View style={styles.entryLeft}>
        <Text style={styles.entryDate}>{formatDateTime(entry.created_at)}</Text>
        <View style={styles.entryMeta}>
          <View style={styles.intensityBadge}>
            <Text style={styles.intensityText}>{entry.intensity}/10</Text>
          </View>
          {entry.trigger_context ? (
            <Text style={styles.entryTrigger} numberOfLines={1}>{entry.trigger_context}</Text>
          ) : (
            <Text style={styles.entryTriggerEmpty}>{t('modules.craving_journal.no_trigger')}</Text>
          )}
        </View>
      </View>
      <ChevronRight size={16} color={colors.textMuted} />
    </Pressable>
  )
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function CravingJournalScreen() {
  const navigation = useNavigation<Nav>()
  const { t } = useTranslation()
  const { isTeenMode, teenColor } = useTeen()

  const [activeTab, setActiveTab] = useState<Tab>('fiches')
  const [topics, setTopics] = useState<PsyEduTopic[]>([])
  const [loadingTopics, setLoadingTopics] = useState(true)
  const [topicsError, setTopicsError] = useState<string | null>(null)
  const [entries, setEntries] = useState<CravingEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)

  useEffect(() => {
    let active = true
    fetchTopicsByModule('craving_journal')
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

  const loadEntries = useCallback(() => {
    setLoadingEntries(true)
    listCravingEntries(30)
      .then(setEntries)
      .finally(() => setLoadingEntries(false))
  }, [])

  useFocusEffect(loadEntries)

  const handleTopicPress = useCallback((topic: PsyEduTopic) => {
    const topicTitle = i18next.t(`craving_journal.${topic.topic_key}.title`, { ns: 'psyedu' })
    navigation.navigate('CravingJournalDetail', {
      topicId: topic.id,
      topicKey: topic.topic_key,
      topicTitle,
    })
  }, [navigation])

  const handleNewEntry = useCallback(() => {
    navigation.navigate('CravingJournalEntry', {})
  }, [navigation])

  const handleEntryPress = useCallback((entry: CravingEntry) => {
    navigation.navigate('CravingJournalEntry', { entryId: entry.id })
  }, [navigation])

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
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <DisclaimerBanner moduleKey="craving_journal" isTeenMode={isTeenMode} />
        }
        renderItem={({ item }) => (
          <FicheCard topic={item} onPress={() => handleTopicPress(item)} />
        )}
      />
    )
  }

  // ─── Onglet Journal ───────────────────────────────────────────────────────

  const renderJournalTab = () => {
    if (loadingEntries) {
      return <ActivityIndicator style={styles.center} color={colors.primary} />
    }
    return (
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Pressable
            style={({ pressed }) => [styles.newEntryBtn, pressed && { opacity: 0.8 }]}
            onPress={handleNewEntry}
          >
            <Plus size={20} color={colors.white} />
            <Text style={styles.newEntryText}>{t('modules.craving_journal.new_entry_btn')}</Text>
          </Pressable>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>{t('modules.craving_journal.empty_title')}</Text>
            <Text style={styles.emptyText}>
              {isTeenMode
                ? t('modules.craving_journal.empty_text', { ns: 'teen' })
                : t('modules.craving_journal.empty_text')}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <EntryRow entry={item} onPress={() => handleEntryPress(item)} />
        )}
      />
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <TeenAccent color={teenColor('craving_journal')} />

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'fiches' && styles.tabActive]}
          onPress={() => setActiveTab('fiches')}
        >
          <Text style={[styles.tabText, activeTab === 'fiches' && styles.tabTextActive]}>
            {t('modules.craving_journal.tab_fiches')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'journal' && styles.tabActive]}
          onPress={() => setActiveTab('journal')}
        >
          <Text style={[styles.tabText, activeTab === 'journal' && styles.tabTextActive]}>
            {t('modules.craving_journal.tab_journal')}
          </Text>
        </Pressable>
      </View>

      {activeTab === 'fiches' ? renderFichesTab() : renderJournalTab()}
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl },
  errorText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', margin: spacing.xl },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.md },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.white },

  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  // ─── Fiche cards
  ficheCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  ficheCardPressed: { opacity: 0.75 },
  ficheBar: { width: 5 },
  ficheBody: { flex: 1, padding: spacing.md, gap: spacing.sm },
  ficheHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ficheIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ficheTitles: { flex: 1 },
  ficheTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  ficheTagline: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  ficheInsightRow: { borderLeftWidth: 3, paddingLeft: spacing.sm },
  ficheInsightText: { fontSize: 13, color: colors.text, lineHeight: 19 },
  ficheFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  ficheReadText: { fontSize: 13, fontWeight: '600' },

  // ─── Entry rows
  entryRow: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  entryRowPressed: { opacity: 0.75 },
  entryLeft: { flex: 1, gap: 4 },
  entryDate: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  intensityBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  intensityText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  entryTrigger: { fontSize: 13, color: colors.text, flex: 1 },
  entryTriggerEmpty: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },

  // ─── Journal empty + new entry
  newEntryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  newEntryText: { fontSize: 16, fontWeight: '700', color: colors.white },
  emptyContainer: { alignItems: 'center', paddingTop: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
})
