import { describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}))

import { supabase } from '../lib/supabase'
import {
  computeAvailableSlots,
  fetchPatientAppointments,
  fetchPractitionerRules,
  bookAppointment,
  cancelAppointment,
} from './appointmentService'
import type { AvailabilityRule, AvailabilityException, Appointment } from './appointmentService'

function makeChain(result: { data: unknown; error?: unknown } = { data: null, error: null }) {
  const chain = new Proxy({} as Record<string, unknown>, {
    get(target, prop: string) {
      if (prop === 'then') return (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
      if (!target[prop]) target[prop] = jest.fn().mockReturnValue(chain)
      return target[prop]
    },
  })
  return chain
}

const mockedFrom = supabase.from as jest.MockedFunction<typeof supabase.from>

beforeEach(() => { jest.clearAllMocks() })

// ─── computeAvailableSlots ────────────────────────────────────────────────────

const baseRule: AvailabilityRule = {
  id: 'r1', practitioner_id: 'p1', day_of_week: 0,
  start_time: '09:00', end_time: '11:00', slot_duration_minutes: 50, buffer_minutes: 0, created_at: '',
}

describe('computeAvailableSlots', () => {
  it('génère 2 créneaux pour 2h / 50min', () => {
    // 2024-01-08 = Lundi
    const slots = computeAvailableSlots([baseRule], [], [], '2024-01-08')
    expect(slots).toHaveLength(2)
    expect(slots[0].starts_at).toBe('2024-01-08T09:00:00')
    expect(slots[0].is_available).toBe(true)
  })

  it('retourne [] si exception is_closed', () => {
    const exc: AvailabilityException = {
      id: 'e1', practitioner_id: 'p1', exception_date: '2024-01-08',
      is_closed: true, start_time: null, end_time: null, created_at: '',
    }
    expect(computeAvailableSlots([baseRule], [exc], [], '2024-01-08')).toHaveLength(0)
  })

  it('retourne [] si aucune règle pour ce jour', () => {
    // 2024-01-09 = Mardi
    expect(computeAvailableSlots([baseRule], [], [], '2024-01-09')).toHaveLength(0)
  })

  it('marque un créneau comme indisponible si déjà réservé', () => {
    const booked: Pick<Appointment, 'starts_at' | 'ends_at' | 'status'> = {
      starts_at: '2024-01-08T09:00:00', ends_at: '2024-01-08T09:50:00', status: 'confirmed',
    }
    const slots = computeAvailableSlots([baseRule], [], [booked], '2024-01-08')
    expect(slots[0].is_available).toBe(false)
    expect(slots[1].is_available).toBe(true)
  })

  it('ignore les RDV annulés', () => {
    const booked: Pick<Appointment, 'starts_at' | 'ends_at' | 'status'> = {
      starts_at: '2024-01-08T09:00:00', ends_at: '2024-01-08T09:50:00', status: 'cancelled_by_patient',
    }
    const slots = computeAvailableSlots([baseRule], [], [booked], '2024-01-08')
    expect(slots[0].is_available).toBe(true)
  })

  it('deux règles matin + après-midi : créneaux triés chronologiquement', () => {
    const morning: AvailabilityRule = { ...baseRule, id: 'r1', start_time: '09:00', end_time: '11:00' }
    const afternoon: AvailabilityRule = { ...baseRule, id: 'r2', start_time: '14:00', end_time: '16:00' }
    const slots = computeAvailableSlots([morning, afternoon], [], [], '2024-01-08')
    // 2h/50min = 2 slots le matin, 2h/50min = 2 slots l'après-midi → 4
    expect(slots).toHaveLength(4)
    expect(slots[0].starts_at).toBe('2024-01-08T09:00:00')
    expect(slots[2].starts_at).toBe('2024-01-08T14:00:00')
    expect(slots[3].starts_at).toBe('2024-01-08T14:50:00')
  })

  it('exception avec horaires explicites remplace toutes les règles du jour', () => {
    const morning: AvailabilityRule = { ...baseRule, id: 'r1', start_time: '09:00', end_time: '11:00' }
    const afternoon: AvailabilityRule = { ...baseRule, id: 'r2', start_time: '14:00', end_time: '18:00' }
    const exc: AvailabilityException = {
      id: 'e1', practitioner_id: 'p1', exception_date: '2024-01-08',
      is_closed: false, start_time: '10:00', end_time: '11:00', created_at: '',
    }
    const slots = computeAvailableSlots([morning, afternoon], [exc], [], '2024-01-08')
    expect(slots).toHaveLength(1)
    expect(slots[0].starts_at).toBe('2024-01-08T10:00:00')
  })
})

// ─── fetchPatientAppointments ─────────────────────────────────────────────────

describe('fetchPatientAppointments', () => {
  it('retourne les rendez-vous du patient', async () => {
    const appt = { id: 'a1', patient_id: 'pat1', status: 'confirmed' }
    mockedFrom.mockReturnValue(makeChain({ data: [appt] }) as never)
    const result = await fetchPatientAppointments('pat1')
    expect(result).toEqual([appt])
  })

  it('retourne [] si aucun rendez-vous', async () => {
    mockedFrom.mockReturnValue(makeChain({ data: null }) as never)
    const result = await fetchPatientAppointments('pat1')
    expect(result).toEqual([])
  })
})

// ─── fetchPractitionerRules ───────────────────────────────────────────────────

describe('fetchPractitionerRules', () => {
  it('retourne les règles du praticien', async () => {
    mockedFrom.mockReturnValue(makeChain({ data: [baseRule] }) as never)
    const result = await fetchPractitionerRules('p1')
    expect(result).toEqual([baseRule])
  })
})

// ─── bookAppointment ──────────────────────────────────────────────────────────

describe('bookAppointment', () => {
  it('retourne ok=true si la réservation réussit', async () => {
    mockedFrom
      .mockReturnValueOnce(makeChain({ data: { auto_confirm_appointments: true } }) as never)
      .mockReturnValueOnce(makeChain({ data: null, error: null }) as never)
    const result = await bookAppointment({
      practitioner_id: 'p1', patient_id: 'pat1',
      starts_at: '2024-01-08T09:00:00Z', ends_at: '2024-01-08T09:50:00Z',
    })
    expect(result.ok).toBe(true)
  })

  it('retourne ok=false si Supabase renvoie une erreur', async () => {
    mockedFrom
      .mockReturnValueOnce(makeChain({ data: null }) as never)
      .mockReturnValueOnce(makeChain({ data: null, error: { message: 'duplicate' } }) as never)
    const result = await bookAppointment({
      practitioner_id: 'p1', patient_id: 'pat1',
      starts_at: '2024-01-08T09:00:00Z', ends_at: '2024-01-08T09:50:00Z',
    })
    expect(result.ok).toBe(false)
  })
})

// ─── cancelAppointment ────────────────────────────────────────────────────────

describe('cancelAppointment', () => {
  it('retourne ok=true si annulation réussie', async () => {
    mockedFrom.mockReturnValue(makeChain({ data: null, error: null }) as never)
    const result = await cancelAppointment('a1')
    expect(result.ok).toBe(true)
  })
})
