import React, { useCallback } from 'react'
import { Text } from 'react-native'
import { Card } from '@ui/Card'
import { homeStyles as styles } from './homeStyles'

export interface SentEntryRowProps {
  entryId: string
  /** Date de la passation, déjà formatée. */
  date: string
  /** Mention d'état, ex. « envoyé ». */
  status: string
  onOpen: (entryId: string) => void
}

/**
 * Une passation dans la liste « Mes passations » (#408) : une date, une mention
 * d'envoi, rien d'autre.
 *
 * Conformité MDR : **aucun score en regard, aucune courbe**. Trois points ne font pas
 * une tendance, et une courbe sans axe est un jugement déguisé. Les totaux restent
 * accessibles, mais sous le dépli, à la demande.
 */
export const SentEntryRow = React.memo(function SentEntryRow({
  entryId, date, status, onOpen,
}: SentEntryRowProps) {
  const handlePress = useCallback(() => onOpen(entryId), [onOpen, entryId])

  return (
    <Card onPress={handlePress} style={styles.sentRow} accessibilityLabel={date}>
      <Text style={styles.sentDate}>{date}</Text>
      <Text style={styles.sentStatus}>{status}</Text>
    </Card>
  )
})
