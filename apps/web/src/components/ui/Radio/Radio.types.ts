export interface RadioOption {
  /** Identifiant unique de l'option. */
  value: string
  /** Libellé affiché. */
  label: string
  /** Texte secondaire optionnel (variantes `list` et `cards`). */
  sublabel?: string
  /** Pastille en tête (ex. valeur numérique d'une échelle) — variante `cards`. */
  badge?: string
}

export interface RadioProps {
  /** Options dans l'ordre d'affichage. */
  options: readonly RadioOption[]
  /** Identifiant de l'option sélectionnée (`null` = aucune). */
  value: string | null
  onChange: (value: string) => void
  /**
   * Habillage :
   * - `list` (défaut) : rangées rond + label (+ sous-label) ;
   * - `pills` : pilules en ligne, remplissage couleur sur l'option active ;
   * - `cards` : grille de cartes (pastille `badge` + label + sous-label),
   *   remplissage couleur sur la carte active. Pour les échelles à libellés riches.
   */
  variant?: 'list' | 'pills' | 'cards'
  /** Couleur d'accentuation de l'option active. Défaut : var(--color-primary). */
  color?: string
  className?: string
  'data-testid'?: string
}
