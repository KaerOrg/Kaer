import React, { useMemo, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing, radius } from '../../../../theme'
import type { ChartEntry } from '../chartTypes'

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

interface DayEntry {
  date: string
  avg: number
  hasEntry: boolean
}

// Marqueur de jour générique : une couleur (et libellé optionnel) par date YYYY-MM-DD.
// Contrat metier-free — le design system ne connaît ni statut médical ni i18n de domaine.
export interface DayMarker {
  color: string
  label?: string
}

interface Props {
  accentColor: string
  locale: string
  daysLabel: string      // ex. « jours saisis »
  legendLabel: string    // ex. « Saisie effectuée — intensité = opacité »
  // Mode 1 (par défaut) : intensité dérivée d'un score moyen sur des dimensions.
  entries?: ChartEntry[]
  dimensionKeys?: readonly string[]
  // Mode 2 : couleur explicite par jour (pastilles neutres fournies par l'appelant).
  // Quand fourni, prime sur le mode score/opacité.
  dayMarkers?: ReadonlyMap<string, DayMarker>
}

function buildMonthGrid(year: number, month: number): (string | null)[][] {
  const firstDay = new Date(year, month, 1)
  const startDow = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (string | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const rows: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
  return rows
}

// Mappe le score moyen (1-10) vers une opacité entre 0.25 et 1
function scoreToOpacity(avg: number): number {
  return 0.25 + 0.75 * ((avg - 1) / 9)
}

export function MonthCalendar({ entries = [], dimensionKeys = [], accentColor, locale, daysLabel, legendLabel, dayMarkers }: Props) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const entryMap = useMemo<Map<string, DayEntry>>(() => {
    const map = new Map<string, DayEntry>()
    for (const e of entries) {
      const dateStr = e.created_at.slice(0, 10)
      const vals = dimensionKeys
        .map(k => e.subscale_scores?.[k] as number | undefined)
        .filter((v): v is number => v != null && v > 0)
      if (vals.length === 0) continue
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length
      map.set(dateStr, { date: dateStr, avg, hasEntry: true })
    }
    return map
  }, [entries, dimensionKeys])

  // Présence d'une saisie un jour donné, quel que soit le mode.
  const hasEntryOn = (dateStr: string): boolean =>
    dayMarkers ? dayMarkers.has(dateStr) : entryMap.has(dateStr)

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])
  const todayStr = today.toISOString().slice(0, 10)

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(locale, {
    month: 'long', year: 'numeric',
  })

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }
  const canGoNext = viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth < today.getMonth())

  // Légende : nombre de jours saisis ce mois
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysWithEntry = Array.from({ length: daysInMonth }, (_, i) => {
    const d = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
    return hasEntryOn(d) ? 1 : 0
  }).reduce<number>((s, v) => s + v, 0)

  return (
    <View style={styles.container}>
      {/* Navigation mois */}
      <View style={styles.nav}>
        <Pressable onPress={prevMonth} style={styles.navBtn} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable
          onPress={nextMonth}
          style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
          hitSlop={12}
          disabled={!canGoNext}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={canGoNext ? colors.text : colors.border}
          />
        </Pressable>
      </View>

      {/* Badge saisies du mois */}
      <View style={[styles.badge, { borderColor: accentColor }]}>
        <MaterialCommunityIcons name="check-circle-outline" size={14} color={accentColor} />
        <Text style={[styles.badgeText, { color: accentColor }]}>
          {daysWithEntry} / {daysInMonth} {daysLabel}
        </Text>
      </View>

      {/* En-têtes jours de semaine */}
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((d, i) => (
          <Text key={i} style={styles.weekday}>{d}</Text>
        ))}
      </View>

      {/* Grille */}
      {grid.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((dateStr, di) => {
            if (!dateStr) return <View key={di} style={styles.dayCell} />

            const entry = entryMap.get(dateStr)
            const marker = dayMarkers?.get(dateStr)
            const filled = dayMarkers ? marker != null : entry != null
            const fillColor = marker ? marker.color : accentColor
            const fillOpacity = dayMarkers ? 1 : (entry ? scoreToOpacity(entry.avg) : 1)
            const isToday = dateStr === todayStr
            const isFuture = dateStr > todayStr

            return (
              <View key={di} style={styles.dayCell}>
                {filled ? (
                  // Jour avec saisie : cercle plein coloré (pastille neutre en mode dayMarkers)
                  <View
                    style={[
                      styles.dayFilled,
                      {
                        backgroundColor: fillColor,
                        opacity: fillOpacity,
                      },
                      isToday && { borderWidth: 2, borderColor: colors.text },
                    ]}
                  >
                    <Text style={styles.dayNumFilled}>
                      {new Date(dateStr + 'T12:00:00').getDate()}
                    </Text>
                  </View>
                ) : (
                  // Jour sans saisie
                  <View
                    style={[
                      styles.dayEmpty,
                      isToday && { borderColor: accentColor, borderWidth: 2 },
                      isFuture && styles.dayFuture,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNum,
                        isToday && { color: accentColor, fontWeight: '700' },
                        isFuture && styles.dayNumFuture,
                      ]}
                    >
                      {new Date(dateStr + 'T12:00:00').getDate()}
                    </Text>
                  </View>
                )}
              </View>
            )
          })}
        </View>
      ))}

      {/* Légende */}
      <View style={styles.legend}>
        <View style={[styles.legendDot, { backgroundColor: accentColor }]} />
        <Text style={styles.legendText}>{legendLabel}</Text>
      </View>
    </View>
  )
}

const CELL = 40

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: { padding: 4 },
  navBtnDisabled: { opacity: 0.3 },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
    flex: 1,
    textAlign: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    backgroundColor: colors.card,
  },
  badgeText: { fontSize: 13, fontWeight: '600' },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekday: {
    width: CELL,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    paddingVertical: 2,
  },
  dayCell: {
    width: CELL,
    height: CELL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayFilled: {
    width: CELL - 4,
    height: CELL - 4,
    borderRadius: (CELL - 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumFilled: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dayEmpty: {
    width: CELL - 4,
    height: CELL - 4,
    borderRadius: (CELL - 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayNum: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMuted,
  },
  dayFuture: {
    borderColor: 'transparent',
  },
  dayNumFuture: {
    color: colors.border,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
  },
})
