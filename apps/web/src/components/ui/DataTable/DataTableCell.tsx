import type { DataTableColumn, DataTableRowContext } from './DataTable.types'

export interface DataTableCellProps<T> {
  /** Colonne décrivant le rendu de la cellule. */
  readonly column: DataTableColumn<T>
  /** Ligne courante passée au rendu de la cellule. */
  readonly row: T
  /** Contexte de la ligne (dépliage) passé au rendu de la cellule. */
  readonly ctx: DataTableRowContext
}

/**
 * Cellule générique du `DataTable` — un `<td>` portant la classe de base
 * `data-table__cell` plus la classe métier optionnelle de la colonne. La cellule
 * calcule elle-même son contenu via `column.cell(row, ctx)` : l'appelant fournit
 * la colonne et la ligne, pas un `children` déjà rendu.
 */
export function DataTableCell<T>({ column, row, ctx }: DataTableCellProps<T>) {
  return (
    <td className={`data-table__cell ${column.cellClassName ?? ''}`}>{column.cell(row, ctx)}</td>
  )
}
