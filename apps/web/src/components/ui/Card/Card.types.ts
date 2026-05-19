import type { ReactNode } from 'react'

export interface CardHeader {
  title: string
  subtitle?: string
  icon?: ReactNode
  right?: ReactNode
}

export interface CardProps {
  header?: CardHeader
  actions?: ReactNode
  children?: ReactNode
  variant?: 'default' | 'outlined' | 'elevated'
  state?: 'active' | 'disabled'
  className?: string
}
