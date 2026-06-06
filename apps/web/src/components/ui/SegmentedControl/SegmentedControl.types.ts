/** Une option d'un `SegmentedControl` : la valeur sélectionnable + son libellé affiché. */
export interface SegmentOption<T extends string = string> {
  value: T
  label: string
}

/**
 * `track` — piste segmentée (conteneur unique, segments à l'intérieur).
 * `pills` — pastilles indépendantes côte à côte.
 */
export type SegmentedControlVariant = 'track' | 'pills'

export interface SegmentedControlProps<T extends string = string> {
  options: readonly SegmentOption<T>[]
  /** Valeur actuellement sélectionnée. */
  value: T
  onChange: (value: T) => void
  variant?: SegmentedControlVariant
  /** Couleur d'accent du segment actif (valeur dynamique). Défaut CSS : `var(--color-primary)`. */
  accentColor?: string
  /** Libellé accessible du groupe (`aria-label`). */
  ariaLabel?: string
  className?: string
}
