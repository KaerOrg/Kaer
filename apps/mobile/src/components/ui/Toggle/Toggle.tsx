import { memo, useMemo } from 'react'
import { View, Text, Switch, StyleSheet } from 'react-native'
import { colors, spacing, fontSize } from '@theme'

export interface ToggleProps {
  /** État de la bascule. */
  value: boolean
  /** Callback de bascule. Absent → rendu statique non interactif (aperçus). */
  onValueChange?: (next: boolean) => void
  /** Libellé principal, à gauche de la bascule. */
  label: string
  /** Libellé secondaire sous le label (ce que la bascule change concrètement). */
  sublabel?: string
  /** Couleur de la piste à l'état actif. Défaut : `colors.primary`. */
  color?: string
  disabled?: boolean
  /** Libellé accessible. Défaut : `label`. */
  accessibilityLabel?: string
  testID?: string
}

/**
 * Bascule on/off du design system mobile : rangée « label + sous-titre » à gauche,
 * interrupteur à droite. Pendant mobile du `Toggle` web.
 *
 * Toute bascule binaire passe par ce primitive, jamais un `Switch` nu habillé à la
 * main dans un écran. À distinguer de `Checkbox` (sémantique case à cocher, dans un
 * formulaire) : ici on active/désactive un réglage, avec effet immédiat.
 *
 * Le bloc texte porte `flex: 1` : un sous-titre long se comprime au lieu de pousser
 * l'interrupteur hors écran (zéro scroll horizontal).
 */
export const Toggle = memo(function Toggle({
  value, onValueChange, label, sublabel, color = colors.primary, disabled = false,
  accessibilityLabel, testID,
}: ToggleProps) {
  const trackColor = useMemo(
    () => ({ false: colors.border, true: color }),
    [color],
  )

  return (
    <View style={styles.row} testID={testID}>
      <View style={styles.texts}>
        <Text style={[styles.label, disabled && styles.disabled]}>{label}</Text>
        {sublabel ? <Text style={[styles.sublabel, disabled && styles.disabled]}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || onValueChange == null}
        trackColor={trackColor}
        thumbColor={colors.white}
        accessibilityRole="switch"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ checked: value, disabled }}
        testID={testID ? `${testID}-switch` : undefined}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
  },
  texts: { flex: 1, flexShrink: 1 },
  label: { fontSize: fontSize.body, color: colors.text, fontWeight: '600' },
  sublabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  disabled: { opacity: 0.5 },
})

export default Toggle
