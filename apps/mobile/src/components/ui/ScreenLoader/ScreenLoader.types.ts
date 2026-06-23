import type { ViewStyle } from 'react-native'

export interface ScreenLoaderProps {
  /** Couleur du spinner. Défaut : `colors.primary`. */
  color?: string
  /** Style additionnel du conteneur centré (ex. padding). */
  style?: ViewStyle
  testID?: string
}
