import React, { useMemo } from 'react'
import { RatingSelector } from '../../../../../ui/RatingSelector'
import { colors } from '@theme'

interface Props { spec: string }

// Aperçu (lecture seule) d'un champ `stars:N` : rangée de N étoiles dont la
// moitié (ceil) est remplie, rendue par RatingSelector (variant icon, readonly).
// Aucun visuel ad hoc — le primitive du design system porte les icônes.
export function StarsWidget({ spec }: Props) {
  const max = Number(spec.split(':')[1] ?? 5)
  const filled = Math.ceil(max / 2)
  const steps = useMemo(() => Array.from({ length: max }, (_, i) => i + 1), [max])

  return (
    <RatingSelector
      variant="icon"
      icon="star"
      iconSize={14}
      steps={steps}
      value={filled}
      color={colors.stars}
      readonly
      showHeader={false}
    />
  )
}
