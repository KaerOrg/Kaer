// Mode « liste » de l'agenda du sommeil : CTA de saisie, accès au Bilan,
// historique des N dernières nuits (barre « fenêtre de sommeil »), note de bas
// de page (sources MDR).

import { ScrollView, View, Text, Pressable } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@theme'
import type { SleepEntry } from '../../../../../lib/database'
import { formatDateShort } from '../../../../../lib/dateUtils'
import type { ContentField } from '@services/moduleService'
import type { Lbl } from './types'
import { lastNDays, yesterdayDateStr } from './sleepHelpers'
import { SleepNightRow } from './SleepNightRow'
import { styles } from './styles'

interface Props {
  entries: SleepEntry[]
  lbl: Lbl
  t: (key: string) => string
  historyDays: number
  qualityMax: number
  footer?: ContentField
  onOpenEntry: (date: string) => void
  onOpenBilan: () => void
}

export function SleepListView({ entries, lbl, t, historyDays, qualityMax, footer, onOpenEntry, onOpenBilan }: Props) {
  const entryByDate: Record<string, SleepEntry> = {}
  for (const e of entries) entryByDate[e.date] = e
  const days = lastNDays(historyDays)
  const ctaTitle = lbl('cta_title')
  const bilanLabel = lbl('bilan_button_label') || lbl('monthly_button_label') || t('common.calendar')
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
          onPress={onOpenBilan}
          accessibilityRole="button"
          testID="cta-bilan"
        >
          <View style={styles.ctaRow}>
            <MaterialCommunityIcons name="chart-box-outline" size={20} color={colors.primary} />
            <Text style={styles.monthBtnText}>{bilanLabel}</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Pressable>
      </View>

      {listHeader ? <Text style={styles.listHeader}>{listHeader}</Text> : null}

      {days.map(date => (
        <SleepNightRow
          key={date}
          date={date}
          entry={entryByDate[date] ?? null}
          qualityMax={qualityMax}
          emptyLabel={emptyDayLabel}
          incompleteLabel={incompleteLabel}
          onPress={onOpenEntry}
        />
      ))}

      {footer != null && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
          <Text style={styles.footerText}>{t(footer.text_code ?? '')}</Text>
        </View>
      )}
    </ScrollView>
  )
}
