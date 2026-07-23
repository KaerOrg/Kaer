import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radius, fonts } from '@theme'

/**
 * Initiales : première lettre des (jusqu'à) deux derniers mots du nom, en majuscules.
 * « Dr Claire Lemoine » → « CL » (le titre honorifique de tête est ignoré),
 * « Lemoine » → « L », chaîne vide → « ? ».
 */
export function initialsFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  return words
    .slice(-2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}

interface AvatarProps {
  /** Nom complet — les initiales en sont dérivées (deux derniers mots). */
  name: string
  /** Diamètre en points. Défaut : 52. */
  size?: number
  /** Couleur de fond du disque (token de thème). Défaut : `primaryLight`. */
  backgroundColor?: string
  /** Couleur des initiales (token de thème). Défaut : `primary`. */
  color?: string
  testID?: string
}

/**
 * Avatar rond à initiales. Primitive présentationnelle : pas de photo, juste les
 * initiales dérivées du nom sur un disque coloré. Réutilisable (cartes RDV, en-têtes
 * de fiche praticien…).
 */
export const Avatar = React.memo(function Avatar({
  name,
  size = 52,
  backgroundColor = colors.primaryLight,
  color = colors.primary,
  testID,
}: AvatarProps) {
  const initials = useMemo(() => initialsFromName(name), [name])
  const circleStyle = useMemo(
    () => ({ width: size, height: size, borderRadius: size / 2, backgroundColor }),
    [size, backgroundColor],
  )
  const textStyle = useMemo(
    () => ({ color, fontSize: Math.round(size * 0.36) }),
    [color, size],
  )
  return (
    <View style={[styles.circle, circleStyle]} testID={testID}>
      <Text style={[styles.initials, textStyle]}>{initials}</Text>
    </View>
  )
})

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  initials: { fontWeight: '600', fontFamily: fonts.serif },
})
