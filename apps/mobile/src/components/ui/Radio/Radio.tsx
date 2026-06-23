import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { colors } from '@theme'
import { styles } from './Radio.styles'
import type { RadioProps } from './Radio.types'

/**
 * Sélecteur à choix exclusif (radio). Deux habillages via `variant` :
 * - `list` (défaut) : rangées rond + label (+ sous-label optionnel) ;
 * - `pills` : pilules en ligne, remplissage couleur sur l'option active.
 *
 * `readonly` rend le même visuel sans interaction (options en `View`, pas en
 * `Pressable`) — pour un aperçu / affichage. Tout sélecteur mono-sélection passe
 * par ce primitive — jamais de `Pressable + styles.btn` ad hoc, ni de duplication
 * d'un autre composant radio.
 */
export const Radio = React.memo(function Radio({
  options, value, onChange, variant = 'list', readonly = false, color = colors.primary, testID,
}: RadioProps) {
  const interactive = !readonly

  if (variant === 'pills') {
    return (
      <View style={styles.pillsRow} testID={testID}>
        {options.map(opt => {
          const active = value === opt.value
          const pillStyle = [styles.pill, active && { backgroundColor: color, borderColor: color }]
          const pillLabel = <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>{opt.label}</Text>
          return interactive ? (
            <Pressable
              key={opt.value}
              style={pillStyle}
              onPress={() => onChange?.(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              {pillLabel}
            </Pressable>
          ) : (
            <View key={opt.value} style={pillStyle} accessibilityState={{ selected: active }}>
              {pillLabel}
            </View>
          )
        })}
      </View>
    )
  }

  return (
    <View style={styles.list} testID={testID}>
      {options.map(opt => {
        const active = value === opt.value
        const rowContent = (
          <>
            <View style={[styles.dot, active && { borderColor: color }]}>
              {active ? <View style={[styles.dotInner, { backgroundColor: color }]} /> : null}
            </View>
            <View style={styles.rowText}>
              <Text style={styles.label}>{opt.label}</Text>
              {opt.sublabel ? <Text style={styles.sublabel}>{opt.sublabel}</Text> : null}
            </View>
          </>
        )
        return interactive ? (
          <Pressable
            key={opt.value}
            style={styles.row}
            onPress={() => onChange?.(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            {rowContent}
          </Pressable>
        ) : (
          <View key={opt.value} style={styles.row} accessibilityState={{ selected: active }}>
            {rowContent}
          </View>
        )
      })}
    </View>
  )
})

export default Radio
