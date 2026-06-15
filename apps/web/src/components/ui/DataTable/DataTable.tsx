import { DataTableRow } from './DataTableRow'
import { DataTableHeader } from './DataTableHeader'
import { DataTablePagination } from './DataTablePagination'
import type { DataTableProps } from './DataTable.types'
import './DataTable.css'

/**
 * Table de données générique du design system — structure, en-têtes, scroll
 * collant, état de dépliage par ligne et état vide. Aucune connaissance métier :
 * colonnes, cellules, panneau de détail et mise en avant sont injectés par
 * l'appelant via `columns` / `renderDetail` / `rowClassName`.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  toolbar,
  renderDetail,
  rowClassName,
  emptyState,
  ariaLabel,
  className,
  sort,
  onSortChange,
  pagination,
}: DataTableProps<T>) {
  return (
    <div className={`data-table-wrap ${className ?? ''}`}>
      {toolbar}

      {rows.length === 0 ? (
        emptyState ?? null
      ) : (
        <>
          <div className="data-table__scroll">
            <table className="data-table" aria-label={ariaLabel}>
              <DataTableHeader columns={columns} sort={sort} onSortChange={onSortChange} />
              <tbody>
                {rows.map(row => (
                  <DataTableRow
                    key={getRowId(row)}
                    row={row}
                    columns={columns}
                    renderDetail={renderDetail}
                    rowClassName={rowClassName?.(row)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.total > 0 ? <DataTablePagination pagination={pagination} /> : null}
        </>
      )}
    </div>
  )
}
