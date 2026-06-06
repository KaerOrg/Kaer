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

/**
 * Contrat d'entrée des graphiques temporels — un relevé daté porteur d'un score
 * principal et de sous-scores nommés. **Volontairement détaché de toute couche de
 * persistance** : le design system ne dépend pas de `lib/database`. Tout type métier
 * exposant ces champs (ex. `ScaleEntry`) satisfait ce contrat structurellement ;
 * c'est à l'appelant (écran/feature) d'y mapper ses données.
 */
export interface ChartEntry {
  created_at: string
  total_score: number
  subscale_scores: Record<string, number | string> | null
}
