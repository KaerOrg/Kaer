const mockSaveDb = jest.fn().mockResolvedValue(undefined)
const mockGetAllDb = jest.fn().mockResolvedValue([])
const mockDeleteDb = jest.fn().mockResolvedValue(undefined)
jest.mock('../lib/database', () => ({
  saveDefusionSession: (...a: unknown[]) => mockSaveDb(...a),
  getAllDefusionSessions: (...a: unknown[]) => mockGetAllDb(...a),
  deleteDefusionSession: (...a: unknown[]) => mockDeleteDb(...a),
}))

const mockEnqueue = jest.fn().mockResolvedValue(undefined)
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

const mockFetchConfig = jest.fn()
jest.mock('./moduleService', () => ({
  fetchPatientModuleConfig: (...a: unknown[]) => mockFetchConfig(...a),
}))

import {
  saveDefusionSession,
  removeDefusionSession,
  fetchDefusionSessions,
  fetchEnabledTechniques,
  enabledTechniquesFromConfig,
  ALL_TECHNIQUES,
} from './defusionService'
import type { DefusionSession } from '../lib/database'

beforeEach(() => jest.clearAllMocks())

const baseSession: Omit<DefusionSession, 'created_at'> = {
  id: 'df-1',
  technique: 'word_repetition',
  word_or_thought: 'rater',
  duration_seconds: 30,
  discomfort_before: 8,
  discomfort_after: 5,
  belief_before: 7,
  belief_after: 6,
}

describe('defusionService — saveDefusionSession', () => {
  it('écrit SQLite puis enqueue defusion_session avec le payload complet', async () => {
    await saveDefusionSession(baseSession)
    expect(mockSaveDb).toHaveBeenCalledWith(baseSession)
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        local_id: 'df-1',
        module_id: 'cognitive_saturation',
        entry_kind: 'defusion_session',
        operation: 'upsert',
        payload: expect.objectContaining({
          technique: 'word_repetition',
          word_or_thought: 'rater',
          duration_seconds: 30,
          discomfort_before: 8,
          discomfort_after: 5,
          belief_before: 7,
          belief_after: 6,
        }),
      }),
    )
  })

  it('propage les mesures passées (null par paire) sans les altérer', async () => {
    await saveDefusionSession({
      ...baseSession,
      discomfort_before: null,
      belief_before: null,
      discomfort_after: 4,
      belief_after: 3,
    })
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          discomfort_before: null,
          belief_before: null,
          discomfort_after: 4,
          belief_after: 3,
        }),
      }),
    )
  })

  it('appelle SQLite avant enqueue', async () => {
    const order: string[] = []
    mockSaveDb.mockImplementation(() => { order.push('db'); return Promise.resolve() })
    mockEnqueue.mockImplementation(() => { order.push('enqueue'); return Promise.resolve() })
    await saveDefusionSession(baseSession)
    expect(order[0]).toBe('db')
  })
})

describe('defusionService — removeDefusionSession', () => {
  it('supprime SQLite puis enqueue un delete', async () => {
    await removeDefusionSession('df-1')
    expect(mockDeleteDb).toHaveBeenCalledWith('df-1')
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ local_id: 'df-1', operation: 'delete', entry_kind: 'defusion_session' }),
    )
  })
})

describe('defusionService — fetchDefusionSessions', () => {
  it('délègue avec la limite par défaut', async () => {
    mockGetAllDb.mockResolvedValueOnce([{ id: 's1' }])
    const res = await fetchDefusionSessions()
    expect(mockGetAllDb).toHaveBeenCalledWith(200)
    expect(res).toEqual([{ id: 's1' }])
  })

  it('transmet une limite explicite', async () => {
    await fetchDefusionSessions(10)
    expect(mockGetAllDb).toHaveBeenCalledWith(10)
  })
})

describe('defusionService — fetchEnabledTechniques', () => {
  it('retourne les deux techniques quand la config est absente', async () => {
    mockFetchConfig.mockResolvedValueOnce(null)
    expect(await fetchEnabledTechniques('p1')).toEqual([...ALL_TECHNIQUES])
  })

  it('retourne les deux techniques quand enabled_techniques est absent/malformé', async () => {
    mockFetchConfig.mockResolvedValueOnce({ enabled_techniques: 'nope' })
    expect(await fetchEnabledTechniques('p1')).toEqual([...ALL_TECHNIQUES])
  })

  it('filtre selon la config et préserve l\'ordre canonique', async () => {
    mockFetchConfig.mockResolvedValueOnce({ enabled_techniques: ['linguistic_distancing'] })
    expect(await fetchEnabledTechniques('p1')).toEqual(['linguistic_distancing'])
  })

  it('ignore les valeurs inconnues et garde l\'ordre canonique', async () => {
    mockFetchConfig.mockResolvedValueOnce({ enabled_techniques: ['linguistic_distancing', 'x', 'word_repetition'] })
    expect(await fetchEnabledTechniques('p1')).toEqual(['word_repetition', 'linguistic_distancing'])
  })

  it('retombe sur les deux techniques si la config n\'active rien de connu', async () => {
    mockFetchConfig.mockResolvedValueOnce({ enabled_techniques: [] })
    expect(await fetchEnabledTechniques('p1')).toEqual([...ALL_TECHNIQUES])
  })
})

describe('defusionService — enabledTechniquesFromConfig (pur)', () => {
  it('défaut = deux techniques quand config null', () => {
    expect(enabledTechniquesFromConfig(null)).toEqual([...ALL_TECHNIQUES])
  })

  it('filtre et préserve l\'ordre canonique', () => {
    expect(enabledTechniquesFromConfig({ enabled_techniques: ['linguistic_distancing', 'word_repetition'] }))
      .toEqual(['word_repetition', 'linguistic_distancing'])
  })

  it('une seule technique activée', () => {
    expect(enabledTechniquesFromConfig({ enabled_techniques: ['word_repetition'] }))
      .toEqual(['word_repetition'])
  })

  it('défaut robuste quand enabled_techniques n\'est pas un tableau', () => {
    expect(enabledTechniquesFromConfig({ enabled_techniques: 42 })).toEqual([...ALL_TECHNIQUES])
  })
})
