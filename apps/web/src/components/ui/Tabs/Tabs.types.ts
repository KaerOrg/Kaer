import type { ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
  badge?: number
  icon?: ReactNode
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  variant?: 'horizontal' | 'vertical'
  className?: string
}
