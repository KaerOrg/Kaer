// ─── Entrée de l'écran d'arrivée de la Séquence (P-6) ────────────────────────
//
// Surface entière cliquable : c'est une carte, pas un bouton — d'où `ui/Card` avec
// `onPress` plutôt qu'un `Pressable` nu. Une seule couleur d'action sur tout le
// parcours ; seule l'entrée dominante est pleine, les autres restent des cartes
// blanches.
//
// La destination voyage avec la carte : le parent n'expose qu'UN callback stable,
// et chaque carte le rappelle avec son propre écran cible. Cela évite autant une
// fonction anonyme recréée à chaque rendu (qui casserait la mémoïsation de `Card`)
// qu'un callback par entrée.

import React, { useCallback } from 'react'
import { Text } from 'react-native'
import { Card } from '@ui/Card'
import type { SequenceState } from '@kaer/shared'
import { styles } from './styles'

export interface SequenceEntryCardProps {
  /** Écran atteint à l'appui. */
  target: SequenceState
  /** Libellé de l'entrée, déjà traduit. */
  label: string
  /** Ligne de précision sous le libellé, déjà traduite. */
  hint?: string
  /** Entrée dominante (« Suivre mon plan ») : pleine, en tête, une seule par écran. */
  lead?: boolean
  onPress: (target: SequenceState) => void
  testID?: string
}

export const SequenceEntryCard = React.memo(function SequenceEntryCard({
  target, label, hint, lead, onPress, testID,
}: SequenceEntryCardProps) {
  const handlePress = useCallback(() => onPress(target), [onPress, target])

  return (
    <Card
      onPress={handlePress}
      style={lead ? styles.entryLead : undefined}
      accessibilityLabel={label}
      testID={testID}
    >
      <Text style={lead ? styles.entryLeadLabel : styles.entryLabel}>{label}</Text>
      {hint != null ? (
        <Text style={lead ? styles.entryLeadHint : styles.entryHint}>{hint}</Text>
      ) : null}
    </Card>
  )
})
