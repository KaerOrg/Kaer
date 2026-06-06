import type { ReactNode } from 'react'

export interface LayoutProps {
  children: ReactNode
  sidebar?: ReactNode
  /** Élargit la zone de contenu (tableaux denses comme la file active). */
  wide?: boolean
}
