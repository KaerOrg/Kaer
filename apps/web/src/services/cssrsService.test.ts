import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import {
  deleteCSSRSAssessment,
  fetchCSSRSAssessments,
  saveCSSRSAssessment,
} from './cssrsService'

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

const draft = {
  patientId: 'pat-1',
  practitionerId: 'p-1',
  ideation_answers: [],
  intensite_ideation: null,
  behavior_answers: [],
  nssi: 0,
  nb_tentatives_averees: null,
  nb_tentatives_interrompues: null,
  nb_tentatives_avortees: null,
  comportement_observe: 0,
  suicide_reussi: 0,
  date_tentative_plus_letale: null,
  letalite_observee: null,
  letalite_potentielle: null,
  ideation_level: 0,
  behavior_count: 0,
}

beforeEach(() => vi.clearAllMocks())

describe('cssrsService.fetchCSSRSAssessments', () => {
  it('retourne les évaluations triées desc', async () => {
    const rows = [{ id: 'a-1', assessed_at: '2026' } as never]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const result = await fetchCSSRSAssessments('pat-1', 'p-1')

    expect(result).toEqual(rows)
  })

  it('retourne [] si data null', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)

    const result = await fetchCSSRSAssessments('pat-1', 'p-1')

    expect(result).toEqual([])
  })
})

describe('cssrsService.saveCSSRSAssessment', () => {
  it('mappe les champs draft → row Supabase et renvoie ok: true', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({ insert } as never)

    const result = await saveCSSRSAssessment(draft)

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      patient_id: 'pat-1',
      practitioner_id: 'p-1',
    }))
    expect(result).toEqual({ ok: true, message: null })
  })

  it("propage le message d'erreur Supabase", async () => {
    const insert = vi.fn().mockResolvedValue({ error: { message: 'fail' } })
    vi.mocked(supabase.from).mockReturnValue({ insert } as never)

    const result = await saveCSSRSAssessment(draft)

    expect(result).toEqual({ ok: false, message: 'fail' })
  })
})

describe('cssrsService.deleteCSSRSAssessment', () => {
  it('supprime par id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.mocked(supabase.from).mockReturnValue({ delete: del } as never)

    await deleteCSSRSAssessment('a-1')

    expect(eq).toHaveBeenCalledWith('id', 'a-1')
  })
})
