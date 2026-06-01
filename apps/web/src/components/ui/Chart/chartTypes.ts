/** Valeur nullable — `null` = donnée manquante (gap dans la courbe). */
export type ChartDataPoint = number | null

export interface ChartProps {
  data: ChartDataPoint[]
  color: string
  /** Valeur maximale de l'axe Y (défaut 3). */
  maxY?: number
}
