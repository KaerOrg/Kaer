// Mock d'expo-image pour les tests Jest : rend un <View> testable portant le
// testID et l'accessibilityLabel, en ignorant les props purement visuelles
// (source, contentFit, transition…). Suffisant pour les assertions de présence.
import React from 'react'
import { View } from 'react-native'

interface MockImageProps {
  testID?: string
  accessibilityLabel?: string
}

export function Image({ testID, accessibilityLabel }: MockImageProps) {
  return <View testID={testID} accessibilityLabel={accessibilityLabel} />
}

export function ImageBackground({ testID }: MockImageProps) {
  return <View testID={testID} />
}

export const useImage = (): null => null
