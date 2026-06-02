/** Un point de données dans un graphique temporel. */
export interface DataPoint {
  value: number
  /** `false` → donnée manquante ce jour/bucket (gap dans la courbe). */
  hasValue: boolean
}

/** Étiquette positionnée sur l'axe X d'un graphique. */
export interface XLabel {
  /** Index dans le tableau `points` auquel colle l'étiquette. */
  index: number
  label: string
}
