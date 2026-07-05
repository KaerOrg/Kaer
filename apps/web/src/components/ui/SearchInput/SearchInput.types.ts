export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  ariaLabel?: string
  /** Variante compacte, alignée sur `Dropdown compact` (barres de filtres). */
  compact?: boolean
}
