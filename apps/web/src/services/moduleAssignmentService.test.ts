import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import {
  fetchPatientModules,
  revokeModule,
  unlockModule,
  unlockPsychoeducation,
  unlockRim,
  updatePsychoeducationCards,
  updateRim,
} from './moduleAssignmentService'

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

beforeEach(() => vi.clearAllMocks())

describe('moduleAssignmentService.fetchPatientModules', () => {
  it('retourne les modules débloqués', async () => {
    const rows = [{ id: 'pm-1', patient_id: 'pat-1', module_type: 'sleep_diary' }]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const result = await fetchPatientModules('pat-1')

    expect(result).toEqual(rows)
  })

  it('retourne [] si aucune ligne', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)

    const result = await fetchPatientModules('pat-1')

    expect(result).toEqual([])
  })
})

describe('moduleAssignmentService.unlockModule', () => {
  it('insère la ligne et renvoie ok: true', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({ insert } as never)

    const result = await unlockModule('pat-1', 'p-1', 'sleep_diary')

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      patient_id: 'pat-1',
      practitioner_id: 'p-1',
      module_type: 'sleep_diary',
    }))
    expect(result).toEqual({ ok: true })
  })

  it("propage le code et le message d'erreur Supabase", async () => {
    const insert = vi.fn().mockResolvedValue({ error: { code: '23505', message: 'dup' } })
    vi.mocked(supabase.from).mockReturnValue({ insert } as never)

    const result = await unlockModule('pat-1', 'p-1', 'sleep_diary')

    expect(result).toEqual({ ok: false, code: '23505', message: 'dup' })
  })

  it('inclut config dans le insert si fourni', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({ insert } as never)

    await unlockModule('pat-1', 'p-1', 'rim', { foo: 'bar' })

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ config: { foo: 'bar' } }))
  })
})

describe('moduleAssignmentService.revokeModule', () => {
  it('supprime la ligne par id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.mocked(supabase.from).mockReturnValue({ delete: del } as never)

    await revokeModule('pm-1')

    expect(eq).toHaveBeenCalledWith('id', 'pm-1')
  })
})

describe('moduleAssignmentService.unlockPsychoeducation', () => {
  it("insère un module psychoeducation avec les cartes (is_read: false, unlocked_at: now)", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({ insert } as never)

    const result = await unlockPsychoeducation('pat-1', 'p-1', ['c1', 'c2'])

    expect(result).toEqual({ ok: true })
    const inserted = insert.mock.calls[0][0]
    expect(inserted.module_type).toBe('psychoeducation')
    expect(inserted.config.unlocked_cards).toHaveLength(2)
    expect(inserted.config.unlocked_cards[0]).toMatchObject({ card_id: 'c1', is_read: false })
    expect(inserted.config.unlocked_cards[0].unlocked_at).toEqual(expect.any(String))
  })
})

describe('moduleAssignmentService.updatePsychoeducationCards', () => {
  it("conserve l'ancien is_read pour les cartes déjà présentes", async () => {
    const existingCards = [
      { card_id: 'c1', is_read: true,  unlocked_at: '2026-01-01' },
      { card_id: 'c2', is_read: false, unlocked_at: '2026-01-02' },
    ]
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    vi.mocked(supabase.from).mockReturnValue({ update } as never)

    await updatePsychoeducationCards('pm-1', existingCards, ['c1', 'c2', 'c3'])

    const cards = update.mock.calls[0][0].config.unlocked_cards
    expect(cards.find((c: { card_id: string }) => c.card_id === 'c1')).toEqual(existingCards[0])
    expect(cards.find((c: { card_id: string }) => c.card_id === 'c3').is_read).toBe(false)
  })
})

describe('moduleAssignmentService.unlockRim / updateRim', () => {
  it('omet original_scenario s’il est vide', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({ insert } as never)

    await unlockRim('pat-1', 'p-1', { alternative: 'alt', original: '' })

    const config = insert.mock.calls[0][0].config
    expect(config).toEqual({ alternative_scenario: 'alt' })
  })

  it("inclut original_scenario quand non vide (updateRim)", async () => {
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    vi.mocked(supabase.from).mockReturnValue({ update } as never)

    await updateRim('pm-1', { alternative: 'alt', original: 'orig' })

    expect(update.mock.calls[0][0].config).toEqual({
      alternative_scenario: 'alt',
      original_scenario: 'orig',
    })
  })
})
