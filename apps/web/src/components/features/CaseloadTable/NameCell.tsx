import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { EditableName } from './EditableName'
import { formatBirthDate } from './caseloadFormat'
import type { LinkablePatient } from './types'
import type { CaseloadEntry, CaseloadEntryInput } from '../../../lib/caseload.types'

export interface NameCellProps {
  entry: CaseloadEntry
  patients: readonly LinkablePatient[]
  expanded: boolean
  onToggle: () => void
  onPatch: (id: string, patch: CaseloadEntryInput) => void
}

/**
 * Cellule « Patient » : chevron de dépliage de la ligne, nom éditable de façon
 * sécurisée (`EditableName`) et date de naissance du patient lié (lecture seule).
 * Un clic sur le nom déplie aussi le détail.
 */
function NameCellComponent({ entry, patients, expanded, onToggle, onPatch }: NameCellProps) {
  const { t } = useTranslation()

  const birthDate = entry.patient_id
    ? patients.find(p => p.id === entry.patient_id)?.birthDate ?? null
    : null

  const handleName = useCallback(
    (next: string) => onPatch(entry.id, { display_name: next }),
    [entry.id, onPatch]
  )

  return (
    <div className="name-cell">
      <button
        type="button"
        className="name-cell__toggle"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={t('file_active.toggle_detail')}
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      <EditableName
        value={entry.display_name}
        onSave={handleName}
        onActivate={onToggle}
        ariaLabel={t('file_active.col.patient')}
      />
      {birthDate ? (
        <span className="name-cell__dob" title={t('file_active.dob_label')}>
          {formatBirthDate(birthDate)}
        </span>
      ) : null}
    </div>
  )
}

export const NameCell = memo(NameCellComponent)
