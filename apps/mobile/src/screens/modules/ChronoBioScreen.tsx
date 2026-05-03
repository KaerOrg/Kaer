import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import {
  Clock, Brain, Sun, Utensils, Users, Moon, AlertTriangle, ChevronRight, Plus, Pencil,
  CalendarRange,
} from 'lucide-react-native'
import i18next from 'i18next'
import { useTranslation } from 'react-i18next'
import { AppStackParamList } from '../../navigation/AppStack'
import { fetchTopicsByModule } from '../../services/psyeduService'
import { listChronoEntries, ChronoEntry } from '../../lib/database'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'
import { colors, spacing, radius } from '../../theme'
import type { PsyEduTopic } from 'shared'

type Nav = NativeStackNavigationProp<AppStackParamList>
type Tab = 'fiches' | 'journal'
type LucideIcon = React.ComponentType<{ size?: number; color?: string }>

const LUCIDE_ICONS: Record<string, LucideIcon> = {
  Clock, Brain, Sun, Utensils, Users, Moon, AlertTriangle,
}

// ─── Utilitaires date ─────────────────────────────────────────────────────────

const PAST_DAYS = 13

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function buildPastDates(): string[] {
  return Array.from({ length: PAST_DAYS }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (i + 1))
    return d.toISOString().slice(0, 10)
  })
}

// ─── Composant : ligne topic psyedu ──────────────────────────────────────────

interface TopicRowProps {
  topic: PsyEduTopic
  onPress: () => void
}

const TopicRow = React.memo(function TopicRow({ topic, onPress }: TopicRowProps) {
  const Icon = LUCIDE_ICONS[topic.icon_name]
  const title = i18next.t(`chronobiology_tracker.${topic.topic_key}.title`, { ns: 'psyedu' })
  const summary = i18next.t(`chronobiology_tracker.${topic.topic_key}.summary`, { ns: 'psyedu' })

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

// ─── Composant : ligne historique ─────────────────────────────────────────────

const ANCHORS: Array<{ key: keyof ChronoEntry; short: string }> = [
  { key: 'wake_time',     short: 'Lev' },
  { key: 'first_meal',    short: '1er' },
  { key: 'main_activity', short: 'Act' },
  { key: 'last_meal',     short: 'Der' },
  { key: 'bedtime',       short: 'Cou' },
]

interface JournalRowProps {
  entry: ChronoEntry
  onPress: () => void
}

const JournalRow = React.memo(function JournalRow({ entry, onPress }: JournalRowProps) {
  const isToday = entry.date === todayISO()
  return (
    <Pressable
      style={({ pressed }) => [styles.journalRow, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.journalLeft}>
        <Text style={[styles.journalDate, isToday && styles.journalDateToday]}>
          {isToday ? "Aujourd'hui" : formatShortDate(entry.date)}
        </Text>
        <View style={styles.anchorChips}>
          {ANCHORS.map(({ key, short }) => {
            const val = entry[key] as string | null
            return (
              <View key={key} style={[styles.chip, val ? styles.chipFilled : styles.chipEmpty]}>
                <Text style={[styles.chipLabel, val ? styles.chipLabelFilled : styles.chipLabelEmpty]}>
                  {short}
                </Text>
                <Text style={[styles.chipTime, val ? styles.chipTimeFilled : styles.chipTimeEmpty]}>
                  {val ?? '—'}
                </Text>
              </View>
            )
          })}
        </View>
      </View>
      <Pencil size={16} color={colors.textMuted} />
    </Pressable>
  )
})

// ─── Composant : jour sans saisie ─────────────────────────────────────────────

interface EmptyDayRowProps {
  date: string
  onPress: () => void
}

const EmptyDayRow = React.memo(function EmptyDayRow({ date, onPress }: EmptyDayRowProps) {
  const { t } = useTranslation()
  return (
    <Pressable
      style={({ pressed }) => [styles.emptyDayRow, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.journalLeft}>
        <Text style={styles.journalDate}>{formatShortDate(date)}</Text>
        <Text style={styles.emptyDayHint}>{t('modules.chrono_bio.no_entry_day')}</Text>
      </View>
      <Plus size={18} color={colors.primary} />
    </Pressable>
  )
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function ChronoBioScreen() {
  const navigation = useNavigation<Nav>()
  const { t } = useTranslation()
  const { teenColor } = useTeen()

  const [activeTab, setActiveTab] = useState<Tab>('fiches')
  const [topics, setTopics] = useState<PsyEduTopic[]>([])
  const [entries, setEntries] = useState<ChronoEntry[]>([])
  const [loadingTopics, setLoadingTopics] = useState(true)
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [topicsError, setTopicsError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchTopicsByModule('chronobiology_tracker')
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
    listChronoEntries(30)
      .then(setEntries)
      .finally(() => setLoadingEntries(false))
  }, [])

  useFocusEffect(loadEntries)

  const handleTopicPress = useCallback((topic: PsyEduTopic) => {
    const topicTitle = i18next.t(`chronobiology_tracker.${topic.topic_key}.title`, { ns: 'psyedu' })
    navigation.navigate('ChronoBioDetail', { topicId: topic.id, topicKey: topic.topic_key, topicTitle })
  }, [navigation])

  const navigateToEntry = useCallback((date: string) => {
    navigation.navigate('ChronoBioEntry', { date })
  }, [navigation])

  const today = useMemo(() => todayISO(), [])

  const entriesByDate = useMemo(() => {
    const m = new Map<string, ChronoEntry>()
    entries.forEach(e => m.set(e.date, e))
    return m
  }, [entries])

  const todayEntry = useMemo(() => entriesByDate.get(today), [entriesByDate, today])

  const pastDates = useMemo(() => buildPastDates(), [])

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

  // ─── Onglet Journal ───────────────────────────────────────────────────────

  const renderJournalTab = () => {
    if (loadingEntries) {
      return <ActivityIndicator style={styles.center} color={colors.primary} />
    }
    return (
      <FlatList
        data={pastDates}
        keyExtractor={(date) => date}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.todaySection}>
            {/* Bouton vue mensuelle */}
            <TouchableOpacity
              style={styles.monthBtn}
              onPress={() => navigation.navigate('ChronoBioMonth')}
              activeOpacity={0.7}
            >
              <CalendarRange size={18} color={colors.primary} />
              <Text style={styles.monthBtnText}>{t('modules.chrono_bio.view_month')}</Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>

            {/* Aujourd'hui */}
            <Text style={styles.sectionLabel}>{t('modules.chrono_bio.today_label')}</Text>
            {todayEntry ? (
              <JournalRow entry={todayEntry} onPress={() => navigateToEntry(today)} />
            ) : (
              <TouchableOpacity
                style={styles.addTodayBtn}
                onPress={() => navigateToEntry(today)}
                activeOpacity={0.7}
              >
                <Plus size={20} color={colors.primary} />
                <Text style={styles.addTodayText}>{t('modules.chrono_bio.add_today')}</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
              {t('modules.chrono_bio.recent_days')}
            </Text>
          </View>
        }
        renderItem={({ item: date }) => {
          const entry = entriesByDate.get(date)
          return entry
            ? <JournalRow entry={entry} onPress={() => navigateToEntry(date)} />
            : <EmptyDayRow date={date} onPress={() => navigateToEntry(date)} />
        }}
      />
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <TeenAccent color={teenColor('chronobiology_tracker')} />

      {/* Segment control */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'fiches' && styles.tabActive]}
          onPress={() => setActiveTab('fiches')}
        >
          <Text style={[styles.tabText, activeTab === 'fiches' && styles.tabTextActive]}>
            {t('modules.chrono_bio.tab_fiches')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'journal' && styles.tabActive]}
          onPress={() => setActiveTab('journal')}
        >
          <Text style={[styles.tabText, activeTab === 'journal' && styles.tabTextActive]}>
            {t('modules.chrono_bio.tab_journal')}
          </Text>
        </Pressable>
      </View>

      {activeTab === 'fiches' ? renderFichesTab() : renderJournalTab()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl },
  errorText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', margin: spacing.xl },

  // Segment control
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
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.white },

  // Liste communes
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },

  // Carte topic psyedu
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

  // Journal
  todaySection: { paddingTop: spacing.sm },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  monthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  monthBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  addTodayBtn: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  addTodayText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  emptyDayRow: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    opacity: 0.75,
  },
  emptyDayHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  // Ligne journal
  journalRow: {
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
  journalLeft: { flex: 1, gap: spacing.xs },
  journalDate: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  journalDateToday: { color: colors.primary },
  anchorChips: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  chip: {
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
    minWidth: 48,
  },
  chipFilled: { backgroundColor: colors.primaryLight },
  chipEmpty: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  chipLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  chipLabelFilled: { color: colors.primary },
  chipLabelEmpty: { color: colors.textMuted },
  chipTime: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  chipTimeFilled: { color: colors.primary },
  chipTimeEmpty: { color: colors.textMuted },
})
