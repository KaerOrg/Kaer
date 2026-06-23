// Mode « liste » de l'agenda du sommeil : CTA de saisie, accès vue mensuelle,
// historique des N dernières nuits, note de bas de page (sources MDR).

import { ScrollView, View, Text, Pressable } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@theme'
import { computeSleepDuration, type SleepEntry } from '../../../../../lib/database'
import { formatDateShort } from '../../../../../lib/dateUtils'
import type { ContentField } from '../../../../../services/moduleService'
import type { Lbl } from './types'
import { lastNDays, yesterdayDateStr } from './sleepHelpers'
import { styles } from './styles'

interface Props {
  entries: SleepEntry[]
  lbl: Lbl
  t: (key: string) => string
  historyDays: number
  qualityMax: number
  footer?: ContentField
  onOpenEntry: (date: string) => void
  onOpenMonth: () => void
}

export function SleepListView({ entries, lbl, t, historyDays, qualityMax, footer, onOpenEntry, onOpenMonth }: Props) {
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
          onPress={() => onOpenEntry(yesterdayDateStr())}
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
          onPress={onOpenMonth}
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
            onPress={() => onOpenEntry(date)}
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
