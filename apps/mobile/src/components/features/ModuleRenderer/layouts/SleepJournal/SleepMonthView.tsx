// Mode « mois » de l'agenda du sommeil : calendrier (encodage neutre conforme MDR :
// nuit renseignée vs non, pas de gradient de qualité), stats moyennes brutes, légende.

import { useMemo } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '../../../../../theme'
import { computeSleepEfficiency, type SleepEntry } from '../../../../../lib/database'
import type { Lbl } from './types'
import { WEEKDAYS_SHORT, daysInMonth, firstWeekday, toYearMonth, sleepMinutes, formatMinutes } from './sleepHelpers'
import { styles } from './styles'

interface Props {
  lbl: Lbl
  t: (key: string) => string
  monthYear: number
  monthNum: number
  monthEntries: SleepEntry[]
  now: Date
  onBack: () => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

export function SleepMonthView({ lbl, t, monthYear, monthNum, monthEntries, now, onBack, onPrevMonth, onNextMonth }: Props) {
  const monthEntryByDate = useMemo(() => {
    const map: Record<string, SleepEntry> = {}
    for (const e of monthEntries) map[e.date] = e
    return map
  }, [monthEntries])

  const totalDays = daysInMonth(monthYear, monthNum)
  const offset = firstWeekday(monthYear, monthNum)
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const isCurrentMonth = monthYear === now.getFullYear() && monthNum === now.getMonth() + 1

  const filledEntries = monthEntries.filter(e => e.quality !== null)
  const sleepDurations = monthEntries.map(sleepMinutes).filter((m): m is number => m !== null)
  const avgSleep = sleepDurations.length > 0
    ? Math.round(sleepDurations.reduce((a, b) => a + b, 0) / sleepDurations.length)
    : null
  const efficiencies = monthEntries
    .map(e => e.bedtime && e.wake_time
      ? computeSleepEfficiency(e.bedtime, e.wake_time, e.sleep_onset_minutes, e.awakenings_duration_minutes, e.in_bed_time, e.out_of_bed_time)
      : null)
    .filter((v): v is number => v !== null)
  const avgEfficiency = efficiencies.length > 0
    ? Math.round(efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length)
    : null
  const onsetEntries = monthEntries.filter(e => e.bedtime && e.wake_time)
  const avgOnset = onsetEntries.length > 0
    ? Math.round(onsetEntries.reduce((a, e) => a + (e.sleep_onset_minutes ?? 0), 0) / onsetEntries.length)
    : null
  const awakEntries = monthEntries.filter(e => e.awakenings != null)
  const avgAwakenings = awakEntries.length > 0
    ? Math.round((awakEntries.reduce((a, e) => a + (e.awakenings ?? 0), 0) / awakEntries.length) * 10) / 10
    : null
  const nightmaresCount = monthEntries.filter(e => e.nightmares === 1).length

  const monthLabel = new Date(monthYear, monthNum - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const monthSummaryTitle = lbl('month_summary_title')
  const legendTitle = lbl('legend_title')

  return (
    <View style={styles.container} testID="sleep-journal-month">
      <View style={styles.monthNav}>
        <Pressable
          onPress={onBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={lbl('back_label') || t('common.back')}
          testID="month-back-button"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Pressable onPress={onPrevMonth} style={styles.navBtn} accessibilityRole="button" testID="month-prev">
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.primary} />
        </Pressable>
        <Text style={styles.monthTitle}>{monthLabel}</Text>
        <Pressable
          onPress={onNextMonth}
          style={[styles.navBtn, isCurrentMonth && styles.navBtnDisabled]}
          accessibilityRole="button"
          testID="month-next"
          disabled={isCurrentMonth}
        >
          <MaterialCommunityIcons name="chevron-right" size={26} color={isCurrentMonth ? colors.border : colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.monthContent}>
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            {WEEKDAYS_SHORT.map((d, i) => (
              <Text key={i} style={styles.weekday}>{d}</Text>
            ))}
          </View>
          {Array.from({ length: cells.length / 7 }, (_, rowIdx) => (
            <View key={rowIdx} style={styles.calendarRow}>
              {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
                if (!day) return <View key={colIdx} style={styles.calendarCell} />
                const dateStr = `${toYearMonth(monthYear, monthNum)}-${String(day).padStart(2, '0')}`
                const entry = monthEntryByDate[dateStr]
                const isFuture = isCurrentMonth && day > now.getDate()
                const isToday = isCurrentMonth && day === now.getDate()
                // Encodage neutre conforme MDR : nuit renseignée vs non, sans
                // jugement de qualité (pas de gradient bon/mauvais).
                const bg = entry
                  ? colors.primary
                  : isFuture ? 'transparent' : colors.border
                const hasNightmare = entry?.nightmares === 1
                return (
                  <View key={colIdx} style={styles.calendarCell}>
                    <View style={[styles.dayDot, { backgroundColor: bg }, isToday && styles.dayDotToday]}>
                      <Text style={[styles.dayNum, entry ? styles.dayNumFilled : isFuture ? styles.dayNumFuture : null]}>
                        {day}
                      </Text>
                      {hasNightmare ? (
                        <View style={styles.nightmareBadge}>
                          <MaterialCommunityIcons name="ghost" size={8} color={colors.white} />
                        </View>
                      ) : null}
                    </View>
                  </View>
                )
              })}
            </View>
          ))}
        </View>

        {monthSummaryTitle ? <Text style={styles.sectionTitle}>{monthSummaryTitle}</Text> : null}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{avgSleep !== null ? formatMinutes(avgSleep) : '–'}</Text>
            <Text style={styles.statLabel}>{lbl('stat_avg_duration_label')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{avgEfficiency !== null ? `${avgEfficiency} %` : '–'}</Text>
            <Text style={styles.statLabel}>{lbl('stat_avg_efficiency_label')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{avgOnset !== null ? formatMinutes(avgOnset) : '–'}</Text>
            <Text style={styles.statLabel}>{lbl('stat_avg_onset_label')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{avgAwakenings !== null ? String(avgAwakenings) : '–'}</Text>
            <Text style={styles.statLabel}>{lbl('stat_avg_awakenings_label')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{`${filledEntries.length}/${totalDays}`}</Text>
            <Text style={styles.statLabel}>{lbl('stat_nights_filled_label')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{String(nightmaresCount)}</Text>
            <Text style={styles.statLabel}>{lbl('stat_nightmares_label')}</Text>
          </View>
        </View>

        {legendTitle ? <Text style={styles.sectionTitle}>{legendTitle}</Text> : null}
        <View style={styles.legendCard}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendLabel}>{lbl('legend_filled_label')}</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
            <Text style={styles.legendLabel}>{lbl('legend_empty_label')}</Text>
          </View>
          <View style={styles.legendRow}>
            <MaterialCommunityIcons name="ghost" size={13} color={colors.textMuted} />
            <Text style={styles.legendLabel}>{lbl('legend_nightmare_label')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
