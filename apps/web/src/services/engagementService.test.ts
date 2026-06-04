import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import {
  fetchScaleEvolution,
  fetchMoodEvolution,
  fetchFearEvolution,
  fetchMedSideEffectsEvolution,
  fetchAvailableScales,
} from './engagementService'

// Chaîne Supabase mockée : chaque méthode renvoie la chaîne, l'await résout `result`.
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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('engagementService.fetchScaleEvolution', () => {
  it('mappe payload.total_score vers des points datés (happy path)', async () => {
    const rows = [
      { client_created_at: '2026-01-01', payload: { total_score: 12 } },
      { client_created_at: '2026-02-01', payload: { total_score: 8 } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const result = await fetchScaleEvolution('p1', 'phq9')

    expect(supabase.from).toHaveBeenCalledWith('patient_entries')
    expect(result).toEqual([
      { date: '2026-01-01', score: 12 },
      { date: '2026-02-01', score: 8 },
    ])
  })

  it('ignore les entrées sans total_score', async () => {
    const rows = [
      { client_created_at: '2026-01-01', payload: { total_score: 5 } },
      { client_created_at: '2026-02-01', payload: { answers: [1, 2] } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const result = await fetchScaleEvolution('p1', 'gad7')

    expect(result).toEqual([{ date: '2026-01-01', score: 5 }])
  })

  it('retourne [] en cas d’erreur Supabase', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: new Error('rls') }) as never)

    expect(await fetchScaleEvolution('p1', 'phq9')).toEqual([])
  })
})

describe('engagementService.fetchMoodEvolution', () => {
  it('extrait les dimensions depuis subscale_scores', async () => {
    const rows = [
      { client_created_at: '2026-01-01', payload: { subscale_scores: { humeur: 7, energie: 6, anxiete: 4, plaisir: 5, sommeil: 8, alimentation: 6 } } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const result = await fetchMoodEvolution('p1')

    expect(result).toEqual([
      { date: '2026-01-01', humeur: 7, energie: 6, anxiete: 4, plaisir: 5, sommeil: 8, alimentation: 6 },
    ])
  })

  it('ignore une entrée sans aucune dimension', async () => {
    const rows = [{ client_created_at: '2026-01-01', payload: { subscale_scores: {} } }]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    expect(await fetchMoodEvolution('p1')).toEqual([])
  })
})

describe('engagementService.fetchFearEvolution', () => {
  it('mappe suds_before/suds_after', async () => {
    const rows = [
      { client_created_at: '2026-01-01', payload: { suds_before: 80, suds_after: 40 } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    expect(await fetchFearEvolution('p1')).toEqual([
      { date: '2026-01-01', suds_before: 80, suds_after: 40 },
    ])
  })

  it('défaut suds_after=0 si absent, ignore si suds_before manquant', async () => {
    const rows = [
      { client_created_at: '2026-01-01', payload: { suds_before: 60 } },
      { client_created_at: '2026-02-01', payload: { suds_after: 10 } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    expect(await fetchFearEvolution('p1')).toEqual([
      { date: '2026-01-01', suds_before: 60, suds_after: 0 },
    ])
  })
})

describe('engagementService.fetchMedSideEffectsEvolution', () => {
  it('agrège les clés d’effets dynamiques', async () => {
    const rows = [
      { client_created_at: '2026-01-01', payload: { subscale_scores: { sedation: 3, nausees: 1 } } },
      { client_created_at: '2026-02-01', payload: { subscale_scores: { sedation: 2, bouche_seche: 4 } } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const { effects, data } = await fetchMedSideEffectsEvolution('p1')

    expect(effects.sort()).toEqual(['bouche_seche', 'nausees', 'sedation'])
    expect(data).toEqual([
      { date: '2026-01-01', sedation: 3, nausees: 1 },
      { date: '2026-02-01', sedation: 2, bouche_seche: 4 },
    ])
  })

  it('retourne vide en cas d’erreur', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: new Error('x') }) as never)

    expect(await fetchMedSideEffectsEvolution('p1')).toEqual({ effects: [], data: [] })
  })
})

describe('engagementService.fetchAvailableScales', () => {
  it('ne garde que les module_id présents dans SCALE_MODULES, dédupliqués', async () => {
    const rows = [
      { module_id: 'phq9' },
      { module_id: 'phq9' },
      { module_id: 'gad7' },
      { module_id: 'mood_tracker' },
      { module_id: 'medication_side_effects' },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const result = await fetchAvailableScales('p1')

    expect(result.sort()).toEqual(['gad7', 'phq9'])
  })
})
