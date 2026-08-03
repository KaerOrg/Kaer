import type { ReactNode } from 'react'

/**
 * Une ligne du tableau des modules / échelles. Présentationnel : l'appelant fournit
 * l'icône, les cellules « libres » (indications, contrôle d'activation) déjà rendues,
 * et les dates BRUTES (ISO ou `null`) : le tableau les formate à la locale et gère le
 * tri. Aucune interprétation des dates (MDR : un horodatage est un fait, pas un signal).
 */
export interface ModuleTableRow {
  /** Identité stable de la ligne (clé React + tri). Typiquement le `module_type`. */
  readonly id: string
  /** Icône du module (ReactNode déjà résolu par l'appelant). */
  readonly icon: ReactNode
  /** Nom du module / de l'échelle (déjà traduit). */
  readonly title: string
  /**
   * Badge accolé au nom (ex. badge Auto/Hétéro d'une échelle, K-4). Rendu à droite du
   * titre dans la 1ʳᵉ colonne. Absent → nom seul.
   */
  readonly titleBadge?: ReactNode
  /** Description tronquée sur une ligne (déjà traduite). */
  readonly description: string
  /** Cellule « Indications » (puces d'indication ou badges d'échelle), déjà rendue. */
  readonly indications: ReactNode
  /** Date de déblocage BRUTE (ISO) ou `null` si non débloqué. */
  readonly unlockedAt: string | null
  /**
   * Remplace l'affichage de la cellule « Débloqué le » par ce libellé (ex. « Toujours
   * dispo. » pour une échelle toujours disponible, C-SSRS). Le tri utilise `unlockedAt`.
   */
  readonly unlockedLabelOverride?: string
  /** Date de la dernière activité BRUTE (ISO) ou `null` si aucune saisie. */
  readonly lastActivityAt: string | null
  /** Contrôle de la colonne « Activé » (toggle ou bouton), déjà rendu. */
  readonly activation: ReactNode
  /**
   * Actions rapides révélées au survol de la ligne (icônes déjà rendues : données,
   * notifications, aperçu, config). Rendues dans une colonne dédiée, uniquement quand
   * la table est cliquable (`onRowClick`). Chaque bouton doit stopper la propagation
   * pour ne pas déclencher le clic de ligne.
   */
  readonly actions?: ReactNode
}
