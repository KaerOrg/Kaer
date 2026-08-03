import type { ReactNode } from 'react'

export interface SheetProps {
  /** Ouvre / ferme la feuille. */
  visible: boolean
  /** Fermeture demandée : appui hors feuille, poignée, ou retour Android. */
  onClose: () => void
  /** Titre affiché en tête de feuille (texte déjà traduit). */
  title?: string
  /** Sous-titre sous le titre : consigne, contexte. */
  subtitle?: string
  /** Libellé accessible de la zone de fermeture (texte déjà traduit, ex. `t('common.close')`). */
  closeLabel: string
  /** Contenu de la feuille. */
  children: ReactNode
  /**
   * Rend le contenu dans un `ScrollView` borné à 70 % de la hauteur d'écran.
   * À activer dès que le contenu peut dépasser (listes de réglages).
   */
  scrollable?: boolean
  testID?: string
}
