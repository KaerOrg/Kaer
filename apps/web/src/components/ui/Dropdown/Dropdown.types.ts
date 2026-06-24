/** Une option proposée dans la liste du Dropdown. */
export interface DropdownOption {
  /** Valeur technique remontée par `onChange` / `onToggle`. */
  value: string
  /** Libellé affiché et filtré par la saisie. */
  label: string
  /** Identifiant de groupe optionnel (section d'en-tête dans la liste). */
  group?: string
  /** Option non sélectionnable (grisée, ignorée par la navigation clavier). */
  disabled?: boolean
}

/** Props communes aux deux modes de sélection. */
interface DropdownBaseProps {
  /** Options disponibles, déjà triées dans l'ordre d'affichage souhaité. */
  options: readonly DropdownOption[]
  /** Libellé visible au-dessus du champ. Sans lui, aucun `<label>` : fournir `ariaLabel`. */
  label?: string
  /** Label d'accessibilité quand `label` est absent (usage barre de filtres). */
  ariaLabel?: string
  /** Message d'erreur inline affiché sous le champ. */
  error?: string
  /** Placeholder du champ de saisie. */
  placeholder?: string
  /** Texte affiché quand aucune option ne correspond à la saisie. */
  emptyText?: string
  /** Filtre à la frappe (insensible casse/accents). Défaut `true`. */
  searchable?: boolean
  /** En-têtes de groupe : `group` id → libellé affiché. */
  groupLabels?: Readonly<Record<string, string>>
  /** Variante compacte (barres de filtres) : champ moins haut. Défaut `false`. */
  compact?: boolean
  /** Désactive entièrement le champ. */
  disabled?: boolean
  /** Id HTML du champ (auto-généré depuis `label` si absent). */
  id?: string
}

/** Mode `single` : une seule valeur, ferme à la sélection (remplace l'ancien `<select>`). */
export interface DropdownSingleProps extends DropdownBaseProps {
  mode?: 'single'
  /** Valeur sélectionnée (chaîne vide = aucune). */
  value: string
  /** Reçoit la nouvelle valeur (pas l'event). */
  onChange: (value: string) => void
}

/** Mode `multiple` : plusieurs valeurs, la liste reste ouverte. Le parent rend ses `Chip onRemove`. */
export interface DropdownMultipleProps extends DropdownBaseProps {
  mode: 'multiple'
  /** Valeurs actuellement cochées (affichées avec un ✓). */
  selectedValues: ReadonlySet<string>
  /** Bascule une option (ajout si absente, retrait si présente). */
  onToggle: (value: string) => void
}

export type DropdownProps = DropdownSingleProps | DropdownMultipleProps
