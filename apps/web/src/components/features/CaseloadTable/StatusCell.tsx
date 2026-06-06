import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { CaseloadStatus } from '../../../lib/caseload.types'

const STATUSES: readonly CaseloadStatus[] = ['active', 'paused', 'archived']

export interface StatusCellProps {
  id: string
  status: CaseloadStatus
  onStatus: (id: string, status: CaseloadStatus) => void
}

/** Statut du dossier (actif / en pause / archivé). */
function StatusCellComponent({ id, status, onStatus }: StatusCellProps) {
  const { t } = useTranslation()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => onStatus(id, e.target.value as CaseloadStatus),
    [id, onStatus]
  )

  return (
    <select
      className="caseload-select"
      value={status}
      onChange={handleChange}
      aria-label={t('file_active.col.status')}
    >
      {STATUSES.map(s => (
        <option key={s} value={s}>{t(`file_active.status.${s}`)}</option>
      ))}
    </select>
  )
}

export const StatusCell = memo(StatusCellComponent)
