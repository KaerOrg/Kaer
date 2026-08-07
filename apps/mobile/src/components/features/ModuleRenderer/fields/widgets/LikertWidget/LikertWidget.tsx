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
  /**
   * Disposition des modalités :
   * - `grid` (défaut) : colonnes de largeur égale, pour une liste défilante où les
   *   items s'enchaînent et où la place verticale est comptée ;
   * - `stack` : rangées pleine largeur, pour une saisie un item par écran, où le
   *   libellé doit se lire en entier et la cible tenir 44 pt.
   */
  layout?: 'grid' | 'stack'
}

/**
 * Échelle Likert (saisie patient). Simple adaptateur numérique au-dessus du
 * primitive `ui/Radio` : les valeurs cliniques sont des nombres tandis que
 * `ui/Radio` opère sur des `string`, d'où la conversion à la frontière. Aucun
 * markup ad hoc : la disposition est une variante du primitive.
 */
export function LikertWidget({ options, selected, onSelect, accentColor, layout = 'grid' }: Props) {
  const radioOptions: RadioOption[] = useMemo(
    () => options.map(o => ({ value: String(o.value), label: o.label })),
    [options],
  )
  const handleChange = useCallback((value: string) => { onSelect(parseInt(value, 10)) }, [onSelect])

  return (
    <Radio
      variant={layout}
      options={radioOptions}
      value={selected === null ? null : String(selected)}
      onChange={handleChange}
      color={accentColor}
    />
  )
}
