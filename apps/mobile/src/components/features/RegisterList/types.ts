import type { ReactNode } from 'react'

/**
 * Une ligne de liste-registre : pastille d'icône + libellé + chevron optionnel.
 * L'icône est fournie par l'appelant (couleur maîtrisée côté appelant, comme
 * `ui/IconChip`), ce qui garde la ligne générique.
 */
export interface RegisterItem {
  /** Clé React stable. */
  key: string
  /** Icône rendue dans la pastille (couleur gérée par l'appelant). */
  icon: ReactNode
  /** Libellé de la ligne (déjà traduit). */
  label: string
  /** Couleur de fond de la pastille (token de thème). */
  chipColor: string
  onPress: () => void
  /** Couleur du libellé (token de thème). Défaut : `colors.text`. */
  labelColor?: string
  /** Afficher le chevron « › » à droite. Défaut : true. */
  showChevron?: boolean
}
