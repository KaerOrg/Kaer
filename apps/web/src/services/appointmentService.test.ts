import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import {
  timeToMinutes,
  minutesToTimeString,
  jsDayToSchema,
  computeAvailableSlots,
  fetchAvailabilityRules,
  saveAvailabilityRule,
  deleteAvailabilityRule,
  fetchAppointmentsForWeek,
  createAppointment,
  updateAppointmentStatus,
  fetchAutoConfirmSetting,
  saveAutoConfirmSetting,
} from './appointmentService'
import type { AvailabilityRule, AvailabilityException, AppointmentWithPatient } from '../lib/calendar.types'

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

// ─── Utilitaires ──────────────────────────────────────────────────────────────

describe('timeToMinutes', () => {
  it('convertit "09:00" → 540', () => expect(timeToMinutes('09:00')).toBe(540))
  it('convertit "09:30" → 570', () => expect(timeToMinutes('09:30')).toBe(570))
  it('convertit "00:00" → 0', () => expect(timeToMinutes('00:00')).toBe(0))
})

describe('minutesToTimeString', () => {
  it('convertit 540 → "09:00"', () => expect(minutesToTimeString(540)).toBe('09:00'))
  it('convertit 570 → "09:30"', () => expect(minutesToTimeString(570)).toBe('09:30'))
  it('formate avec zéro les heures < 10', () => expect(minutesToTimeString(60)).toBe('01:00'))
})

describe('jsDayToSchema', () => {
  it('Lundi JS (1) → 0', () => expect(jsDayToSchema(1)).toBe(0))
  it('Dimanche JS (0) → 6', () => expect(jsDayToSchema(0)).toBe(6))
  it('Vendredi JS (5) → 4', () => expect(jsDayToSchema(5)).toBe(4))
})

// ─── computeAvailableSlots ────────────────────────────────────────────────────

const baseRule: AvailabilityRule = {
  id: 'r1',
  practitioner_id: 'p1',
  day_of_week: 0, // Lundi
  start_time: '09:00',
  end_time: '12:00',
  slot_duration_minutes: 50,
  created_at: '2024-01-01T00:00:00Z',
}

describe('computeAvailableSlots', () => {
  it('génère les bons créneaux pour une règle simple (3h / 50min = 3 slots)', () => {
    // 2024-01-08 = Lundi
    const slots = computeAvailableSlots([baseRule], [], [], '2024-01-08')
    expect(slots).toHaveLength(3)
    expect(slots[0].starts_at).toBe('2024-01-08T09:00:00')
    expect(slots[0].ends_at).toBe('2024-01-08T09:50:00')
    expect(slots[0].is_available).toBe(true)
  })

  it('retourne [] si aucune règle pour ce jour', () => {
    // 2024-01-09 = Mardi, rule only covers Lundi
    const slots = computeAvailableSlots([baseRule], [], [], '2024-01-09')
    expect(slots).toHaveLength(0)
  })

  it('retourne [] si exception is_closed', () => {
    const exception: AvailabilityException = {
      id: 'e1', practitioner_id: 'p1', exception_date: '2024-01-08',
      is_closed: true, start_time: null, end_time: null, created_at: '',
    }
    const slots = computeAvailableSlots([baseRule], [exception], [], '2024-01-08')
    expect(slots).toHaveLength(0)
  })

  it('override d\'horaire via exception non fermée', () => {
    const exception: AvailabilityException = {
      id: 'e2', practitioner_id: 'p1', exception_date: '2024-01-08',
      is_closed: false, start_time: '10:00', end_time: '11:00', created_at: '',
    }
    // 1h / 50min = 1 slot
    const slots = computeAvailableSlots([baseRule], [exception], [], '2024-01-08')
    expect(slots).toHaveLength(1)
    expect(slots[0].starts_at).toBe('2024-01-08T10:00:00')
  })

  it('marque un slot comme indisponible si un RDV actif chevauche', () => {
    const appt: AppointmentWithPatient = {
      id: 'a1', practitioner_id: 'p1', patient_id: 'pat1',
      starts_at: '2024-01-08T09:00:00', ends_at: '2024-01-08T09:50:00',
      status: 'confirmed', notes: null, created_at: '', updated_at: '',
      patient_display_name: 'Jean Dupont', patient_email: 'jean@t.fr',
    }
    const slots = computeAvailableSlots([baseRule], [], [appt], '2024-01-08')
    expect(slots[0].is_available).toBe(false)
    expect(slots[0].appointment).toEqual(appt)
    expect(slots[1].is_available).toBe(true)
  })

  it('ignore les rendez-vous annulés', () => {
    const appt: AppointmentWithPatient = {
      id: 'a2', practitioner_id: 'p1', patient_id: 'pat1',
      starts_at: '2024-01-08T09:00:00', ends_at: '2024-01-08T09:50:00',
      status: 'cancelled_by_patient', notes: null, created_at: '', updated_at: '',
      patient_display_name: 'Marie', patient_email: 'm@t.fr',
    }
    const slots = computeAvailableSlots([baseRule], [], [appt], '2024-01-08')
    expect(slots[0].is_available).toBe(true)
  })
})

// ─── fetchAvailabilityRules ───────────────────────────────────────────────────

describe('fetchAvailabilityRules', () => {
  it('retourne les règles du praticien', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: [baseRule] }) as never)
    const result = await fetchAvailabilityRules('p1')
    expect(result).toEqual([baseRule])
  })

  it('retourne [] si erreur Supabase', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null }) as never)
    const result = await fetchAvailabilityRules('p1')
    expect(result).toEqual([])
  })
})

// ─── saveAvailabilityRule ─────────────────────────────────────────────────────

describe('saveAvailabilityRule', () => {
  it('retourne ok=true avec la règle créée', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: baseRule, error: null }) as never)
    const result = await saveAvailabilityRule({
      practitioner_id: 'p1', day_of_week: 0,
      start_time: '09:00', end_time: '12:00', slot_duration_minutes: 50,
    })
    expect(result.ok).toBe(true)
    expect(result.data).toEqual(baseRule)
  })

  it('retourne ok=false avec message d\'erreur si Supabase échoue', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: { message: 'constraint' } }) as never)
    const result = await saveAvailabilityRule({
      practitioner_id: 'p1', day_of_week: 0,
      start_time: '09:00', end_time: '12:00', slot_duration_minutes: 50,
    })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('constraint')
  })
})

// ─── deleteAvailabilityRule ───────────────────────────────────────────────────

describe('deleteAvailabilityRule', () => {
  it('retourne ok=true si suppression réussie', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)
    const result = await deleteAvailabilityRule('r1')
    expect(result.ok).toBe(true)
  })
})

// ─── createAppointment ────────────────────────────────────────────────────────

describe('createAppointment', () => {
  const params = {
    practitioner_id: 'p1', patient_id: 'pat1',
    starts_at: '2024-01-08T09:00:00Z', ends_at: '2024-01-08T09:50:00Z',
    auto_confirm: true,
  }

  it('crée un RDV confirmé si auto_confirm=true', async () => {
    const appt = { id: 'a1', ...params, status: 'confirmed', notes: null, created_at: '', updated_at: '' }
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: appt, error: null }) as never)
    const result = await createAppointment(params)
    expect(result.ok).toBe(true)
  })

  it('retourne ok=false si Supabase échoue (ex. conflit de créneau)', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: { message: 'conflict' } }) as never)
    const result = await createAppointment(params)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('conflict')
  })
})

// ─── updateAppointmentStatus ──────────────────────────────────────────────────

describe('updateAppointmentStatus', () => {
  it('retourne ok=true si mise à jour réussie', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)
    const result = await updateAppointmentStatus('a1', 'confirmed')
    expect(result.ok).toBe(true)
  })
})

// ─── fetchAutoConfirmSetting ──────────────────────────────────────────────────

describe('fetchAutoConfirmSetting', () => {
  it('retourne true si auto_confirm_appointments = true', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: { auto_confirm_appointments: true } }) as never)
    const result = await fetchAutoConfirmSetting('p1')
    expect(result).toBe(true)
  })

  it('retourne true par défaut si données absentes', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null }) as never)
    const result = await fetchAutoConfirmSetting('p1')
    expect(result).toBe(true)
  })
})

describe('saveAutoConfirmSetting', () => {
  it('retourne ok=true si mise à jour réussie', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)
    const result = await saveAutoConfirmSetting('p1', false)
    expect(result.ok).toBe(true)
  })
})

// ─── fetchAppointmentsForWeek ─────────────────────────────────────────────────

describe('fetchAppointmentsForWeek', () => {
  it('retourne [] si aucun rendez-vous', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null }) as never)
    const result = await fetchAppointmentsForWeek('p1', '2024-01-08', '2024-01-14')
    expect(result).toEqual([])
  })

  it('mappe correctement les données patient depuis la relation', async () => {
    const row = {
      id: 'a1', practitioner_id: 'p1', patient_id: 'pat1',
      starts_at: '2024-01-08T09:00:00Z', ends_at: '2024-01-08T09:50:00Z',
      status: 'confirmed', notes: null, created_at: '', updated_at: '',
      patient_rel: [{
        patient_alias: 'Jean D.', patient_first_name: 'Jean', patient_last_name: 'Dupont',
        patients: { email: 'jean@t.fr', first_name: 'Jean', last_name: 'Dupont' },
      }],
    }
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: [row] }) as never)
    const result = await fetchAppointmentsForWeek('p1', '2024-01-08', '2024-01-14')
    expect(result[0].patient_display_name).toBe('Jean D.')
    expect(result[0].patient_email).toBe('jean@t.fr')
  })
})
