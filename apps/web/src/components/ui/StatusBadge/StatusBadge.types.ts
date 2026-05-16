import type { ReactNode } from 'react'

export type StatusBadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

export interface StatusBadgeProps {
  variant?: StatusBadgeVariant
  label: string
  value?: string | number
  icon?: ReactNode
  className?: string
}
