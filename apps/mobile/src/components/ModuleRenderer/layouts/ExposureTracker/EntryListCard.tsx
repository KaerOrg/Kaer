import React from 'react'
import { View, Text, Pressable } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '../../../../theme'
import { formatDateShortYear } from '../../../../lib/dateUtils'
import { useModuleT } from '../../../../hooks/useModuleT'
import type { FearEntry } from '../../../../lib/database'
import { etStyles } from './styles'

interface SudsBarProps {
  label: string
  value: number | null
  color: string
}

function SudsBar({ label, value, color }: SudsBarProps) {
  if (value === null) {
    return (
      <View style={etStyles.sudsRow}>
        <Text style={etStyles.sudsLabel}>{label}</Text>
        <Text style={etStyles.sudsPending}>—</Text>
      </View>
    )
  }
  return (
    <View style={etStyles.sudsRow}>
      <Text style={etStyles.sudsLabel}>{label}</Text>
      <View style={etStyles.sudsTrack}>
        <View style={[etStyles.sudsFill, { width: `${value}%` as `${number}%`, backgroundColor: color }]} />
      </View>
      <Text style={[etStyles.sudsValue, { color }]}>{value}</Text>
    </View>
  )
}

export interface EntryListCardProps {
  entry: FearEntry
  strategyLabels: string[]
  beforeColor: string
  afterColor: string
  beforeLabel: string
  afterLabel: string
  onEdit: () => void
  onDelete: () => void
}

export function EntryListCard({
  entry, strategyLabels, beforeColor, afterColor, beforeLabel, afterLabel, onEdit, onDelete,
}: EntryListCardProps) {
  const t = useModuleT()
  return (
    <View style={etStyles.entryCard} testID={`entry-${entry.id}`}>
      <View style={etStyles.cardHeader}>
        <View style={etStyles.cardHeaderLeft}>
          <Text style={etStyles.cardSituation} numberOfLines={1}>{entry.situation_label}</Text>
          <Text style={etStyles.cardDate}>{formatDateShortYear(entry.date)}</Text>
        </View>
        <View style={etStyles.cardActions}>
          <Pressable
            onPress={onEdit}
            hitSlop={8}
            accessibilityLabel={t('common.edit')}
            testID={`edit-${entry.id}`}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            accessibilityLabel={t('common.delete')}
            testID={`delete-${entry.id}`}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <View style={etStyles.cardSuds}>
        <SudsBar label={beforeLabel} value={entry.suds_before} color={beforeColor} />
        <SudsBar label={afterLabel} value={entry.suds_after} color={afterColor} />
      </View>

      {strategyLabels.length > 0 ? (
        <View style={etStyles.cardChips}>
          {strategyLabels.map((s, i) => (
            <View key={i} style={etStyles.cardChip}>
              <Text style={etStyles.cardChipText}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {entry.notes ? (
        <Text style={etStyles.cardNotes} numberOfLines={2}>{entry.notes}</Text>
      ) : null}
    </View>
  )
}
