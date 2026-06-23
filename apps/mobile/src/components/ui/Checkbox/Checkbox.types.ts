export interface CheckboxProps {
  /** État coché. */
  checked: boolean
  /**
   * Callback de bascule (reçoit le nouvel état).
   * Absent → rendu statique non interactif (aperçu, lecture seule).
   */
  onChange?: (checked: boolean) => void
  /** Libellé optionnel affiché à droite de la case. */
  label?: string
  /** Désactive l'interaction et grise l'habillage. */
  disabled?: boolean
  /** Couleur de la case cochée. Défaut : `colors.primary`. */
  color?: string
  testID?: string
}
