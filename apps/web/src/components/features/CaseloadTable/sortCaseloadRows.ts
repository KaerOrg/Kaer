import { computeEntryAlert } from '../../../lib/caseloadLogic'
import type { CaseloadRowData, CaseloadStatus } from '../../../lib/caseload.types'
import type { SortDirection } from '../../ui/DataTable'

/** Colonnes triables de la matrice « Ma file active » (= `DataTableColumn.id` triables). */
export type CaseloadSortColumn = 'patient' | 'status' | 'important' | 'waiting' | 'alert'

/** Tri utilisateur actif sur une colonne de la matrice. */
export interface CaseloadSort {
  readonly column: CaseloadSortColumn
  readonly direction: SortDirection
}

const STATUS_RANK: Record<CaseloadStatus, number> = { active: 0, paused: 1, archived: 2 }
const ALERT_RANK = { critical: 0, upcoming: 1, ok: 2 } as const

/**
 * Sens initial le plus utile quand le praticien sélectionne une colonne pour la
 * première fois (avant de pouvoir basculer asc/desc). Ex. « Important » montre
 * d'emblée les patients épinglés en tête.
 */
export const DEFAULT_SORT_DIRECTION: Record<CaseloadSortColumn, SortDirection> = {
  patient: 'asc',
  status: 'asc',
  important: 'desc',
  waiting: 'desc',
  alert: 'asc',
}

/**
 * Comparateur d'ordre naturel ascendant pour une colonne donnée. Le sens (asc/desc)
 * et le départage stable sont appliqués par `sortCaseloadRows` — ici, ordre croissant
 * uniquement (A→Z, actif→archivé, non-épinglé→épinglé, 0→N attentes, critique→ok).
 */
function compareColumn(
  a: CaseloadRowData,
  b: CaseloadRowData,
  column: CaseloadSortColumn,
  today: string
): number {
  switch (column) {
    case 'patient':
      return a.entry.display_name.localeCompare(b.entry.display_name)
    case 'status':
      return STATUS_RANK[a.entry.status] - STATUS_RANK[b.entry.status]
    case 'important':
      return Number(a.entry.is_important) - Number(b.entry.is_important)
    case 'waiting':
      return a.waits.length - b.waits.length
    case 'alert':
      return (
        ALERT_RANK[computeEntryAlert(a.actions, today)] - ALERT_RANK[computeEntryAlert(b.actions, today)]
      )
  }
}

/**
 * Trie les dossiers (déjà filtrés) selon la colonne et le sens choisis par le
 * praticien. Le départage (`created_at`) reste stable, non affecté par le sens, pour
 * garantir un ordre déterministe à valeurs égales. Ne mute jamais `rows`.
 */
export function sortCaseloadRows(
  rows: readonly CaseloadRowData[],
  sort: CaseloadSort,
  today: string
): CaseloadRowData[] {
  const factor = sort.direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const primary = compareColumn(a, b, sort.column, today)
    if (primary !== 0) return primary * factor
    return a.entry.created_at.localeCompare(b.entry.created_at)
  })
}
