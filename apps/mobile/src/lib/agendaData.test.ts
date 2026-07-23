import { buildAgendaData } from './agendaData'
import type { Appointment, AppointmentStatus } from '@services/appointmentService'

const NOW = new Date('2026-07-16T12:00:00Z')

function makeAppt(over: Partial<Appointment> & { starts_at: string }): Appointment {
  return {
    id: over.id ?? over.starts_at,
    practitioner_id: 'prac-1',
    patient_id: 'pat-1',
    starts_at: over.starts_at,
    ends_at: over.ends_at ?? over.starts_at,
    status: (over.status ?? 'confirmed') as AppointmentStatus,
    notes: over.notes ?? null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

describe('buildAgendaData', () => {
  it('désigne le RDV à venir le plus proche comme `next` et trie les suivants', () => {
    const appts = [
      makeAppt({ id: 'c', starts_at: '2026-07-25T09:00:00Z' }),
      makeAppt({ id: 'a', starts_at: '2026-07-18T10:00:00Z' }),
      makeAppt({ id: 'b', starts_at: '2026-07-21T09:15:00Z' }),
    ]
    const { next, upcoming } = buildAgendaData(appts, NOW)
    expect(next?.id).toBe('a')
    expect(upcoming.map((u) => u.id)).toEqual(['b', 'c'])
  })

  it('classe les RDV passés du plus récent au plus ancien', () => {
    const appts = [
      makeAppt({ id: 'old', starts_at: '2026-06-01T10:00:00Z', status: 'completed' }),
      makeAppt({ id: 'recent', starts_at: '2026-07-10T10:00:00Z', status: 'completed' }),
    ]
    const { past, next } = buildAgendaData(appts, NOW)
    expect(next).toBeNull()
    expect(past.map((p) => p.id)).toEqual(['recent', 'old'])
  })

  it('range les RDV annulés dans les passés même si leur horaire est futur', () => {
    const appts = [
      makeAppt({ id: 'cancelled', starts_at: '2026-07-20T10:00:00Z', status: 'cancelled_by_patient' }),
    ]
    const { next, upcoming, past } = buildAgendaData(appts, NOW)
    expect(next).toBeNull()
    expect(upcoming).toEqual([])
    expect(past.map((p) => p.id)).toEqual(['cancelled'])
  })

  it('déduplique les jours à venir en dates ISO locales', () => {
    const appts = [
      makeAppt({ id: 'x', starts_at: '2026-07-18T10:00:00Z' }),
      makeAppt({ id: 'y', starts_at: '2026-07-18T15:00:00Z' }),
      makeAppt({ id: 'z', starts_at: '2026-07-21T09:00:00Z' }),
    ]
    const { eventDays } = buildAgendaData(appts, NOW)
    expect(eventDays).toEqual(['2026-07-18', '2026-07-21'])
  })

  it('gère une liste vide', () => {
    expect(buildAgendaData([], NOW)).toEqual({ next: null, upcoming: [], past: [], eventDays: [] })
  })
})
