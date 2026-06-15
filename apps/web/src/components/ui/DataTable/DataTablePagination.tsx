import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../Button'
import type { DataTablePaginationState } from './DataTable.types'

interface DataTablePaginationProps {
  readonly pagination: DataTablePaginationState
}

/**
 * Barre de pagination contrôlée : intervalle affiché + navigation page précédente /
 * suivante. Aucune donnée n'est tronquée ici — `onPageChange` délègue à l'appelant
 * (pagination typiquement côté serveur).
 */
export function DataTablePagination({ pagination }: DataTablePaginationProps) {
  const { page, pageSize, total, onPageChange, labels } = pagination
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)
  const canPrev = page > 0
  const canNext = page + 1 < totalPages

  return (
    <div className="data-table__pagination">
      <span className="data-table__pagination-range">{labels.range(from, to, total)}</span>
      <div className="data-table__pagination-controls">
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronLeft size={16} />}
          aria-label={labels.previous}
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
        />
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronRight size={16} />}
          aria-label={labels.next}
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
        />
      </div>
    </div>
  )
}
