import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { colors } from '../../../theme'
import { styles } from './Radio.styles'
import type { RadioProps } from './Radio.types'

/**
 * Sélecteur à choix exclusif (radio). Deux habillages via `variant` :
 * - `list` (défaut) : rangées rond + label (+ sous-label optionnel) ;
 * - `pills` : pilules en ligne, remplissage couleur sur l'option active.
 *
 * Tout sélecteur mono-sélection passe par ce primitive — jamais de
 * `Pressable + styles.btn` ad hoc, ni de duplication d'un autre composant radio.
 */
export const Radio = React.memo(function Radio({
  options, value, onChange, variant = 'list', color = colors.primary, testID,
}: RadioProps) {
  if (variant === 'pills') {
    return (
      <View style={styles.pillsRow} testID={testID}>
        {options.map(opt => {
          const active = value === opt.value
          return (
            <Pressable
              key={opt.value}
              style={[styles.pill, active && { backgroundColor: color, borderColor: color }]}
              onPress={() => onChange(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>{opt.label}</Text>
            </Pressable>
          )
        })}
      </View>
    )
  }

  return (
    <View style={styles.list} testID={testID}>
      {options.map(opt => {
        const active = value === opt.value
        return (
          <Pressable
            key={opt.value}
            style={styles.row}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <View style={[styles.dot, active && { borderColor: color }]}>
              {active ? <View style={[styles.dotInner, { backgroundColor: color }]} /> : null}
            </View>
            <View style={styles.rowText}>
              <Text style={styles.label}>{opt.label}</Text>
              {opt.sublabel ? <Text style={styles.sublabel}>{opt.sublabel}</Text> : null}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
})

export default Radio
