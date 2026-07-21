import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Button } from '@ui/Button'
import type { FearEntry, FearSituation } from '../../../../../lib/database'
import type { ExposureConfig } from './types'
import { sessionCount, lastSessionScore } from './exposureLogic'
import { LadderEmpty } from './LadderEmpty'
import { LadderRow } from './LadderRow'
import { etStyles } from './styles'

export interface LadderListProps {
  steps: FearSituation[]
  entries: FearEntry[]
  config: ExposureConfig
  lbl: (k: string, opts?: Record<string, string | number>) => string
  onOpenStep: (id: string) => void
  onAddStep: () => void
}

/**
 * Échelle de la peur : marches classées du moins → plus angoissant.
 * Affichage passif (#183) — barre de difficulté proportionnelle + pastille
 * « Dernier pic » (aucune coche, aucune valence, aucun jugement).
 */
export function LadderList({
  steps, entries, config, lbl, onOpenStep, onAddStep,
}: LadderListProps) {
  if (steps.length === 0) {
    return (
      <View style={etStyles.container}>
        <LadderEmpty accent={config.peakColor} lbl={lbl} onCreate={onAddStep} />
      </View>
    )
  }

  return (
    <View style={etStyles.container} testID="exposure-ladder">
      <ScrollView contentContainerStyle={etStyles.listContent}>
        <Text style={etStyles.historyTitle}>{lbl('ladder_sort_hint')}</Text>

        {steps.map(step => (
          <LadderRow
            key={step.id}
            step={step}
            count={sessionCount(entries, step.id)}
            lastPeak={lastSessionScore(entries, step.id)}
            config={config}
            lbl={lbl}
            onOpen={onOpenStep}
          />
        ))}
      </ScrollView>

      <Button
        variant="primary"
        label={lbl('add_step')}
        iconLeft={<MaterialCommunityIcons name="plus" size={22} color={colors.white} />}
        onPress={onAddStep}
        style={etStyles.fab}
        testID="add-step-fab"
      />
    </View>
  )
}
