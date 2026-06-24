import React, { useMemo } from 'react'
import { RatingSelector } from '@ui/RatingSelector'
import { colors } from '@theme'

interface Props { min: number; max: number; unit?: string }

// Aperçu (lecture seule) d'un champ slider : jauge continue rendue par
// RatingSelector (variant track + continuous), affichant la valeur médiane.
// Bornes et unité reçues en props atomiques (props frères `slider_min`,
// `slider_max`, `slider_unit`). Aucun visuel ad hoc — le primitive porte la jauge.
export function SliderWidget({ min, max, unit }: Props) {
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
