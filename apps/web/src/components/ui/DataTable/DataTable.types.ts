import type { ReactNode } from 'react'

/**
 * Contexte d'une ligne passé au rendu des cellules et du panneau de détail.
 * Permet à une cellule métier de piloter le dépliage (ex. un chevron cliquable).
 */
export interface DataTableRowContext {
  readonly expanded: boolean
  readonly toggleExpanded: () => void
}

/**
 * Définition d'une colonne. La table ne connaît rien du métier : l'appelant
 * injecte l'en-tête (déjà traduit) et le rendu de chaque cellule.
 */
export interface DataTableColumn<T> {
  /** Identifiant stable — clé React de l'en-tête et de la cellule. */
  readonly id: string
  /** Contenu de l'en-tête (ReactNode déjà traduit par l'appelant). */
  readonly header: ReactNode
  /** Classe optionnelle du `<th>` (largeur, alignement propres au métier). */
  readonly headerClassName?: string
  /** Classe optionnelle du `<td>`. */
  readonly cellClassName?: string
  /**
   * Colonne triable : l'en-tête devient cliquable et émet `onSortChange(id)`.
   * Le tri lui-même est à la charge de l'appelant (souvent côté serveur) — la
   * table ne réordonne jamais `rows`.
   */
  readonly sortable?: boolean
  /** Rendu de la cellule pour une ligne donnée. */
  readonly cell: (row: T, ctx: DataTableRowContext) => ReactNode
}

export type SortDirection = 'asc' | 'desc'

/** Colonne de tri active + sens. `column` correspond à `DataTableColumn.id`. */
export interface DataTableSort {
  readonly column: string
  readonly direction: SortDirection
}

/**
 * État de pagination contrôlé. La table ne tronque jamais `rows` : elle affiche la
 * page courante telle qu'injectée et délègue le changement de page via `onPageChange`
 * (pagination typiquement côté serveur).
 */
export interface DataTablePaginationState {
  /** Index de page, base 0. */
  readonly page: number
  readonly pageSize: number
  /** Total du jeu (filtré) — borne le nombre de pages. */
  readonly total: number
  readonly onPageChange: (page: number) => void
  /** Libellés (i18n résolu par l'appelant — un primitive ne connaît pas de clé). */
  readonly labels: DataTablePaginationLabels
}

export interface DataTablePaginationLabels {
  /** `aria-label` du bouton « page précédente ». */
  readonly previous: string
  /** `aria-label` du bouton « page suivante ». */
  readonly next: string
  /** Construit le libellé d'intervalle, ex. « 1–150 sur 412 ». */
  readonly range: (from: number, to: number, total: number) => string
}

export interface DataTableProps<T> {
  readonly columns: readonly DataTableColumn<T>[]
  readonly rows: readonly T[]
  /** Identité stable d'une ligne — clé React et conservation de l'état de dépliage. */
  readonly getRowId: (row: T) => string
  /** Zone libre au-dessus de la table (filtres, capture rapide…). */
  readonly toolbar?: ReactNode
  /**
   * Rendu du panneau dépliable d'une ligne. Si absent, aucune ligne n'est
   * dépliable et le contexte `expanded` reste toujours `false`.
   */
  readonly renderDetail?: (row: T, ctx: DataTableRowContext) => ReactNode
  /** Classe additionnelle d'une ligne (ex. mise en avant). */
  readonly rowClassName?: (row: T) => string | undefined
  /** Affiché à la place de la table quand `rows` est vide. */
  readonly emptyState?: ReactNode
  /** Libellé accessible de la table. */
  readonly ariaLabel?: string
  /** Tri actif (en-têtes triables). Sans lui, aucun indicateur n'est affiché. */
  readonly sort?: DataTableSort
  /**
   * Clic sur un en-tête triable. Reçoit l'`id` de la colonne ; à l'appelant de
   * basculer le sens (asc/desc) et de re-trier (souvent via un refetch serveur).
   */
  readonly onSortChange?: (column: string) => void
  /** Pagination contrôlée. Absente → aucune barre de pagination. */
  readonly pagination?: DataTablePaginationState
  /**
   * Classe additionnelle posée sur le conteneur `.data-table-wrap` — permet à un
   * consommateur de scoper son propre habillage (couleurs d'en-tête, dégradé de
   * lignes…) sans toucher au style générique partagé.
   */
  readonly className?: string
}
