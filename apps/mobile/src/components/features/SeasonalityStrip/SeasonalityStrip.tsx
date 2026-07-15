import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing, radius } from '@theme'
import { ribbonCellOpacity } from '@kaer/shared'
import { YearCheckbox } from './YearCheckbox'
import type { SeasonYearRow } from './seasonality'

// ─── Saisonnalité — frise pluri-annuelle des moyennes mensuelles ─────────────
//
// Superpose jusqu'à 5 années pour une dimension. L'année en cours est marquée
// (teinte soutenue), les années comparées plus claires — hiérarchie visuelle,
// pas de sémantique clinique (MDR : magnitude d'une moyenne descriptive seule).
// Comparaison désactivée par défaut (UX épurée) : dépliée via « Comparer », menu
// compact de cases à cocher (pas de bulles pleine largeur).

const MAX_YEARS = 5

export interface SeasonalityStripProps {
  /** Années disponibles, récent → ancien ; la première est l'année en cours. */
  readonly rows: readonly SeasonYearRow[]
  readonly currentYear: number
  readonly yMax: number
  /** 12 initiales de mois (J F M A M J J A S O N D), localisées par le parent. */
  readonly monthLabels: readonly string[]
  readonly currentColor: string
  readonly pastColor: string
  readonly title: string
  readonly hint: string
  readonly compareLabel: string
  readonly testID?: string
}

export const SeasonalityStrip = React.memo(function SeasonalityStrip({
  rows, currentYear, yMax, monthLabels, currentColor, pastColor,
  title, hint, compareLabel, testID,
}: SeasonalityStripProps) {
  const [comparing, setComparing] = useState(false)
  const [selectedPast, setSelectedPast] = useState<ReadonlySet<number>>(new Set())

  const pastYears = useMemo(
    () => rows.map(r => r.year).filter(y => y !== currentYear).slice(0, MAX_YEARS - 1),
    [rows, currentYear]
  )

  const togglePastYear = useCallback((year: number) => {
    setSelectedPast(prev => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }, [])

  const toggleComparing = useCallback(() => setComparing(v => !v), [])

  const visibleRows = useMemo(
    () => rows.filter(r => r.year === currentYear || (comparing && selectedPast.has(r.year))),
    [rows, currentYear, comparing, selectedPast]
  )

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {pastYears.length > 0 ? (
          <Pressable
            style={[styles.compareBtn, comparing && { borderColor: currentColor }]}
            onPress={toggleComparing}
            accessibilityRole="button"
            accessibilityState={{ expanded: comparing }}
          >
            <MaterialCommunityIcons name="layers-outline" size={14} color={comparing ? currentColor : colors.textMuted} />
            <Text style={[styles.compareText, comparing && { color: currentColor }]}>{compareLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.hint}>{hint}</Text>

      {comparing && pastYears.length > 0 ? (
        <View style={styles.compareMenu}>
          {pastYears.map(year => (
            <YearCheckbox
              key={year}
              year={year}
              checked={selectedPast.has(year)}
              color={pastColor}
              onToggle={togglePastYear}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.grid}>
        {visibleRows.map(row => {
          const isCurrent = row.year === currentYear
          const color = isCurrent ? currentColor : pastColor
          return (
            <View key={row.year} style={styles.yearRow}>
              <Text style={[styles.yearLabel, isCurrent && styles.yearLabelCurrent]}>{row.year}</Text>
              <View style={styles.cells}>
                {row.months.map((value, m) => {
                  const opacity = ribbonCellOpacity(value, yMax)
                  return (
                    <View
                      key={m}
                      style={[
                        styles.cell,
                        opacity == null ? styles.cellEmpty : { backgroundColor: color, opacity },
                      ]}
                    />
                  )
                })}
              </View>
            </View>
          )
        })}

        <View style={styles.monthsRow}>
          <View style={styles.yearSpacer} />
          <View style={styles.cells}>
            {monthLabels.map((label, m) => (
              <Text key={m} style={styles.monthLabel}>{label}</Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, gap: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  title: { fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1 },
  compareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
  },
  compareText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  hint: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },

  compareMenu: { gap: 4, paddingVertical: 2 },

  grid: { gap: 4 },
  yearRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  yearLabel: { fontSize: 12, color: colors.textMuted, width: 40 },
  yearLabelCurrent: { fontWeight: '700', color: colors.text },
  yearSpacer: { width: 40 },
  cells: { flex: 1, flexDirection: 'row', gap: 2 },
  cell: { flex: 1, height: 18, borderRadius: 3 },
  cellEmpty: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },

  monthsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  monthLabel: { flex: 1, fontSize: 9, color: colors.textMuted, textAlign: 'center' },
})
