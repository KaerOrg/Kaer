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
import { getSleepEntriesForMonth, computeSleepDuration, SleepEntry } from '../../lib/database'
import { colors, spacing, radius } from '../../theme'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// Jour de semaine du 1er du mois (0=Lun … 6=Dim, semaine française)
function firstWeekday(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay() // 0=Sun
  return (day + 6) % 7 // 0=Mon … 6=Sun
}

// Durée de sommeil en minutes
function sleepMinutes(entry: SleepEntry): number | null {
  if (!entry.bedtime || !entry.wake_time) return null
  const [bH, bM] = entry.bedtime.split(':').map(Number)
  const [wH, wM] = entry.wake_time.split(':').map(Number)
  let total = wH * 60 + wM - (bH * 60 + bM) - (entry.sleep_onset_minutes ?? 0)
  if (total < 0) total += 24 * 60
  return total
}

// Couleur de la cellule selon la qualité
function qualityColor(quality: number | null): string {
  if (quality === null) return colors.border
  if (quality >= 4) return colors.success
  if (quality >= 3) return '#F59E0B' // warning
  return colors.danger
}

// ─── Statistiques du mois ────────────────────────────────────────────────────

interface MonthStats {
  filledDays: number
  totalDays: number
  avgSleepMinutes: number | null
  avgAwakenings: number | null
  nightmaresCount: number
}

function computeStats(entries: SleepEntry[], totalDays: number): MonthStats {
  const filled = entries.filter((e) => e.quality !== null)
  const withDuration = entries.map(sleepMinutes).filter((m): m is number => m !== null)
  const avgSleep =
    withDuration.length > 0
      ? Math.round(withDuration.reduce((a, b) => a + b, 0) / withDuration.length)
      : null
  const awakEntries = entries.filter((e) => e.awakenings != null)
  const avgAwakenings =
    awakEntries.length > 0
      ? Math.round((awakEntries.reduce((a, e) => a + (e.awakenings ?? 0), 0) / awakEntries.length) * 10) / 10
      : null
  const nightmaresCount = entries.filter((e) => e.nightmares === 1).length
  return { filledDays: filled.length, totalDays, avgSleepMinutes: avgSleep, avgAwakenings, nightmaresCount }
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h${String(m).padStart(2, '0')}`
}

// ─── Composants ──────────────────────────────────────────────────────────────

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function CalendarGrid({
  year,
  month,
  entryByDate,
}: {
  year: number
  month: number
  entryByDate: Record<string, SleepEntry>
}) {
  const days = daysInMonth(year, month)
  const offset = firstWeekday(year, month)

  // Cellules : cases vides + jours du mois
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ]
  // Compléter pour avoir des rangées complètes
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month

  return (
    <View style={calStyles.grid}>
      {/* En-têtes jours */}
      <View style={calStyles.row}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={calStyles.weekday}>{d}</Text>
        ))}
      </View>
      {/* Rangées */}
      {Array.from({ length: cells.length / 7 }, (_, rowIdx) => (
        <View key={rowIdx} style={calStyles.row}>
          {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
            if (!day) return <View key={colIdx} style={calStyles.cell} />
            const dateStr = `${toYearMonth(year, month)}-${String(day).padStart(2, '0')}`
            const entry = entryByDate[dateStr]
            const isFuture = isCurrentMonth && day > today.getDate()
            const isToday = isCurrentMonth && day === today.getDate()
            const bgColor = entry ? qualityColor(entry.quality) : isFuture ? 'transparent' : colors.border
            const hasNightmare = entry?.nightmares === 1

            return (
              <View key={colIdx} style={calStyles.cell}>
                <View style={[calStyles.dot, { backgroundColor: bgColor }, isToday && calStyles.dotToday]}>
                  <Text style={[calStyles.dayNum, entry ? calStyles.dayNumFilled : isFuture ? calStyles.dayNumFuture : null]}>
                    {day}
                  </Text>
                  {hasNightmare && (
                    <View style={calStyles.nightmareBadge}>
                      <MaterialCommunityIcons name="ghost" size={8} color={colors.white} />
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

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
      {sub ? <Text style={statStyles.sub}>{sub}</Text> : null}
    </View>
  )
}

function Legend() {
  const items = [
    { color: colors.success, label: 'Bonne nuit (4-5★)' },
    { color: '#F59E0B', label: 'Nuit moyenne (3★)' },
    { color: colors.danger, label: 'Mauvaise nuit (1-2★)' },
    { color: colors.border, label: 'Non renseigné' },
  ]
  return (
    <View style={legStyles.container}>
      {items.map((item) => (
        <View key={item.label} style={legStyles.row}>
          <View style={[legStyles.dot, { backgroundColor: item.color }]} />
          <Text style={legStyles.label}>{item.label}</Text>
        </View>
      ))}
      <View style={legStyles.row}>
        <MaterialCommunityIcons name="ghost" size={13} color={colors.textMuted} />
        <Text style={legStyles.label}>Cauchemar cette nuit</Text>
      </View>
    </View>
  )
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function SleepDiaryMonthScreen() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [entries, setEntries] = useState<SleepEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getSleepEntriesForMonth(toYearMonth(year, month))
    setEntries(data)
    setLoading(false)
  }, [year, month])

  useFocusEffect(load)

  const goToPrev = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  const goToNext = () => {
    const nextIsAfterNow = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
    if (nextIsAfterNow) return
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const entryByDate = Object.fromEntries(entries.map((e) => [e.date, e]))
  const stats = computeStats(entries, daysInMonth(year, month))

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Navigation mois */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goToPrev} style={styles.navBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthLabel(year, month)}</Text>
        <TouchableOpacity
          onPress={goToNext}
          style={[styles.navBtn, isCurrentMonth && styles.navBtnDisabled]}
          activeOpacity={isCurrentMonth ? 1 : 0.7}
        >
          <MaterialCommunityIcons name="chevron-right" size={28} color={isCurrentMonth ? colors.border : colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Calendrier */}
          <View style={styles.card}>
            <CalendarGrid year={year} month={month} entryByDate={entryByDate} />
          </View>

          {/* Statistiques */}
          <Text style={styles.sectionTitle}>Résumé du mois</Text>
          <View style={styles.statsGrid}>
            <StatCard
              label="Durée moy."
              value={stats.avgSleepMinutes !== null ? formatMinutes(stats.avgSleepMinutes) : '–'}
            />
            <StatCard
              label="Réveils moy."
              value={stats.avgAwakenings !== null ? String(stats.avgAwakenings) : '–'}
            />
            <StatCard
              label="Nuits saisies"
              value={`${stats.filledDays}/${stats.totalDays}`}
            />
            <StatCard
              label="Cauchemars"
              value={String(stats.nightmaresCount)}
            />
          </View>

          {/* Légende */}
          <Text style={styles.sectionTitle}>Légende</Text>
          <View style={styles.card}>
            <Legend />
          </View>
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
  monthTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
})

const calStyles = StyleSheet.create({
  grid: { gap: 4 },
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
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dot: {
    width: '85%',
    aspectRatio: 1,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotToday: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayNum: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
  dayNumFilled: { color: colors.white, fontWeight: '700' },
  dayNumFuture: { color: colors.border },
  nightmareBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
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
  value: { fontSize: 26, fontWeight: '800', color: colors.primary },
  label: { fontSize: 13, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  sub: { fontSize: 11, color: colors.border, marginTop: 1 },
})

const legStyles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
  label: { fontSize: 13, color: colors.textMuted },
})
