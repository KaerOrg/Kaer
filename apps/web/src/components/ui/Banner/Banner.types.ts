import type { ReactNode } from 'react'

export type BannerVariant = 'info' | 'success' | 'warning' | 'danger'

export interface BannerAction {
  label: string
  onClick: () => void
}

export interface BannerProps {
  /** Couleur sémantique du bandeau. */
  variant?: BannerVariant
  /** Icône optionnelle affichée à gauche. */
  icon?: ReactNode
  /** Contenu textuel du bandeau. */
  children: ReactNode
  /** Action principale optionnelle (bouton-lien à droite). */
  action?: BannerAction
  /** Si fourni, affiche un bouton de fermeture (croix) appelant ce callback. */
  onDismiss?: () => void
  /** Libellé accessible du bouton de fermeture (obligatoire si `onDismiss`). */
  dismissLabel?: string
  className?: string
}
