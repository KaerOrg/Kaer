import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { getEmotionEntriesForMonth, type EmotionEntry } from '../../lib/database'
import { EMOTION_WHEEL } from '../../constants/emotionWheel'
import { colors, spacing, radius } from '../../theme'

// ─── Helpers calendrier ───────────────────────────────────────────────────────

function toYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function monthLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1)
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

// Jour de semaine du 1er du mois, semaine française (0=Lun … 6=Dim)
function firstWeekday(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay() // 0=Sun
  return (day + 6) % 7
}

function isoToDateStr(iso: string): string {
  return iso.slice(0, 10) // YYYY-MM-DD
}

// ─── Lookup couleurs des émotions primaires ───────────────────────────────────
// Module-level map pour éviter les re-créations

const PRIMARY_COLOR_MAP = new Map(EMOTION_WHEEL.map((e) => [e.key, e.color]))
const PRIMARY_ICON_MAP = new Map(
  EMOTION_WHEEL.map((e) => [e.key, e.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']])
)
const PRIMARY_LABEL_MAP = new Map(EMOTION_WHEEL.map((e) => [e.key, e.label]))

// ─── Calcul stats mensuelles ──────────────────────────────────────────────────
//
// Toutes les valeurs sont brutes (comptages, moyennes de valeurs déclarées).
// Aucune interprétation algorithmique — conformité MDR 2017/745.

interface MonthStats {
  totalEntries: number
  distinctDays: number
  avgIntensity: number | null
  dominantPrimary: string | null   // clé de l'émotion primaire la plus fréquente
  primaryCounts: { key: string; label: string; color: string; count: number }[]
}

function computeStats(entries: EmotionEntry[]): MonthStats {
  if (entries.length === 0) {
    return { totalEntries: 0, distinctDays: 0, avgIntensity: null, dominantPrimary: null, primaryCounts: [] }
  }

  const distinctDays = new Set(entries.map((e) => isoToDateStr(e.created_at))).size
  const avgIntensity =
    Math.round((entries.reduce((s, e) => s + e.intensity, 0) / entries.length) * 10) / 10

  const countMap = new Map<string, number>()
  for (const e of entries) {
    countMap.set(e.primary_key, (countMap.get(e.primary_key) ?? 0) + 1)
  }

  const primaryCounts = [...countMap.entries()]
    .map(([key, count]) => ({
      key,
      label: PRIMARY_LABEL_MAP.get(key) ?? key,
      color: PRIMARY_COLOR_MAP.get(key) ?? colors.primary,
      count,
    }))
    .sort((a, b) => b.count - a.count)

  const dominantPrimary = primaryCounts[0]?.key ?? null

  return { totalEntries: entries.length, distinctDays, avgIntensity, dominantPrimary, primaryCounts }
}

// ─── Grille calendrier ────────────────────────────────────────────────────────
//
// Chaque cellule affiche jusqu'à 3 points colorés — un par émotion primaire
// distincte saisie ce jour. Affichage passif : aucun label, aucun score.

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

interface CalendarGridProps {
  year: number
  month: number
  entriesByDate: Map<string, EmotionEntry[]>
}

function CalendarGrid({ year, month, entriesByDate }: CalendarGridProps) {
  const days = daysInMonth(year, month)
  const offset = firstWeekday(year, month)

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month

  return (
    <View style={calStyles.grid}>
      <View style={calStyles.row}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={calStyles.weekday}>{d}</Text>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, rowIdx) => (
        <View key={rowIdx} style={calStyles.row}>
          {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
            if (!day) return <View key={colIdx} style={calStyles.cell} />

            const dateStr = `${toYearMonth(year, month)}-${String(day).padStart(2, '0')}`
            const dayEntries = entriesByDate.get(dateStr) ?? []
            const isFuture = isCurrentMonth && day > today.getDate()
            const isToday = isCurrentMonth && day === today.getDate()

            // Couleurs des émotions primaires distinctes ce jour (max 3)
            const distinctColors = [
              ...new Map(dayEntries.map((e) => [e.primary_key, PRIMARY_COLOR_MAP.get(e.primary_key) ?? colors.primary])),
            ].slice(0, 3)

            const hasEntries = dayEntries.length > 0

            return (
              <View key={colIdx} style={calStyles.cell}>
                <View style={[
                  calStyles.dayCellInner,
                  hasEntries && calStyles.dayCellFilled,
                  isToday && calStyles.dayCellToday,
                  isFuture && calStyles.dayCellFuture,
                ]}>
                  <Text style={[
                    calStyles.dayNum,
                    hasEntries && calStyles.dayNumFilled,
                    isFuture && calStyles.dayNumFuture,
                  ]}>
                    {day}
                  </Text>
                  {hasEntries && (
                    <View style={calStyles.dotsRow}>
                      {distinctColors.map(([key, color]) => (
                        <View key={key} style={[calStyles.dot, { backgroundColor: color }]} />
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )
}

// ─── Barre de fréquence par émotion primaire ──────────────────────────────────

interface EmotionBarProps {
  label: string
  color: string
  count: number
  max: number
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']
}

function EmotionBar({ label, color, count, max, icon }: EmotionBarProps) {
  const pct = max > 0 ? count / max : 0
  return (
    <View style={barStyles.row}>
      <View style={barStyles.labelRow}>
        <MaterialCommunityIcons name={icon} size={14} color={color} />
        <Text style={barStyles.label} numberOfLines={1}>{label}</Text>
        <Text style={[barStyles.count, { color }]}>{count}</Text>
      </View>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}

// ─── Carte stat ───────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  )
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function EmotionMonthScreen() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [entries, setEntries] = useState<EmotionEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getEmotionEntriesForMonth(toYearMonth(year, month))
    setEntries(data)
    setLoading(false)
  }, [year, month])

  useFocusEffect(load)

  function goToPrev() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12) }
    else setMonth((m) => m - 1)
  }

  function goToNext() {
    const isAtOrBeyondNow =
      year > now.getFullYear() ||
      (year === now.getFullYear() && month >= now.getMonth() + 1)
    if (isAtOrBeyondNow) return
    if (month === 12) { setYear((y) => y + 1); setMonth(1) }
    else setMonth((m) => m + 1)
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  // Regrouper par date pour la grille
  const entriesByDate = new Map<string, EmotionEntry[]>()
  for (const e of entries) {
    const d = isoToDateStr(e.created_at)
    const list = entriesByDate.get(d) ?? []
    list.push(e)
    entriesByDate.set(d, list)
  }

  const stats = computeStats(entries)
  const maxCount = stats.primaryCounts[0]?.count ?? 1

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>

      {/* ── Navigation mois ────────────────────────────────────────────────── */}
      <View style={styles.monthNav} testID="month-nav">
        <TouchableOpacity
          onPress={goToPrev}
          style={styles.navBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Mois précédent"
          testID="prev-month"
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.monthTitle} testID="month-title">
          {monthLabel(year, month)}
        </Text>
        <TouchableOpacity
          onPress={goToNext}
          style={[styles.navBtn, isCurrentMonth && styles.navBtnDisabled]}
          activeOpacity={isCurrentMonth ? 1 : 0.7}
          accessibilityRole="button"
          accessibilityLabel="Mois suivant"
          testID="next-month"
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={28}
            color={isCurrentMonth ? colors.border : colors.primary}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* ── Calendrier ─────────────────────────────────────────────────── */}
          <View style={styles.card} testID="calendar-grid">
            <CalendarGrid year={year} month={month} entriesByDate={entriesByDate} />
          </View>

          {/* ── Légende ────────────────────────────────────────────────────── */}
          <View style={styles.legendRow}>
            <MaterialCommunityIcons name="circle" size={10} color={colors.primary} />
            <Text style={styles.legendText}>Chaque point = une émotion notée ce jour-là. La couleur indique l'émotion principale.</Text>
          </View>

          {/* ── Résumé chiffré ──────────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Résumé du mois</Text>
          {stats.totalEntries === 0 ? (
            <View style={styles.empty} testID="empty-state">
              <MaterialCommunityIcons name="palette-outline" size={40} color={colors.border} />
              <Text style={styles.emptyText}>Aucune entrée ce mois-ci</Text>
            </View>
          ) : (
            <>
              <View style={styles.statsGrid}>
                <StatCard label="Entrées" value={String(stats.totalEntries)} />
                <StatCard label="Jours concernés" value={String(stats.distinctDays)} />
                <StatCard
                  label="Intensité moy."
                  value={stats.avgIntensity !== null ? `${stats.avgIntensity}/10` : '–'}
                />
              </View>

              {/* ── Fréquences par émotion primaire ──────────────────────── */}
              <Text style={styles.sectionTitle}>Fréquence par émotion</Text>
              <View style={styles.card} testID="emotion-bars">
                {stats.primaryCounts.map((pc) => (
                  <EmotionBar
                    key={pc.key}
                    label={pc.label}
                    color={pc.color}
                    count={pc.count}
                    max={maxCount}
                    icon={PRIMARY_ICON_MAP.get(pc.key) ?? 'emoticon-outline'}
                  />
                ))}
              </View>

              {/* ── Liste détaillée des jours ─────────────────────────────── */}
              <Text style={styles.sectionTitle}>Détail par jour</Text>
              {[...entriesByDate.entries()]
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([date, dayEntries]) => (
                  <View key={date} style={styles.dayBlock} testID={`day-block-${date}`}>
                    <Text style={styles.dayTitle}>
                      {new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </Text>
                    {dayEntries.map((e) => {
                      const color = PRIMARY_COLOR_MAP.get(e.primary_key) ?? colors.primary
                      const icon = PRIMARY_ICON_MAP.get(e.primary_key) ?? 'emoticon-outline'
                      return (
                        <View key={e.id} style={[styles.dayEntry, { borderLeftColor: color }]}>
                          <MaterialCommunityIcons name={icon} size={16} color={color} />
                          <View style={styles.dayEntryText}>
                            <Text style={[styles.dayEntryPrimary, { color }]}>
                              {e.primary_label} · {e.secondary_label} · {e.specific_label}
                            </Text>
                            <Text style={styles.dayEntryIntensity}>Intensité : {e.intensity}/10</Text>
                            {!!e.notes && (
                              <Text style={styles.dayEntryNotes} numberOfLines={2}>{e.notes}</Text>
                            )}
                          </View>
                          <Text style={styles.dayEntryTime}>
                            {new Date(e.created_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      )
                    })}
                  </View>
                ))}
            </>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monthTitle: { fontSize: 17, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  navBtn: { padding: spacing.xs },
  navBtnDisabled: { opacity: 0.3 },

  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  legendText: { fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 16 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.xs,
  },

  statsGrid: { flexDirection: 'row', gap: spacing.sm },

  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyText: { fontSize: 15, color: colors.textMuted },

  // Détail par jour
  dayBlock: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'capitalize',
    marginBottom: spacing.xs,
  },
  dayEntry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderLeftWidth: 3,
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dayEntryText: { flex: 1, gap: 2 },
  dayEntryPrimary: { fontSize: 14, fontWeight: '600' },
  dayEntryIntensity: { fontSize: 12, color: colors.textMuted },
  dayEntryNotes: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  dayEntryTime: { fontSize: 11, color: colors.border, marginTop: 2 },
})

const calStyles = StyleSheet.create({
  grid: { gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    paddingBottom: spacing.xs,
  },
  cell: {
    flex: 1,
    aspectRatio: 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayCellInner: {
    width: '90%',
    height: '90%',
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayCellFilled: {
    backgroundColor: colors.primaryLight,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayCellFuture: { opacity: 0.3 },
  dayNum: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
  dayNumFilled: { color: colors.primary, fontWeight: '700' },
  dayNumFuture: { color: colors.border },
  dotsRow: { flexDirection: 'row', gap: 2, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3 },
})

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  value: { fontSize: 24, fontWeight: '800', color: colors.primary },
  label: { fontSize: 12, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
})

const barStyles = StyleSheet.create({
  row: { gap: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { flex: 1, fontSize: 13, color: colors.text },
  count: { fontSize: 13, fontWeight: '700' },
  track: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.full },
})
