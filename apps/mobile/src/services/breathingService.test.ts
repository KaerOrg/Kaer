const mockSaveDb = jest.fn().mockResolvedValue(undefined)
const mockGetAllDb = jest.fn().mockResolvedValue([])
const mockGetSettingsDb = jest.fn().mockResolvedValue(undefined)
const mockSaveSettingsDb = jest.fn().mockResolvedValue(undefined)
jest.mock('../lib/database', () => ({
  saveBreathingSession: (...a: unknown[]) => mockSaveDb(...a),
  getAllBreathingSessions: (...a: unknown[]) => mockGetAllDb(...a),
  getBreathingSettings: (...a: unknown[]) => mockGetSettingsDb(...a),
  saveBreathingSettings: (...a: unknown[]) => mockSaveSettingsDb(...a),
}))

const mockEnqueue = jest.fn().mockResolvedValue(undefined)
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

const mockFetchModuleFields = jest.fn()
jest.mock('./moduleService', () => ({
  fetchModuleFields: (...a: unknown[]) => mockFetchModuleFields(...a),
}))

import {
  saveBreathingSession,
  fetchBreathingSessions,
  fetchBreathingTechniques,
  fetchBreathingSettings,
  saveBreathingSettings,
  techniquesFromFields,
  getCycleDuration,
} from './breathingService'
import type { BreathingSettings } from './breathingService'
import type { ContentField } from '@kaer/shared'

beforeEach(() => jest.clearAllMocks())

// Fabrique typée d'un ContentField (évite les casts partiels).
function makeField(over: Partial<ContentField>): ContentField {
  return {
    id: 'f',
    module_id: 'breathing_techniques',
    section_id: null,
    parent_field_id: null,
    field_type: 'breathing_technique',
    text_code: null,
    sort_order: 0,
    props: {},
    children: [],
    ...over,
  }
}

function phase(type: string, seconds: number, sort: number): ContentField {
  return makeField({
    field_type: 'breathing_phase',
    sort_order: sort,
    props: { phase_type: type, phase_seconds: String(seconds) },
  })
}

describe('breathingService — saveBreathingSession', () => {
  it('enqueue un payload enrichi et propage started_at en client_created_at', async () => {
    await saveBreathingSession({
      id: 'bs-1',
      technique_key: 'coherence',
      started_at: '2025-01-01T08:30:00.000Z',
      duration_seconds: 300,
      planned_duration_seconds: 600,
      cycles_completed: 30,
      completed: true,
      feeling: 'calmer',
    })
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'bs-1',
      module_id: 'breathing_techniques',
      entry_kind: 'breathing_session',
      operation: 'upsert',
      client_created_at: '2025-01-01T08:30:00.000Z',
      payload: {
        technique_key: 'coherence',
        started_at: '2025-01-01T08:30:00.000Z',
        duration_seconds: 300,
        planned_duration_seconds: 600,
        cycles_completed: 30,
        completed: true,
        feeling: 'calmer',
      },
    }))
  })

  it('applique les défauts (planned = durée, cycles 0, completed true, feeling null)', async () => {
    await saveBreathingSession({ id: 'bs-2', technique_key: 'carree', duration_seconds: 120 })
    const payload = mockEnqueue.mock.calls[0][0].payload
    expect(payload).toMatchObject({
      planned_duration_seconds: 120,
      cycles_completed: 0,
      completed: true,
      feeling: null,
    })
  })

  it('enregistre une session interrompue (completed=false)', async () => {
    await saveBreathingSession({
      id: 'bs-3', technique_key: 'carree', duration_seconds: 40,
      planned_duration_seconds: 300, completed: false,
    })
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      entry_kind: 'breathing_session',
      payload: expect.objectContaining({ completed: false }),
    }))
  })

  it('SQLite est appelé avant enqueue', async () => {
    const order: string[] = []
    mockSaveDb.mockImplementation(() => { order.push('db'); return Promise.resolve() })
    mockEnqueue.mockImplementation(() => { order.push('enqueue'); return Promise.resolve() })
    await saveBreathingSession({ id: 'x', technique_key: 'abc', duration_seconds: 60 })
    expect(order[0]).toBe('db')
  })
})

describe('breathingService — settings', () => {
  const settings: BreathingSettings = {
    enabled_techniques: ['coherence_cardiaque', 'carree'],
    primary_technique: 'coherence_cardiaque',
    weekly_goal_sessions: 5,
    reminder_enabled: true,
    reminder_time: '21:00',
    reminder_days: [1, 3, 5],
    haptics: true,
    ambient_sound: false,
    ambient_sound_key: 'river',
    breath_sound: false,
    preferred_duration_min: 5,
  }

  it('fetchBreathingSettings délègue à la lecture locale', async () => {
    mockGetSettingsDb.mockResolvedValueOnce(settings)
    expect(await fetchBreathingSettings()).toEqual(settings)
    expect(mockGetSettingsDb).toHaveBeenCalledTimes(1)
  })

  it('saveBreathingSettings écrit SQLite puis enqueue breathing_setting (local_id stable)', async () => {
    await saveBreathingSettings(settings)
    expect(mockSaveSettingsDb).toHaveBeenCalledWith(settings)
    expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
      local_id: 'breathing_settings',
      module_id: 'breathing_techniques',
      entry_kind: 'breathing_setting',
      operation: 'upsert',
      payload: expect.objectContaining({ enabled_techniques: ['coherence_cardiaque', 'carree'], primary_technique: 'coherence_cardiaque' }),
    }))
  })
})

describe('breathingService — fetchBreathingSessions', () => {
  it('délègue à getAllBreathingSessions avec la limite par défaut', async () => {
    mockGetAllDb.mockResolvedValueOnce([{ id: 's1' }])
    const res = await fetchBreathingSessions()
    expect(mockGetAllDb).toHaveBeenCalledWith(200)
    expect(res).toEqual([{ id: 's1' }])
  })

  it('transmet une limite explicite', async () => {
    await fetchBreathingSessions(10)
    expect(mockGetAllDb).toHaveBeenCalledWith(10)
  })
})

describe('breathingService — fetchBreathingTechniques', () => {
  it('mappe les fields breathing_technique en techniques, phases ordonnées', async () => {
    mockFetchModuleFields.mockResolvedValueOnce({
      preview_kind: 'breathing_pacer',
      fields: [
        makeField({
          id: 'bt.tech.coherence_cardiaque',
          props: { technique_key: 'coherence_cardiaque', color: '#4F46E5', recommended_duration_min: '5' },
          // volontairement dans le désordre pour vérifier le tri par sort_order
          children: [phase('exhale', 5, 2), phase('inhale', 5, 1)],
        }),
      ],
    })
    const techs = await fetchBreathingTechniques()
    expect(mockFetchModuleFields).toHaveBeenCalledWith('breathing_techniques')
    expect(techs).toEqual([
      {
        key: 'coherence_cardiaque',
        color: '#4F46E5',
        recommended_duration_min: 5,
        phases: [
          { type: 'inhale', seconds: 5 },
          { type: 'exhale', seconds: 5 },
        ],
      },
    ])
  })

  it('ignore les fields qui ne sont pas des techniques', async () => {
    mockFetchModuleFields.mockResolvedValueOnce({
      preview_kind: 'breathing_pacer',
      fields: [
        makeField({ id: 'bt.label', field_type: 'module_label' }),
        makeField({ id: 'bt.field_1', field_type: 'field_row' }),
        makeField({
          id: 'bt.tech.carree',
          props: { technique_key: 'carree', color: '#D97706', recommended_duration_min: '4' },
          children: [phase('inhale', 4, 1)],
        }),
      ],
    })
    const techs = await fetchBreathingTechniques()
    expect(techs).toHaveLength(1)
    expect(techs[0].key).toBe('carree')
  })

  it('retourne [] quand le module n\'a aucun field', async () => {
    mockFetchModuleFields.mockResolvedValueOnce({ preview_kind: 'fields', fields: [] })
    expect(await fetchBreathingTechniques()).toEqual([])
  })
})

describe('breathingService — techniquesFromFields', () => {
  it('convertit les fields breathing_technique en techniques (phases ordonnées)', () => {
    const techs = techniquesFromFields([
      makeField({ id: 'bt.label', field_type: 'module_label' }),
      makeField({
        id: 'bt.tech.carree',
        props: { technique_key: 'carree', color: '#D97706', recommended_duration_min: '4' },
        children: [phase('exhale', 4, 2), phase('inhale', 4, 1)],
      }),
    ])
    expect(techs).toEqual([
      {
        key: 'carree',
        color: '#D97706',
        recommended_duration_min: 4,
        phases: [
          { type: 'inhale', seconds: 4 },
          { type: 'exhale', seconds: 4 },
        ],
      },
    ])
  })

  it('retourne [] sans field de technique', () => {
    expect(techniquesFromFields([makeField({ field_type: 'field_row' })])).toEqual([])
  })
})

describe('breathingService — getCycleDuration', () => {
  it('somme la durée des phases', () => {
    expect(getCycleDuration({
      key: 'k', color: '#000', recommended_duration_min: 4,
      phases: [{ type: 'inhale', seconds: 4 }, { type: 'hold_in', seconds: 4 }, { type: 'exhale', seconds: 4 }, { type: 'hold_out', seconds: 4 }],
    })).toBe(16)
  })

  it('retourne 0 sans phase', () => {
    expect(getCycleDuration({ key: 'k', color: '#000', recommended_duration_min: 0, phases: [] })).toBe(0)
  })
})
