import React from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '../../../../../theme'
import type { FearEntry, FearSituation } from '../../../../../lib/database'
import { DisclaimerBanner } from '../../../DisclaimerBanner'
import type { ExposureConfig } from './types'
import { sessionCount } from './exposureLogic'
import { etStyles } from './styles'

export interface LadderListProps {
  steps: FearSituation[]
  entries: FearEntry[]
  config: ExposureConfig
  moduleKey: string
  isTeenMode: boolean
  lbl: (k: string, opts?: Record<string, string | number>) => string
  onOpenStep: (id: string) => void
  onToggleDone: (step: FearSituation) => void
  onAddStep: () => void
}

/** Échelle de la peur : marches classées du moins → plus angoissant. */
export function LadderList({
  steps, entries, config, moduleKey, isTeenMode, lbl, onOpenStep, onToggleDone, onAddStep,
}: LadderListProps) {
  return (
    <View style={etStyles.container} testID="exposure-ladder">
      <ScrollView contentContainerStyle={etStyles.listContent}>
        <DisclaimerBanner moduleKey={moduleKey} isTeenMode={isTeenMode} />

        {steps.length === 0 ? (
          <View style={etStyles.empty} testID="ladder-empty">
            <MaterialCommunityIcons name="stairs" size={52} color={colors.border} />
            <Text style={etStyles.emptyTitle}>{lbl('ladder_empty_title')}</Text>
            <Text style={etStyles.emptyText}>{lbl('ladder_empty_text')}</Text>
          </View>
        ) : (
          steps.map(step => {
            const count = sessionCount(entries, step.id)
            const done = step.is_done === 1
            return (
              <Pressable
                key={step.id}
                style={etStyles.ladderRow}
                onPress={() => onOpenStep(step.id)}
                testID={`step-${step.id}`}
              >
                <Pressable
                  style={[etStyles.ladderCheckbox, done && etStyles.ladderCheckboxDone]}
                  onPress={() => onToggleDone(step)}
                  hitSlop={8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: done }}
                  accessibilityLabel={lbl('step_done')}
                  testID={`step-done-${step.id}`}
                >
                  {done ? <MaterialCommunityIcons name="check" size={16} color={colors.white} /> : null}
                </Pressable>
                <View style={etStyles.ladderRowText}>
                  <Text style={etStyles.ladderRowTitle} numberOfLines={2}>{step.label}</Text>
                  <View style={etStyles.ladderRowMeta}>
                    {step.target_suds != null ? (
                      <View style={etStyles.targetChip}>
                        <Text style={etStyles.targetChipText}>{lbl('step_target', { value: step.target_suds })}</Text>
                      </View>
                    ) : null}
                    <Text style={etStyles.ladderMetaText}>{lbl('step_sessions', { n: count })}</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>
            )
          })
        )}
      </ScrollView>

      <Pressable
        style={etStyles.fab}
        onPress={onAddStep}
        accessibilityRole="button"
        accessibilityLabel={lbl('add_step')}
        testID="add-step-fab"
      >
        <MaterialCommunityIcons name="plus" size={22} color={colors.white} />
        <Text style={etStyles.fabText}>{lbl('add_step')}</Text>
      </Pressable>
    </View>
  )
}
