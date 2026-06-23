import React, { useMemo } from 'react'
import { RatingSelector } from '../../../../../ui/RatingSelector'
import { colors } from '@theme'

interface Props { spec: string }

// Aperçu (lecture seule) d'un champ `slider:min:max[:unit]` : jauge continue
// rendue par RatingSelector (variant track + continuous), affichant la valeur
// médiane. Aucun visuel ad hoc — le primitive du design system porte la jauge.
export function SliderWidget({ spec }: Props) {
  const [, rawMin, rawMax, unit] = spec.split(':')
  const min = Number(rawMin ?? 0)
  const max = Number(rawMax ?? 10)
  const mid = Math.round((min + max) / 2)
  const bounds = useMemo(() => [min, max], [min, max])

  return (
    <RatingSelector
      variant="track"
      continuous
      steps={bounds}
      value={mid}
      unit={unit}
      color={colors.primary}
      showHeader={false}
    />
  )
}
