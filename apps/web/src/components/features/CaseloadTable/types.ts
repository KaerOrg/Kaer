import type { CaseloadStatus } from '../../../lib/caseload.types'

/** Un patient de l'app reliable à un dossier (avec ses modules débloqués). */
export interface LinkablePatient {
  id: string
  name: string
  email: string
  moduleTypes: readonly string[]
}

/** État des filtres de la matrice « Ma file active » (UI uniquement). */
export interface CaseloadFilterState {
  search: string
  status: 'all' | CaseloadStatus
  onlyImportant: boolean
  onlyOverdue: boolean
  onlyWaiting: boolean
}

export const EMPTY_FILTER: CaseloadFilterState = {
  search: '',
  status: 'all',
  onlyImportant: false,
  onlyOverdue: false,
  onlyWaiting: false,
}
