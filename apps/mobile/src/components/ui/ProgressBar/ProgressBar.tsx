import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import { colors, radius } from '@theme'

export interface ProgressBarProps {
  /** Valeur remplie, exprimée dans [0, max]. Bornée à cet intervalle au rendu. */
  value: number
  /** Valeur maximale (100 % de remplissage). Défaut : 100. */
  max?: number
  /** Couleur de la portion remplie. Une seule couleur : aucun codage conditionnel. Défaut : `colors.primary`. */
  color?: string
  /** Couleur de la piste (portion vide). Défaut : `colors.border`. */
  trackColor?: string
  /** Épaisseur de la barre en pixels. Défaut : 6. */
  height?: number
  /** Libellé accessible de la jauge (ex. « 3 sur 5 sessions »). */
  accessibilityLabel?: string
  testID?: string
}

/**
 * Jauge linéaire remplie au prorata d'une valeur brute. Pendant linéaire de
 * `ProgressRing`, pour les progressions qui se lisent en ligne (objectif de la
 * semaine, temps écoulé d'une session).
 *
 * Primitif pur : aucune logique métier, aucune interprétation. La couleur est
 * fixe et fournie par l'appelant : elle ne varie jamais selon la valeur (une
 * teinte qui change avec la donnée serait un jugement, interdit par le MDR).
 */
export const ProgressBar = memo(function ProgressBar({
  value,
  max = 100,
  color = colors.primary,
  trackColor = colors.border,
  height = 6,
  accessibilityLabel,
  testID,
}: ProgressBarProps) {
  const fraction = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0

  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <View
        style={[styles.fill, { width: `${fraction * 100}%`, backgroundColor: color }]}
        testID={testID ? `${testID}-fill` : undefined}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
})

export default ProgressBar
