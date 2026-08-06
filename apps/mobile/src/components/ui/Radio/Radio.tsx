import React from 'react'
import { View, Text, Pressable, type StyleProp, type ViewStyle } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { styles } from './Radio.styles'
import type { RadioOption, RadioProps } from './Radio.types'

/**
 * Sélecteur à choix exclusif (radio). Quatre habillages via `variant` :
 * - `list` (défaut) : rangées rond + label (+ sous-label optionnel) ;
 * - `pills` : pilules en ligne, remplissage couleur sur l'option active ;
 * - `grid` : colonnes de largeur égale, label centré multiligne, remplissage
 *   couleur sur l'option active (échelle Likert d'un questionnaire clinique) ;
 * - `stack` : rangées encadrées pleine largeur, cible d'au moins 44 pt, libellé
 *   jamais tronqué, coche sur l'option active (saisie un item par écran).
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

  // Enrobe le contenu d'une option dans un `Pressable` (saisie) ou une `View`
  // (lecture seule) : logique partagée par les trois habillages.
  const renderOption = (
    opt: RadioOption,
    active: boolean,
    optStyle: StyleProp<ViewStyle>,
    content: React.ReactNode,
  ) =>
    interactive ? (
      <Pressable
        key={opt.value}
        style={optStyle}
        onPress={() => onChange?.(opt.value)}
        accessibilityRole="radio"
        accessibilityState={{ selected: active }}
      >
        {content}
      </Pressable>
    ) : (
      <View key={opt.value} style={optStyle} accessibilityState={{ selected: active }}>
        {content}
      </View>
    )

  if (variant === 'pills') {
    return (
      <View style={styles.pillsRow} testID={testID}>
        {options.map(opt => {
          const active = value === opt.value
          return renderOption(
            opt,
            active,
            [styles.pill, active && { backgroundColor: color, borderColor: color }],
            <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>{opt.label}</Text>,
          )
        })}
      </View>
    )
  }

  if (variant === 'grid') {
    return (
      <View style={styles.gridRow} testID={testID}>
        {options.map(opt => {
          const active = value === opt.value
          return renderOption(
            opt,
            active,
            [styles.gridOption, active && { backgroundColor: color, borderColor: color }],
            <Text style={[styles.gridLabel, active && styles.gridLabelActive]} numberOfLines={2}>
              {opt.label}
            </Text>,
          )
        })}
      </View>
    )
  }

  if (variant === 'stack') {
    return (
      <View style={styles.stack} testID={testID}>
        {options.map(opt => {
          const active = value === opt.value
          return renderOption(
            opt,
            active,
            [styles.stackOption, active && { borderColor: color }],
            <>
              <Text style={[styles.stackLabel, active && styles.stackLabelActive]}>{opt.label}</Text>
              {active ? <MaterialCommunityIcons name="check" size={20} color={color} /> : null}
            </>,
          )
        })}
      </View>
    )
  }

  return (
    <View style={styles.list} testID={testID}>
      {options.map(opt => {
        const active = value === opt.value
        return renderOption(
          opt,
          active,
          styles.row,
          <>
            <View style={[styles.dot, active && { borderColor: color }]}>
              {active ? <View style={[styles.dotInner, { backgroundColor: color }]} /> : null}
            </View>
            <View style={styles.rowText}>
              <Text style={styles.label}>{opt.label}</Text>
              {opt.sublabel ? <Text style={styles.sublabel}>{opt.sublabel}</Text> : null}
            </View>
          </>,
        )
      })}
    </View>
  )
})

export default Radio
