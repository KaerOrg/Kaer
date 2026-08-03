import { memo, useCallback, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { DataTableCell } from './DataTableCell'
import type { DataTableColumn, DataTableRowContext } from './DataTable.types'

interface DataTableRowProps<T> {
  readonly row: T
  readonly columns: readonly DataTableColumn<T>[]
  readonly renderDetail?: (row: T, ctx: DataTableRowContext) => ReactNode
  readonly rowClassName?: string
  readonly onActivate?: (row: T) => void
}

// Éléments interactifs d'une ligne : un clic à l'intérieur de l'un d'eux (toggle,
// bouton d'action, lien) ne déclenche PAS l'activation de la surface-ligne.
const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, [role="button"], [role="switch"], [role="checkbox"]'

function DataTableRowInner<T>({ row, columns, renderDetail, rowClassName, onActivate }: DataTableRowProps<T>) {
  const [expanded, setExpanded] = useState(false)
  const toggleExpanded = useCallback(() => setExpanded(v => !v), [])
  const ctx = useMemo<DataTableRowContext>(() => ({ expanded, toggleExpanded }), [expanded, toggleExpanded])

  // Activation SOURIS de la ligne : raccourci d'ouverture. On n'ajoute PAS `role`/
  // `tabIndex` sur le `<tr>` : une ligne qui contient des boutons ne peut pas être un
  // `role="button"` valide (descendants interactifs). Le chemin clavier/lecteur d'écran
  // passe par les contrôles explicites de la ligne (toggle + boutons d'action), jamais
  // perdu. Un clic sur l'un d'eux est ignoré ici (il gère sa propre action).
  const handleClick = useCallback((e: MouseEvent<HTMLTableRowElement>) => {
    if (!onActivate) return
    if ((e.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) return
    onActivate(row)
  }, [onActivate, row])

  const interactive = onActivate != null

  return (
    <>
      <tr
        className={`data-table__row ${interactive ? 'data-table__row--clickable' : ''} ${rowClassName ?? ''}`}
        onClick={interactive ? handleClick : undefined}
      >
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
