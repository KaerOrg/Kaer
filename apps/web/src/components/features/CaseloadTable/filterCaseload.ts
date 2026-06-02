import { tokenizeSearch, matchesAllTokens } from '../../../lib/search'
import { computeEntryAlert, selectTopAction, daysBetween } from '../../../lib/caseloadLogic'
import type { CaseloadRowData } from '../../../lib/caseload.types'
import type { CaseloadFilterState } from './types'

const ALERT_RANK = { critical: 0, upcoming: 1, ok: 2 } as const
const FAR_FUTURE = '9999-12-31'

function hasOverdueAction(row: CaseloadRowData, today: string): boolean {
  return row.actions.some(a => !a.is_done && a.due_date !== null && daysBetween(today, a.due_date) < 0)
}

function matchesFilter(row: CaseloadRowData, filter: CaseloadFilterState, today: string, tokens: string[]): boolean {
  const { entry } = row
  if (filter.status !== 'all' && entry.status !== filter.status) return false
  if (filter.onlyImportant && !entry.is_important) return false
  if (filter.onlyOverdue && !hasOverdueAction(row, today)) return false
  if (filter.onlyWaiting && row.waits.length === 0) return false
  if (tokens.length > 0) {
    const haystack = [
      entry.display_name,
      ...entry.care_pathways,
      ...row.actions.map(a => a.label),
      ...row.waits.map(w => w.label),
    ]
      .filter(Boolean)
      .join(' ')
    if (!matchesAllTokens(haystack, tokens)) return false
  }
  return true
}

/**
 * Filtre puis trie les dossiers pour la matrice. Les patients « Important » sont
 * épinglés en haut ; ensuite, tri par sévérité d'alerte (= action la plus urgente),
 * puis échéance, puis ancienneté — mécanique et stable.
 */
export function selectCaseloadRows(
  rows: readonly CaseloadRowData[],
  filter: CaseloadFilterState,
  today: string
): CaseloadRowData[] {
  const tokens = tokenizeSearch(filter.search)
  const filtered = rows.filter(r => matchesFilter(r, filter, today, tokens))
  return filtered.sort((a, b) => {
    const byImportant = Number(b.entry.is_important) - Number(a.entry.is_important)
    if (byImportant !== 0) return byImportant
    const byAlert =
      ALERT_RANK[computeEntryAlert(a.actions, today)] - ALERT_RANK[computeEntryAlert(b.actions, today)]
    if (byAlert !== 0) return byAlert
    const aDue = selectTopAction(a.actions, today)?.due_date ?? FAR_FUTURE
    const bDue = selectTopAction(b.actions, today)?.due_date ?? FAR_FUTURE
    const byDue = aDue.localeCompare(bDue)
    if (byDue !== 0) return byDue
    return a.entry.created_at.localeCompare(b.entry.created_at)
  })
}
