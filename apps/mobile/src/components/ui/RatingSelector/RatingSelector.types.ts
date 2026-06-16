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
  label: string
  /** Sous-libellé optionnel (ex. "0 = aucun effort"). */
  sublabel?: string
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
  onPress: (value: number) => void
}
