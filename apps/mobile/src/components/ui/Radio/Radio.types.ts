export interface RadioOption {
  /** Identifiant unique de l'option. */
  value: string
  /** Libellé affiché. */
  label: string
  /** Texte secondaire optionnel (variant `list` uniquement). */
  sublabel?: string
}

export interface RadioProps {
  /** Options dans l'ordre d'affichage. */
  options: readonly RadioOption[]
  /** Identifiant de l'option sélectionnée (`null` = aucune). */
  value: string | null
  /** Sélection. Optionnel : inutile (et ignoré) en `readonly`. */
  onChange?: (value: string) => void
  /**
   * Habillage :
   * - `list` (défaut) : radio classique, rangées rond + label (+ sous-label) ;
   * - `pills` : pilules en ligne, remplissage couleur sur l'option active.
   */
  variant?: 'list' | 'pills'
  /**
   * Lecture seule : même rendu, aucune interaction (options rendues en `View`,
   * pas en `Pressable`). Un même primitive sert l'affichage et la saisie, on ne
   * duplique pas en composant « display-only ». Cf. `RatingSelector`.
   */
  readonly?: boolean
  /** Couleur d'accentuation de l'option active. Défaut : `colors.primary`. */
  color?: string
  testID?: string
}
