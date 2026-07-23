import type { ReactNode } from 'react'
import type { ViewStyle } from 'react-native'

export interface CardHeader {
  title: string
  subtitle?: string
  icon?: ReactNode
}

export interface CardProps {
  header?: CardHeader
  actions?: ReactNode
  children?: ReactNode
  variant?: 'default' | 'outlined' | 'elevated'
  state?: 'active' | 'disabled'
  style?: ViewStyle
  accentColor?: string
  /**
   * Filet d'accent vertical sur le bord gauche (4px), le reste de la bordure
   * inchangé. Motif « bandeau » (ex. carte de crise en `colors.danger`).
   */
  leftAccentColor?: string
  /** Rend la carte pressable (navigation). */
  onPress?: () => void
  accessibilityLabel?: string
  testID?: string
}
