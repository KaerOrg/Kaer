import { memo, useCallback } from 'react'
import { Chip } from '@ui/Chip'

export interface DayChipProps {
  /** Jour au format `Date.getDay()` (0 = dimanche). */
  jsDay: number
  /** Initiale affichée (« L », « Me »…). */
  label: string
  selected: boolean
  /** Reçoit le jour : évite une lambda par puce dans le rendu du parent. */
  onToggle: (jsDay: number) => void
}

/**
 * Une puce de jour du sélecteur de rappel. Existe pour porter le callback stable :
 * sans elle, chaque rendu de la feuille recréerait sept lambdas.
 */
export const DayChip = memo(function DayChip({ jsDay, label, selected, onToggle }: DayChipProps) {
  const handlePress = useCallback(() => onToggle(jsDay), [onToggle, jsDay])

  return (
    <Chip
      label={label}
      selected={selected}
      onPress={handlePress}
      testID={`breathing-reminder-day-${jsDay}`}
    />
  )
})
