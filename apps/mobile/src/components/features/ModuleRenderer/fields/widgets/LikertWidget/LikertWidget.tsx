import React, { useCallback, useMemo } from 'react'
import { Radio, type RadioOption } from '@ui/Radio'

export interface LikertOption {
  value: number
  label: string
}

interface Props {
  options: LikertOption[]
  selected: number | null
  onSelect: (value: number) => void
  accentColor?: string
}

/**
 * Échelle Likert (saisie patient) : colonnes de largeur égale, label centré
 * multiligne. Simple adaptateur numérique au-dessus du primitive `ui/Radio`
 * (variant `grid`) : les valeurs cliniques sont des nombres tandis que `ui/Radio`
 * opère sur des `string`, d'où la conversion à la frontière. Aucun markup ad hoc.
 */
export function LikertWidget({ options, selected, onSelect, accentColor }: Props) {
  const radioOptions: RadioOption[] = useMemo(
    () => options.map(o => ({ value: String(o.value), label: o.label })),
    [options],
  )
  const handleChange = useCallback((value: string) => { onSelect(parseInt(value, 10)) }, [onSelect])

  return (
    <Radio
      variant="grid"
      options={radioOptions}
      value={selected === null ? null : String(selected)}
      onChange={handleChange}
      color={accentColor}
    />
  )
}
