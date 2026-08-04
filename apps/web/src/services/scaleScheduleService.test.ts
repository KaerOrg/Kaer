import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import { fetchScaleSchedule, saveScaleSchedule, deleteScaleSchedule, type ScaleScheduleInput } from './scaleScheduleService'

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

const ROW = {
  id: 's1', patient_id: 'p1', practitioner_id: 'pr1', module_id: 'phq9',
  mode: 'home', frequency: 'biweekly', day_of_week: 1, time_of_day: '09:00',
  ends_on: null, patient_reminder: true,
}

const INPUT: ScaleScheduleInput = {
  patientId: 'p1', practitionerId: 'pr1', moduleId: 'phq9',
  mode: 'home', frequency: 'biweekly', dayOfWeek: 1, timeOfDay: '09:00',
  endsOn: null, patientReminder: true,
}

beforeEach(() => vi.clearAllMocks())

describe('scaleScheduleService.fetchScaleSchedule', () => {
  it('retourne la programmation existante (happy path)', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: ROW, error: null }) as never)
    const res = await fetchScaleSchedule('p1', 'phq9')
    expect(supabase.from).toHaveBeenCalledWith('scale_schedules')
    expect(res?.frequency).toBe('biweekly')
  })

  it('retourne null quand aucune programmation', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)
    expect(await fetchScaleSchedule('p1', 'gad7')).toBeNull()
  })

  it('propage l’erreur Supabase', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: new Error('rls') }) as never)
    await expect(fetchScaleSchedule('p1', 'phq9')).rejects.toThrow('rls')
  })
})

describe('scaleScheduleService.saveScaleSchedule', () => {
  it('upsert et retourne la ligne enregistrée (happy path)', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: ROW, error: null }) as never)
    const res = await saveScaleSchedule(INPUT)
    expect(supabase.from).toHaveBeenCalledWith('scale_schedules')
    expect(res.module_id).toBe('phq9')
  })

  it('propage l’erreur d’écriture', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: new Error('boom') }) as never)
    await expect(saveScaleSchedule(INPUT)).rejects.toThrow('boom')
  })
})

describe('scaleScheduleService.deleteScaleSchedule', () => {
  it('supprime sans erreur (happy path)', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)
    await expect(deleteScaleSchedule('p1', 'phq9')).resolves.toBeUndefined()
    expect(supabase.from).toHaveBeenCalledWith('scale_schedules')
  })

  it('propage l’erreur de suppression', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: new Error('nope') }) as never)
    await expect(deleteScaleSchedule('p1', 'phq9')).rejects.toThrow('nope')
  })
})
