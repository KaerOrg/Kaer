import type { ReactNode } from 'react'

export type ChipTone = 'neutral' | 'info' | 'warning'

export type ChipSize = 'sm' | 'md'

export interface ChipProps {
  /** Texte de la puce (obligatoire). */
  label: string
  /** Couleur de fond/texte. Ignoré quand `selectable` (les filtres ont leur propre style). */
  tone?: ChipTone
  /** Taille : `md` par défaut, `sm` pour les puces compactes (cartes denses). */
  size?: ChipSize
  /** Icône en tête de puce. */
  icon?: ReactNode
  /** Rend la puce comme un bouton-bascule (filtres) — `aria-pressed` reflète `selected`. */
  selectable?: boolean
  /** État sélectionné, uniquement avec `selectable`. */
  selected?: boolean
  /** Clic sur la puce sélectionnable. */
  onClick?: () => void
  /** Affiche un bouton × de suppression (tags éditables). */
  onRemove?: () => void
  /** Label accessibilité du bouton × — obligatoire dès que `onRemove` est fourni. */
  removeLabel?: string
  /** Tooltip natif. */
  title?: string
  /** Classe additionnelle. */
  className?: string
}
