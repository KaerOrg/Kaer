// ─── RecordCardHeader — en-tête commun des cartes liste column_form ──────────
//
// Date + puce « à finir » (statut de workflow dérivé) + actions crayon/poubelle.
// Partagé par la carte générique à puces (RecordCard) et la carte récit
// (NarrativeRecordCard) — présentationnel, actions injectées par le parent.

import { memo } from 'react'
import { View, Text } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Button } from '@ui/Button'
import { Chip } from '@ui/Chip'
import type { FormEntry } from '../../../../../lib/database'
import { formatDateFull } from '../../../../../lib/dateUtils'
import { isEntryComplete } from './entryCompletion'
import { styles } from './styles'

interface Props {
  entry: FormEntry
  showCompletion: boolean
  completeKeys: string[]
  toCompleteLabel: string
  t: (key: string) => string
  onEdit: (entry: FormEntry) => void
  onDelete: (entry: FormEntry) => void
  /** Date en titre proéminent (Journal chronobiologique) au lieu du libellé discret. */
  prominent?: boolean
  /** Si fourni, affiche un chevron d'état de dépli (carte frise). */
  expanded?: boolean
}

export const RecordCardHeader = memo(function RecordCardHeader({
  entry, showCompletion, completeKeys, toCompleteLabel, t, onEdit, onDelete,
  prominent, expanded,
}: Props) {
  return (
    <View style={styles.recordHeader}>
      <View style={styles.recordHeaderLeft}>
        <Text style={prominent ? styles.recordDateProminent : styles.recordDate}>{formatDateFull(entry.created_at)}</Text>
        {showCompletion && !isEntryComplete(entry.values, completeKeys) ? (
          <Chip
            label={toCompleteLabel}
            size="sm"
            selected
            onPress={() => onEdit(entry)}
            testID={`to-complete-${entry.id}`}
          />
        ) : null}
      </View>
      <View style={styles.recordActions}>
        {expanded != null ? (
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={colors.textMuted}
          />
        ) : null}
        <Button
          variant="ghost"
          onPress={() => onEdit(entry)}
          iconLeft={<MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />}
          accessibilityLabel={t('common.modify')}
          testID={`edit-${entry.id}`}
        />
        <Button
          variant="ghost"
          onPress={() => onDelete(entry)}
          iconLeft={<MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />}
          accessibilityLabel={t('common.delete')}
          testID={`delete-${entry.id}`}
        />
      </View>
    </View>
  )
})
