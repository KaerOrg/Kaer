import React from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '../../../../../theme'
import type { FearEntry, FearSituation } from '../../../../../lib/database'
import { DesensitizationChart } from '../../../../ui/Chart'
import type { ExposureConfig } from './types'
import { peakSeries, entriesForStep } from './exposureLogic'
import { SessionCard } from './SessionCard'
import { etStyles } from './styles'

export interface StepDetailProps {
  step: FearSituation
  entries: FearEntry[]
  config: ExposureConfig
  lbl: (k: string, opts?: Record<string, string | number>) => string
  tCommon: (k: string) => string
  resolveStrategyLabels: (entry: FearEntry) => string[]
  onBack: () => void
  onEditStep: () => void
  onDeleteStep: () => void
  onDoExposure: () => void
  onEditExposure: (entryId: string) => void
  onDeleteExposure: (entry: FearEntry) => void
}

/** Détail d'une marche : courbe de progression + historique des expositions. */
export function StepDetail({
  step, entries, config, lbl, tCommon, resolveStrategyLabels,
  onBack, onEditStep, onDeleteStep, onDoExposure, onEditExposure, onDeleteExposure,
}: StepDetailProps) {
  const series = peakSeries(entries, step.id)
  const sessions = entriesForStep(entries, step.id)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <View style={etStyles.container} testID="exposure-step-detail">
      <View style={etStyles.entryHeaderBar}>
        <Pressable onPress={onBack} style={etStyles.backBtn} accessibilityLabel={tCommon('common.back')} testID="detail-back">
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={etStyles.headerTitle} numberOfLines={1}>{step.label}</Text>
        <Pressable onPress={onEditStep} hitSlop={8} accessibilityLabel={tCommon('common.edit')} testID="detail-edit-step">
          <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
        </Pressable>
        <Pressable onPress={onDeleteStep} hitSlop={8} accessibilityLabel={tCommon('common.delete')} testID="detail-delete-step">
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={etStyles.listContent}>
        <View style={etStyles.chartCard}>
          {series.length === 0 ? (
            <Text style={etStyles.emptyText}>{lbl('detail_no_sessions')}</Text>
          ) : (
            <DesensitizationChart
              points={series}
              width={300}
              accentColor={colors.primary}
              yAxisLabel={lbl('chart_y_axis')}
              xAxisLabel={lbl('chart_x_axis')}
            />
          )}
        </View>

        {sessions.length > 0 ? (
          <Text style={etStyles.historyTitle}>{lbl('detail_history_title')}</Text>
        ) : null}
        {sessions.map(e => (
          <SessionCard
            key={e.id}
            entry={e}
            config={config}
            strategyLabels={resolveStrategyLabels(e)}
            lbl={lbl}
            tCommon={tCommon}
            onEdit={() => onEditExposure(e.id)}
            onDelete={() => onDeleteExposure(e)}
          />
        ))}
      </ScrollView>

      <Pressable
        style={etStyles.doExposureBtn}
        onPress={onDoExposure}
        accessibilityRole="button"
        accessibilityLabel={lbl('detail_do_exposure')}
        testID="do-exposure-btn"
      >
        <MaterialCommunityIcons name="thermometer-plus" size={22} color={colors.white} />
        <Text style={etStyles.doExposureText}>{lbl('detail_do_exposure')}</Text>
      </Pressable>
    </View>
  )
}
