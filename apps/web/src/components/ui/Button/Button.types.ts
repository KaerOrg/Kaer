import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'
/** Intention sémantique de l'action — pilote l'accent de couleur au survol / état actif. */
export type ButtonCategory = 'neutral' | 'danger' | 'success'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /**
   * Accent sémantique appliqué au survol et à l'état `aria-pressed` (sur les
   * variantes transparentes `ghost`/`outline`). `danger` → rouge, `success` → vert.
   */
  category?: ButtonCategory
  loading?: boolean
  /**
   * Icône optionnelle. Avec `children` → icône à gauche du label. Sans `children`
   * → bouton icône-seule (carré). Dans ce dernier cas, fournir `aria-label`.
   */
  icon?: ReactNode
}
