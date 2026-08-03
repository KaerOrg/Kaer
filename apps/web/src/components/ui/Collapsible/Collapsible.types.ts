import type { ReactNode } from 'react'

export interface CollapsibleProps {
  /** Titre de la section (déjà traduit : un primitive ne connaît pas de clé i18n). */
  readonly title: ReactNode
  /** Complément d'en-tête affiché à côté du titre, en petit corps atténué. */
  readonly meta?: ReactNode
  /** Contenu révélé au dépliage. */
  readonly children: ReactNode
  /**
   * État initial. Non contrôlé : le composant possède son ouverture. Une section
   * dense (table, long tableau) gagne à rester repliée à l'arrivée sur la page.
   */
  readonly defaultOpen?: boolean
  /** Classe additionnelle du conteneur, pour scoper l'habillage d'un consommateur. */
  readonly className?: string
}
