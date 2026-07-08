export interface SliderProps {
  /**
   * Valeur courante. `null` = curseur non touché : piste vide, aucun thumb, rien
   * n'est pré-sélectionné tant que le patient n'a pas interagi (pas de valeur
   * d'ancrage — conformité MDR 2017/745).
   */
  value: number | null
  /** Borne basse de la plage. */
  min: number
  /** Borne haute de la plage. */
  max: number
  /** Pas d'alignement du curseur (défaut 1 = continu au point près). */
  step?: number
  /** Couleur d'accent (remplissage + thumb). */
  color: string
  /** Libellé affiché au-dessus de la piste (sert d'`accessibilityLabel`). */
  label?: string
  /** Unité affichée après la valeur (ex. '%'). */
  unit?: string
  /** Affiche les bornes min / max sous la piste (défaut false). */
  showEndLabels?: boolean
  /** Préfixe de testID : expose `${testID}-value` et `${testID}-fill`. */
  testID?: string
  /** Émis à chaque interaction (tap ou glissement) avec la valeur alignée/bornée. */
  onChange: (value: number) => void
}
