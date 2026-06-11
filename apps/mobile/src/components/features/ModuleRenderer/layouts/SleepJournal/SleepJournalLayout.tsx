// ─── Layout `sleep_journal` — agenda du sommeil (sleep_diary) ────────────────
//
// Pattern « journal quotidien horodaté » : 3 modes internes (list/entry/month),
// time pickers natifs, calcul d'efficacité du sommeil affiché en valeur brute,
// grille calendrier mensuelle. Persistance dans la table SQLite dédiée
// `sleep_diary_entries` (UNIQUE par date).
// Conformité MDR 2017/745 : aucun seuil interprétatif, juste affichage des
// valeurs brutes saisies par le patient. La couleur de la qualité est une
// convention d'affichage (4-5 étoiles = vert), pas une interprétation clinique.

import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  View, Text, Pressable, ScrollView, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { colors } from '../../../../../theme'
import type { ContentField } from '../../../../../services/moduleService'
import {
  getAllSleepEntries, getSleepEntry, getSleepEntriesForMonth,
  computeSleepDuration, computeSleepEfficiency, generateId,
  type SleepEntry,
} from '../../../../../lib/database'
import { saveSleepEntry, deleteSleepEntry } from '../../../../../services/sleepDiaryService'
import { formatDateFull, formatDateShort } from '../../../../../lib/dateUtils'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { useToast } from '../../../../../contexts/ToastContext'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import { styles } from './styles'

const WEEKDAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const

function toHHMM(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

function fromHHMM(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

function yesterdayDateStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function lastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = 1; i <= n; i += 1) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function toYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function firstWeekday(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay()
  return (day + 6) % 7
}

function sleepMinutes(entry: SleepEntry): number | null {
  if (!entry.bedtime || !entry.wake_time) return null
  const [bH, bM] = entry.bedtime.split(':').map(Number)
  const [wH, wM] = entry.wake_time.split(':').map(Number)
  let total = wH * 60 + wM - (bH * 60 + bM) - (entry.sleep_onset_minutes ?? 0)
  if (total < 0) total += 24 * 60
  return total
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h${String(m).padStart(2, '0')}`
}

function qualityColorOf(quality: number | null, qualityWarning: number, qualityGood: number): string {
  if (quality === null) return colors.border
  if (quality >= qualityGood) return colors.success
  if (quality >= qualityWarning) return '#F59E0B'
  return colors.danger
}

export interface SleepJournalLayoutProps {
  /** Fields du module (config). */
  fields: ContentField[]
  /** Note de bas de page MDR (sources scientifiques) — affichée en mode liste. */
  footer?: ContentField
}

export function SleepJournalLayout({ fields, footer }: SleepJournalLayoutProps) {
  const t = useModuleTranslation()
  const { showToast } = useToast()
  const { showConfirm } = useConfirmDialog()

  const configField = fields.find(f => f.field_type === 'sleep_journal_config')
  const lbl = (key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }
  const historyDays = parseInt(configField?.props['history_days'] ?? '14', 10)
  const awakeningsMax = parseInt(configField?.props['awakenings_max'] ?? '20', 10)
  const onsetMaxMinutes = parseInt(configField?.props['onset_max_minutes'] ?? '180', 10)
  const awakDurationMaxMinutes = parseInt(configField?.props['awak_duration_max_minutes'] ?? '300', 10)
  const efficiencyGood = parseInt(configField?.props['efficiency_good'] ?? '85', 10)
  const efficiencyWarning = parseInt(configField?.props['efficiency_warning'] ?? '70', 10)
  const qualityMax = parseInt(configField?.props['quality_max'] ?? '5', 10)
  const qualityGoodThreshold = parseInt(configField?.props['quality_good_threshold'] ?? '4', 10)
  const qualityAvgThreshold = parseInt(configField?.props['quality_avg_threshold'] ?? '3', 10)

  const now = useMemo(() => new Date(), [])

  // ── State
  const [mode, setMode] = useState<'list' | 'entry' | 'month'>('list')
  const [entries, setEntries] = useState<SleepEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Mode entry
  const [targetDate, setTargetDate] = useState<string>(yesterdayDateStr())
  const [existingId, setExistingId] = useState<string | null>(null)
  const [bedtime, setBedtime] = useState<Date>(() => { const d = new Date(); d.setHours(23, 0, 0, 0); return d })
  const [wakeTime, setWakeTime] = useState<Date>(() => { const d = new Date(); d.setHours(7, 0, 0, 0); return d })
  const [onsetMinutes, setOnsetMinutes] = useState(0)
  const [awakenings, setAwakenings] = useState(0)
  const [awakeningsDuration, setAwakeningsDuration] = useState(0)
  const [nightmares, setNightmares] = useState(false)
  const [quality, setQuality] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [showBedtimePicker, setShowBedtimePicker] = useState(false)
  const [showWakePicker, setShowWakePicker] = useState(false)

  // Mode month
  const [monthYear, setMonthYear] = useState(now.getFullYear())
  const [monthNum, setMonthNum] = useState(now.getMonth() + 1)
  const [monthEntries, setMonthEntries] = useState<SleepEntry[]>([])

  // Hide the React Navigation header in entry mode — the inner header carries the title.
  const navigation = useNavigation()
  useEffect(() => {
    navigation.setOptions({ headerShown: mode !== 'entry' })
  }, [navigation, mode])

  // ── Loaders
  const loadEntries = useCallback(async () => {
    const data = await getAllSleepEntries()
    setEntries(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadEntries().catch(() => setLoading(false)) }, [loadEntries])

  const loadMonth = useCallback(async (year: number, monthVal: number) => {
    const data = await getSleepEntriesForMonth(toYearMonth(year, monthVal))
    setMonthEntries(data)
  }, [])

  // ── Navigation
  const handleOpenEntry = useCallback(async (date: string) => {
    setTargetDate(date)
    const entry = await getSleepEntry(date)
    if (entry) {
      setExistingId(entry.id)
      if (entry.bedtime) setBedtime(fromHHMM(entry.bedtime))
      else { const d = new Date(); d.setHours(23, 0, 0, 0); setBedtime(d) }
      if (entry.wake_time) setWakeTime(fromHHMM(entry.wake_time))
      else { const d = new Date(); d.setHours(7, 0, 0, 0); setWakeTime(d) }
      setOnsetMinutes(entry.sleep_onset_minutes ?? 0)
      setAwakenings(entry.awakenings ?? 0)
      setAwakeningsDuration(entry.awakenings_duration_minutes ?? 0)
      setNightmares(entry.nightmares === 1)
      setQuality(entry.quality)
      setNotes(entry.notes ?? '')
    } else {
      setExistingId(null)
      const b = new Date(); b.setHours(23, 0, 0, 0); setBedtime(b)
      const w = new Date(); w.setHours(7, 0, 0, 0); setWakeTime(w)
      setOnsetMinutes(0)
      setAwakenings(0)
      setAwakeningsDuration(0)
      setNightmares(false)
      setQuality(null)
      setNotes('')
    }
    setMode('entry')
  }, [])

  const handleOpenMonth = useCallback(() => {
    void loadMonth(monthYear, monthNum)
    setMode('month')
  }, [loadMonth, monthYear, monthNum])

  const handleBackToList = useCallback(() => {
    void loadEntries()
    setMode('list')
  }, [loadEntries])

  // ── Save / delete
  const handleSave = useCallback(async () => {
    if (quality === null) {
      showToast(lbl('quality_missing_msg') || t('common.warning'), 'info')
      return
    }
    setSaving(true)
    try {
      await saveSleepEntry({
        id: existingId ?? generateId(),
        date: targetDate,
        bedtime: toHHMM(bedtime),
        wake_time: toHHMM(wakeTime),
        sleep_onset_minutes: onsetMinutes,
        awakenings,
        awakenings_duration_minutes: awakeningsDuration,
        nightmares: nightmares ? 1 : 0,
        quality,
        notes: notes.trim() || null,
      })
      await loadEntries()
      setMode('list')
    } catch {
      showToast(t('common.save_error'), 'error')
    } finally {
      setSaving(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, existingId, targetDate, bedtime, wakeTime, onsetMinutes, awakenings, awakeningsDuration, nightmares, notes, loadEntries, t, showToast])

  const handleDelete = useCallback(() => {
    if (!existingId) return
    showConfirm({
      title: lbl('delete_title') || t('common.delete'),
      message: t('common.irreversible'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: async () => {
        await deleteSleepEntry(existingId)
        await loadEntries()
        setMode('list')
      },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingId, loadEntries, t, showConfirm])

  // ── Month nav
  const goPrevMonth = useCallback(() => {
    let y = monthYear, m = monthNum
    if (m === 1) { y -= 1; m = 12 } else { m -= 1 }
    setMonthYear(y)
    setMonthNum(m)
    void loadMonth(y, m)
  }, [monthYear, monthNum, loadMonth])

  const goNextMonth = useCallback(() => {
    const nowYear = now.getFullYear()
    const nowMonth = now.getMonth() + 1
    if (monthYear > nowYear || (monthYear === nowYear && monthNum >= nowMonth)) return
    let y = monthYear, m = monthNum
    if (m === 12) { y += 1; m = 1 } else { m += 1 }
    setMonthYear(y)
    setMonthNum(m)
    void loadMonth(y, m)
  }, [monthYear, monthNum, loadMonth, now])

  // ── Sleep efficiency (computed live in entry mode)
  const liveSE = useMemo(
    () => computeSleepEfficiency(toHHMM(bedtime), toHHMM(wakeTime), onsetMinutes, awakeningsDuration),
    [bedtime, wakeTime, onsetMinutes, awakeningsDuration]
  )
  const seColor = liveSE === null ? colors.danger
    : liveSE >= efficiencyGood ? colors.success
    : liveSE >= efficiencyWarning ? '#F59E0B'
    : colors.danger

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  // ── MODE LIST ───────────────────────────────────────────────────────────
  if (mode === 'list') {
    const entryByDate: Record<string, SleepEntry> = {}
    for (const e of entries) entryByDate[e.date] = e
    const days = lastNDays(historyDays)
    const ctaTitle = lbl('cta_title')
    const monthlyLabel = lbl('monthly_button_label') || t('common.calendar')
    const listHeader = lbl('list_header')
    const incompleteLabel = lbl('incomplete_label')
    const emptyDayLabel = lbl('empty_day_label')

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.listContent} testID="sleep-journal-list">
        <View style={styles.ctaContainer}>
          <Pressable
            style={styles.ctaCard}
            onPress={() => handleOpenEntry(yesterdayDateStr())}
            accessibilityRole="button"
            testID="cta-yesterday"
          >
            <View style={styles.ctaRow}>
              <MaterialCommunityIcons name="weather-night" size={32} color={colors.white} />
              <View style={styles.ctaTexts}>
                {ctaTitle ? <Text style={styles.ctaTitle}>{ctaTitle}</Text> : null}
                <Text style={styles.ctaSubtitle}>{formatDateShort(yesterdayDateStr())}</Text>
              </View>
              <Text style={styles.chevronWhite}>›</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.monthCard}
            onPress={handleOpenMonth}
            accessibilityRole="button"
            testID="cta-month"
          >
            <View style={styles.ctaRow}>
              <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.primary} />
              <Text style={styles.monthBtnText}>{monthlyLabel}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>
        </View>

        {listHeader ? <Text style={styles.listHeader}>{listHeader}</Text> : null}

        {days.map(date => {
          const entry = entryByDate[date]
          const filled = entry != null
          return (
            <Pressable
              key={date}
              style={[styles.dayRow, filled && styles.dayRowFilled]}
              onPress={() => handleOpenEntry(date)}
              accessibilityRole="button"
              testID={`day-${date}`}
            >
              <View style={[styles.dot, filled ? styles.dotFilled : styles.dotEmpty]} />
              <View style={styles.dayInfo}>
                <Text style={[styles.dayDate, filled && styles.dayDateFilled]}>{formatDateShort(date)}</Text>
                {filled && entry.bedtime && entry.wake_time ? (
                  <View style={styles.entryDetails}>
                    <Text style={styles.entryMeta}>
                      {entry.bedtime} → {entry.wake_time}
                      {'  '}
                      <Text style={styles.entryMetaStrong}>
                        ({computeSleepDuration(entry.bedtime, entry.wake_time, entry.sleep_onset_minutes)})
                      </Text>
                    </Text>
                    {entry.quality !== null ? (
                      <View style={styles.starsRow}>
                        {Array.from({ length: qualityMax }, (_, i) => (
                          <MaterialCommunityIcons
                            key={i}
                            name={i < (entry.quality ?? 0) ? 'star' : 'star-outline'}
                            size={14}
                            color={i < (entry.quality ?? 0) ? colors.stars : colors.border}
                          />
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : filled ? (
                  <Text style={styles.entryMeta}>{incompleteLabel}</Text>
                ) : (
                  <Text style={styles.emptyDay}>{emptyDayLabel}</Text>
                )}
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )
        })}

        {footer != null && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
            <Text style={styles.footerText}>{t(footer.text_code ?? '')}</Text>
          </View>
        )}
      </ScrollView>
    )
  }

  // ── MODE MONTH ──────────────────────────────────────────────────────────
  if (mode === 'month') {
    const monthEntryByDate: Record<string, SleepEntry> = {}
    for (const e of monthEntries) monthEntryByDate[e.date] = e
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
            onPress={handleBackToList}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={lbl('back_label') || t('common.back')}
            testID="month-back-button"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Pressable onPress={goPrevMonth} style={styles.navBtn} accessibilityRole="button" testID="month-prev">
            <MaterialCommunityIcons name="chevron-left" size={26} color={colors.primary} />
          </Pressable>
          <Text style={styles.monthTitle}>{monthLabel}</Text>
          <Pressable
            onPress={goNextMonth}
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
                  const bg = entry
                    ? qualityColorOf(entry.quality, qualityAvgThreshold, qualityGoodThreshold)
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
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendLabel}>{lbl('legend_good_label')}</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendLabel}>{lbl('legend_average_label')}</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
              <Text style={styles.legendLabel}>{lbl('legend_bad_label')}</Text>
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

  // ── MODE ENTRY ──────────────────────────────────────────────────────────
  const onsetConv = (() => {
    if (onsetMinutes === 0) return null
    const h = Math.floor(onsetMinutes / 60)
    const m = onsetMinutes % 60
    if (h > 0 && m > 0) return `= ${h}h${String(m).padStart(2, '0')}`
    if (h > 0) return `= ${h}h00`
    return null
  })()
  const awakDurConv = (() => {
    if (awakeningsDuration === 0) return null
    const h = Math.floor(awakeningsDuration / 60)
    const m = awakeningsDuration % 60
    if (h > 0 && m > 0) return `= ${h}h${String(m).padStart(2, '0')}`
    if (h > 0) return `= ${h}h00`
    return null
  })()
  const qualityLabels = [
    lbl('quality_label_1'),
    lbl('quality_label_2'),
    lbl('quality_label_3'),
    lbl('quality_label_4'),
    lbl('quality_label_5'),
  ]
  const saveLabel = existingId
    ? (lbl('update_label') || t('common.update'))
    : (lbl('save_label') || t('common.save'))
  const tapModify = lbl('tap_to_modify_hint')
  const minutesUnit = lbl('minutes_unit') || 'min'

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
      testID="sleep-journal-entry"
    >
      <View style={styles.entryHeaderBar} testID="entry-date-header">
        <Pressable
          onPress={handleBackToList}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={lbl('back_label') || t('common.back')}
          testID="entry-back-button"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.entryHeaderTitle}>
          <Text style={styles.dateLabel}>{lbl('date_label')}</Text>
          <Text style={styles.dateValue}>{formatDateFull(targetDate)}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.entryContent} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{lbl('section_schedule_title')}</Text>
          <View style={styles.card}>
            <View style={styles.timeFieldGroup}>
              <Text style={styles.fieldLabel}>{lbl('bedtime_label')}</Text>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setShowBedtimePicker(true)}
                accessibilityRole="button"
                testID="bedtime-btn"
              >
                <MaterialCommunityIcons name="clock-outline" size={20} color={colors.textMuted} />
                <Text style={styles.timeValue}>{toHHMM(bedtime)}</Text>
                {tapModify ? <Text style={styles.timeHint}>{tapModify}</Text> : null}
              </TouchableOpacity>
              {showBedtimePicker ? (
                <DateTimePicker
                  value={bedtime}
                  mode="time"
                  is24Hour
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, date) => {
                    if (Platform.OS === 'android') setShowBedtimePicker(false)
                    if (date) setBedtime(date)
                  }}
                />
              ) : null}
              {showBedtimePicker && Platform.OS === 'ios' ? (
                <Pressable style={styles.confirmBtn} onPress={() => setShowBedtimePicker(false)}>
                  <Text style={styles.confirmBtnText}>{lbl('confirm_label') || t('common.ok')}</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.divider} />

            <View style={styles.timeFieldGroup}>
              <Text style={styles.fieldLabel}>{lbl('wake_time_label')}</Text>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setShowWakePicker(true)}
                accessibilityRole="button"
                testID="wake-time-btn"
              >
                <MaterialCommunityIcons name="clock-outline" size={20} color={colors.textMuted} />
                <Text style={styles.timeValue}>{toHHMM(wakeTime)}</Text>
                {tapModify ? <Text style={styles.timeHint}>{tapModify}</Text> : null}
              </TouchableOpacity>
              {showWakePicker ? (
                <DateTimePicker
                  value={wakeTime}
                  mode="time"
                  is24Hour
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, date) => {
                    if (Platform.OS === 'android') setShowWakePicker(false)
                    if (date) setWakeTime(date)
                  }}
                />
              ) : null}
              {showWakePicker && Platform.OS === 'ios' ? (
                <Pressable style={styles.confirmBtn} onPress={() => setShowWakePicker(false)}>
                  <Text style={styles.confirmBtnText}>{lbl('confirm_label') || t('common.ok')}</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.divider} />

            <View style={styles.timeFieldGroup}>
              <Text style={styles.fieldLabel}>{lbl('onset_label')}</Text>
              <View style={styles.minutesRow}>
                <TextInput
                  style={styles.minutesInput}
                  value={onsetMinutes > 0 ? String(onsetMinutes) : ''}
                  onChangeText={(raw) => {
                    const parsed = parseInt(raw, 10)
                    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= onsetMaxMinutes) setOnsetMinutes(parsed)
                    else if (raw === '') setOnsetMinutes(0)
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.border}
                  maxLength={3}
                  returnKeyType="done"
                  testID="onset-input"
                />
                <Text style={styles.minutesUnit}>{minutesUnit}</Text>
                {onsetConv ? <Text style={styles.minutesConv}>{onsetConv}</Text> : null}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{lbl('section_awakenings_title')}</Text>
          <View style={styles.card}>
            <View style={styles.timeFieldGroup}>
              <Text style={styles.fieldLabel}>{lbl('awakenings_label')}</Text>
              <View style={styles.counterRow}>
                <Pressable
                  style={[styles.counterBtn, awakenings <= 0 && styles.counterBtnDisabled]}
                  onPress={() => awakenings > 0 && setAwakenings(awakenings - 1)}
                  accessibilityRole="button"
                  accessibilityLabel="-"
                  testID="awakenings-minus"
                >
                  <Text style={styles.counterBtnText}>−</Text>
                </Pressable>
                <Text style={styles.counterValue} testID="awakenings-value">{awakenings}</Text>
                <Pressable
                  style={[styles.counterBtn, awakenings >= awakeningsMax && styles.counterBtnDisabled]}
                  onPress={() => awakenings < awakeningsMax && setAwakenings(awakenings + 1)}
                  accessibilityRole="button"
                  accessibilityLabel="+"
                  testID="awakenings-plus"
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.timeFieldGroup}>
              <Text style={styles.fieldLabel}>{lbl('awakenings_duration_label')}</Text>
              <View style={styles.minutesRow}>
                <TextInput
                  style={styles.minutesInput}
                  value={awakeningsDuration > 0 ? String(awakeningsDuration) : ''}
                  onChangeText={(raw) => {
                    const parsed = parseInt(raw, 10)
                    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= awakDurationMaxMinutes) setAwakeningsDuration(parsed)
                    else if (raw === '') setAwakeningsDuration(0)
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.border}
                  maxLength={3}
                  returnKeyType="done"
                  testID="awak-duration-input"
                />
                <Text style={styles.minutesUnit}>{minutesUnit}</Text>
                {awakDurConv ? <Text style={styles.minutesConv}>{awakDurConv}</Text> : null}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{lbl('section_nightmares_title')}</Text>
          <Pressable
            style={[styles.card, styles.toggleRow]}
            onPress={() => setNightmares(!nightmares)}
            accessibilityRole="switch"
            accessibilityState={{ checked: nightmares }}
            testID="nightmares-toggle"
          >
            <View style={styles.toggleLeft}>
              <MaterialCommunityIcons
                name="ghost"
                size={22}
                color={nightmares ? colors.danger : colors.textMuted}
              />
              <Text style={styles.toggleLabel}>{lbl('nightmares_label')}</Text>
            </View>
            <View style={[styles.switchTrack, nightmares && styles.switchTrackOn]}>
              <View style={[styles.switchThumb, nightmares && styles.switchThumbOn]} />
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{lbl('section_quality_title')}</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>{lbl('quality_label')}</Text>
            <View style={styles.starsBig}>
              {Array.from({ length: qualityMax }, (_, i) => {
                const n = i + 1
                return (
                  <Pressable
                    key={n}
                    onPress={() => setQuality(n)}
                    accessibilityRole="button"
                    accessibilityLabel={String(n)}
                    testID={`quality-star-${n}`}
                  >
                    <MaterialCommunityIcons
                      name={n <= (quality ?? 0) ? 'star' : 'star-outline'}
                      size={36}
                      color={n <= (quality ?? 0) ? colors.stars : colors.border}
                    />
                  </Pressable>
                )
              })}
            </View>
            {quality !== null && qualityLabels[quality - 1] ? (
              <Text style={styles.qualityLabel}>{qualityLabels[quality - 1]}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{lbl('section_notes_title')}</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder={lbl('notes_placeholder')}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              testID="notes-input"
            />
          </View>
        </View>

        {liveSE !== null ? (
          <View style={[styles.seCard, { borderColor: seColor }]} testID="sleep-efficiency">
            <View style={styles.seRow}>
              <MaterialCommunityIcons name="sleep" size={20} color={seColor} />
              <Text style={styles.seTitle}>{lbl('efficiency_label')}</Text>
              <Text style={[styles.seScore, { color: seColor }]}>{liveSE} %</Text>
            </View>
          </View>
        ) : null}

        <Pressable
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={saveLabel}
          testID="save-button"
        >
          <Text style={styles.saveBtnText}>{saving ? '…' : saveLabel}</Text>
          {!saving ? <MaterialCommunityIcons name="check" size={20} color={colors.white} /> : null}
        </Pressable>
        {existingId ? (
          <Pressable
            style={styles.deleteBtn}
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel={lbl('delete_label') || t('common.delete')}
            testID="delete-button"
          >
            <Text style={styles.deleteBtnText}>{lbl('delete_label') || t('common.delete')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
