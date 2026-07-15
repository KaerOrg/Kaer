// Onglet « Mois » du bilan de l'agenda du sommeil : navigation mensuelle,
// calendrier (encodage neutre conforme MDR : nuit renseignée vs non, pas de
// gradient de qualité), carte de moyennes brutes (anneau d'efficacité + durée +
// endormissement), tuiles (réveils / nuits / cauchemars), légende.

import { useMemo } from 'react'
import { View, Text } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Button } from '@ui/Button'
import { ProgressRing } from '@ui/ProgressRing'
import { computeSleepEfficiency, type SleepEntry } from '../../../../../lib/database'
import type { Lbl } from './types'
import { daysInMonth, sleepMinutes, formatMinutes } from './sleepHelpers'
import { SleepCalendar } from './SleepCalendar'
import { styles } from './styles'

interface Props {
  lbl: Lbl
  t: (key: string) => string
  monthYear: number
  monthNum: number
  monthEntries: SleepEntry[]
  now: Date
  locale: string
  onPrevMonth: () => void
  onNextMonth: () => void
}

export function SleepMonthView({ lbl, t, monthYear, monthNum, monthEntries, now, locale, onPrevMonth, onNextMonth }: Props) {
  const monthEntryByDate = useMemo(() => {
    const map: Record<string, SleepEntry> = {}
    for (const e of monthEntries) map[e.date] = e
    return map
  }, [monthEntries])

  const totalDays = daysInMonth(monthYear, monthNum)
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
    .toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  const monthSummaryTitle = lbl('month_summary_title')
  const legendTitle = lbl('legend_title')

  return (
    <View testID="sleep-journal-month">
      <View style={styles.monthNavInline}>
        <Button
          variant="ghost"
          onPress={onPrevMonth}
          accessibilityLabel={lbl('prev_month_label') || t('common.previous')}
          testID="month-prev"
          iconLeft={<MaterialCommunityIcons name="chevron-left" size={26} color={colors.primary} />}
        />
        <Text style={styles.monthTitle}>{monthLabel}</Text>
        <Button
          variant="ghost"
          onPress={onNextMonth}
          disabled={isCurrentMonth}
          accessibilityLabel={lbl('next_month_label') || t('common.next')}
          testID="month-next"
          iconLeft={<MaterialCommunityIcons name="chevron-right" size={26} color={isCurrentMonth ? colors.border : colors.primary} />}
        />
      </View>

      <SleepCalendar
        monthYear={monthYear}
        monthNum={monthNum}
        monthEntryByDate={monthEntryByDate}
        now={now}
      />

      {monthSummaryTitle ? <Text style={styles.sectionTitle}>{monthSummaryTitle}</Text> : null}
      <View style={styles.summaryCard}>
        <ProgressRing
          value={avgEfficiency ?? 0}
          max={100}
          size={84}
          label={avgEfficiency !== null ? `${avgEfficiency} %` : '-'}
          color={colors.primary}
          accessibilityLabel={lbl('stat_avg_efficiency_label')}
        />
        <View style={styles.summaryFacts}>
          <Text style={styles.summaryEfficiencyLabel}>{lbl('stat_avg_efficiency_label')}</Text>
          <View style={styles.summaryFactRow}>
            <Text style={styles.summaryFactValue}>{avgSleep !== null ? formatMinutes(avgSleep) : '-'}</Text>
            <Text style={styles.summaryFactLabel}>{lbl('stat_avg_duration_label')}</Text>
          </View>
          <View style={styles.summaryFactRow}>
            <Text style={styles.summaryFactValue}>{avgOnset !== null ? formatMinutes(avgOnset) : '-'}</Text>
            <Text style={styles.summaryFactLabel}>{lbl('stat_avg_onset_label')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{avgAwakenings !== null ? String(avgAwakenings) : '-'}</Text>
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
    </View>
  )
}
