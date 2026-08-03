import { memo, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize } from '@theme'

export interface StepperProps {
  /** Valeur courante, toujours renseignée (un incrémenteur n'a pas d'état « vide »). */
  value: number
  /** Borne basse incluse. */
  min: number
  /** Borne haute incluse. */
  max: number
  /** Pas d'incrément. Défaut : 1. */
  step?: number
  /** Appelé avec la nouvelle valeur, déjà bornée à [min, max]. */
  onChange: (next: number) => void
  /** Unité affichée sous la valeur (ex. « sessions par semaine »). */
  unit?: string
  /** Couleur d'accent des deux boutons. Défaut : `colors.primary`. */
  color?: string
  /** Libellé accessible du bouton « moins » (i18n à la charge de l'appelant). */
  decrementLabel: string
  /** Libellé accessible du bouton « plus » (i18n à la charge de l'appelant). */
  incrementLabel: string
  testID?: string
}

/**
 * Incrémenteur numérique borné : « − valeur + ». Pour les réglages discrets à
 * faible amplitude (objectif hebdomadaire, nombre de rappels), où un `Slider`
 * demanderait une visée au pixel et où la valeur exacte compte.
 *
 * Les deux commandes sont des `Pressable` nus, et non `ui/Button` : un primitive du
 * design system ne se construit pas sur un autre.
 */
export const Stepper = memo(function Stepper({
  value, min, max, step = 1, onChange, unit, color = colors.primary,
  decrementLabel, incrementLabel, testID,
}: StepperProps) {
  const canDecrement = value > min
  const canIncrement = value < max

  const decrement = useCallback(
    () => onChange(Math.max(min, value - step)),
    [onChange, min, value, step],
  )
  const increment = useCallback(
    () => onChange(Math.min(max, value + step)),
    [onChange, max, value, step],
  )

  return (
    <View style={styles.row} testID={testID}>
      <Pressable
        style={[styles.btn, !canDecrement && styles.btnDisabled]}
        onPress={decrement}
        disabled={!canDecrement}
        accessibilityRole="button"
        accessibilityLabel={decrementLabel}
        accessibilityState={{ disabled: !canDecrement }}
        testID={testID ? `${testID}-minus` : undefined}
      >
        <MaterialCommunityIcons name="minus" size={22} color={canDecrement ? color : colors.border} />
      </Pressable>

      <View style={styles.valueBlock}>
        <Text style={styles.value} testID={testID ? `${testID}-value` : undefined}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>

      <Pressable
        style={[styles.btn, !canIncrement && styles.btnDisabled]}
        onPress={increment}
        disabled={!canIncrement}
        accessibilityRole="button"
        accessibilityLabel={incrementLabel}
        accessibilityState={{ disabled: !canIncrement }}
        testID={testID ? `${testID}-plus` : undefined}
      >
        <MaterialCommunityIcons name="plus" size={22} color={canIncrement ? color : colors.border} />
      </Pressable>
    </View>
  )
})

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  btn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  valueBlock: { alignItems: 'center', flexShrink: 1, minWidth: 80 },
  value: { fontSize: fontSize.display, fontWeight: '700', color: colors.text },
  unit: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
})

export default Stepper
