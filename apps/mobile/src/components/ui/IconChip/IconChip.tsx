import React, { useMemo, type ReactNode } from 'react'
import { View, StyleSheet } from 'react-native'
import { radius } from '@theme'

interface IconChipProps {
  /** Couleur de fond de la pastille (token de thème). */
  color: string
  /** Icône rendue au centre (couleur gérée par l'appelant). */
  children: ReactNode
  /** Côté de la pastille carrée. Défaut : 38. */
  size?: number
  testID?: string
}

/**
 * Pastille d'icône : carré arrondi de fond coloré contenant une icône centrée.
 * Primitive présentationnelle réutilisée par les lignes de module, le bandeau de
 * crise et les listes de réglages (accueil / profil patient).
 */
export const IconChip = React.memo(function IconChip({ color, children, size = 38, testID }: IconChipProps) {
  const sizeStyle = useMemo(
    () => ({ width: size, height: size, backgroundColor: color }),
    [size, color],
  )
  return <View style={[styles.chip, sizeStyle]} testID={testID}>{children}</View>
})

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
