import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import type { DataTableColumn, DataTableSort } from './DataTable.types'

interface DataTableHeaderProps<T> {
  readonly columns: readonly DataTableColumn<T>[]
  readonly sort?: DataTableSort
  readonly onSortChange?: (column: string) => void
}

/**
 * Ligne d'en-tête de la table. Une colonne `sortable` rend un bouton de tri (reset
 * visuel, ce n'est pas un bouton-shaped) avec indicateur de sens et `aria-sort`. Le
 * tri effectif appartient à l'appelant — l'en-tête ne fait qu'émettre `onSortChange`.
 */
export function DataTableHeader<T>({ columns, sort, onSortChange }: DataTableHeaderProps<T>) {
  return (
    <thead>
      <tr>
        {columns.map(col => {
          const sortable = col.sortable === true && onSortChange !== undefined
          const active = sortable && sort?.column === col.id
          const ariaSort = !sortable
            ? undefined
            : active
              ? (sort?.direction === 'asc' ? 'ascending' : 'descending')
              : 'none'

          return (
            <th
              key={col.id}
              className={`data-table__th ${col.headerClassName ?? ''}`}
              aria-sort={ariaSort}
            >
              {sortable ? (
                <button
                  type="button"
                  className={`data-table__sort-btn ${active ? 'data-table__sort-btn--active' : ''}`}
                  onClick={() => onSortChange(col.id)}
                >
                  {col.header}
                  {active ? (
                    sort?.direction === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                  ) : (
                    <ChevronsUpDown size={13} className="data-table__sort-icon-idle" />
                  )}
                </button>
              ) : (
                col.header
              )}
            </th>
          )
        })}
      </tr>
    </thead>
  )
}
