export type RatingSelectorVariant = 'numbered' | 'track' | 'icon'

/** Icônes disponibles pour la variante `icon`. */
export type RatingSelectorIcon = 'star' | 'weather-sunny'

export interface RatingSelectorProps {
  /** Valeur sélectionnée. null = aucune sélection visible. */
  value: number | null
  /** Valeurs disponibles, dans l'ordre d'affichage. */
  steps: number[]
  /** Couleur d'accent (pip sélectionné / track ou icône remplis). */
  color: string
  /** Libellé du champ — sert aussi d'accessibilityLabel de base. */
  label?: string
  /** Sous-libellé optionnel (ex. "0 = aucun effort"). */
  sublabel?: string
  /**
   * Lecture seule : aucune interaction (pips/icônes rendus en `View`, pas en
   * `Pressable`). `onPress` devient inutile. Vaut pour toutes les variantes —
   * un même composant sert l'affichage et la saisie, on ne duplique pas en
   * « composant d'affichage » parallèle.
   */
  readonly?: boolean
  /**
   * Remplissage continu (variante `track` uniquement) : au lieu d'un pip par
   * `step`, affiche une barre proportionnelle remplie au ratio
   * `(value - min) / (max - min)`, où `min`/`max` sont le premier et le dernier
   * `steps`. Pour une jauge continue, passer `steps={[min, max]}`. Implique un
   * rendu non interactif.
   */
  continuous?: boolean
  /** Unité affichée après la valeur en mode `continuous` (ex. "min"). */
  unit?: string
  /**
   * 'numbered' (défaut) : boutons carrés avec le chiffre, seul le sélectionné
   *   est mis en évidence. Usage : mood_tracker, fear_thermometer.
   * 'track' : segments fins formant une barre de progression, tous les pips
   *   jusqu'à la valeur courante sont remplis. Usage : behavioral_activation,
   *   beck_columns.
   * 'icon' : rangée d'icônes (étoiles, soleils) remplies jusqu'à la valeur.
   *   Usage : qualité / ressenti de l'agenda du sommeil.
   */
  variant?: RatingSelectorVariant
  /** Icône de la variante `icon` (défaut 'star'). */
  icon?: RatingSelectorIcon
  /** Taille des icônes de la variante `icon` (défaut 36). */
  iconSize?: number
  /**
   * false → masque l'en-tête label/valeur.
   * Utile quand le parent gère son propre header (ex. SudsField).
   */
  showHeader?: boolean
  /** Affiche les valeurs min/max en dessous (track uniquement en pratique). */
  showEndLabels?: boolean
  /** Préfixe de testID : chaque pip expose `${testIdPrefix}-${valeur}`. */
  testIdPrefix?: string
  /** Appelé au clic sur un pip. Optionnel : inutile en `readonly`/`continuous`. */
  onPress?: (value: number) => void
}
