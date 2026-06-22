export interface ActionSheetOption {
  label: string
  onClick: () => void
  destructive?: boolean
}

export interface ActionSheetProps {
  /** Contrôle l'affichage. `false` → rien n'est rendu. */
  open: boolean
  /** Titre optionnel (en-tête de la feuille). */
  title?: string
  /** Options proposées, dans l'ordre d'affichage. */
  options: readonly ActionSheetOption[]
  /** Libellé du bouton d'annulation. */
  cancelLabel: string
  /** Émis à la fermeture (backdrop, Échap, annuler, ou après une option). */
  onClose: () => void
}
