import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { AppStackParamList } from '../../navigation/AppStack'
import {
  getAllSleepEntries,
  computeSleepDuration,
  computeSleepEfficiency,
  SleepEntry,
} from '../../lib/database'
import { colors, spacing, radius } from '../../theme'
import { Card } from '../../components/Card'
import { StatusBadge } from '../../components/StatusBadge'

// Formate YYYY-MM-DD en "Lun. 7 avr."
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

// Retourne la date d'hier au format YYYY-MM-DD
function yesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

// Retourne les 14 derniers jours sous forme YYYY-MM-DD, du plus récent au plus ancien
function getLast14Days(): string[] {
  const days: string[] = []
  for (let i = 1; i <= 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

// Affiche des étoiles de qualité de sommeil
function QualityStars({ quality }: { quality: number | null }) {
  const { t } = useTranslation()
  if (!quality) return <Text style={styles.entryMeta}>{t('modules.sleep_diary.quality_not_set')}</Text>
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: 5 }, (_, i) => (
        <MaterialCommunityIcons
          key={i}
          name={i < quality ? 'star' : 'star-outline'}
          size={14}
          color={i < quality ? colors.stars : colors.border}
        />
      ))}
    </View>
  )
}

export default function SleepDiaryScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>()
  const [entries, setEntries] = useState<SleepEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadEntries = async () => {
    const data = await getAllSleepEntries()
    setEntries(data)
    setLoading(false)
  }

  // Recharge les entrées à chaque fois qu'on revient sur cet écran
  useFocusEffect(
    useCallback(() => {
      loadEntries()
    }, [])
  )

  // Construit la liste des 14 derniers jours en marquant ceux qui ont une entrée
  const days = getLast14Days()
  const entryByDate = Object.fromEntries(entries.map((e) => [e.date, e]))

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Boutons d'action */}
      <View style={styles.ctaContainer}>
        <Pressable onPress={() => navigation.navigate('SleepDiaryEntry', { date: yesterday() })}>
          <Card style={styles.ctaCard}>
            <View style={styles.ctaRow}>
              <MaterialCommunityIcons name="weather-night" size={32} color={colors.white} />
              <View style={styles.ctaTexts}>
                <Text style={styles.ctaTitle}>{t('modules.sleep_diary.cta_title')}</Text>
                <Text style={styles.ctaSubtitle}>{formatDate(yesterday())}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Card>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('SleepDiaryMonth')}>
          <Card variant="outlined" style={styles.monthCard}>
            <View style={styles.ctaRow}>
              <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.primary} />
              <Text style={styles.monthButtonText}>{t('modules.sleep_diary.monthly_button')}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Card>
        </Pressable>
      </View>

      <FlatList
        data={days}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.listHeader}>{t('modules.sleep_diary.list_header')}</Text>
        }
        renderItem={({ item: date }) => {
          const entry = entryByDate[date]
          const filled = !!entry
          return (
            <TouchableOpacity
              style={[styles.dayRow, filled && styles.dayRowFilled]}
              onPress={() => navigation.navigate('SleepDiaryEntry', { date })}
              activeOpacity={0.75}
            >
              {/* Indicateur visuel gauche */}
              <View style={[styles.dot, filled ? styles.dotFilled : styles.dotEmpty]} />

              <View style={styles.dayInfo}>
                <Text style={[styles.dayDate, filled && styles.dayDateFilled]}>
                  {formatDate(date)}
                </Text>

                {filled && entry.bedtime && entry.wake_time ? (
                  <View style={styles.entryDetails}>
                    <Text style={styles.entryMeta}>
                      {entry.bedtime} → {entry.wake_time}
                      {'  '}
                      <Text style={styles.duration}>
                        ({computeSleepDuration(entry.bedtime, entry.wake_time, entry.sleep_onset_minutes)})
                      </Text>
                    </Text>
                    <View style={styles.metaRow}>
                      <QualityStars quality={entry.quality} />
                      {(() => {
                        const se = computeSleepEfficiency(
                          entry.bedtime,
                          entry.wake_time,
                          entry.sleep_onset_minutes,
                          entry.awakenings_duration_minutes
                        )
                        if (se === null) return null
                        const seColor = se >= 85 ? colors.success : se >= 70 ? '#F59E0B' : colors.danger
                        const seVariant = se >= 85 ? 'success' as const : se >= 70 ? 'warning' as const : 'danger' as const
                        return (
                          <StatusBadge variant={seVariant} label="SE" value={`${se} %`} />
                        )
                      })()}
                    </View>
                  </View>
                ) : filled ? (
                  <Text style={styles.entryMeta}>{t('modules.sleep_diary.incomplete')}</Text>
                ) : (
                  <Text style={styles.emptyDay}>{t('modules.sleep_diary.empty_day')}</Text>
                )}
              </View>

              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  ctaContainer: { padding: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  ctaCard: { backgroundColor: colors.primary },
  monthCard: {},
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ctaTexts: { flex: 1 },
  monthButtonText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.primary },
  starsRow: { flexDirection: 'row', gap: 2 },
  ctaTitle: { fontSize: 17, fontWeight: '700', color: colors.white },
  ctaSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  listHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.card,
  },
  dayRowFilled: {
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotFilled: { backgroundColor: colors.success },
  dotEmpty: { backgroundColor: colors.border },
  dayInfo: { flex: 1 },
  dayDate: { fontSize: 15, fontWeight: '500', color: colors.textMuted },
  dayDateFilled: { color: colors.text, fontWeight: '600' },
  entryDetails: { marginTop: 2, gap: 1 },
  entryMeta: { fontSize: 13, color: colors.textMuted },
  duration: { fontWeight: '600', color: colors.primary },
  emptyDay: { fontSize: 13, color: colors.border, fontStyle: 'italic', marginTop: 2 },
  chevron: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
})
