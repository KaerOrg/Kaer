import { memo, useCallback } from 'react'
import { ModuleChips } from './ModuleChips'
import type { CaseloadEntry } from '../../../lib/caseload.types'
import type { LinkablePatient } from './types'

export interface CareCellProps {
  entry: CaseloadEntry
  patients: readonly LinkablePatient[]
  /** Map module_id → nom d'icône lucide (catalogue des modules). */
  iconByModule: Record<string, string>
  /** Ouvre le détail du dossier (drawer) pour ce dossier, pour le « +N » de modules repliés. */
  onOpen: (entryId: string) => void
}

/**
 * Colonne « Soins en cours » : les modules débloqués du patient lié (lecture seule).
 * Les soins correspondent aux modules de l'app — pas de saisie libre.
 */
function CareCellComponent({ entry, patients, iconByModule, onOpen }: CareCellProps) {
  const linkedModules = entry.patient_id
    ? patients.find(p => p.id === entry.patient_id)?.moduleTypes ?? []
    : []

  // Callback stable (préserve le `memo`) : un parent passant `openModules` directement
  // évite de recréer une flèche `() => openModules(id)` à chaque rendu de la cellule.
  const handleOpen = useCallback(() => onOpen(entry.id), [onOpen, entry.id])

  return (
    <ModuleChips moduleTypes={linkedModules} iconByModule={iconByModule} iconOnly max={6} onOverflowClick={handleOpen} />
  )
}

export const CareCell = memo(CareCellComponent)
