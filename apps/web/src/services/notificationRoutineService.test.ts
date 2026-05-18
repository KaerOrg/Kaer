import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import {
  getRoutinesForPatientModule,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  getActivityFeed,
} from './notificationRoutineService'

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

const ROUTINE = {
  id: 'r-1',
  patient_module_id: 'pm-1',
  practitioner_id: 'prac-1',
  patient_id: 'pat-1',
  days_of_week: [1, 3, 5],
  time_of_day: '09:00',
  patient_time_override: null,
  practitioner_note: null,
  is_active: true,
  patient_paused: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

beforeEach(() => vi.clearAllMocks())

describe('getRoutinesForPatientModule', () => {
  it('retourne les routines du module', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: [ROUTINE], error: null }) as never)
    const result = await getRoutinesForPatientModule('pm-1')
    expect(result).toEqual([ROUTINE])
  })

  it('retourne [] si aucune routine', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)
    const result = await getRoutinesForPatientModule('pm-1')
    expect(result).toEqual([])
  })

  it('propage une erreur Supabase', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: null, error: { message: 'RLS denied' } }) as never
    )
    await expect(getRoutinesForPatientModule('pm-1')).rejects.toEqual({ message: 'RLS denied' })
  })
})

describe('createRoutine', () => {
  it('insère et retourne la routine créée', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: ROUTINE, error: null }) as never)
    const result = await createRoutine({
      patient_module_id: 'pm-1',
      practitioner_id: 'prac-1',
      patient_id: 'pat-1',
      days_of_week: [1, 3, 5],
      time_of_day: '09:00',
    })
    expect(result).toEqual(ROUTINE)
  })

  it('propage une erreur d\'insertion', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: null, error: { message: 'constraint violation' } }) as never
    )
    await expect(
      createRoutine({
        patient_module_id: 'pm-1',
        practitioner_id: 'prac-1',
        patient_id: 'pat-1',
        days_of_week: [],
        time_of_day: '08:00',
      })
    ).rejects.toEqual({ message: 'constraint violation' })
  })
})

describe('updateRoutine', () => {
  it('met à jour et retourne la routine', async () => {
    const updated = { ...ROUTINE, is_active: false }
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: updated, error: null }) as never)
    const result = await updateRoutine('r-1', { is_active: false })
    expect(result.is_active).toBe(false)
  })

  it('propage une erreur de mise à jour', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: null, error: { message: 'not found' } }) as never
    )
    await expect(updateRoutine('r-1', { is_active: false })).rejects.toEqual({ message: 'not found' })
  })
})

describe('deleteRoutine', () => {
  it('supprime sans erreur', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)
    await expect(deleteRoutine('r-1')).resolves.toBeUndefined()
  })

  it('propage une erreur de suppression', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: null, error: { message: 'delete failed' } }) as never
    )
    await expect(deleteRoutine('r-1')).rejects.toEqual({ message: 'delete failed' })
  })
})

describe('getActivityFeed', () => {
  it('retourne les événements de pause', async () => {
    const events = [
      {
        id: 'e-1',
        patient_id: 'pat-1',
        event_type: 'NOTIFICATION_PAUSED',
        metadata: { module_type: 'phq9', routine_id: 'r-1' },
        created_at: '2026-01-02T10:00:00Z',
      },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: events, error: null }) as never)
    const result = await getActivityFeed('prac-1')
    expect(result).toEqual(events)
  })

  it('retourne [] si aucun événement', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)
    const result = await getActivityFeed('prac-1')
    expect(result).toEqual([])
  })
})
