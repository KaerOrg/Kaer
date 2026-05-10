import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors, spacing } from '../../../../theme'
import {
  firstWeekday,
  daysInMonth,
  toISODate,
  countFilledAnchors,
  type AnchorEntry,
} from './chronoMonthUtils'

const DAY_HEADERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

interface Props {
  year: number
  month: number
  entriesByDate: ReadonlyMap<string, AnchorEntry>
  todayISO: string
  anchorKeys: readonly string[]
  onDayPress: (dateISO: string) => void
}

// Grille de densité mensuelle : un point par jour rempli, vide sinon.
// MDR : aucun seuil interprétatif — le point est plein si tous les ancrages
// sont renseignés, semi-transparent sinon. Pas de couleur d'alerte.
export function CalendarGrid({
  year,
  month,
  entriesByDate,
  todayISO,
  anchorKeys,
  onDayPress,
}: Props) {
  const offset = firstWeekday(year, month)
  const days = daysInMonth(year, month)
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const rows = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7))

  return (
    <View style={styles.container} testID="chrono-month-grid">
      <View style={styles.row}>
        {DAY_HEADERS.map((h, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.dayHeader}>{h}</Text>
          </View>
        ))}
      </View>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((day, colIdx) => {
            if (!day) return <View key={colIdx} style={styles.cell} />
            const iso = toISODate(year, month, day)
            const isToday = iso === todayISO
            const isFuture = iso > todayISO
            const entry = entriesByDate.get(iso)
            const filled = entry ? countFilledAnchors(entry, anchorKeys) : 0

            return (
              <Pressable
                key={colIdx}
                style={styles.cell}
                onPress={isFuture ? undefined : () => onDayPress(iso)}
                disabled={isFuture}
                testID={`chrono-day-${day}`}
              >
                <Text
                  style={[
                    styles.dayNum,
                    isToday && styles.dayNumToday,
                    isFuture && styles.dayNumFuture,
                  ]}
                >
                  {day}
                </Text>
                {entry ? (
                  <View
                    style={[styles.dot, filled === anchorKeys.length && styles.dotFull]}
                  />
                ) : !isFuture ? (
                  <View style={styles.dotEmpty} />
                ) : null}
              </Pressable>
            )
          })}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
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
