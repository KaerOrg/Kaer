import type { ReactNode } from 'react'
import type { ViewStyle } from 'react-native'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  /** Nœud affiché à gauche du label (ex. icône MaterialCommunityIcons). */
  iconLeft?: ReactNode
  testID?: string
}
