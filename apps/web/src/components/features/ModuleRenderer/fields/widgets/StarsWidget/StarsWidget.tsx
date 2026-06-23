import { useMemo } from 'react'
import { RatingSelector } from '../../../../../ui/RatingSelector'

interface Props { spec: string }

// Aperçu (lecture seule) d'un champ `stars:N` : rangée de N étoiles dont la
// moitié (ceil) est remplie, rendue par RatingSelector (variant icon, sans
// onChange → lecture seule). Aucun markup ad hoc — le primitive porte les icônes.
export function StarsWidget({ spec }: Props) {
  const max = Number(spec.split(':')[1] ?? 5)
  const filled = Math.ceil(max / 2)
  const steps = useMemo(() => Array.from({ length: max }, (_, i) => i + 1), [max])

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
