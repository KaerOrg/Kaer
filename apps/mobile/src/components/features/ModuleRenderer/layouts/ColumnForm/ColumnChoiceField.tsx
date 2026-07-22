import { memo, useCallback } from 'react'
import { View, Text } from 'react-native'
import { Chip } from '@ui/Chip'
import { Radio } from '@ui/Radio'
import { styles } from './styles'

export interface ChoiceOption {
  code: string
  label: string
}

export interface ColumnChoiceFieldProps {
  fieldKey: string
  label: string
  options: ChoiceOption[]
  /** `pills` = puces horizontales ; `radio` = liste à sélection unique. */
  variant: 'pills' | 'radio'
  value: string
  accent: string
  onChange: (code: string) => void
}

/**
 * Champ de choix EXCLUSIF générique (`column_choice_field`). Une seule option
 * active à la fois ; l'option cochée peut être décochée (retour à « aucun choix »).
 * `pills` pour un choix compact (Oui / Un peu / Non), `radio` pour une liste
 * d'issues. Aucune couleur de gravité (MDR) : l'accent code l'identité du champ.
 */
export const ColumnChoiceField = memo(function ColumnChoiceField({
  fieldKey, label, options, variant, value, accent, onChange,
}: ColumnChoiceFieldProps) {
  const handlePill = useCallback(
    (code: string) => onChange(value === code ? '' : code),
    [onChange, value],
  )

  return (
    <View testID={`choice-${fieldKey}`}>
      {label ? <Text style={styles.chipsGroupLabel}>{label}</Text> : null}

      {variant === 'radio' ? (
        <Radio
          options={options.map(o => ({ value: o.code, label: o.label }))}
          value={value === '' ? null : value}
          onChange={onChange}
          color={accent}
          testID={`choice-radio-${fieldKey}`}
        />
      ) : (
        <View style={styles.chipsRow}>
          {options.map(o => (
            <Chip
              key={o.code}
              label={o.label}
              color={accent}
              selected={value === o.code}
              onPress={() => handlePill(o.code)}
              testID={`choice-pill-${fieldKey}-${o.code}`}
            />
          ))}
        </View>
      )}
    </View>
  )
})
