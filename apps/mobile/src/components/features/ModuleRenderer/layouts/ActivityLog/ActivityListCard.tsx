import React from 'react'
import { View, Text, Pressable } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '../../../../../theme'
import { useModuleT } from '../../../../../hooks/useModuleT'
import type { ActivityRecord } from '../../../../../lib/database'
import { alStyles } from './styles'

export interface ActivityListCardProps {
  record: ActivityRecord
  onToggleDone: () => void
  onEdit: () => void
  onDelete: () => void
  ft: (type: string) => string
}

export function ActivityListCard({ record, onToggleDone, onEdit, onDelete, ft }: ActivityListCardProps) {
  const t = useModuleT()
  const isDone = record.done === 1
  const toggleAriaLabel = isDone
    ? (ft('activity_log_mark_undone_label') || t('common.undo'))
    : (ft('activity_log_mark_done_label') || t('common.done'))
  return (
    <View style={[alStyles.recordCard, isDone && alStyles.recordCardDone]} testID={`record-${record.id}`}>
      <Pressable
        style={alStyles.checkbox}
        onPress={onToggleDone}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isDone }}
        accessibilityLabel={toggleAriaLabel}
        testID={`toggle-${record.id}`}
      >
        <MaterialCommunityIcons
          name={isDone ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
          size={26}
          color={isDone ? colors.success : colors.border}
        />
      </Pressable>
      <View style={alStyles.recordContent}>
        <Text style={[alStyles.recordLabel, isDone && alStyles.recordLabelDone]}>{record.label}</Text>
        <View style={alStyles.recordScores}>
          <View style={alStyles.scorePill}>
            <Text style={alStyles.scorePillKey}>P</Text>
            <Text style={alStyles.scorePillVal}>{record.pleasure}</Text>
          </View>
          <View style={alStyles.scorePill}>
            <Text style={alStyles.scorePillKey}>M</Text>
            <Text style={alStyles.scorePillVal}>{record.mastery}</Text>
          </View>
        </View>
        {record.notes ? (
          <Text style={alStyles.recordNotes} numberOfLines={1}>{record.notes}</Text>
        ) : null}
      </View>
      <View style={alStyles.recordActions}>
        <Pressable onPress={onEdit} hitSlop={8} accessibilityLabel={t('common.edit')} testID={`edit-${record.id}`}>
          <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={8} accessibilityLabel={t('common.delete')} testID={`delete-${record.id}`}>
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  )
}
