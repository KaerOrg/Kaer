import { describe, it, expect } from 'vitest'
import { selectCaseloadRows } from './filterCaseload'
import { EMPTY_FILTER } from './types'
import type { CaseloadAction, CaseloadEntry, CaseloadRowData, CaseloadWait } from '../../../lib/caseload.types'

const TODAY = '2026-06-02'

function makeEntry(overrides: Partial<CaseloadEntry> = {}): CaseloadEntry {
  return {
    id: 'e-1', practitioner_id: 'p-1', patient_id: null, display_name: 'Bernard Hugo',
    status: 'active', is_important: false, wake_date: null,
    care_pathways: [], last_reviewed_at: null, created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z', archived_at: null, ...overrides,
  }
}

function makeAction(overrides: Partial<CaseloadAction> = {}): CaseloadAction {
  return {
    id: 'a-1', entry_id: 'e-1', practitioner_id: 'p-1', label: 'Tâche', due_date: null,
    due_time: null, is_done: false, done_at: null, recurrence_days: null, sort_order: 0,
    created_at: '2026-06-01T10:00:00Z', updated_at: '2026-06-01T10:00:00Z', ...overrides,
  }
}

function makeWait(overrides: Partial<CaseloadWait> = {}): CaseloadWait {
  return {
    id: 'w-1', entry_id: 'e-1', practitioner_id: 'p-1', label: 'Bilan', relance_date: null,
    created_at: '2026-06-01T10:00:00Z', updated_at: '2026-06-01T10:00:00Z', ...overrides,
  }
}

function row(
  entry: Partial<CaseloadEntry>,
  actions: Partial<CaseloadAction>[] = [],
  waits: Partial<CaseloadWait>[] = []
): CaseloadRowData {
  return { entry: makeEntry(entry), actions: actions.map(makeAction), waits: waits.map(makeWait) }
}

describe('selectCaseloadRows', () => {
  it('trie les dossiers critiques (action la plus urgente) avant les autres', () => {
    const rows = [
      row({ id: 'ok' }, [{ due_date: '2026-07-01' }]),
      row({ id: 'late' }, [{ due_date: '2026-05-30' }]),
      row({ id: 'soon' }, [{ due_date: '2026-06-05' }]),
    ]
    expect(selectCaseloadRows(rows, EMPTY_FILTER, TODAY).map(r => r.entry.id)).toEqual(['late', 'soon', 'ok'])
  })

  it('recherche sur le nom et les libellés d\'action, sans accent', () => {
    const rows = [
      row({ id: 'a', display_name: 'Hugo' }, [{ label: 'Bilan psychomoteur' }]),
      row({ id: 'b', display_name: 'Lea Martin' }, []),
    ]
    expect(selectCaseloadRows(rows, { ...EMPTY_FILTER, search: 'psycho' }, TODAY).map(r => r.entry.id)).toEqual(['a'])
  })

  it('filtre les importants, les retards et les attentes de tiers', () => {
    const rows = [
      row({ id: 'vip', is_important: true }, []),
      row({ id: 'late' }, [{ due_date: '2026-05-30' }]),
      row({ id: 'waiting' }, [], [{ label: 'bilan' }]),
      row({ id: 'plain' }, []),
    ]
    expect(selectCaseloadRows(rows, { ...EMPTY_FILTER, onlyImportant: true }, TODAY).map(r => r.entry.id)).toEqual(['vip'])
    expect(selectCaseloadRows(rows, { ...EMPTY_FILTER, onlyOverdue: true }, TODAY).map(r => r.entry.id)).toEqual(['late'])
    expect(selectCaseloadRows(rows, { ...EMPTY_FILTER, onlyWaiting: true }, TODAY).map(r => r.entry.id)).toEqual(['waiting'])
  })

  it('ne compte pas une action faite comme un retard', () => {
    const rows = [row({ id: 'done' }, [{ due_date: '2026-05-30', is_done: true }])]
    expect(selectCaseloadRows(rows, { ...EMPTY_FILTER, onlyOverdue: true }, TODAY)).toHaveLength(0)
  })

  it('filtre par statut', () => {
    const rows = [row({ id: 'a', status: 'active' }), row({ id: 'p', status: 'paused' })]
    expect(selectCaseloadRows(rows, { ...EMPTY_FILTER, status: 'paused' }, TODAY).map(r => r.entry.id)).toEqual(['p'])
  })
})
