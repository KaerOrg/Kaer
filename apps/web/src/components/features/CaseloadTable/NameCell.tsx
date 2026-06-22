import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye } from 'lucide-react'
import { EditableName } from './EditableName'
import type { CaseloadEntry, CaseloadEntryInput } from '../../../lib/caseload.types'

export interface NameCellProps {
  entry: CaseloadEntry
  expanded: boolean
  onToggle: () => void
  onPatch: (id: string, patch: CaseloadEntryInput) => void
}

/**
 * Cellule « Patient » : chevron de dépliage de la ligne et nom éditable de façon
 * sécurisée (`EditableName`). Un clic sur le nom déplie aussi le détail.
 */
function NameCellComponent({ entry, expanded, onToggle, onPatch }: NameCellProps) {
  const { t } = useTranslation()

  const handleName = useCallback(
    (next: string) => onPatch(entry.id, { display_name: next }),
    [entry.id, onPatch]
  )

  return (
    <div className="name-cell">
      <button
        type="button"
        className={`name-cell__toggle ${expanded ? 'name-cell__toggle--active' : ''}`}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={t('file_active.toggle_detail')}
      >
        <Eye size={16} />
      </button>
      <EditableName
        value={entry.display_name}
        onSave={handleName}
        onActivate={onToggle}
        ariaLabel={t('file_active.col.patient')}
      />
    </div>
  )
}

export const NameCell = memo(NameCellComponent)
