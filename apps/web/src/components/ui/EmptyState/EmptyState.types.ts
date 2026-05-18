import type { ReactNode } from 'react'

export interface EmptyStateAction {
  label: string
  onClick: () => void
}

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: EmptyStateAction
  className?: string
}
