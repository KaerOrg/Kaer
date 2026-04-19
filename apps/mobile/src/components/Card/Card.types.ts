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
}
