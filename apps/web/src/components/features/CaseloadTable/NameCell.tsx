import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { EditableName } from './EditableName'
import type { CaseloadEntry, CaseloadEntryInput } from '../../../lib/caseload.types'

export interface NameCellProps {
  entry: CaseloadEntry
  onPatch: (id: string, patch: CaseloadEntryInput) => void
}

/** Nom affiché du dossier — édition explicite via `EditableName` (lecture seule + crayon). */
function NameCellComponent({ entry, onPatch }: NameCellProps) {
  const { t } = useTranslation()

  const handleName = useCallback(
    (next: string) => onPatch(entry.id, { display_name: next }),
    [entry.id, onPatch]
  )

  return (
    <EditableName
      value={entry.display_name}
      onSave={handleName}
      ariaLabel={t('file_active.col.patient')}
    />
  )
}

export const NameCell = memo(NameCellComponent)
