import React, { useCallback } from 'react'
import { View, Text, Pressable } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Button } from '@ui/Button'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import type { ActivityRecord } from '../../../../../lib/database'
import type { LabelFn } from './types'
import { alStyles } from './styles'

export interface ActivityListCardProps {
  record: ActivityRecord
  onToggleDone: (record: ActivityRecord) => void
  onEdit: (recordId: string) => void
  onDelete: (record: ActivityRecord) => void
  lbl: LabelFn
}

// Carte d'une activité (agenda et historique) : statut, heure prévue et,
// une fois réalisée, les P/M ressentis bruts. « Non renseigné » n'affiche
// rien : jamais de zéro fabriqué (MDR : valeurs brutes saisies uniquement).
// Mémoïsée avec callbacks stables (record injecté ici) : les vues parentes
// passent leurs handlers directement, sans closure recréée par item.
export const ActivityListCard = React.memo(function ActivityListCard({
  record, onToggleDone, onEdit, onDelete, lbl,
}: ActivityListCardProps) {
  const t = useModuleTranslation()
  const isDone = record.done === 1
  const handleToggle = useCallback(() => onToggleDone(record), [onToggleDone, record])
  const handleEdit = useCallback(() => onEdit(record.id), [onEdit, record.id])
  const handleDelete = useCallback(() => onDelete(record), [onDelete, record])
  const toggleAriaLabel = isDone
    ? (lbl('mark_undone_label') || t('common.undo'))
    : (lbl('mark_done_label') || t('common.done'))

  const pShort = lbl('pleasure_short_label') || 'P'
  const mShort = lbl('mastery_short_label') || 'M'
  const pleasure = isDone ? record.pleasure : null
  const mastery = isDone ? record.mastery : null
  const hasScores = pleasure != null || mastery != null

  return (
    <View style={[alStyles.recordCard, isDone && alStyles.recordCardDone]} testID={`record-${record.id}`}>
      <Pressable
        style={alStyles.checkbox}
        onPress={handleToggle}
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
        {(hasScores || record.planned_time) ? (
          <View style={alStyles.recordScores}>
            {record.planned_time ? (
              <View style={alStyles.scorePill}>
                <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textMuted} />
                <Text style={alStyles.scorePillVal}>{record.planned_time}</Text>
              </View>
            ) : null}
            {pleasure != null ? (
              <View style={alStyles.scorePill}>
                <Text style={alStyles.scorePillKey}>{pShort}</Text>
                <Text style={alStyles.scorePillVal}>{pleasure}</Text>
              </View>
            ) : null}
            {mastery != null ? (
              <View style={alStyles.scorePill}>
                <Text style={alStyles.scorePillKey}>{mShort}</Text>
                <Text style={alStyles.scorePillVal}>{mastery}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {record.notes ? (
          <Text style={alStyles.recordNotes} numberOfLines={1}>{record.notes}</Text>
        ) : null}
      </View>
      <View style={alStyles.recordActions}>
        <Button
          variant="ghost"
          onPress={handleEdit}
          accessibilityLabel={t('common.edit')}
          testID={`edit-${record.id}`}
          iconLeft={<MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />}
        />
        <Button
          variant="ghost"
          onPress={handleDelete}
          accessibilityLabel={t('common.delete')}
          testID={`delete-${record.id}`}
          iconLeft={<MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />}
        />
      </View>
    </View>
  )
})
