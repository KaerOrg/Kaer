import type { ReactNode } from 'react'

export interface ProgressRingProps {
  /** Valeur remplie, bornée à `[0, max]` au rendu. */
  value: number
  /** Valeur de remplissage complet (100 %). Défaut : 100. */
  max?: number
  /** Diamètre extérieur en pixels. Défaut : 96. */
  size?: number
  /** Épaisseur de l'anneau en pixels. Défaut : 10. */
  strokeWidth?: number
  /** Couleur de l'arc rempli. Une seule couleur, aucun codage conditionnel. Défaut : `var(--color-primary)`. */
  color?: string
  /** Couleur de la piste vide. Défaut : `var(--color-border)`. */
  trackColor?: string
  /** Texte central principal (ex. « 91 % »). */
  label?: ReactNode
  /** Texte central secondaire, plus petit. */
  sublabel?: ReactNode
  /** Libellé accessible de la jauge. */
  ariaLabel?: string
  className?: string
}
