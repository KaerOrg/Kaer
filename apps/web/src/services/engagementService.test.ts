import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}))

const mockLogDataAccess = vi.fn()
vi.mock('./auditService', () => ({
  logDataAccess: (...args: unknown[]) => mockLogDataAccess(...args),
}))

const mockReportFailedOperation = vi.fn()
vi.mock('./errorReportingService', () => ({
  reportFailedOperation: (...args: unknown[]) => mockReportFailedOperation(...args),
}))

import { supabase } from '../lib/supabase'
import {
  fetchScaleEvolution,
  fetchMoodEvolution,
  fetchMoodMarkers,
  fetchFearEvolution,
  fetchDefusionEvolution,
  fetchMedSideEffectsEvolution,
  fetchSleepEvolution,
  fetchAvailableScales,
  fetchModuleSummary,
  fetchModuleLastActivity,
  fetchChronoEntries,
  fetchFormEntries,
  fetchActivityEntries,
  fetchScalePassations,
  markPassationRead,
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

describe('engagementService.fetchScalePassations', () => {
  it('mappe chaque passation avec ses réponses, son total et son accusé de lecture', async () => {
    const rows = [
      { local_id: 'a', client_created_at: '2026-07-14T09:00:00Z', payload: { answers: [1, 2, 3], total_score: 6 }, practitioner_read_at: '2026-07-15T08:00:00Z' },
      { local_id: 'b', client_created_at: '2026-07-28T21:12:00Z', payload: { answers: [0, 0, 0], total_score: 0 }, practitioner_read_at: null },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const result = await fetchScalePassations('p1', 'phq9')

    expect(supabase.from).toHaveBeenCalledWith('patient_entries')
    expect(result).toEqual([
      { id: 'a', date: '2026-07-14T09:00:00Z', answers: [1, 2, 3], totalScore: 6, readAt: '2026-07-15T08:00:00Z' },
      // Jamais ouverte : `null`, et c'est un état normal, pas une donnée manquante.
      { id: 'b', date: '2026-07-28T21:12:00Z', answers: [0, 0, 0], totalScore: 0, readAt: null },
    ])
  })

  it('garde `null` pour une réponse absente, sans la confondre avec zéro', async () => {
    const rows = [
      { local_id: 'a', client_created_at: '2026-07-14T09:00:00Z', payload: { answers: [1, null, 'x'], total_score: 1 }, practitioner_read_at: null },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    expect((await fetchScalePassations('p1', 'phq9'))[0].answers).toEqual([1, null, null])
  })

  it('tolère un payload sans réponses ni total plutôt que de planter', async () => {
    const rows = [{ local_id: 'a', client_created_at: '2026-07-14T09:00:00Z', payload: {}, practitioner_read_at: null }]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    expect(await fetchScalePassations('p1', 'phq9')).toEqual([
      { id: 'a', date: '2026-07-14T09:00:00Z', answers: [], totalScore: null, readAt: null },
    ])
  })

  it('retourne [] en cas d’erreur Supabase', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: new Error('rls') }) as never)

    expect(await fetchScalePassations('p1', 'phq9')).toEqual([])
  })
})

describe('engagementService.markPassationRead', () => {
  it('pose l\'accusé par le RPC et renvoie la date qui fait foi', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: '2026-07-29T08:00:00Z', error: null } as never)

    const result = await markPassationRead('p1', 'entry-1', 'phq9')

    expect(supabase.rpc).toHaveBeenCalledWith('mark_entry_read', {
      p_patient_id: 'p1',
      p_local_id: 'entry-1',
    })
    expect(result).toBe('2026-07-29T08:00:00Z')
  })

  it('trace la consultation au journal d\'audit, sans aucun contenu clinique', async () => {
    // Une passation est une donnée de santé : sa lecture doit être traçable. Les
    // métadonnées restent techniques : jamais une réponse, jamais un score (RGPD/MDR).
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await markPassationRead('p1', 'entry-1', 'phq9')

    expect(mockLogDataAccess).toHaveBeenCalledWith({
      action: 'read',
      targetTable: 'patient_entries',
      targetId: 'entry-1',
      patientId: 'p1',
      metadata: { scope: 'passation', module_id: 'phq9' },
    })
  })

  it('reporte l\'échec du RPC à la télémétrie, sans rien afficher', async () => {
    // Un accusé qui ne se pose pas est invisible à l'écran du praticien, et le patient
    // attendrait un « Vu le … » qui ne vient jamais. Personne ne l'apprendrait sans ça.
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'rls' } } as never)

    expect(await markPassationRead('p1', 'entry-1', 'phq9')).toBeNull()
    expect(mockReportFailedOperation).toHaveBeenCalledWith(
      'patient/phq9/passation',
      'mark_entry_read failed',
      'rls',
    )
  })

  it('trace l\'accès même quand le RPC échoue', async () => {
    // L'audit porte sur la CONSULTATION, pas sur la réussite de l'accusé : le praticien
    // a bien ouvert la passation dans les deux cas.
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'rls' } } as never)

    await markPassationRead('p1', 'entry-1', 'phq9')

    expect(mockLogDataAccess).toHaveBeenCalledTimes(1)
  })
})

describe('engagementService.fetchDefusionEvolution', () => {
  it('mappe le payload de défusion (mesures nullables par paire, technique)', async () => {
    const rows = [
      { client_created_at: '2026-07-10T10:00:00Z', payload: { technique: 'word_repetition', word_or_thought: 'rater', duration_seconds: 30, discomfort_before: 8, discomfort_after: 5, belief_before: 7, belief_after: 6 } },
      { client_created_at: '2026-07-11T10:00:00Z', payload: { technique: 'linguistic_distancing', word_or_thought: 'nul', duration_seconds: 0, discomfort_before: null, discomfort_after: 4, belief_before: null, belief_after: 3 } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const result = await fetchDefusionEvolution('p1')

    expect(supabase.from).toHaveBeenCalledWith('patient_entries')
    expect(result).toEqual([
      { date: '2026-07-10T10:00:00Z', technique: 'word_repetition', word: 'rater', duration_seconds: 30, discomfort_before: 8, discomfort_after: 5, belief_before: 7, belief_after: 6 },
      { date: '2026-07-11T10:00:00Z', technique: 'linguistic_distancing', word: 'nul', duration_seconds: 0, discomfort_before: null, discomfort_after: 4, belief_before: null, belief_after: 3 },
    ])
  })

  it('technique inconnue → repli sur word_repetition', async () => {
    const rows = [{ client_created_at: '2026-07-10T10:00:00Z', payload: { technique: 'bogus', word_or_thought: 'x', duration_seconds: 30 } }]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)
    const result = await fetchDefusionEvolution('p1')
    expect(result[0].technique).toBe('word_repetition')
    expect(result[0].discomfort_before).toBeNull()
  })

  it('retourne [] en cas d’erreur Supabase', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: new Error('rls') }) as never)
    expect(await fetchDefusionEvolution('p1')).toEqual([])
  })
})

describe('engagementService.fetchSleepEvolution', () => {
  it('calcule efficacité et TST, trie par nuit (payload.date)', async () => {
    const rows = [
      { client_created_at: '2026-02-02T08:00:00Z', payload: {
        date: '2026-02-01', in_bed_time: '22:30', bedtime: '23:00', wake_time: '07:00',
        out_of_bed_time: '07:30', sleep_onset_minutes: 0, awakenings_duration_minutes: 0,
        nap_minutes: 20, quality: 4, nightmares: 0,
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
    expect(night.nap_min).toBe(20)
    expect(night.quality).toBe(4)
    // Nuit 01-31 : fallback fenêtre 480, TST = 480-60 = 420 → SE 88, cauchemar
    expect(result[0].total_sleep_min).toBe(420)
    expect(result[0].efficiency).toBe(88)
    expect(result[0].nightmares).toBe(true)
    // Champs absents du payload → valeurs neutres (0 sieste, qualité nulle)
    expect(result[0].nap_min).toBe(0)
    expect(result[0].quality).toBeNull()
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

describe('engagementService.fetchMoodMarkers', () => {
  it('mappe les repères (date/label/type), id depuis la ligne', async () => {
    const rows = [
      { id: 'm1', payload: { date: '2026-06-14', label: 'Passage à 150 mg', type: 'treatment' } },
      { id: 'm2', payload: { date: '2026-07-02', label: 'Reprise du travail', type: 'life_event' } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    expect(await fetchMoodMarkers('p1')).toEqual([
      { id: 'm1', date: '2026-06-14', label: 'Passage à 150 mg', type: 'treatment' },
      { id: 'm2', date: '2026-07-02', label: 'Reprise du travail', type: 'life_event' },
    ])
  })

  it('normalise un type inconnu vers "other" et ignore un repère sans date', async () => {
    const rows = [
      { id: 'm1', payload: { date: '2026-06-14', label: 'X', type: 'bogus' } },
      { id: 'm2', payload: { label: 'sans date' } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    expect(await fetchMoodMarkers('p1')).toEqual([
      { id: 'm1', date: '2026-06-14', label: 'X', type: 'other' },
    ])
  })

  it('retourne [] sur erreur', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: { message: 'x' } }) as never)
    expect(await fetchMoodMarkers('p1')).toEqual([])
  })
})

describe('engagementService.fetchFearEvolution', () => {
  it('mappe suds_before/peak/after + situation', async () => {
    const rows = [
      { client_created_at: '2026-01-01', payload: { suds_before: 80, suds_peak: 90, suds_after: 40, situation_label: 'Métro' } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    expect(await fetchFearEvolution('p1')).toEqual([
      { date: '2026-01-01', suds_before: 80, suds_peak: 90, suds_after: 40, situation: 'Métro' },
    ])
  })

  it('peak=null (brouillon), suds_after=0 par défaut, situation vide si absente, ignore si suds_before manquant', async () => {
    const rows = [
      { client_created_at: '2026-01-01', payload: { suds_before: 60 } },
      { client_created_at: '2026-02-01', payload: { suds_after: 10 } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    expect(await fetchFearEvolution('p1')).toEqual([
      { date: '2026-01-01', suds_before: 60, suds_peak: null, suds_after: 0, situation: '' },
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

describe('engagementService.fetchModuleLastActivity', () => {
  it('retient la saisie la plus récente de chaque module (tri desc, 1re occurrence)', async () => {
    // Trié décroissant par client_created_at : la 1re ligne d'un module est sa plus récente.
    const rows = [
      { module_id: 'phq9', client_created_at: '2026-03-01T10:00:00Z' },
      { module_id: 'sleep_diary', client_created_at: '2026-02-20T08:00:00Z' },
      { module_id: 'phq9', client_created_at: '2026-01-15T09:00:00Z' },
      { module_id: 'sleep_diary', client_created_at: '2026-01-01T07:00:00Z' },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: rows, error: null }) as never)

    const result = await fetchModuleLastActivity('p1')

    expect(supabase.from).toHaveBeenCalledWith('patient_entries')
    expect(result.get('phq9')).toBe('2026-03-01T10:00:00Z')
    expect(result.get('sleep_diary')).toBe('2026-02-20T08:00:00Z')
    expect(result.size).toBe(2)
  })

  it('retourne une map vide quand aucune entrée', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: [], error: null }) as never)

    expect((await fetchModuleLastActivity('p1')).size).toBe(0)
  })

  it('retourne une map vide en cas d’erreur réseau', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: new Error('rls') }) as never)

    expect((await fetchModuleLastActivity('p1')).size).toBe(0)
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
