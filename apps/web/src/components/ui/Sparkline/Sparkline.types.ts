export interface SparklineProps {
  /** Série de valeurs à tracer (au moins 2 points). */
  values: number[]
  /** Couleur du trait. Défaut : var(--color-primary). */
  color?: string
  /** Bornes de l'échelle verticale (défaut 1–10). */
  min?: number
  max?: number
  /** Dimensions du SVG en pixels. */
  width?: number
  height?: number
  /** Classe additionnelle (ex. pour `flex: 1` dans une ligne). */
  className?: string
}
