import { memo, useCallback } from 'react'
import { CareTagsCell } from './CareTagsCell'
import { ModuleChips } from './ModuleChips'
import type { CaseloadEntry, CaseloadEntryInput } from '../../../lib/caseload.types'
import type { LinkablePatient } from './types'

export interface CareCellProps {
  entry: CaseloadEntry
  patients: readonly LinkablePatient[]
  onPatch: (id: string, patch: CaseloadEntryInput) => void
}

/** Colonne « Soins en cours » : tags éditables + modules débloqués du patient lié. */
function CareCellComponent({ entry, patients, onPatch }: CareCellProps) {
  const linkedModules = entry.patient_id
    ? patients.find(p => p.id === entry.patient_id)?.moduleTypes ?? []
    : []

  const handleCare = useCallback(
    (next: string[]) => onPatch(entry.id, { care_pathways: next }),
    [entry.id, onPatch]
  )

  return (
    <>
      <CareTagsCell pathways={entry.care_pathways} onChange={handleCare} />
      <ModuleChips moduleTypes={linkedModules} />
    </>
  )
}

export const CareCell = memo(CareCellComponent)
