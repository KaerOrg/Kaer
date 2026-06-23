import React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { colors } from '@theme'
import { styles } from './ScreenLoader.styles'
import type { ScreenLoaderProps } from './ScreenLoader.types'

/**
 * État de chargement plein écran — `ActivityIndicator` centré. Remplace le bloc
 * `<View style={center}><ActivityIndicator .../></View>` dupliqué dans les écrans
 * de module (ScaleHistory, ScaleEntry, ModuleContent, MedicationSideEffectsEntry…).
 */
export const ScreenLoader = React.memo(function ScreenLoader({
  color = colors.primary,
  style,
  testID,
}: ScreenLoaderProps) {
  return (
    <View style={[styles.center, style]} testID={testID}>
      <ActivityIndicator color={color} size="large" />
    </View>
  )
})

export default ScreenLoader
