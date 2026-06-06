import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import type { CaseloadEntry, CaseloadEntryInput } from '../../../lib/caseload.types'

export interface ImportantCellProps {
  entry: CaseloadEntry
  onPatch: (id: string, patch: CaseloadEntryInput) => void
}

/** Drapeau ⭐ « Important » — épingle le dossier en haut de la file. */
function ImportantCellComponent({ entry, onPatch }: ImportantCellProps) {
  const { t } = useTranslation()

  const toggleImportant = useCallback(
    () => onPatch(entry.id, { is_important: !entry.is_important }),
    [entry.id, entry.is_important, onPatch]
  )

  return (
    <button
      type="button"
      className={`important-star ${entry.is_important ? 'important-star--on' : ''}`}
      onClick={toggleImportant}
      aria-pressed={entry.is_important}
      aria-label={t('file_active.important.toggle')}
    >
      <Star size={18} fill={entry.is_important ? 'currentColor' : 'none'} />
    </button>
  )
}

export const ImportantCell = memo(ImportantCellComponent)
