import React, { useMemo } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../../../../theme'
import {
  daysInMonth,
  toISODate,
  timeToFraction,
  type AnchorEntry,
  type AnchorSpec,
} from './chronoMonthUtils'

const BAND_HEIGHT = 144
const DOT_D = 6
const Y_TICKS: ReadonlyArray<{ label: string; frac: number }> = [
  { label: '0h',  frac: 0    },
  { label: '6h',  frac: 0.25 },
  { label: '12h', frac: 0.5  },
  { label: '18h', frac: 0.75 },
  { label: '24h', frac: 1    },
]
const DAY_MARKERS = [1, 8, 15, 22, 29]

interface Props {
  year: number
  month: number
  entriesByDate: ReadonlyMap<string, AnchorEntry>
  todayISO: string
  anchors: readonly AnchorSpec[]
  onDayPress: (iso: string) => void
}

// Bande de rythme mensuelle : 1 colonne par jour, 5 ancrages affichés
// comme des points positionnés selon l'heure (axe Y 0-24h).
// MDR : visualisation passive des horaires bruts saisis. Aucune analyse
// de régularité, aucun seuil, aucune couleur d'alerte.
export function RhythmBand({
  year,
  month,
  entriesByDate,
  todayISO,
  anchors,
  onDayPress,
}: Props) {
  const days = daysInMonth(year, month)
  const dayRange = useMemo(
    () => Array.from({ length: days }, (_, i) => i + 1),
    [days]
  )

  return (
    <View style={styles.wrapper} testID="chrono-rhythm-band">
      <View style={[styles.yAxis, { height: BAND_HEIGHT }]}>
        {Y_TICKS.map(({ label, frac }) => (
          <Text
            key={label}
            style={[styles.yLabel, { top: Math.round(frac * (BAND_HEIGHT - 10)) }]}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.bandColumn}>
        <View style={[styles.band, { height: BAND_HEIGHT }]}>
          {Y_TICKS.map(({ frac }) => (
            <View
              key={`gl${frac}`}
              style={[styles.gridLine, { top: Math.round(frac * BAND_HEIGHT) }]}
            />
          ))}

          <View style={[StyleSheet.absoluteFill, styles.columnsRow]}>
            {dayRange.map(day => {
              const iso = toISODate(year, month, day)
              const isFuture = iso > todayISO
              const isToday = iso === todayISO
              const entry = entriesByDate.get(iso)

              return (
                <Pressable
                  key={day}
                  style={[styles.dayCol, isToday && styles.dayColToday]}
                  onPress={isFuture ? undefined : () => onDayPress(iso)}
                  disabled={isFuture}
                >
                  {day > 1 && day % 7 === 1 ? <View style={styles.weekSep} /> : null}
                  {entry
                    ? anchors.map(({ key, color }) => {
                        const val = entry.anchors[key]
                        if (!val) return null
                        const topPx = Math.round(timeToFraction(val) * BAND_HEIGHT) - DOT_D / 2
                        return (
                          <View
                            key={key}
                            style={[styles.dot, { top: topPx, backgroundColor: color }]}
                          />
                        )
                      })
                    : null}
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={styles.dayMarkersRow}>
          {dayRange.map(day => (
            <View key={day} style={styles.dayMarkerCell}>
              {DAY_MARKERS.includes(day) ? (
                <Text style={styles.dayMarkerText}>{day}</Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  yAxis: { width: 28, position: 'relative' },
  yLabel: {
    position: 'absolute',
    left: 0,
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
  },
  bandColumn: { flex: 1 },
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
  columnsRow: { flexDirection: 'row' },
  dayCol: { flex: 1, position: 'relative' },
  dayColToday: { backgroundColor: colors.primaryLight, opacity: 0.9 },
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
  dayMarkersRow: { flexDirection: 'row', marginTop: 2, width: '100%' },
  dayMarkerCell: { flex: 1, alignItems: 'center' },
  dayMarkerText: { fontSize: 8, color: colors.textMuted },
})
