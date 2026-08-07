import React, { useMemo } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { colors, radius } from '@theme'

export interface ProgressBarProps {
  /** Valeur remplie, exprimée dans [0, max]. Bornée à cet intervalle au rendu. */
  value: number
  /** Valeur maximale (100 % de remplissage). Défaut : 100. */
  max?: number
  /**
   * Couleur de la portion remplie. Une seule couleur, jamais conditionnée à la
   * donnée : une barre qui change de teinte selon la valeur porterait un jugement.
   * Défaut : `colors.primary`.
   */
  color?: string
  /** Couleur de la piste (portion vide). Défaut : `colors.border`. */
  trackColor?: string
  /** Épaisseur en pixels. Défaut : 4. */
  height?: number
  /** Style du conteneur (largeur, marges). */
  style?: StyleProp<ViewStyle>
  testID?: string
}

/**
 * Barre de progression linéaire. Pendant de `ui/ProgressRing` pour les cas où la
 * progression accompagne un en-tête plutôt qu'un chiffre central : parcours en
 * plusieurs étapes, questionnaire un item par écran, exercice guidé.
 *
 * Purement présentationnelle : elle ne connaît ni étape, ni module, ni donnée
 * patient. Le libellé (« 8 / 10 ») appartient à l'appelant, qui seul sait ce qu'il
 * compte et dans quelle langue.
 */
export const ProgressBar = React.memo(function ProgressBar({
  value, max = 100, color = colors.primary, trackColor = colors.border, height = 4, style, testID,
}: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0

  const trackStyle = useMemo<ViewStyle>(
    () => ({ height, backgroundColor: trackColor, borderRadius: radius.full, overflow: 'hidden' }),
    [height, trackColor],
  )
  const fillStyle = useMemo<ViewStyle>(
    () => ({ width: `${ratio * 100}%`, height: '100%', backgroundColor: color, borderRadius: radius.full }),
    [ratio, color],
  )

  return (
    <View
      style={[trackStyle, style]}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: Math.min(max, Math.max(0, value)) }}
    >
      <View style={fillStyle} />
    </View>
  )
})

export default ProgressBar
