import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../../theme'
import { styles } from './Checkbox.styles'
import type { CheckboxProps } from './Checkbox.types'

/**
 * Case à cocher générique (contrôle binaire détaché de tout métier).
 *
 * - Interactif quand `onChange` est fourni (`Pressable`).
 * - Rendu statique non interactif quand `onChange` est absent (`View`) — sert aux
 *   aperçus en lecture seule.
 *
 * Toute case à cocher passe par ce primitive — jamais d'icône `square-outline` +
 * `Text` assemblés à la main.
 */
export const Checkbox = React.memo(function Checkbox({
  checked, onChange, label, disabled = false, color = colors.primary, testID,
}: CheckboxProps) {
  const iconColor = disabled ? colors.border : checked ? color : colors.textMuted
  const content = (
    <>
      <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={20} color={iconColor} />
      {label ? <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text> : null}
    </>
  )

  if (!onChange) {
    return (
      <View
        style={styles.row}
        testID={testID}
        accessible
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
      >
        {content}
      </View>
    )
  }

  return (
    <Pressable
      style={styles.row}
      onPress={() => onChange(!checked)}
      disabled={disabled}
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
    >
      {content}
    </Pressable>
  )
})

export default Checkbox
