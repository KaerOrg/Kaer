// Grille calendrier mensuelle de l'agenda du sommeil.
// Encodage neutre conforme MDR : « nuit renseignée vs non » (pas de gradient de
// qualité), badge cauchemar discret. Aucune interprétation clinique.

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { View, Text } from 'react-native'
import { colors } from '@theme'
import type { SleepEntry } from '../../../../../lib/database'
import { WEEKDAYS_SHORT, daysInMonth, firstWeekday, toYearMonth } from './sleepHelpers'
import { styles } from './styles'

interface Props {
  monthYear: number
  monthNum: number
  /** Entrées du mois indexées par date 'YYYY-MM-DD'. */
  monthEntryByDate: Record<string, SleepEntry>
  /** Date de référence (pour distinguer aujourd'hui / futur). */
  now: Date
}

export function SleepCalendar({ monthYear, monthNum, monthEntryByDate, now }: Props) {
  const totalDays = daysInMonth(monthYear, monthNum)
  const offset = firstWeekday(monthYear, monthNum)
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const isCurrentMonth = monthYear === now.getFullYear() && monthNum === now.getMonth() + 1

  return (
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
  )
}
