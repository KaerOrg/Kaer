export interface PillSelectorProps {
  /** Identifiants des options dans l'ordre d'affichage. */
  options: string[]
  /** Identifiant de l'option sélectionnée. */
  value: string
  onChange: (value: string) => void
  /** Libellés d'affichage par identifiant d'option. */
  labels: Record<string, string>
  /** Couleur d'accentuation de la pilule active. Défaut : `colors.primary`. */
  color?: string
}
