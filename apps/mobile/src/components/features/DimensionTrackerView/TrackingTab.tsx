import React, { useCallback, useMemo, useState, type ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing, radius, typography } from '@theme'
import { SEASONALITY_CURRENT_COLOR, SEASONALITY_PAST_COLOR } from '@kaer/shared'
import { Radio, type RadioOption } from '@ui/Radio'
import {
  DimensionChart, buildXLabels, type TimeRange, type DataPoint,
} from '@ui/Chart/TimeRangeCharts'
import type { ScaleEntry } from '../../../lib/database'
import { SymptomRibbon, buildRibbonGrid } from '../SymptomRibbon'
import { SeasonalityStrip, buildSeasonality } from '../SeasonalityStrip'

// ─── Onglet « Suivi » (mood_tracker) ─────────────────────────────────────────
//
// Fusionne l'ancienne « Évolution » et l'ancienne « Vue mensuelle ». De haut en
// bas : sélecteur de mois, ruban multi-symptômes du mois, courbes de tendance par
// dimension, saisonnalité pluri-annuelle, repères (injectés par le parent). La
// moyenne composite trompeuse est retirée (MDR). Le sélecteur de mois pilote le
// ruban ; les courbes gardent leur propre sélecteur de plage.

const SEASON_YEARS = 5

export interface TrackingTabProps {
  readonly entries: readonly ScaleEntry[]
  readonly dimensionKeys: readonly string[]
  readonly dimLabel: (key: string) => string
  readonly ribbonDimensions: readonly { key: string; label: string; color: string }[]
  readonly midColors: Record<string, string>
  readonly yMax: number
  readonly accentColor: string
  readonly locale: string
  readonly timeRange: TimeRange
  readonly rangeOptions: readonly RadioOption[]
  readonly onRangeChange: (v: string) => void
  readonly chartData: Record<string, DataPoint[]>
  readonly showSeasonality: boolean
  readonly seasonDimension: string
  /** Carte des repères, rendue et pilotée par le parent (partagée avec charts). */
  readonly markersSlot: ReactNode
  readonly labels: {
    readonly ribbonTitle: string
    readonly assiduity: (done: number, total: number) => string
    readonly ribbonLegend: string
    readonly chartSection: string
    readonly emptyText: string
    readonly seasonTitle: string
    readonly seasonHint: string
    readonly seasonCompare: string
  }
  readonly testID?: string
}

export const TrackingTab = React.memo(function TrackingTab({
  entries, dimensionKeys, dimLabel, ribbonDimensions, midColors, yMax, accentColor,
  locale, timeRange, rangeOptions, onRangeChange, chartData,
  showSeasonality, seasonDimension, markersSlot, labels, testID,
}: TrackingTabProps) {
  const now = useMemo(() => new Date(), [])
  const [viewed, setViewed] = useState({ year: now.getFullYear(), month: now.getMonth() })

  const isCurrentMonth = viewed.year === now.getFullYear() && viewed.month === now.getMonth()

  const shiftMonth = useCallback((delta: number) => {
    setViewed(prev => {
      const d = new Date(prev.year, prev.month + delta, 1)
      // Jamais au-delà du mois courant.
      if (d.getFullYear() > now.getFullYear() ||
        (d.getFullYear() === now.getFullYear() && d.getMonth() > now.getMonth())) {
        return prev
      }
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }, [now])

  const goPrev = useCallback(() => shiftMonth(-1), [shiftMonth])
  const goNext = useCallback(() => shiftMonth(1), [shiftMonth])

  const monthLabel = useMemo(
    () => new Date(viewed.year, viewed.month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
    [viewed, locale]
  )

  const grid = useMemo(
    () => buildRibbonGrid(entries, dimensionKeys, viewed.year, viewed.month),
    [entries, dimensionKeys, viewed]
  )

  const ribbonTitle = `${labels.ribbonTitle} · ${grid.daysInMonth} j.`

  const seasonYears = useMemo(
    () => Array.from({ length: SEASON_YEARS }, (_, i) => now.getFullYear() - i),
    [now]
  )
  const seasonRows = useMemo(
    () => buildSeasonality(entries, seasonDimension, seasonYears),
    [entries, seasonDimension, seasonYears]
  )
  const monthInitials = useMemo(
    () => Array.from({ length: 12 }, (_, m) =>
      new Date(2021, m, 1).toLocaleDateString(locale, { month: 'narrow' })),
    [locale]
  )

  const xLabels = useMemo(() => buildXLabels(timeRange, locale), [timeRange, locale])

  return (
    <View style={styles.section} testID={testID}>
      {/* Sélecteur de mois */}
      <View style={styles.monthBar}>
        <Pressable onPress={goPrev} hitSlop={8} style={styles.monthNav} accessibilityRole="button">
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable
          onPress={goNext}
          hitSlop={8}
          style={[styles.monthNav, isCurrentMonth && styles.monthNavDisabled]}
          disabled={isCurrentMonth}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="chevron-right" size={24} color={isCurrentMonth ? colors.border : colors.text} />
        </Pressable>
      </View>

      <SymptomRibbon
        dimensions={ribbonDimensions}
        grid={grid}
        yMax={yMax}
        title={ribbonTitle}
        assiduityLabel={labels.assiduity(grid.filledDays, grid.daysInMonth)}
        legendLabel={labels.ribbonLegend}
        testID="symptom-ribbon"
      />

      {showSeasonality ? (
        <SeasonalityStrip
          rows={seasonRows}
          currentYear={now.getFullYear()}
          yMax={yMax}
          monthLabels={monthInitials}
          currentColor={SEASONALITY_CURRENT_COLOR}
          pastColor={SEASONALITY_PAST_COLOR}
          title={`${labels.seasonTitle} · ${dimLabel(seasonDimension)}`}
          hint={labels.seasonHint}
          compareLabel={labels.seasonCompare}
          testID="seasonality-strip"
        />
      ) : null}

      {markersSlot}

      {/* Détail par dimension */}
      <Text style={typography.h3}>{labels.chartSection}</Text>
      {entries.length === 0 ? (
        <Text style={styles.empty}>{labels.emptyText}</Text>
      ) : (
        <>
          <Radio options={rangeOptions} value={timeRange} onChange={onRangeChange} variant="pills" color={accentColor} />
          <View style={styles.chartGrid}>
            {dimensionKeys.map(key => (
              <DimensionChart
                key={key}
                label={dimLabel(key)}
                points={chartData[key]}
                color={midColors[key] ?? accentColor}
                avgLabel=""
                range={timeRange}
                xLabels={xLabels}
                yMax={yMax}
              />
            ))}
          </View>
        </>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  monthBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  monthNav: { padding: 4 },
  monthNavDisabled: { opacity: 0.4 },
  monthLabel: { fontSize: 15, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  chartGrid: { gap: spacing.sm },
  empty: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
})
