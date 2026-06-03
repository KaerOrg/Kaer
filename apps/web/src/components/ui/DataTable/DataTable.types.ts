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
  /** Rendu de la cellule pour une ligne donnée. */
  readonly cell: (row: T, ctx: DataTableRowContext) => ReactNode
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
}
