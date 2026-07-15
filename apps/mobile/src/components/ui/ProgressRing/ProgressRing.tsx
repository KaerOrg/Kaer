import { memo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { colors } from '@theme'

export interface ProgressRingProps {
  /** Valeur remplie, exprimée dans [0, max]. Bornée à cet intervalle au rendu. */
  value: number
  /** Valeur maximale de l'anneau (100 % de remplissage). Défaut : 100. */
  max?: number
  /** Diamètre extérieur en pixels. Défaut : 96. */
  size?: number
  /** Épaisseur de l'anneau en pixels. Défaut : 10. */
  strokeWidth?: number
  /** Couleur de l'arc rempli. Une seule couleur — aucun codage conditionnel. Défaut : `colors.primary`. */
  color?: string
  /** Couleur de la piste (portion vide). Défaut : `colors.border`. */
  trackColor?: string
  /** Texte central principal (ex. « 91 % »). */
  label?: string
  /** Texte central secondaire, plus petit, sous le label. */
  sublabel?: string
  /** Libellé accessible de la jauge. */
  accessibilityLabel?: string
  testID?: string
}

/**
 * Jauge circulaire remplie au prorata d'une valeur brute — une seule couleur
 * d'accent, aucun code couleur conditionnel (conforme à un affichage neutre).
 * Primitif pur du design system : aucune logique métier, aucune interprétation.
 * L'arc démarre en haut (12 h) et se remplit dans le sens horaire.
 */
export const ProgressRing = memo(function ProgressRing({
  value,
  max = 100,
  size = 96,
  strokeWidth = 10,
  color = colors.primary,
  trackColor = colors.border,
  label,
  sublabel,
  accessibilityLabel,
  testID,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const fraction = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const dashOffset = circumference * (1 - fraction)
  const center = size / 2

  return (
    <View
      style={[styles.wrapper, { width: size, height: size }]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={center} cy={center} r={radius}
          stroke={trackColor} strokeWidth={strokeWidth} fill="none"
        />
        <Circle
          cx={center} cy={center} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      {(label != null || sublabel != null) ? (
        <View style={styles.center} pointerEvents="none">
          {label != null ? <Text style={styles.label}>{label}</Text> : null}
          {sublabel != null ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
        </View>
      ) : null}
    </View>
  )
})

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 22, fontWeight: '800', color: colors.text },
  sublabel: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
})
