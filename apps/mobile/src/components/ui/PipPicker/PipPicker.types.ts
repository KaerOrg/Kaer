export type PipPickerVariant = 'numbered' | 'track'

export interface PipPickerProps {
  /** Valeur sélectionnée. null = aucune sélection visible. */
  value: number | null
  /** Valeurs disponibles, dans l'ordre d'affichage. */
  steps: number[]
  /** Couleur d'accent (pip sélectionné / track rempli). */
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
   */
  variant?: PipPickerVariant
  /**
   * false → masque l'en-tête label/valeur.
   * Utile quand le parent gère son propre header (ex. SudsPicker).
   */
  showHeader?: boolean
  /** Affiche les valeurs min/max en dessous (track uniquement en pratique). */
  showEndLabels?: boolean
  onPress: (value: number) => void
}
