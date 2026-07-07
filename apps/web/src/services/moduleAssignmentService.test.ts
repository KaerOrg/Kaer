import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import {
  fetchBAActivities,
  fetchPatientModules,
  fetchMedications,
  revokeModule,
  unlockModule,
  unlockPsychoeducation,
  unlockRim,
  updateBAActivities,
  updateMedications,
  updatePsychoeducationTopics,
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
  it("insère un module psychoeducation avec les fiches (is_read: false, unlocked_at: now)", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({ insert } as never)

    const result = await unlockPsychoeducation('pat-1', 'p-1', ['t1', 't2'])

    expect(result).toEqual({ ok: true })
    const inserted = insert.mock.calls[0][0]
    expect(inserted.module_type).toBe('psychoeducation')
    expect(inserted.config.unlocked_topics).toHaveLength(2)
    expect(inserted.config.unlocked_topics[0]).toMatchObject({ topic_id: 't1', is_read: false })
    expect(inserted.config.unlocked_topics[0].unlocked_at).toEqual(expect.any(String))
  })
})

describe('moduleAssignmentService.updatePsychoeducationTopics', () => {
  it("conserve l'ancien is_read pour les fiches déjà présentes", async () => {
    const existingTopics = [
      { topic_id: 't1', is_read: true,  unlocked_at: '2026-01-01' },
      { topic_id: 't2', is_read: false, unlocked_at: '2026-01-02' },
    ]
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    vi.mocked(supabase.from).mockReturnValue({ update } as never)

    await updatePsychoeducationTopics('pm-1', existingTopics, ['t1', 't2', 't3'])

    const topics = update.mock.calls[0][0].config.unlocked_topics
    expect(topics.find((tpc: { topic_id: string }) => tpc.topic_id === 't1')).toEqual(existingTopics[0])
    expect(topics.find((tpc: { topic_id: string }) => tpc.topic_id === 't3').is_read).toBe(false)
  })
})

describe('moduleAssignmentService.fetchMedications / updateMedications', () => {
  const MED = { id: 'm1', name: 'Sertraline', posology: '50 mg matin', kind: 'maintenance' as const }

  it('fetchMedications retourne la liste depuis config.medications', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: { config: { medications: [MED] } }, error: null }) as never
    )
    expect(await fetchMedications('pm-1')).toEqual([MED])
  })

  it('fetchMedications retourne [] si config absente', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)
    expect(await fetchMedications('pm-1')).toEqual([])
  })

  it('updateMedications préserve le reste de la config et écrit medications', async () => {
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    const select = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { config: { tracked_effects: ['x'] } } }) }),
    })
    vi.mocked(supabase.from).mockReturnValue({ select, update } as never)

    const result = await updateMedications('pm-1', [MED])

    expect(result).toEqual({ ok: true })
    expect(update.mock.calls[0][0].config).toEqual({ tracked_effects: ['x'], medications: [MED] })
  })
})

describe('moduleAssignmentService.fetchBAActivities / updateBAActivities', () => {
  const ACTIVITY = {
    id: 'a1',
    label: 'Marche 20 min',
    domain_id: 'al.dom_body',
    value_text: 'Retrouver mon souffle',
  }

  it('fetchBAActivities retourne la liste depuis config.ba_activities', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: { config: { ba_activities: [ACTIVITY] } }, error: null }) as never
    )
    expect(await fetchBAActivities('pm-1')).toEqual([ACTIVITY])
  })

  it('fetchBAActivities retourne [] si config absente ou clé non-tableau', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)
    expect(await fetchBAActivities('pm-1')).toEqual([])

    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: { config: { ba_activities: 'oops' } }, error: null }) as never
    )
    expect(await fetchBAActivities('pm-1')).toEqual([])
  })

  it('updateBAActivities préserve le reste de la config et écrit ba_activities', async () => {
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    const select = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { config: { medications: ['m'] } } }) }),
    })
    vi.mocked(supabase.from).mockReturnValue({ select, update } as never)

    const result = await updateBAActivities('pm-1', [ACTIVITY])

    expect(result).toEqual({ ok: true })
    expect(update.mock.calls[0][0].config).toEqual({ medications: ['m'], ba_activities: [ACTIVITY] })
  })

  it('updateBAActivities remonte ok:false si Supabase renvoie une erreur', async () => {
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: 'boom' } }) })
    const select = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }),
    })
    vi.mocked(supabase.from).mockReturnValue({ select, update } as never)

    expect(await updateBAActivities('pm-1', [ACTIVITY])).toEqual({ ok: false })
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