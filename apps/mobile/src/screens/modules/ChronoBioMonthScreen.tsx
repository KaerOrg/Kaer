import React, { useCallback, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { AppStackParamList } from '../../navigation/AppStack'
import { getChronoEntriesForMonth, ChronoEntry } from '../../lib/database'
import { colors, spacing, radius } from '../../theme'

type Nav = NativeStackNavigationProp<AppStackParamList>

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const DAY_HEADERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function firstWeekday(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay()
  return (day + 6) % 7
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function toYearMonth(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, '0')}`
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

function countAnchors(entry: ChronoEntry): number {
  return [entry.wake_time, entry.first_meal, entry.main_activity, entry.last_meal, entry.bedtime]
    .filter(Boolean).length
}

// ─── Bande de rythme — constantes ─────────────────────────────────────────────

const BAND_HEIGHT = 144
const DOT_D = 6

const ANCHOR_BAND: ReadonlyArray<{ key: keyof ChronoEntry; label: string; color: string }> = [
  { key: 'wake_time',     label: 'Lever',      color: '#F59E0B' },
  { key: 'first_meal',    label: '1er repas',  color: '#F97316' },
  { key: 'main_activity', label: 'Activité',   color: '#3B82F6' },
  { key: 'last_meal',     label: 'Dernier',    color: '#EF4444' },
  { key: 'bedtime',       label: 'Coucher',    color: '#8B5CF6' },
]

const Y_TICKS: ReadonlyArray<{ label: string; frac: number }> = [
  { label: '0h',  frac: 0    },
  { label: '6h',  frac: 0.25 },
  { label: '12h', frac: 0.5  },
  { label: '18h', frac: 0.75 },
  { label: '24h', frac: 1    },
]

// Day-of-month markers shown below the band (days 1, 8, 15, 22, 29)
const BAND_DAY_MARKERS = [1, 8, 15, 22, 29]

function timeToFraction(time: string): number {
  const parts = time.split(':')
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  return (h * 60 + m) / 1440
}

// ─── Composant : grille calendrier ───────────────────────────────────────────

interface CalendarGridProps {
  year: number
  month: number
  entriesByDate: Map<string, ChronoEntry>
  todayISO: string
  onDayPress: (dateISO: string) => void
}

function CalendarGrid({ year, month, entriesByDate, todayISO, onDayPress }: CalendarGridProps) {
  const offset = firstWeekday(year, month)
  const days = daysInMonth(year, month)
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const rows = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7))

  return (
    <View style={gridStyles.container}>
      <View style={gridStyles.row}>
        {DAY_HEADERS.map((h, i) => (
          <View key={i} style={gridStyles.cell}>
            <Text style={gridStyles.dayHeader}>{h}</Text>
          </View>
        ))}
      </View>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={gridStyles.row}>
          {row.map((day, colIdx) => {
            if (!day) return <View key={colIdx} style={gridStyles.cell} />
            const iso = toISO(year, month, day)
            const isToday = iso === todayISO
            const isFuture = iso > todayISO
            const entry = entriesByDate.get(iso)
            const anchors = entry ? countAnchors(entry) : 0

            return (
              <Pressable
                key={colIdx}
                style={gridStyles.cell}
                onPress={isFuture ? undefined : () => onDayPress(iso)}
                disabled={isFuture}
              >
                <Text style={[
                  gridStyles.dayNum,
                  isToday && gridStyles.dayNumToday,
                  isFuture && gridStyles.dayNumFuture,
                ]}>
                  {day}
                </Text>
                {entry ? (
                  <View style={[gridStyles.dot, anchors === 5 && gridStyles.dotFull]} />
                ) : !isFuture ? (
                  <View style={gridStyles.dotEmpty} />
                ) : null}
              </Pressable>
            )
          })}
        </View>
      ))}
    </View>
  )
}

const gridStyles = StyleSheet.create({
  container: { marginHorizontal: spacing.lg },
  row: { flexDirection: 'row' },
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayHeader: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  dayNum: { fontSize: 14, fontWeight: '500', color: colors.text },
  dayNumToday: { color: colors.primary, fontWeight: '700' },
  dayNumFuture: { color: colors.textMuted, opacity: 0.5 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    opacity: 0.6,
  },
  dotFull: { opacity: 1 },
  dotEmpty: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
})

// ─── Composant : bande de rythme ─────────────────────────────────────────────

interface RhythmBandProps {
  year: number
  month: number
  entriesByDate: Map<string, ChronoEntry>
  todayISO: string
  onDayPress: (iso: string) => void
}

function RhythmBand({ year, month, entriesByDate, todayISO, onDayPress }: RhythmBandProps) {
  const days = daysInMonth(year, month)
  const dayRange = useMemo(
    () => Array.from({ length: days }, (_, i) => i + 1),
    [days],
  )

  return (
    <View style={bandStyles.wrapper}>

      {/* Y-axis labels */}
      <View style={[bandStyles.yAxis, { height: BAND_HEIGHT }]}>
        {Y_TICKS.map(({ label, frac }) => (
          <Text
            key={label + String(frac)}
            style={[bandStyles.yLabel, { top: Math.round(frac * (BAND_HEIGHT - 10)) }]}
          >
            {label}
          </Text>
        ))}
      </View>

      {/* Band + day labels column */}
      <View style={bandStyles.bandColumn}>

        {/* Band area */}
        <View style={[bandStyles.band, { height: BAND_HEIGHT }]}>

          {/* Horizontal grid lines */}
          {Y_TICKS.map(({ frac }) => (
            <View
              key={`gl${frac}`}
              style={[bandStyles.gridLine, { top: Math.round(frac * BAND_HEIGHT) }]}
            />
          ))}

          {/* Day columns — absolute fill over grid lines */}
          <View style={[StyleSheet.absoluteFill, bandStyles.columnsRow]}>
            {dayRange.map((day) => {
              const iso = toISO(year, month, day)
              const isFuture = iso > todayISO
              const isToday = iso === todayISO
              const entry = entriesByDate.get(iso)

              return (
                <Pressable
                  key={day}
                  style={[bandStyles.dayCol, isToday && bandStyles.dayColToday]}
                  onPress={isFuture ? undefined : () => onDayPress(iso)}
                  disabled={isFuture}
                >
                  {/* Week separator after each 7-day block */}
                  {day > 1 && day % 7 === 1 && (
                    <View style={bandStyles.weekSep} />
                  )}

                  {/* Anchor dots positioned by time */}
                  {entry && ANCHOR_BAND.map(({ key, color }) => {
                    const val = entry[key] as string | null
                    if (!val) return null
                    const topPx = Math.round(timeToFraction(val) * BAND_HEIGHT) - DOT_D / 2
                    return (
                      <View
                        key={key}
                        style={[bandStyles.dot, { top: topPx, backgroundColor: color }]}
                      />
                    )
                  })}
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* Day number markers below the band */}
        <View style={[bandStyles.dayMarkersRow, { width: '100%' }]}>
          {dayRange.map((day) => (
            <View key={day} style={bandStyles.dayMarkerCell}>
              {BAND_DAY_MARKERS.includes(day) && (
                <Text style={bandStyles.dayMarkerText}>{day}</Text>
              )}
            </View>
          ))}
        </View>

      </View>
    </View>
  )
}

// ─── Composant : légende ancrages ────────────────────────────────────────────

function AnchorLegend() {
  return (
    <View style={legendStyles.row}>
      {ANCHOR_BAND.map(({ key, label, color }) => (
        <View key={key} style={legendStyles.item}>
          <View style={[legendStyles.dot, { backgroundColor: color }]} />
          <Text style={legendStyles.label}>{label}</Text>
        </View>
      ))}
    </View>
  )
}

const legendStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 11, color: colors.textMuted },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function ChronoBioMonthScreen() {
  const navigation = useNavigation<Nav>()
  const { t } = useTranslation()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [entries, setEntries] = useState<ChronoEntry[]>([])

  const todayISO = useMemo(() => now.toISOString().slice(0, 10), [])
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  const load = useCallback(() => {
    getChronoEntriesForMonth(toYearMonth(year, month)).then(setEntries)
  }, [year, month])

  useFocusEffect(load)

  const entriesByDate = useMemo(() => {
    const m = new Map<string, ChronoEntry>()
    entries.forEach(e => m.set(e.date, e))
    return m
  }, [entries])

  const goToPrev = useCallback(() => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }, [month])

  const goToNext = useCallback(() => {
    if (isCurrentMonth) return
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }, [month, isCurrentMonth])

  const handleDayPress = useCallback((dateISO: string) => {
    navigation.navigate('ChronoBioEntry', { date: dateISO })
  }, [navigation])

  const totalDays = daysInMonth(year, month)
  const filledCount = entries.length

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Navigation mois */}
        <View style={styles.navRow}>
          <Pressable style={styles.navBtn} onPress={goToPrev}>
            <ChevronLeft size={22} color={colors.primary} />
          </Pressable>
          <Text style={styles.monthTitle}>
            {MONTH_NAMES[month - 1]} {year}
          </Text>
          <Pressable
            style={[styles.navBtn, isCurrentMonth && styles.navBtnDisabled]}
            onPress={goToNext}
            disabled={isCurrentMonth}
          >
            <ChevronRight size={22} color={isCurrentMonth ? colors.border : colors.primary} />
          </Pressable>
        </View>

        {/* Compteur */}
        <Text style={styles.counter}>
          {filledCount} / {totalDays} {t('modules.chrono_bio.legend_recorded').toLowerCase()}
          {filledCount > 1 ? 's' : ''}
        </Text>

        {/* Calendrier (vue densité) */}
        <CalendarGrid
          year={year}
          month={month}
          entriesByDate={entriesByDate}
          todayISO={todayISO}
          onDayPress={handleDayPress}
        />

        {/* Légende calendrier */}
        <View style={styles.calLegend}>
          <View style={styles.legendItem}>
            <View style={calLegendStyles.dotFull} />
            <Text style={styles.legendText}>{t('modules.chrono_bio.legend_recorded')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={calLegendStyles.dotEmpty} />
            <Text style={styles.legendText}>{t('modules.chrono_bio.legend_empty_day')}</Text>
          </View>
        </View>

        {/* ── Séparateur ── */}
        <View style={styles.divider} />

        {/* Titre bande de rythme */}
        <Text style={styles.sectionTitle}>{t('modules.chrono_bio.rhythm_band_title')}</Text>
        <Text style={styles.sectionSubtitle}>
          Chaque point représente l'heure d'un ancrage. Appuyez sur une colonne pour modifier.
        </Text>

        {/* Bande de rythme */}
        <RhythmBand
          year={year}
          month={month}
          entriesByDate={entriesByDate}
          todayISO={todayISO}
          onDayPress={handleDayPress}
        />

        {/* Légende ancrages */}
        <AnchorLegend />

      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles : bande ───────────────────────────────────────────────────────────

const bandStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  yAxis: {
    width: 28,
    position: 'relative',
  },
  yLabel: {
    position: 'absolute',
    left: 0,
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
  },
  bandColumn: {
    flex: 1,
  },
  band: {
    position: 'relative',
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  columnsRow: {
    flexDirection: 'row',
  },
  dayCol: {
    flex: 1,
    position: 'relative',
  },
  dayColToday: {
    backgroundColor: colors.primaryLight,
    opacity: 0.9,
  },
  weekSep: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  dot: {
    position: 'absolute',
    width: DOT_D,
    height: DOT_D,
    borderRadius: DOT_D / 2,
    left: '50%',
    marginLeft: -(DOT_D / 2),
  },
  dayMarkersRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  dayMarkerCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayMarkerText: {
    fontSize: 8,
    color: colors.textMuted,
  },
})

// ─── Styles : légende calendrier ─────────────────────────────────────────────

const calLegendStyles = StyleSheet.create({
  dotFull: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary,
  },
  dotEmpty: {
    width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border,
  },
})

// ─── Styles : écran ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: spacing.xl },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  navBtn: { padding: spacing.sm },
  navBtnDisabled: { opacity: 0.3 },
  monthTitle: { fontSize: 18, fontWeight: '700', color: colors.text },

  counter: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  calLegend: {
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendText: { fontSize: 12, color: colors.textMuted },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: spacing.lg,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
})
