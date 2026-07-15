// Mode « bilan » de l'agenda du sommeil : un seul écran à deux onglets
// (Mois | Évolution) via SegmentedControl. Supprime le doublon de l'ancien mode
// « mois » (le calendrier n'apparaît qu'une fois, le mini-graphe 7 nuits a migré
// vers l'onglet Évolution). L'onglet actif est un état de vue local ; les données
// (mois + plage d'évolution) sont possédées par l'orchestrateur.

import { useState, useMemo } from 'react'
import { View, Text, ScrollView } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Button } from '@ui/Button'
import { SegmentedControl } from '@ui/SegmentedControl'
import type { SleepEntry } from '../../../../../lib/database'
import type { Lbl } from './types'
import type { EvolutionRange } from './sleepHelpers'
import { SleepMonthView } from './SleepMonthView'
import { SleepEvolutionView } from './SleepEvolutionView'
import { styles } from './styles'

type BilanTab = 'month' | 'evolution'

interface Props {
  lbl: Lbl
  t: (key: string) => string
  locale: string
  monthYear: number
  monthNum: number
  monthEntries: SleepEntry[]
  now: Date
  evolutionEntries: SleepEntry[]
  evolutionRange: EvolutionRange
  onEvolutionRangeChange: (range: EvolutionRange) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onBack: () => void
}

export function SleepBilanView({
  lbl, t, locale, monthYear, monthNum, monthEntries, now,
  evolutionEntries, evolutionRange, onEvolutionRangeChange,
  onPrevMonth, onNextMonth, onBack,
}: Props) {
  const [tab, setTab] = useState<BilanTab>('month')

  const tabOptions = useMemo(() => [
    { value: 'month' as const, label: lbl('bilan_tab_month') || t('common.calendar') },
    { value: 'evolution' as const, label: lbl('bilan_tab_evolution') || '' },
  ], [lbl, t])

  return (
    <View style={styles.container} testID="sleep-journal-bilan">
      <View style={styles.monthNav}>
        <Button
          variant="ghost"
          onPress={onBack}
          accessibilityLabel={lbl('back_label') || t('common.back')}
          testID="bilan-back-button"
          iconLeft={<MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />}
        />
        <Text style={styles.monthTitle}>{lbl('bilan_title') || lbl('bilan_button_label')}</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.monthContent}>
        <SegmentedControl
          options={tabOptions}
          value={tab}
          onChange={setTab}
          accessibilityLabel={lbl('bilan_title') || lbl('bilan_button_label')}
          testID="bilan-tabs"
        />

        {tab === 'month' ? (
          <SleepMonthView
            lbl={lbl}
            t={t}
            monthYear={monthYear}
            monthNum={monthNum}
            monthEntries={monthEntries}
            now={now}
            locale={locale}
            onPrevMonth={onPrevMonth}
            onNextMonth={onNextMonth}
          />
        ) : (
          <SleepEvolutionView
            entries={evolutionEntries}
            range={evolutionRange}
            onRangeChange={onEvolutionRangeChange}
            lbl={lbl}
            locale={locale}
          />
        )}
      </ScrollView>
    </View>
  )
}
