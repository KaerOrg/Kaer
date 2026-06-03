import { memo, useCallback, useMemo, useState, type ReactNode } from 'react'
import { DataTableCell } from './DataTableCell'
import type { DataTableColumn, DataTableRowContext } from './DataTable.types'

interface DataTableRowProps<T> {
  readonly row: T
  readonly columns: readonly DataTableColumn<T>[]
  readonly renderDetail?: (row: T, ctx: DataTableRowContext) => ReactNode
  readonly rowClassName?: string
}

function DataTableRowInner<T>({ row, columns, renderDetail, rowClassName }: DataTableRowProps<T>) {
  const [expanded, setExpanded] = useState(false)
  const toggleExpanded = useCallback(() => setExpanded(v => !v), [])
  const ctx = useMemo<DataTableRowContext>(() => ({ expanded, toggleExpanded }), [expanded, toggleExpanded])

  return (
    <>
      <tr className={`data-table__row ${rowClassName ?? ''}`}>
        {columns.map(col => (
          <DataTableCell key={col.id} column={col} row={row} ctx={ctx} />
        ))}
      </tr>

      {expanded && renderDetail !== undefined ? (
        <tr className="data-table__detail-row">
          <td colSpan={columns.length}>
            <div className="data-table__detail">{renderDetail(row, ctx)}</div>
          </td>
        </tr>
      ) : null}
    </>
  )
}

/**
 * `React.memo` efface la généricité du composant ; on restaure la signature
 * générique exacte par assertion vers le type concret de la fonction (jamais
 * `any`/`unknown`). Motif idiomatique pour un composant générique mémoïsé.
 */
export const DataTableRow = memo(DataTableRowInner) as typeof DataTableRowInner
