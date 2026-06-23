import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../../theme'
import { styles, SIZE } from './Chip.styles'
import type { ChipProps } from './Chip.types'

/**
 * Puce / token du design system mobile : pilule compacte contournée (icône + label).
 * Une seule primitive couvre :
 *  - la puce statique d'aperçu (icône + valeur, atténuée via `muted`) ;
 *  - la puce sélectionnable (`selected` + `onPress`) pour les filtres / motifs ;
 *  - le badge léger contour (icône + label).
 *
 * Interactive quand `onPress` est fourni (`Pressable`), sinon rendu statique (`View`).
 * Pour un indicateur d'état sémantique **rempli** (label + valeur), préférer `StatusBadge`.
 */
export const Chip = React.memo(function Chip({
  label, icon, selected = false, color = colors.primary, size = 'md', muted = false, onPress, testID,
}: ChipProps) {
  const geom = SIZE[size]
  const accent = selected ? color : colors.textMuted
  const container = [
    styles.base,
    { paddingHorizontal: geom.paddingHorizontal, paddingVertical: geom.paddingVertical, gap: geom.gap },
    selected && { borderColor: color, backgroundColor: colors.primaryLight },
    muted && styles.muted,
  ]

  const content = (
    <>
      {icon ? <Ionicons name={icon} size={geom.iconSize} color={accent} /> : null}
      <Text style={[styles.label, { fontSize: geom.fontSize, color: accent }]}>{label}</Text>
    </>
  )

  if (!onPress) {
    return (
      <View style={container} testID={testID}>
        {content}
      </View>
    )
  }

  return (
    <Pressable
      style={container}
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {content}
    </Pressable>
  )
})

export default Chip
