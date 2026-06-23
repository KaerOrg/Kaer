import React from 'react'
import { View, Text, Pressable } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '../../../theme'
import { styles } from './RatingSelector.styles'
import { ContinuousGauge } from './ContinuousGauge'
import type { RatingSelectorProps } from './RatingSelector.types'

// Sélecteur de note sur une échelle 1..N. Trois habillages (variant) pour un
// même besoin : pastilles chiffrées, barre de progression, ou rangée d'icônes.
// `readonly` désactive l'interaction (même rendu, sans saisie) ; `continuous`
// transforme la variante `track` en jauge proportionnelle (affichage).
export const RatingSelector = React.memo(function RatingSelector({
  value,
  steps,
  color,
  label = '',
  sublabel,
  readonly = false,
  continuous = false,
  unit,
  variant = 'numbered',
  icon = 'star',
  iconSize = 36,
  showHeader = true,
  showEndLabels = false,
  testIdPrefix,
  onPress,
}: RatingSelectorProps) {
  const filledIcon = icon === 'star' ? 'star' : 'weather-sunny'
  const emptyIcon = icon === 'star' ? 'star-outline' : 'weather-sunny'
  const pipTestId = (n: number): string | undefined => (testIdPrefix != null ? `${testIdPrefix}-${n}` : undefined)
  const interactive = !readonly && !continuous

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <View>
            <Text style={styles.label}>{label}</Text>
            {sublabel != null && <Text style={styles.sublabel}>{sublabel}</Text>}
          </View>
          {value != null && <Text style={[styles.value, { color }]} testID="rating-header-value">{value}</Text>}
        </View>
      )}

      {continuous ? (
        <ContinuousGauge value={value} steps={steps} color={color} unit={unit} label={label} />
      ) : variant === 'icon' ? (
        <View style={styles.icons}>
          {steps.map((n) => {
            const on = n <= (value ?? 0)
            const iconNode = (
              <MaterialCommunityIcons
                name={on ? filledIcon : emptyIcon}
                size={iconSize}
                color={on ? color : colors.border}
              />
            )
            return interactive ? (
              <Pressable
                key={n}
                onPress={() => onPress?.(n)}
                hitSlop={4}
                accessibilityRole="radio"
                accessibilityState={{ checked: value === n }}
                accessibilityLabel={`${label} : ${n}`}
                testID={pipTestId(n)}
              >
                {iconNode}
              </Pressable>
            ) : (
              <View key={n} testID={pipTestId(n)} accessibilityLabel={`${label} : ${n}`}>
                {iconNode}
              </View>
            )
          })}
        </View>
      ) : (
        <View style={variant === 'track' ? styles.track : styles.pips}>
          {steps.map((n) => {
            const selected = value === n
            const filled = variant === 'track' && value != null && n <= value
            const pipStyle =
              variant === 'track'
                ? [styles.trackPip, (selected || filled) && { backgroundColor: color }]
                : [styles.numberedPip, selected && { backgroundColor: color, borderColor: color }]
            const pipContent =
              variant === 'track' ? null : (
                <Text style={[styles.pipText, selected && styles.pipTextSelected]}>{n}</Text>
              )

            return interactive ? (
              <Pressable
                key={n}
                style={pipStyle}
                onPress={() => onPress?.(n)}
                hitSlop={4}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`${label} : ${n}`}
                testID={pipTestId(n)}
              >
                {pipContent}
              </Pressable>
            ) : (
              <View
                key={n}
                style={pipStyle}
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`${label} : ${n}`}
                testID={pipTestId(n)}
              >
                {pipContent}
              </View>
            )
          })}
        </View>
      )}

      {showEndLabels && steps.length > 0 && (
        <View style={styles.endLabels}>
          <Text style={styles.endLabel}>{steps[0]}</Text>
          <Text style={styles.endLabel}>{steps[steps.length - 1]}</Text>
        </View>
      )}
    </View>
  )
})
