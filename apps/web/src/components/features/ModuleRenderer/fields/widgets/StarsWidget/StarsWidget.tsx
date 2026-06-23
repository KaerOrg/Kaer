import { useMemo } from 'react'
import { RatingSelector } from '../../../../../ui/RatingSelector'

interface Props { count: number }

// Aperçu (lecture seule) d'un champ étoiles : rangée de `count` étoiles dont la
// moitié (ceil) est remplie, rendue par RatingSelector (variant icon, sans
// onChange → lecture seule). Aucun markup ad hoc — le primitive porte les icônes.
export function StarsWidget({ count }: Props) {
  const filled = Math.ceil(count / 2)
  const steps = useMemo(() => Array.from({ length: count }, (_, i) => i + 1), [count])

  return (
    <RatingSelector
      variant="icon"
      icon="star"
      iconSize={16}
      steps={steps}
      value={filled}
      color="var(--color-stars)"
      label=""
      showHeader={false}
    />
  )
}
