import React, { useMemo } from 'react'
import { RatingSelector } from '@ui/RatingSelector'
import { colors } from '@theme'

interface Props { count: number }

// Aperçu (lecture seule) d'un champ étoiles : rangée de `count` étoiles dont la
// moitié (ceil) est remplie, rendue par RatingSelector (variant icon, readonly).
// Aucun visuel ad hoc — le primitive du design system porte les icônes.
export function StarsWidget({ count }: Props) {
  const filled = Math.ceil(count / 2)
  const steps = useMemo(() => Array.from({ length: count }, (_, i) => i + 1), [count])

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
