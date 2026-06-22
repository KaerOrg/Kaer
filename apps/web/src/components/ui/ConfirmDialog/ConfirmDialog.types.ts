export interface ConfirmDialogProps {
  /** Contrôle l'affichage. `false` → rien n'est rendu. */
  open: boolean
  /** Titre de la boîte. */
  title: string
  /** Message explicatif optionnel. */
  message?: string
  /** Libellé du bouton de confirmation (défaut « OK »). */
  confirmLabel?: string
  /** Libellé du bouton d'annulation. */
  cancelLabel: string
  /** Action destructive → bouton de confirmation en variante danger. */
  destructive?: boolean
  /** Émis à la confirmation (peut être async). */
  onConfirm: () => void | Promise<void>
  /** Émis à l'annulation / fermeture (backdrop, Échap, bouton annuler). */
  onCancel: () => void
}
