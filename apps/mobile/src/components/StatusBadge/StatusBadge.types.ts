import type { ViewStyle } from 'react-native'

export type StatusBadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

export interface StatusBadgeProps {
  variant?: StatusBadgeVariant
  label: string
  value?: string | number
  icon?: string
  style?: ViewStyle
}
