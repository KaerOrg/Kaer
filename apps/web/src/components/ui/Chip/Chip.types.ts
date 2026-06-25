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
  /**
   * Puce icône seule : le `label` n'est pas affiché, il sert de nom accessible
   * (`aria-label`) et de tooltip (`title`). L'`icon` est alors obligatoire.
   */
  iconOnly?: boolean
  /** Rend la puce comme un bouton-bascule (filtres) — `aria-pressed` reflète `selected`. */
  selectable?: boolean
  /** État sélectionné, uniquement avec `selectable`. */
  selected?: boolean
  /**
   * Couleur d'accent appliquée à l'état **sélectionné** d'une puce `selectable`
   * (bordure + texte, et fond translucide si c'est un hex). Pour les contextes où
   * la teinte active dépend de la donnée (ex. couleur de la famille d'émotion
   * choisie) et non du primaire fixe. Sans effet hors `selectable`/`selected`.
   */
  accentColor?: string
  /**
   * Action au clic. Avec `selectable`, bascule le filtre. Sans `selectable` ni
   * `onRemove`, rend la puce comme un bouton d'action (ex. « +N » qui ouvre un
   * panneau) en conservant l'habillage du `tone`, sans `aria-pressed`.
   */
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
