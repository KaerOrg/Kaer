import { describe, it, expect } from 'vitest'
import { sortCaseloadRows, DEFAULT_SORT_DIRECTION } from './sortCaseloadRows'
import type { CaseloadAction, CaseloadEntry, CaseloadRowData, CaseloadWait } from '../../../lib/caseload.types'

const TODAY = '2026-06-02'

function makeEntry(overrides: Partial<CaseloadEntry> = {}): CaseloadEntry {
  return {
    id: 'e-1', practitioner_id: 'p-1', patient_id: null, display_name: 'Bernard Hugo',
    status: 'active', is_important: false, wake_date: null, invited_email: null,
    care_pathways: [], last_reviewed_at: null, created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z', archived_at: null, ...overrides,
  }
}

function makeAction(overrides: Partial<CaseloadAction> = {}): CaseloadAction {
  return {
    id: 'a-1', entry_id: 'e-1', practitioner_id: 'p-1', label: 'Tâche', due_date: null,
    due_time: null, is_urgent: false, is_done: false, done_at: null, recurrence_days: null, sort_order: 0,
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
  return { entry: makeEntry(entry), actions: actions.map(makeAction), waits: waits.map(makeWait), patient_avatar_url: null }
}

const ids = (rows: readonly CaseloadRowData[]) => rows.map(r => r.entry.id)

describe('sortCaseloadRows', () => {
  it('trie par nom de patient (asc / desc), insensible à la casse via localeCompare', () => {
    const rows = [
      row({ id: 'c', display_name: 'Charlie' }),
      row({ id: 'a', display_name: 'alice' }),
      row({ id: 'b', display_name: 'Bob' }),
    ]
    expect(ids(sortCaseloadRows(rows, { column: 'patient', direction: 'asc' }, TODAY))).toEqual(['a', 'b', 'c'])
    expect(ids(sortCaseloadRows(rows, { column: 'patient', direction: 'desc' }, TODAY))).toEqual(['c', 'b', 'a'])
  })

  it('trie par statut (actif → en veille → archivé) en ascendant', () => {
    const rows = [
      row({ id: 'arch', status: 'archived' }),
      row({ id: 'act', status: 'active' }),
      row({ id: 'pause', status: 'paused' }),
    ]
    expect(ids(sortCaseloadRows(rows, { column: 'status', direction: 'asc' }, TODAY))).toEqual(['act', 'pause', 'arch'])
  })

  it('trie par nombre d\'attentes de retour', () => {
    const rows = [
      row({ id: 'none' }, [], []),
      row({ id: 'two' }, [], [{ id: 'w1' }, { id: 'w2' }]),
      row({ id: 'one' }, [], [{ id: 'w3' }]),
    ]
    expect(ids(sortCaseloadRows(rows, { column: 'waiting', direction: 'desc' }, TODAY))).toEqual(['two', 'one', 'none'])
  })

  it('trie par sévérité d\'alerte : asc place les dossiers critiques en tête', () => {
    const rows = [
      row({ id: 'ok' }, [{ due_date: '2026-07-01' }]),
      row({ id: 'late' }, [{ due_date: '2026-05-30' }]),
      row({ id: 'soon' }, [{ due_date: '2026-06-05' }]),
    ]
    expect(ids(sortCaseloadRows(rows, { column: 'alert', direction: 'asc' }, TODAY))).toEqual(['late', 'soon', 'ok'])
  })

  it('départage les valeurs égales par created_at, sans inverser le tiebreaker en desc', () => {
    const rows = [
      row({ id: 'late', display_name: 'Léa', created_at: '2026-06-01T12:00:00Z' }),
      row({ id: 'early', display_name: 'Léa', created_at: '2026-06-01T09:00:00Z' }),
    ]
    // Noms identiques → l'ordre suit created_at (early avant late) dans les deux sens.
    expect(ids(sortCaseloadRows(rows, { column: 'patient', direction: 'asc' }, TODAY))).toEqual(['early', 'late'])
    expect(ids(sortCaseloadRows(rows, { column: 'patient', direction: 'desc' }, TODAY))).toEqual(['early', 'late'])
  })

  it('ne mute pas le tableau source', () => {
    const rows = [row({ id: 'b', display_name: 'Bob' }), row({ id: 'a', display_name: 'Alice' })]
    sortCaseloadRows(rows, { column: 'patient', direction: 'asc' }, TODAY)
    expect(ids(rows)).toEqual(['b', 'a'])
  })

  it('expose un sens initial par défaut utile pour chaque colonne', () => {
    expect(DEFAULT_SORT_DIRECTION).toEqual({
      patient: 'asc', status: 'asc', waiting: 'desc', alert: 'asc',
    })
  })
})
