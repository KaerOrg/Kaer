import type { ReactNode } from 'react'
import type { ViewStyle } from 'react-native'

export interface EmptyStateAction {
  label: string
  onPress: () => void
}

export interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: EmptyStateAction
  style?: ViewStyle
}
