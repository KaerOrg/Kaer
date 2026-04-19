import type { ReactNode } from 'react'
import type { ViewStyle } from 'react-native'

export interface AccordionProps {
  title: string
  subtitle?: string
  badge?: number
  defaultOpen?: boolean
  children: ReactNode
  style?: ViewStyle
}
