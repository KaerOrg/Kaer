import React, { useCallback } from 'react'
import { Checkbox } from '@ui/Checkbox'

// Case à cocher d'une année comparée — leaf mémoïsé à callback stable.

export interface YearCheckboxProps {
  readonly year: number
  readonly checked: boolean
  readonly color: string
  readonly onToggle: (year: number) => void
}

export const YearCheckbox = React.memo(function YearCheckbox({ year, checked, color, onToggle }: YearCheckboxProps) {
  const handleChange = useCallback(() => onToggle(year), [onToggle, year])
  return <Checkbox checked={checked} onChange={handleChange} label={String(year)} color={color} />
})
