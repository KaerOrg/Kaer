import React from 'react'
import { View, StyleSheet } from 'react-native'

interface TeenAccentProps {
  // Couleur vive du module (depuis teenColor())
  // Si undefined ou mode adulte, ne rend rien
  color?: string
}

// Bande colorée fine en haut d'un écran, visible uniquement en mode ado.
// À placer en premier enfant du SafeAreaView (avant le ScrollView).
export function TeenAccent({ color }: TeenAccentProps) {
  if (!color) return null
  return <View style={[styles.band, { backgroundColor: color }]} />
}

const styles = StyleSheet.create({
  band: {
    height: 4,
    width: '100%',
  },
})
