import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { CaseloadEntry, CaseloadEntryInput } from '../../../lib/caseload.types'

export interface NameCellProps {
  entry: CaseloadEntry
  onPatch: (id: string, patch: CaseloadEntryInput) => void
}

/** Nom affiché du dossier — input non contrôlé, renommage au blur. */
function NameCellComponent({ entry, onPatch }: NameCellProps) {
  const { t } = useTranslation()

  const handleName = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const value = e.target.value.trim()
      if (!value) {
        e.target.value = entry.display_name
        return
      }
      if (value !== entry.display_name) onPatch(entry.id, { display_name: value })
    },
    [entry.id, entry.display_name, onPatch]
  )

  return (
    <input
      key={`name-${entry.display_name}`}
      className="caseload-input caseload-input--name"
      defaultValue={entry.display_name}
      onBlur={handleName}
      title={entry.display_name}
      aria-label={t('file_active.col.patient')}
    />
  )
}

export const NameCell = memo(NameCellComponent)
