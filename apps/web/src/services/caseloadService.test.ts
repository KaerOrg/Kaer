import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import {
  fetchCaseload,
  createCaseloadEntry,
  createEntryWithFirstAction,
  updateCaseloadEntry,
  setCaseloadStatus,
  createCaseloadAction,
  updateCaseloadAction,
  setActionDone,
  deleteCaseloadAction,
  createCaseloadWait,
  deleteCaseloadWait,
  createCaseloadNote,
  fetchCaseloadNotes,
  syncCaseloadWithPatients,
} from './caseloadService'
import type { CaseloadAction, CaseloadEntry, CaseloadNote, CaseloadWait } from '../lib/caseload.types'

function makeChain(result: { data: unknown; error?: unknown } = { data: null, error: null }) {
  const chain = new Proxy({} as Record<string, unknown>, {
    get(target, prop: string) {
      if (prop === 'then') return (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
      if (!target[prop]) target[prop] = vi.fn().mockReturnValue(chain)
      return target[prop]
    },
  })
  return chain
}

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
    id: 'a-1', entry_id: 'e-1', practitioner_id: 'p-1', label: 'Renouvellement', due_date: null,
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

function makeNote(overrides: Partial<CaseloadNote> = {}): CaseloadNote {
  return {
    id: 'n-1', entry_id: 'e-1', practitioner_id: 'p-1', body: 'À revoir', is_pinned: false,
    created_at: '2026-06-01T10:00:00Z', ...overrides,
  }
}

beforeEach(() => vi.clearAllMocks())

describe('fetchCaseload', () => {
  it('assemble les dossiers avec leurs actions et attentes groupées', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'caseload_entries') {
        return makeChain({ data: [makeEntry({ id: 'e1' }), makeEntry({ id: 'e2' })], error: null }) as never
      }
      if (table === 'caseload_actions') {
        return makeChain({ data: [makeAction({ id: 'a1', entry_id: 'e1' })], error: null }) as never
      }
      return makeChain({ data: [makeWait({ id: 'w1', entry_id: 'e1' })], error: null }) as never
    })

    const rows = await fetchCaseload('p-1')

    expect(rows).toHaveLength(2)
    expect(rows.find(r => r.entry.id === 'e1')?.actions).toHaveLength(1)
    expect(rows.find(r => r.entry.id === 'e1')?.waits).toHaveLength(1)
    expect(rows.find(r => r.entry.id === 'e2')?.actions).toHaveLength(0)
    expect(rows.find(r => r.entry.id === 'e2')?.waits).toHaveLength(0)
  })

  it('mappe l\'avatar du patient lié (embed) et null sinon', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'caseload_entries') {
        return makeChain({
          data: [
            { ...makeEntry({ id: 'e1', patient_id: 'pat-1' }), patient: { avatar_url: 'https://x/a.png' } },
            { ...makeEntry({ id: 'e2' }), patient: null },
          ],
          error: null,
        }) as never
      }
      return makeChain({ data: [], error: null }) as never
    })

    const rows = await fetchCaseload('p-1')

    expect(rows.find(r => r.entry.id === 'e1')?.patient_avatar_url).toBe('https://x/a.png')
    expect(rows.find(r => r.entry.id === 'e2')?.patient_avatar_url).toBeNull()
    // L'objet embed `patient` ne fuite pas dans l'entrée elle-même.
    expect(rows.find(r => r.entry.id === 'e1')?.entry).not.toHaveProperty('patient')
  })

  it('renvoie un tableau vide si la requête dossiers échoue', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: { message: 'boom' } }) as never)
    expect(await fetchCaseload('p-1')).toEqual([])
  })
})

describe('createCaseloadEntry', () => {
  it('refuse un nom vide sans toucher à la base', async () => {
    expect(await createCaseloadEntry('p-1', { display_name: '  ' })).toEqual({ ok: false })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('insère et renvoie le dossier', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: makeEntry({ display_name: 'Léa M.' }), error: null }) as never)
    const result = await createCaseloadEntry('p-1', { display_name: 'Léa M.' })
    expect(result.ok).toBe(true)
    expect(result.entry?.display_name).toBe('Léa M.')
  })
})

describe('createEntryWithFirstAction', () => {
  it('crée le dossier et sa première action', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'caseload_entries') return makeChain({ data: makeEntry({ id: 'e9' }), error: null }) as never
      return makeChain({ data: makeAction({ id: 'a9', entry_id: 'e9', label: 'Appeler' }), error: null }) as never
    })
    const result = await createEntryWithFirstAction('p-1', { displayName: 'Léa M.', actionLabel: 'Appeler', actionDue: '2026-06-05' })
    expect(result.ok).toBe(true)
    expect(result.row?.actions).toHaveLength(1)
    expect(result.row?.actions[0].label).toBe('Appeler')
  })

  it('crée un dossier sans action si aucun libellé fourni', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: makeEntry(), error: null }) as never)
    const result = await createEntryWithFirstAction('p-1', { displayName: 'Léa M.' })
    expect(result.ok).toBe(true)
    expect(result.row?.actions).toEqual([])
    expect(supabase.from).toHaveBeenCalledTimes(1)
  })
})

describe('updateCaseloadEntry', () => {
  it('renvoie ok:false en cas d\'erreur', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: { message: 'x' } }) as never)
    expect((await updateCaseloadEntry('e-1', { priority: 'urgent' })).ok).toBe(false)
  })
})

describe('setCaseloadStatus', () => {
  it('pose archived_at à l\'archivage et le retire sinon', async () => {
    const update = vi.fn().mockReturnThis()
    const chain = makeChain({ data: makeEntry({ status: 'archived' }), error: null })
    chain.update = update.mockReturnValue(chain)
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await setCaseloadStatus('e-1', 'archived')
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'archived', archived_at: expect.any(String) }))

    await setCaseloadStatus('e-1', 'active')
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'active', archived_at: null }))
  })
})

describe('createCaseloadAction', () => {
  it('refuse un libellé vide', async () => {
    expect(await createCaseloadAction('p-1', 'e-1', { label: '   ' })).toEqual({ ok: false })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('insère et renvoie l\'action', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: makeAction({ label: 'Courrier' }), error: null }) as never)
    const result = await createCaseloadAction('p-1', 'e-1', { label: 'Courrier' })
    expect(result.ok).toBe(true)
    expect(result.action?.label).toBe('Courrier')
  })
})

describe('setActionDone', () => {
  it('pose done_at quand coché, le retire quand décoché', async () => {
    const update = vi.fn().mockReturnThis()
    const chain = makeChain({ data: makeAction({ is_done: true }), error: null })
    chain.update = update.mockReturnValue(chain)
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await setActionDone('a-1', true)
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ is_done: true, done_at: expect.any(String) }))

    await setActionDone('a-1', false)
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ is_done: false, done_at: null }))
  })
})

describe('updateCaseloadAction', () => {
  it('renvoie ok:false en cas d\'erreur', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: { message: 'x' } }) as never)
    expect((await updateCaseloadAction('a-1', { label: 'X' })).ok).toBe(false)
  })
})

describe('deleteCaseloadAction', () => {
  it('renvoie ok:true en succès, ok:false en erreur', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)
    expect(await deleteCaseloadAction('a-1')).toEqual({ ok: true })

    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: { message: 'x' } }) as never)
    expect(await deleteCaseloadAction('a-1')).toEqual({ ok: false })
  })
})

describe('createCaseloadWait', () => {
  it('refuse un libellé vide', async () => {
    expect(await createCaseloadWait('p-1', 'e-1', { label: '  ' })).toEqual({ ok: false })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('insère et renvoie l\'attente', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: makeWait({ label: 'Retour ASE' }), error: null }) as never)
    const result = await createCaseloadWait('p-1', 'e-1', { label: 'Retour ASE', relance_date: '2026-06-20' })
    expect(result.ok).toBe(true)
    expect(result.wait?.label).toBe('Retour ASE')
  })
})

describe('deleteCaseloadWait', () => {
  it('renvoie ok selon le succès', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)
    expect(await deleteCaseloadWait('w-1')).toEqual({ ok: true })
  })
})

describe('createCaseloadNote', () => {
  it('refuse un corps vide', async () => {
    expect(await createCaseloadNote('p-1', 'e-1', '   ')).toEqual({ ok: false })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('insère et renvoie la note', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: makeNote({ body: 'RDV manqué' }), error: null }) as never)
    const result = await createCaseloadNote('p-1', 'e-1', 'RDV manqué')
    expect(result.ok).toBe(true)
    expect(result.note?.body).toBe('RDV manqué')
  })
})

describe('fetchCaseloadNotes', () => {
  it('renvoie un tableau vide en cas d\'erreur', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: { message: 'x' } }) as never)
    expect(await fetchCaseloadNotes('e-1')).toEqual([])
  })
})

describe('syncCaseloadWithPatients', () => {
  type Thenable = { then: (r: (v: unknown) => unknown) => unknown }
  const resolved = (): Thenable => ({ then: r => Promise.resolve({ error: null }).then(r) })

  it('ne touche pas la base sans inscrit ni invitation', async () => {
    expect(await syncCaseloadWithPatients('p-1', [], [])).toEqual({ created: 0, linked: 0 })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('crée un dossier lié pour un inscrit, libre pour une invitation', async () => {
    const insert = vi.fn().mockReturnValue(resolved())
    const chain = makeChain({ data: [], error: null })
    chain.insert = insert
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const result = await syncCaseloadWithPatients(
      'p-1',
      [{ id: 'pat-1', name: 'Léa', email: 'lea@x.fr' }],
      [{ email: 'tom@x.fr', name: 'Tom' }]
    )

    expect(result).toEqual({ created: 2, linked: 0 })
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ patient_id: 'pat-1', display_name: 'Léa' }),
      expect.objectContaining({ invited_email: 'tom@x.fr', display_name: 'Tom' }),
    ])
  })

  it('convertit un dossier libre en lié quand l\'invité s\'inscrit', async () => {
    const insert = vi.fn()
    const update = vi.fn().mockReturnValue({ eq: () => resolved() })
    const chain = makeChain({ data: [{ id: 'free-1', patient_id: null, invited_email: 'lea@x.fr' }], error: null })
    chain.insert = insert
    chain.update = update
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const result = await syncCaseloadWithPatients('p-1', [{ id: 'pat-1', name: 'Léa', email: 'lea@x.fr' }], [])

    expect(result).toEqual({ created: 0, linked: 1 })
    expect(insert).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledWith({ patient_id: 'pat-1', invited_email: null })
  })

  it('ne recrée rien si tout est déjà couvert', async () => {
    const insert = vi.fn()
    const chain = makeChain({ data: [{ id: 'e1', patient_id: 'pat-1', invited_email: null }], error: null })
    chain.insert = insert
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const result = await syncCaseloadWithPatients('p-1', [{ id: 'pat-1', name: 'Léa', email: 'lea@x.fr' }], [])

    expect(result).toEqual({ created: 0, linked: 0 })
    expect(insert).not.toHaveBeenCalled()
  })
})
