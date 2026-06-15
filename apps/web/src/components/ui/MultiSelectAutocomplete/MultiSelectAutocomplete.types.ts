/** Une option proposée dans la liste de l'autocomplete. */
export interface AutocompleteOption {
  /** Valeur technique remontée par `onToggle`. */
  value: string
  /** Libellé affiché et filtré par la saisie. */
  label: string
  /** Identifiant de groupe optionnel (section d'en-tête dans la liste). */
  group?: string
}

export interface MultiSelectAutocompleteProps {
  /** Options disponibles, déjà triées dans l'ordre d'affichage souhaité. */
  options: readonly AutocompleteOption[]
  /** Valeurs actuellement sélectionnées (cochées dans la liste). */
  selectedValues: ReadonlySet<string>
  /** Bascule la sélection d'une option (ajout si absente, retrait si présente). */
  onToggle: (value: string) => void
  /** Placeholder du champ de saisie. */
  placeholder?: string
  /** Label d'accessibilité de la combobox. */
  ariaLabel?: string
  /** En-têtes de groupe : `group` id → libellé affiché. */
  groupLabels?: Readonly<Record<string, string>>
  /** Texte affiché quand aucune option ne correspond à la saisie. */
  emptyText?: string
}
