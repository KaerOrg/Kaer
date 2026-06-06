import { describe, it, expect } from 'vitest'
import {
  daysBetween,
  computeAlertForDue,
  computeActionAlert,
  computeEntryAlert,
  selectTopAction,
  buildTodayList,
} from './caseloadLogic'
import type { CaseloadAction, CaseloadEntry, CaseloadRowData, CaseloadWait } from './caseload.types'

const TODAY = '2026-06-02'

function makeEntry(overrides: Partial<CaseloadEntry> = {}): CaseloadEntry {
  return {
    id: 'e-1',
    practitioner_id: 'p-1',
    patient_id: null,
    display_name: 'Bernard Hugo',
    status: 'active',
    is_important: false,
    wake_date: null,
    care_pathways: [],
    last_reviewed_at: null,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z',
    archived_at: null,
    ...overrides,
  }
}

function makeWait(overrides: Partial<CaseloadWait> = {}): CaseloadWait {
  return {
    id: 'w-1',
    entry_id: 'e-1',
    practitioner_id: 'p-1',
    label: 'Bilan',
    relance_date: null,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z',
    ...overrides,
  }
}

function makeAction(overrides: Partial<CaseloadAction> = {}): CaseloadAction {
  return {
    id: 'a-1',
    entry_id: 'e-1',
    practitioner_id: 'p-1',
    label: 'Renouvellement',
    due_date: null,
    due_time: null,
    is_done: false,
    done_at: null,
    recurrence_days: null,
    sort_order: 0,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z',
    ...overrides,
  }
}

function makeRow(
  entry: Partial<CaseloadEntry>,
  actions: Partial<CaseloadAction>[],
  waits: Partial<CaseloadWait>[] = []
): CaseloadRowData {
  return { entry: makeEntry(entry), actions: actions.map(makeAction), waits: waits.map(makeWait) }
}

describe('daysBetween', () => {
  it('compte les jours entiers entre deux dates', () => {
    expect(daysBetween('2026-06-02', '2026-06-05')).toBe(3)
    expect(daysBetween('2026-06-05', '2026-06-02')).toBe(-3)
    expect(daysBetween('2026-06-30', '2026-07-01')).toBe(1)
  })
})

describe('computeAlertForDue', () => {
  it("renvoie 'ok' sans échéance", () => {
    expect(computeAlertForDue(null, TODAY)).toBe('ok')
  })
  it("renvoie 'critical' si dépassée ou aujourd'hui", () => {
    expect(computeAlertForDue('2026-05-31', TODAY)).toBe('critical')
    expect(computeAlertForDue(TODAY, TODAY)).toBe('critical')
  })
  it("distingue 'upcoming' et 'ok' selon la fenêtre de 7 jours", () => {
    expect(computeAlertForDue('2026-06-09', TODAY)).toBe('upcoming')
    expect(computeAlertForDue('2026-06-15', TODAY)).toBe('ok')
  })
})

describe('computeActionAlert', () => {
  it("renvoie 'ok' pour une action faite, quelle que soit son échéance", () => {
    expect(computeActionAlert({ due_date: '2026-05-30', is_done: true }, TODAY)).toBe('ok')
  })
  it("dérive de l'échéance pour une action ouverte", () => {
    expect(computeActionAlert({ due_date: '2026-05-30', is_done: false }, TODAY)).toBe('critical')
  })
})

describe('computeEntryAlert', () => {
  it("renvoie 'ok' sans action ouverte", () => {
    expect(computeEntryAlert([makeAction({ is_done: true, due_date: '2026-05-30' })], TODAY)).toBe('ok')
    expect(computeEntryAlert([], TODAY)).toBe('ok')
  })
  it("prend l'action ouverte la plus sévère", () => {
    const actions = [
      makeAction({ id: 'a', due_date: '2026-06-09' }), // upcoming
      makeAction({ id: 'b', due_date: '2026-05-30' }), // critical
    ]
    expect(computeEntryAlert(actions, TODAY)).toBe('critical')
  })
})

describe('selectTopAction', () => {
  it('ignore les actions faites et prend la plus urgente', () => {
    const actions = [
      makeAction({ id: 'done', is_done: true, due_date: '2026-05-20' }),
      makeAction({ id: 'soon', due_date: '2026-06-09' }),
      makeAction({ id: 'late', due_date: '2026-05-30' }),
    ]
    expect(selectTopAction(actions, TODAY)?.id).toBe('late')
  })
  it("départage par l'heure à date égale", () => {
    const actions = [
      makeAction({ id: 'afternoon', due_date: TODAY, due_time: '14:00' }),
      makeAction({ id: 'morning', due_date: TODAY, due_time: '09:00' }),
    ]
    expect(selectTopAction(actions, TODAY)?.id).toBe('morning')
  })
  it('renvoie null si aucune action ouverte', () => {
    expect(selectTopAction([makeAction({ is_done: true })], TODAY)).toBeNull()
  })
})

describe('buildTodayList', () => {
  it('liste les actions ouvertes en retard / du jour des dossiers actifs', () => {
    const rows = [
      makeRow({ id: 'e1' }, [{ id: 'overdue', entry_id: 'e1', due_date: '2026-05-31' }, { id: 'future', entry_id: 'e1', due_date: '2026-06-30' }]),
      makeRow({ id: 'e2' }, [{ id: 'today', entry_id: 'e2', due_date: TODAY }]),
    ]
    const list = buildTodayList(rows, TODAY)
    expect(list.map(i => i.action?.id)).toEqual(['overdue', 'today'])
    expect(list[0].reason).toEqual({ kind: 'overdue', days: 2 })
  })

  it('exclut les actions faites', () => {
    const rows = [makeRow({ id: 'e1' }, [{ is_done: true, due_date: '2026-05-30' }])]
    expect(buildTodayList(rows, TODAY)).toHaveLength(0)
  })

  it('ajoute les relances d\'attente dues (actif) et les réveils (en veille)', () => {
    const rows = [
      makeRow({ id: 'rel', status: 'active' }, [], [{ relance_date: '2026-06-01', label: 'labo' }]),
      makeRow({ id: 'wake', status: 'paused', wake_date: '2026-06-02' }, []),
    ]
    const list = buildTodayList(rows, TODAY)
    expect(list.map(i => i.bucket)).toEqual(['relance', 'wake'])
    expect(list.every(i => i.action === null)).toBe(true)
    expect(list[0].reason).toEqual({ kind: 'relance_due', label: 'labo' })
  })

  it('ignore les dossiers archivés et les réveils futurs', () => {
    const rows = [
      makeRow({ id: 'arch', status: 'archived' }, [{ due_date: '2026-05-30' }]),
      makeRow({ id: 'future-wake', status: 'paused', wake_date: '2026-09-01' }, []),
    ]
    expect(buildTodayList(rows, TODAY)).toHaveLength(0)
  })

  it('épingle les patients « Important » en tête de bucket', () => {
    const rows = [
      makeRow({ id: 'plain', is_important: false }, [{ id: 'p', entry_id: 'plain', due_date: '2026-05-30' }]),
      makeRow({ id: 'vip', is_important: true }, [{ id: 'v', entry_id: 'vip', due_date: '2026-05-30' }]),
    ]
    const list = buildTodayList(rows, TODAY)
    expect(list.map(i => i.entry.id)).toEqual(['vip', 'plain'])
  })
})
