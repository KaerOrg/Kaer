// Une mesure de mise à distance déjà décidée, rendue en phrase (P-13).
//
// La phrase est composée AU RENDU, jamais stockée composée : les morceaux restent
// modifiables un par un, et l'i18n reste possible.

import React, { useCallback } from 'react'
import { Text } from 'react-native'
import { Button } from '@ui/Button'
import { Card } from '@ui/Card'
import { composeMeasureSentence } from '@kaer/shared'
import type { PlanItem } from '@services/planItemService'
import { styles } from './measureStyles'

export interface MeasureCardProps {
  item: PlanItem
  deleteLabel: string
  onDelete: (item: PlanItem) => void
}

export const MeasureCard = React.memo(function MeasureCard({ item, deleteLabel, onDelete }: MeasureCardProps) {
  // `text` porte le verbe et l'objet tels que le patient les a écrits ; `role` le tiers
  // qui s'en occupe, `note` l'échéance. Aucune date n'est comparée à aujourd'hui.
  const sentence = composeMeasureSentence({
    verb: item.text,
    what: '',
    who: item.role ?? null,
    until: item.note ?? null,
  })
  const handleDelete = useCallback(() => onDelete(item), [onDelete, item])

  return (
    <Card testID={`measure-${item.id}`}>
      <Text style={styles.sentence}>{sentence}</Text>
      <Button
        variant="ghostDanger"
        size="sm"
        label={deleteLabel}
        onPress={handleDelete}
        testID={`measure-${item.id}-delete`}
      />
    </Card>
  )
})
