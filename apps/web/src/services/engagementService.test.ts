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
  fetchSleepEvolution,
  fetchAvailableScales,
  fetchModuleSummary,
  fetchChronoEntries,
  fetchFormEntries,
  fetchActivityEntries,
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

describe('engagementService.fetchSleepEvolution', () => {
  it('calcule efficacité et TST, trie par nuit (payload.date)', async () => {
    const rows = [
      { client_created_at: '2026-02-02T08:00:00Z', payload: {
        date: '2026-02-01', in_bed_time: '22:30', bedtime: '23:00', wake_time: '07:00',
        out_of_bed_time: '07:30', sleep_onset_minutes: 0, awakenings_duration_minutes: 0, nightmares: 0,
      } },
      { client_created_at: '2026-02-01T08:00:00Z', payload: {
        date: '2026-01-31', bedtime: '23:00', wake_time: '07:00',
        sleep_onset_minutes: 30, awakenings_duration_minutes: 30, nightmares: 1,
      } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const result = await fetchSleepEvolution('p1')

    // Trié par payload.date croissant : 01-31 puis 02-01
    expect(result.map(p => p.date)).toEqual(['2026-01-31', '2026-02-01'])
    // Nuit 02-01 : fenêtre 480, TPL 540 → SE = 89, TST 480
    const night = result[1]
    expect(night.efficiency).toBe(89)
    expect(night.total_sleep_min).toBe(480)
    // Nuit 01-31 : fallback fenêtre 480, TST = 480-60 = 420 → SE 88, cauchemar
    expect(result[0].total_sleep_min).toBe(420)
    expect(result[0].efficiency).toBe(88)
    expect(result[0].nightmares).toBe(true)
  })

  it('ignore les entrées sans payload.date', async () => {
    const rows = [{ client_created_at: '2026-02-01', payload: { bedtime: '23:00' } }]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)
    expect(await fetchSleepEvolution('p1')).toEqual([])
  })

  it('retourne [] en cas d’erreur Supabase', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: new Error('rls') }) as never)
    expect(await fetchSleepEvolution('p1')).toEqual([])
  })
})

describe('engagementService.fetchActivityEntries', () => {
  it('mappe le payload complet et trie par date métier puis heure prévue', async () => {
    const rows = [
      { local_id: 'a2', payload: {
        date: '2026-06-02', label: 'Yoga', done: 0, expected_pleasure: 6, expected_mastery: 4,
        pleasure: null, mastery: null, planned_time: '18:00', domain_id: 'al.dom_body', notes: null,
      } },
      { local_id: 'a1', payload: {
        date: '2026-06-01', label: 'Marche', done: 1, expected_pleasure: 3, expected_mastery: 2,
        pleasure: 7, mastery: 5, planned_time: null, domain_id: 'al.dom_body', notes: 'super',
      } },
      { local_id: 'a3', payload: {
        date: '2026-06-02', label: 'Appel ami', done: 0, expected_pleasure: null, expected_mastery: null,
        pleasure: null, mastery: null, planned_time: '10:00', domain_id: 'al.dom_social', notes: null,
      } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const result = await fetchActivityEntries('p1')

    expect(supabase.from).toHaveBeenCalledWith('patient_entries')
    expect(result.map(e => e.id)).toEqual(['a1', 'a3', 'a2'])
    expect(result[0]).toEqual({
      id: 'a1', date: '2026-06-01', label: 'Marche', done: true,
      expected_pleasure: 3, expected_mastery: 2, pleasure: 7, mastery: 5,
      planned_time: null, domain_id: 'al.dom_body', notes: 'super',
    })
  })

  it('legacy sans expected_* : planifiée → P/M lus comme attendus, réalisée → ressentis', async () => {
    const rows = [
      { local_id: 'old1', payload: { date: '2026-05-01', label: 'Lecture', done: 0, pleasure: 5, mastery: 5, notes: null } },
      { local_id: 'old2', payload: { date: '2026-05-02', label: 'Course', done: 1, pleasure: 8, mastery: 6, notes: null } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const result = await fetchActivityEntries('p1')

    expect(result[0]).toMatchObject({
      id: 'old1', done: false, expected_pleasure: 5, expected_mastery: 5, pleasure: null, mastery: null,
    })
    expect(result[1]).toMatchObject({
      id: 'old2', done: true, expected_pleasure: null, expected_mastery: null, pleasure: 8, mastery: 6,
    })
  })

  it('ignore les payloads sans date ou label, retourne [] sur erreur Supabase', async () => {
    const rows = [
      { local_id: 'x1', payload: { label: 'Sans date', done: 0 } },
      { local_id: 'x2', payload: { date: '2026-05-01', done: 0 } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)
    expect(await fetchActivityEntries('p1')).toEqual([])

    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: new Error('rls') }) as never)
    expect(await fetchActivityEntries('p1')).toEqual([])
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

describe('engagementService.fetchModuleSummary', () => {
  it('retourne la dernière saisie (data[0], tri desc) et le compte (happy path)', async () => {
    const rows = [
      { client_created_at: '2026-03-01', payload: { total_score: 9 } },
      { client_created_at: '2026-02-01', payload: { total_score: 12 } },
      { client_created_at: '2026-01-01', payload: { total_score: 15 } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const result = await fetchModuleSummary('p1', 'phq9')

    expect(supabase.from).toHaveBeenCalledWith('patient_entries')
    expect(result).toEqual({
      lastDate: '2026-03-01',
      count: 3,
      lastPayload: { total_score: 9 },
    })
  })

  it('retourne un résumé vide quand aucune entrée', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: [], error: null }) as never)

    expect(await fetchModuleSummary('p1', 'sleep_diary')).toEqual({
      lastDate: null,
      count: 0,
      lastPayload: null,
    })
  })

  it('retourne un résumé vide en cas d’erreur réseau', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: new Error('rls') }) as never)

    expect(await fetchModuleSummary('p1', 'phq9')).toEqual({
      lastDate: null,
      count: 0,
      lastPayload: null,
    })
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

describe('engagementService.fetchFormEntries', () => {
  it('mappe chaque fiche en { date, values } avec textes et curseurs bruts (happy path)', async () => {
    const rows = [
      {
        client_created_at: '2026-06-01T10:00:00Z',
        payload: { values: { situation: 'Réunion', emotion: 'anxiété', emotion_intensity: 80 } },
      },
      {
        client_created_at: '2026-06-03T18:00:00Z',
        payload: { values: { situation: 'Repas', outcome_intensity: 40 } },
      },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const result = await fetchFormEntries('p1', 'beck_columns')

    expect(supabase.from).toHaveBeenCalledWith('patient_entries')
    expect(result).toEqual([
      { date: '2026-06-01T10:00:00Z', values: { situation: 'Réunion', emotion: 'anxiété', emotion_intensity: 80 } },
      { date: '2026-06-03T18:00:00Z', values: { situation: 'Repas', outcome_intensity: 40 } },
    ])
  })

  it('filtre les valeurs non texte/nombre et les lignes sans values ou sans date', async () => {
    const rows = [
      { client_created_at: '2026-06-01T10:00:00Z', payload: null },
      { client_created_at: null, payload: { values: { situation: 'x' } } },
      { client_created_at: '2026-06-02T10:00:00Z', payload: { foo: 1 } },
      {
        client_created_at: '2026-06-03T10:00:00Z',
        payload: { values: { situation: 'ok', nested: { a: 1 }, empty: null, belief: 50 } },
      },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    expect(await fetchFormEntries('p1', 'beck_columns')).toEqual([
      { date: '2026-06-03T10:00:00Z', values: { situation: 'ok', belief: 50 } },
    ])
  })

  it('retourne vide en cas d’erreur Supabase', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: new Error('rls') }) as never)

    expect(await fetchFormEntries('p1', 'beck_columns')).toEqual([])
  })
})

describe('engagementService.fetchChronoEntries', () => {
  it('mappe chaque saisie en { date, values } (happy path)', async () => {
    const rows = [
      { client_created_at: '2026-06-01T07:00:00Z', payload: { values: { wake_time: '07:00', bedtime: '23:00' } } },
      { client_created_at: '2026-06-02T07:30:00Z', payload: { values: { wake_time: '07:30', bedtime: '23:30' } } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const result = await fetchChronoEntries('p1')

    expect(supabase.from).toHaveBeenCalledWith('patient_entries')
    expect(result).toEqual([
      { date: '2026-06-01', values: { wake_time: '07:00', bedtime: '23:00' } },
      { date: '2026-06-02', values: { wake_time: '07:30', bedtime: '23:30' } },
    ])
  })

  it('ignore les lignes sans values ou sans date', async () => {
    const rows = [
      { client_created_at: '2026-06-01T07:00:00Z', payload: null },
      { client_created_at: null, payload: { values: { wake_time: '07:00' } } },
      { client_created_at: '2026-06-03T07:00:00Z', payload: { foo: 1 } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    expect(await fetchChronoEntries('p1')).toEqual([])
  })

  it('retourne vide en cas d’erreur Supabase', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: new Error('rls') }) as never)

    expect(await fetchChronoEntries('p1')).toEqual([])
  })
})
