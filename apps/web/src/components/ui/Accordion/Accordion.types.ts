import type { ReactNode } from 'react'

export interface AccordionProps {
  title: string
  icon?: ReactNode
  subtitle?: string
  badge?: number
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}
