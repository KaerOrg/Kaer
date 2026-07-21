import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Button } from '@ui/Button'
import { Card } from '@ui/Card'
import type { FearEntry, FearSituation } from '../../../../../lib/database'
import { DesensitizationChart } from '@ui/Chart'
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

/** Détail d'une marche : courbe de désensibilisation + historique des expositions. */
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
        <Button
          variant="ghost"
          onPress={onBack}
          accessibilityLabel={tCommon('common.back')}
          iconLeft={<MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />}
          testID="detail-back"
        />
        <Text style={etStyles.headerTitle} numberOfLines={1}>{step.label}</Text>
        <Button
          variant="ghost"
          onPress={onEditStep}
          accessibilityLabel={tCommon('common.edit')}
          iconLeft={<MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />}
          testID="detail-edit-step"
        />
        <Button
          variant="ghost"
          onPress={onDeleteStep}
          accessibilityLabel={tCommon('common.delete')}
          iconLeft={<MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.textMuted} />}
          testID="detail-delete-step"
        />
      </View>

      <ScrollView contentContainerStyle={etStyles.listContent}>
        <View style={etStyles.chartCard}>
          {series.length === 0 ? (
            <Text style={etStyles.emptyText}>{lbl('detail_no_sessions')}</Text>
          ) : (
            <DesensitizationChart
              points={series}
              width={300}
              accentColor={config.peakColor}
              yAxisLabel={lbl('chart_y_axis')}
              xAxisLabel={lbl('chart_x_axis')}
            />
          )}
        </View>

        {/* Difficulté estimée + ré-évaluation (re-cotation TCC, conserve l'historique) */}
        <Card style={etStyles.difficultyCard}>
          <Text style={etStyles.difficultyText}>
            {lbl('detail_difficulty', { value: step.target_suds ?? 0 })}
          </Text>
          <Button
            variant="ghost"
            size="sm"
            label={lbl('detail_reevaluate')}
            iconRight={<MaterialCommunityIcons name="chevron-right" size={18} color={colors.primary} />}
            onPress={onEditStep}
            testID="detail-reevaluate"
          />
        </Card>

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

        {/* CTA pleine largeur, dans le flux — ne recouvre jamais la dernière carte. */}
        <Button
          variant="primary"
          label={lbl('detail_do_exposure')}
          iconLeft={<MaterialCommunityIcons name="plus" size={22} color={colors.white} />}
          onPress={onDoExposure}
          style={etStyles.ctaBtn}
          testID="do-exposure-btn"
        />
      </ScrollView>
    </View>
  )
}
