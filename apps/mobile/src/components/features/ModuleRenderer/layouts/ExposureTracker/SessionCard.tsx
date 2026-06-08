import React from 'react'
import { View, Text, Pressable } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '../../../../../theme'
import { formatDateShortYear } from '../../../../../lib/dateUtils'
import type { FearEntry } from '../../../../../lib/database'
import type { ExposureConfig } from './types'
import { SudsBar } from './SudsBar'
import { etStyles } from './styles'

export interface SessionCardProps {
  entry: FearEntry
  config: ExposureConfig
  strategyLabels: string[]
  /** Libellé d'une clé module (`modules.<id>.<k>`). */
  lbl: (k: string) => string
  /** Libellé commun (`common.*`). */
  tCommon: (k: string) => string
  onEdit: () => void
  onDelete: () => void
}

/** Carte d'une exposition passée : SUDS anticipé / pic / final + prédiction/résultat. */
export function SessionCard({
  entry, config, strategyLabels, lbl, tCommon, onEdit, onDelete,
}: SessionCardProps) {
  return (
    <View style={etStyles.entryCard} testID={`session-${entry.id}`}>
      <View style={etStyles.cardHeader}>
        <Text style={etStyles.cardDate}>{formatDateShortYear(entry.date)}</Text>
        <View style={etStyles.cardActions}>
          <Pressable onPress={onEdit} hitSlop={8} accessibilityLabel={tCommon('common.edit')} testID={`edit-${entry.id}`}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8} accessibilityLabel={tCommon('common.delete')} testID={`delete-${entry.id}`}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <View style={etStyles.cardSuds}>
        <SudsBar label={lbl('suds_anticipated')} value={entry.suds_before} color={config.beforeColor} max={config.sudsMax} />
        <SudsBar label={lbl('suds_peak')} value={entry.suds_peak} color={config.peakColor} max={config.sudsMax} />
        <SudsBar label={lbl('suds_final')} value={entry.suds_after} color={config.afterColor} max={config.sudsMax} />
      </View>

      {entry.expectation_text ? (
        <Text style={etStyles.cardNotes}>
          <Text style={etStyles.sudsLabel}>{lbl('expectation_label')} </Text>
          {entry.expectation_text}
        </Text>
      ) : null}
      {entry.outcome_text ? (
        <Text style={etStyles.cardNotes}>
          <Text style={etStyles.sudsLabel}>{lbl('outcome_label')} </Text>
          {entry.outcome_text}
        </Text>
      ) : null}

      {strategyLabels.length > 0 ? (
        <View style={etStyles.cardChips}>
          {strategyLabels.map((s, i) => (
            <View key={i} style={etStyles.cardChip}>
              <Text style={etStyles.cardChipText}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {entry.notes ? <Text style={etStyles.cardNotes} numberOfLines={3}>{entry.notes}</Text> : null}
    </View>
  )
}
