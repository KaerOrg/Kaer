// Onglet « Évolution » du bilan de l'agenda du sommeil.
// Montre la donnée BRUTE sur le temps long (nuit par nuit + moyenne hebdomadaire),
// sans verdict ni ligne de tendance : l'analyse reste au praticien (note MDR en
// pied). Sélecteur de plage 1M/3M/6M, bascule métrique Durée/Efficacité.

import { useMemo, useState } from 'react'
import { View, Text } from 'react-native'
import { colors } from '@theme'
import { SegmentedControl } from '@ui/SegmentedControl'
import { LineChart, BarChart } from '@ui/Chart'
import type { SleepEntry } from '../../../../../lib/database'
import type { Lbl } from './types'
import {
  rangeStartIso, todayIso, buildNightlyPoints, buildNightlyLabels,
  buildWeeklyAverages, type SleepMetric, type EvolutionRange,
} from './sleepHelpers'
import { styles } from './styles'

interface Props {
  /** Entrées de la plage courante (chargées par l'orchestrateur). */
  entries: SleepEntry[]
  range: EvolutionRange
  onRangeChange: (range: EvolutionRange) => void
  lbl: Lbl
  /** Langue courante (libellés de mois de l'axe X). */
  locale: string
}

const RANGE_VALUES: EvolutionRange[] = ['1M', '3M', '6M']
const METRIC_VALUES: SleepMetric[] = ['duration', 'efficiency']

export function SleepEvolutionView({ entries, range, onRangeChange, lbl, locale }: Props) {
  const [metric, setMetric] = useState<SleepMetric>('duration')

  const rangeOptions = useMemo(
    () => RANGE_VALUES.map(value => ({ value, label: lbl(`evolution_range_${value.toLowerCase()}`) || value })),
    [lbl],
  )
  const metricOptions = useMemo(
    () => METRIC_VALUES.map(value => ({ value, label: lbl(`evolution_metric_${value}`) || value })),
    [lbl],
  )

  const fromIso = rangeStartIso(range)
  const toIso = todayIso()
  const weekPrefix = lbl('evolution_week_prefix') || 'S'

  const nightly = useMemo(() => buildNightlyPoints(entries, metric, fromIso, toIso), [entries, metric, fromIso, toIso])
  const nightlyLabels = useMemo(() => buildNightlyLabels(fromIso, toIso, locale), [fromIso, toIso, locale])
  const weekly = useMemo(
    () => buildWeeklyAverages(entries, metric, fromIso, toIso, weekPrefix),
    [entries, metric, fromIso, toIso, weekPrefix],
  )
  const maxY = metric === 'efficiency' ? 100 : 12

  return (
    <View style={styles.evolutionContent} testID="sleep-evolution">
      <SegmentedControl
        options={rangeOptions}
        value={range}
        onChange={onRangeChange}
        accessibilityLabel={lbl('evolution_range_label')}
        testID="evolution-range"
      />
      <SegmentedControl
        options={metricOptions}
        value={metric}
        onChange={setMetric}
        variant="pills"
        accessibilityLabel={lbl('evolution_metric_label')}
        testID="evolution-metric"
      />

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{lbl('evolution_nightly_title')}</Text>
        <LineChart points={nightly} color={colors.primary} xLabels={nightlyLabels} maxY={maxY} />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{lbl('evolution_weekly_title')}</Text>
        <BarChart points={weekly.points} color={colors.primary} xLabels={weekly.labels} maxY={maxY} />
      </View>

      {lbl('evolution_mdr_note') ? (
        <Text style={styles.evolutionNote}>{lbl('evolution_mdr_note')}</Text>
      ) : null}
    </View>
  )
}
