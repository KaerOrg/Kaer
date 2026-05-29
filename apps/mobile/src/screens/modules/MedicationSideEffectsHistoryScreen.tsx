import React, { useCallback, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native'
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { getAllScaleEntries, deleteScaleEntry, type ScaleEntry } from '../../lib/database'
import { formatDateLong } from '../../lib/dateUtils'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius, typography } from '../../theme'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/features/TeenAccent'
import { useAuthStore } from '../../store/authStore'
import { fetchModuleEvents, type SideEffectsEvent } from '../../services/homeService'

type Nav = NativeStackNavigationProp<AppStackParamList>
type TimeRange = '7J' | '1M' | '6M' | '1A'

const SCALE_ID = 'medication_side_effects'
const MODULE_COLOR = '#8B5CF6'

const SYMPTOM_KEYS = [
  'sedation',
  'akathisia',
  'tremors',
  'dry_mouth',
  'sleep',
  'nausea',
] as const

const SYMPTOM_LABEL_KEYS: Record<string, string> = {
  sedation:  'effect_sedation_label',
  akathisia: 'effect_akathisia_label',
  tremors:   'effect_tremors_label',
  dry_mouth: 'effect_dry_mouth_label',
  sleep:     'effect_sleep_label',
  nausea:    'effect_nausea_label',
}

// ── Data point ───────────────────────────────────────────────────────────────

interface DataPoint {
  value: number
  hasValue: boolean
}

// ── X-axis labels ─────────────────────────────────────────────────────────────

interface XLabel {
  index: number
  label: string
}

function buildXLabels(range: TimeRange, locale: string): XLabel[] {
  const now = new Date()

  if (range === '7J') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (6 - i))
      return { index: i, label: String(d.getDate()) }
    })
  }

  if (range === '1M') {
    return [0, 9, 19, 29].map(i => {
      const d = new Date(now)
      d.setDate(d.getDate() - (29 - i))
      const label = d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
        .replace(/\./g, '').replace(/\s+/g, ' ')
      return { index: i, label }
    })
  }

  if (range === '6M') {
    const labels: XLabel[] = []
    let lastMonth = -1
    for (let i = 0; i < 26; i++) {
      const bucketEnd = new Date(now)
      bucketEnd.setDate(bucketEnd.getDate() - (25 - i) * 7)
      const month = bucketEnd.getMonth()
      if (month !== lastMonth) {
        lastMonth = month
        const label = bucketEnd
          .toLocaleDateString(locale, { month: 'short' })
          .replace(/\./g, '')
          .slice(0, 4)
        labels.push({ index: i, label })
      }
    }
    return labels
  }

  // 1A — one label per month
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const label = d
      .toLocaleDateString(locale, { month: 'short' })
      .replace(/\./g, '')
      .slice(0, 3)
    return { index: i, label }
  })
}

// ── Chart data builders ──────────────────────────────────────────────────────

function buildChartData(entries: ScaleEntry[], key: string, range: TimeRange): DataPoint[] {
  const now = new Date()

  if (range === '7J') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (6 - i))
      const dateStr = d.toISOString().slice(0, 10)
      const entry = entries.find(e => e.created_at.slice(0, 10) === dateStr)
      const val = entry?.subscale_scores?.[key] as number | undefined
      return { value: val ?? 0, hasValue: val != null }
    })
  }

  if (range === '1M') {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (29 - i))
      const dateStr = d.toISOString().slice(0, 10)
      const entry = entries.find(e => e.created_at.slice(0, 10) === dateStr)
      const val = entry?.subscale_scores?.[key] as number | undefined
      return { value: val ?? 0, hasValue: val != null }
    })
  }

  if (range === '6M') {
    return Array.from({ length: 26 }, (_, i) => {
      const bucketEnd = new Date(now)
      bucketEnd.setDate(bucketEnd.getDate() - (25 - i) * 7)
      const bucketStart = new Date(bucketEnd)
      bucketStart.setDate(bucketStart.getDate() - 6)
      const bucket = entries.filter(e => {
        const d = new Date(e.created_at)
        return d >= bucketStart && d <= bucketEnd
      })
      if (bucket.length === 0) return { value: 0, hasValue: false }
      const avg = bucket.reduce((s, e) => s + ((e.subscale_scores?.[key] as number | undefined) ?? 0), 0) / bucket.length
      return { value: avg, hasValue: true }
    })
  }

  return Array.from({ length: 12 }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const bucket = entries.filter(e => {
      const d = new Date(e.created_at)
      return d >= month && d <= monthEnd
    })
    if (bucket.length === 0) return { value: 0, hasValue: false }
    const avg = bucket.reduce((s, e) => s + ((e.subscale_scores?.[key] as number | undefined) ?? 0), 0) / bucket.length
    return { value: avg, hasValue: true }
  })
}

function computeAvg(points: DataPoint[]): string {
  const valid = points.filter(p => p.hasValue)
  if (valid.length === 0) return '—'
  const avg = valid.reduce((s, p) => s + p.value, 0) / valid.length
  return avg.toFixed(1)
}

function computeStreak(entries: ScaleEntry[]): number {
  if (entries.length === 0) return 0
  const datesWithEntry = new Set(entries.map(e => e.created_at.slice(0, 10)))
  let streak = 0
  const cur = new Date()
  cur.setHours(0, 0, 0, 0)
  while (true) {
    const dateStr = cur.toISOString().slice(0, 10)
    if (!datesWithEntry.has(dateStr)) break
    streak++
    cur.setDate(cur.getDate() - 1)
  }
  return streak
}

// ── LineChart — 1M / 6M / 1A ─────────────────────────────────────────────────

const SVG_W = 280
const DATA_H = 56
const LABEL_H = 14
const SVG_H = DATA_H + LABEL_H
const PAD_X = 6
const PAD_Y = 6

interface LineChartProps {
  points: DataPoint[]
  color: string
  xLabels: XLabel[]
}

function LineChart({ points, color, xLabels }: LineChartProps) {
  const n = points.length
  if (n === 0) return null

  const innerW = SVG_W - PAD_X * 2
  const innerH = DATA_H - PAD_Y * 2

  const xAt = (i: number) => PAD_X + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const yAt = (v: number) => PAD_Y + innerH - (v / 3) * innerH

  // Build connected segments (skip gaps)
  const segments: string[][] = []
  let current: string[] = []
  for (let i = 0; i < n; i++) {
    if (points[i].hasValue) {
      current.push(`${xAt(i).toFixed(1)},${yAt(points[i].value).toFixed(1)}`)
    } else {
      if (current.length > 1) segments.push(current)
      current = []
    }
  }
  if (current.length > 1) segments.push(current)

  const baseY = yAt(0)
  const labelY = DATA_H + LABEL_H - 2

  return (
    <Svg width="100%" height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="none">
      {/* Baseline */}
      <Line
        x1={PAD_X} y1={baseY}
        x2={SVG_W - PAD_X} y2={baseY}
        stroke="#E5E7EB"
        strokeWidth="1"
      />

      {/* Connected segments */}
      {segments.map((seg, si) => (
        <Polyline
          key={si}
          points={seg.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* Data points */}
      {points.map((p, i) => {
        if (!p.hasValue) return null
        return (
          <Circle
            key={i}
            cx={xAt(i)}
            cy={yAt(p.value)}
            r={n <= 12 ? 3.5 : 2.5}
            fill={color}
            stroke="white"
            strokeWidth="1.5"
          />
        )
      })}

      {/* X-axis labels */}
      {xLabels.map(({ index, label }) => (
        <SvgText
          key={`xl_${index}`}
          x={xAt(index)}
          y={labelY}
          textAnchor="middle"
          fontSize={n > 12 ? '7' : '8'}
          fill="#9CA3AF"
        >
          {label}
        </SvgText>
      ))}
    </Svg>
  )
}

// ── BarChart — 7J ─────────────────────────────────────────────────────────────

const BAR_H = 48

interface BarChartProps {
  points: DataPoint[]
  color: string
  xLabels: XLabel[]
}

function BarChart({ points, color, xLabels }: BarChartProps) {
  return (
    <View style={barStyles.wrapper}>
      {/* Value labels above bars */}
      <View style={barStyles.topLabels}>
        {points.map((p, i) => (
          <View key={i} style={barStyles.topCell}>
            {p.hasValue && p.value > 0 && (
              <Text style={[barStyles.valueLabel, { color }]}>{p.value}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Bars */}
      <View style={barStyles.row}>
        {points.map((p, i) => {
          const h = !p.hasValue || p.value === 0 ? 2 : Math.max(4, (p.value / 3) * BAR_H)
          return (
            <View
              key={i}
              style={[
                barStyles.bar,
                {
                  height: h,
                  backgroundColor: p.hasValue && p.value > 0 ? color : '#D1D5DB',
                  opacity: p.hasValue ? 1 : 0.4,
                },
              ]}
            />
          )
        })}
      </View>

      {/* Date labels below bars — one per bar, same flex layout */}
      <View style={barStyles.bottomLabels}>
        {points.map((_, i) => (
          <View key={i} style={barStyles.bottomCell}>
            <Text style={barStyles.dateLabel}>{xLabels[i]?.label ?? ''}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const barStyles = StyleSheet.create({
  wrapper: { gap: 2 },
  topLabels: {
    flexDirection: 'row',
    height: 13,
  },
  topCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  valueLabel: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: BAR_H,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
  },
  bottomLabels: {
    flexDirection: 'row',
    marginTop: 3,
  },
  bottomCell: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'center',
  },
})

// ── SymptomChart ─────────────────────────────────────────────────────────────

interface SymptomChartProps {
  label: string
  points: DataPoint[]
  color: string
  avgLabel: string
  range: TimeRange
  xLabels: XLabel[]
}

function SymptomChart({ label, points, color, avgLabel, range, xLabels }: SymptomChartProps) {
  const avg = computeAvg(points)
  return (
    <View style={symptomStyles.card}>
      <View style={symptomStyles.header}>
        <Text style={symptomStyles.label} numberOfLines={2}>{label}</Text>
        <Text style={[symptomStyles.avg, { color }]}>
          {avg === '—' ? avg : avgLabel.replace('{{value}}', avg)}
        </Text>
      </View>
      {range === '7J'
        ? <BarChart points={points} color={color} xLabels={xLabels} />
        : <LineChart points={points} color={color} xLabels={xLabels} />
      }
    </View>
  )
}

const symptomStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 17,
  },
  avg: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 0,
  },
})

// ── RangeSelector ────────────────────────────────────────────────────────────

const RANGES: TimeRange[] = ['7J', '1M', '6M', '1A']

interface RangeSelectorProps {
  value: TimeRange
  onChange: (r: TimeRange) => void
  labels: Record<TimeRange, string>
  color: string
}

function RangeSelector({ value, onChange, labels, color }: RangeSelectorProps) {
  return (
    <View style={rangeStyles.row}>
      {RANGES.map(r => (
        <Pressable
          key={r}
          style={[rangeStyles.btn, value === r && { backgroundColor: color, borderColor: color }]}
          onPress={() => onChange(r)}
        >
          <Text style={[rangeStyles.label, value === r && rangeStyles.labelActive]}>
            {labels[r]}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

const rangeStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  btn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.white,
  },
})

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MedicationSideEffectsHistoryScreen() {
  const navigation = useNavigation<Nav>()
  const { isTeenMode, teenColor } = useTeen()
  const { t, i18n } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const accentColor = teenColor(SCALE_ID) ?? MODULE_COLOR
  const patient = useAuthStore(s => s.patient)

  const [entries, setEntries] = useState<ScaleEntry[]>([])
  const [events, setEvents] = useState<SideEffectsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('1M')

  React.useEffect(() => {
    navigation.setOptions({ title: t(`modules.${SCALE_ID}.label`) })
  }, [t, navigation])

  useFocusEffect(
    useCallback(() => {
      let active = true
      const load = async () => {
        const [entriesData, eventsData] = await Promise.all([
          getAllScaleEntries(SCALE_ID),
          patient?.id ? fetchModuleEvents(patient.id, SCALE_ID) : Promise.resolve([]),
        ])
        if (!active) return
        setEntries(entriesData)
        setEvents(eventsData)
        setLoading(false)
      }
      load().catch(() => { if (active) setLoading(false) })
      return () => { active = false }
    }, [patient?.id])
  )

  const locale = i18n.language

  const chartData = useMemo(
    () => Object.fromEntries(
      SYMPTOM_KEYS.map(key => [key, buildChartData(entries, key, timeRange)])
    ) as Record<string, DataPoint[]>,
    [entries, timeRange]
  )

  const xLabels = useMemo(
    () => buildXLabels(timeRange, locale),
    [timeRange, locale]
  )

  const streak = useMemo(() => computeStreak(entries), [entries])

  const rangeLabels: Record<TimeRange, string> = {
    '7J': t(`modules.${SCALE_ID}.range_7j`),
    '1M': t(`modules.${SCALE_ID}.range_1m`),
    '6M': t(`modules.${SCALE_ID}.range_6m`),
    '1A': t(`modules.${SCALE_ID}.range_1a`),
  }
  const avgLabel     = t(`modules.${SCALE_ID}.chart_avg`)
  const chartSection = t(`modules.${SCALE_ID}.chart_section`)
  const scoreLabel   = t(`modules.${SCALE_ID}.score_label`)
  const scoreMax     = t(`modules.${SCALE_ID}.score_max`)
  const newBtnLabel  = t(`modules.${SCALE_ID}.new_btn`)
  const emptyTitle   = t(`modules.${SCALE_ID}.empty_title`)
  const emptyText    = t(`modules.${SCALE_ID}.empty_text`)

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      t('common.delete_record_title'),
      t('common.irreversible'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteScaleEntry(id)
            setEntries(prev => prev.filter(e => e.id !== id))
          },
        },
      ]
    )
  }, [t])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={accentColor} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <TeenAccent color={accentColor} />
      <ScrollView contentContainerStyle={styles.container}>

        {/* Streak badge */}
        {streak > 0 && (
          <View style={[styles.streakBadge, { borderColor: accentColor }]}>
            <MaterialCommunityIcons name="fire" size={18} color={accentColor} />
            <Text style={[styles.streakText, { color: accentColor }]}>
              {streak === 1
                ? t(`modules.${SCALE_ID}.streak`, { count: streak })
                : t(`modules.${SCALE_ID}.streak_plural`, { count: streak })}
            </Text>
          </View>
        )}

        {/* Range selector + charts */}
        <View style={styles.section}>
          <Text style={typography.h3}>{chartSection}</Text>
          <RangeSelector
            value={timeRange}
            onChange={setTimeRange}
            labels={rangeLabels}
            color={accentColor}
          />
          <View style={styles.chartGrid}>
            {SYMPTOM_KEYS.map(key => (
              <SymptomChart
                key={key}
                label={t(`modules.${SCALE_ID}.${SYMPTOM_LABEL_KEYS[key]}`)}
                points={chartData[key]}
                color={accentColor}
                avgLabel={avgLabel}
                range={timeRange}
                xLabels={xLabels}
              />
            ))}
          </View>
        </View>

        {/* Events from practitioner */}
        {events.length > 0 && (
          <View style={styles.section}>
            <Text style={typography.h3}>{t(`modules.${SCALE_ID}.events_title`)}</Text>
            <View style={styles.eventsList}>
              {events
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((ev, idx) => (
                  <View key={idx} style={[styles.eventRow, { borderLeftColor: accentColor }]}>
                    <Text style={styles.eventDate}>
                      {new Date(ev.date).toLocaleDateString(locale)}
                    </Text>
                    <Text style={styles.eventLabel}>{ev.label}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* New entry button */}
        <Pressable
          style={[styles.newBtn, { backgroundColor: accentColor }]}
          onPress={() => navigation.navigate('ScaleEntry', { scale_id: SCALE_ID })}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
          <Text style={styles.newBtnText}>{newBtnLabel}</Text>
        </Pressable>

        {/* Entry list */}
        {entries.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {entries.map(entry => {
              const notes = entry.subscale_scores?.['notes'] as string | undefined
              return (
                <Pressable
                  key={entry.id}
                  style={styles.card}
                  onPress={() => navigation.navigate('ScaleEntry', { scale_id: SCALE_ID, entry_id: entry.id })}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.modify')}
                >
                  <View style={styles.cardMain}>
                    <Text style={styles.cardDate}>{formatDateLong(entry.created_at)}</Text>
                    <View style={styles.scoreRow}>
                      <Text style={styles.scoreLabel}>{scoreLabel}</Text>
                      <Text style={[styles.scoreValue, { color: accentColor }]}>
                        {Math.round(entry.total_score)}
                        <Text style={styles.scoreMax}> {scoreMax}</Text>
                      </Text>
                    </View>
                    {entry.subscale_scores != null && (
                      <View style={styles.chips}>
                        {SYMPTOM_KEYS.map(key => {
                          const val = entry.subscale_scores![key] as number | undefined
                          if (val == null) return null
                          return (
                            <View key={key} style={styles.chip}>
                              <Text style={styles.chipKey}>
                                {t(`modules.${SCALE_ID}.chip_${key}`)}
                              </Text>
                              <Text style={styles.chipValue}>{val}</Text>
                            </View>
                          )
                        })}
                      </View>
                    )}
                    {!!notes && (
                      <Text style={styles.noteInline} numberOfLines={2}>{notes}</Text>
                    )}
                  </View>
                  <View style={styles.cardActions}>
                    <MaterialCommunityIcons name="pencil-outline" size={17} color={accentColor} />
                    <Pressable
                      onPress={() => handleDelete(entry.id)}
                      hitSlop={8}
                      accessibilityLabel={t('common.delete')}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={17} color={colors.textMuted} />
                    </Pressable>
                  </View>
                </Pressable>
              )
            })}
          </View>
        )}

        <View style={styles.note}>
          <MaterialCommunityIcons name="information-outline" size={14} color={colors.textMuted} />
          <Text style={styles.noteText}>{t(`modules.${SCALE_ID}.footer`)}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
  section: { gap: spacing.sm },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: colors.card,
  },
  streakText: { fontWeight: '700', fontSize: 14 },
  chartGrid: { gap: spacing.sm },
  eventsList: { gap: spacing.xs },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingLeft: spacing.sm,
    borderLeftWidth: 3,
    paddingVertical: 4,
  },
  eventDate: { fontSize: 12, fontWeight: '600', color: colors.textMuted, minWidth: 80 },
  eventLabel: { fontSize: 13, color: colors.text, flex: 1 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  newBtnText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: 8 },
  emptyTitle: { ...typography.h3, color: colors.textMuted, textAlign: 'center' },
  emptyText: { ...typography.caption, textAlign: 'center', maxWidth: 280 },
  list: { gap: spacing.sm },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardMain: { flex: 1 },
  cardDate: { ...typography.caption, marginBottom: 6 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  scoreLabel: { fontSize: 13, color: colors.textMuted },
  scoreValue: { fontSize: 22, fontWeight: '700' },
  scoreMax: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  chips: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipKey: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  chipValue: { fontSize: 11, color: colors.text },
  noteInline: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 6,
  },
  cardActions: { flexDirection: 'column', alignItems: 'center', gap: 10, paddingLeft: spacing.sm },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.sm,
  },
  noteText: { fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 17 },
})
