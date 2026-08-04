import { describe, it, expect } from 'vitest'
import { computeScheduleStatus } from './scaleScheduleStatus'
import type { ScaleSchedule, ScheduleFrequency, ScheduleMode } from '@services/scaleScheduleService'

function makeSchedule(over: Partial<ScaleSchedule> = {}): ScaleSchedule {
  return {
    id: 's1',
    patient_id: 'p1',
    practitioner_id: 'pr1',
    module_id: 'phq9',
    mode: 'home',
    frequency: 'monthly',
    day_of_week: 1,
    time_of_day: '09:00',
    ends_on: null,
    patient_reminder: true,
    created_at: '2026-06-01T09:00:00+00:00',
    ...over,
  }
}

describe('computeScheduleStatus', () => {
  it('échelle auto sans programmation : à programmer', () => {
    expect(
      computeScheduleStatus({ schedule: null, evaluationType: 'auto', lastActivityIso: null, todayIso: '2026-07-22' }),
    ).toEqual({ kind: 'unscheduled' })
  })

  it('échelle hétéro sans programmation : en séance, à la demande', () => {
    expect(
      computeScheduleStatus({ schedule: null, evaluationType: 'hetero', lastActivityIso: null, todayIso: '2026-07-22' }),
    ).toEqual({ kind: 'on_demand', mode: 'in_session' })
  })

  it('mode en séance : à la demande, sans date', () => {
    const schedule = makeSchedule({ mode: 'in_session', frequency: 'on_demand' })
    expect(
      computeScheduleStatus({ schedule, evaluationType: 'hetero', lastActivityIso: '2026-07-01', todayIso: '2026-07-22' }),
    ).toEqual({ kind: 'on_demand', mode: 'in_session' })
  })

  it('cadence à la demande à domicile : à la demande, sans date', () => {
    const schedule = makeSchedule({ mode: 'home', frequency: 'on_demand' })
    expect(
      computeScheduleStatus({ schedule, evaluationType: 'auto', lastActivityIso: null, todayIso: '2026-07-22' }),
    ).toEqual({ kind: 'on_demand', mode: 'home' })
  })

  it('bimensuel : prochaine échéance = dernière activité + 14 j, non en retard', () => {
    const schedule = makeSchedule({ frequency: 'biweekly' })
    const status = computeScheduleStatus({
      schedule,
      evaluationType: 'auto',
      lastActivityIso: '2026-07-12',
      todayIso: '2026-07-22',
    })
    expect(status).toEqual({ kind: 'home', frequency: 'biweekly', nextDate: '2026-07-26', overdueDays: 0, reminder: true })
  })

  it('mensuel dépassé : en retard du bon nombre de jours', () => {
    const schedule = makeSchedule({ frequency: 'monthly' })
    const status = computeScheduleStatus({
      schedule,
      evaluationType: 'auto',
      lastActivityIso: '2026-06-02',
      todayIso: '2026-07-22',
    })
    // ancre 02/06 + 1 mois = 02/07 ; aujourd'hui 22/07 → 20 jours de retard.
    expect(status).toEqual({ kind: 'home', frequency: 'monthly', nextDate: '2026-07-02', overdueDays: 20, reminder: true })
  })

  it('trimestriel : + 3 mois calendaires', () => {
    const schedule = makeSchedule({ frequency: 'quarterly' })
    const status = computeScheduleStatus({
      schedule,
      evaluationType: 'auto',
      lastActivityIso: '2026-07-10',
      todayIso: '2026-07-22',
    })
    expect(status).toEqual({ kind: 'home', frequency: 'quarterly', nextDate: '2026-10-10', overdueDays: 0, reminder: true })
  })

  it('hebdomadaire : + 7 j', () => {
    const schedule = makeSchedule({ frequency: 'weekly', patient_reminder: false })
    const status = computeScheduleStatus({
      schedule,
      evaluationType: 'auto',
      lastActivityIso: '2026-07-15',
      todayIso: '2026-07-22',
    })
    expect(status).toEqual({ kind: 'home', frequency: 'weekly', nextDate: '2026-07-22', overdueDays: 0, reminder: false })
  })

  it('jamais de passation : ancre = date de mise en place (created_at)', () => {
    const schedule = makeSchedule({ frequency: 'monthly', created_at: '2026-07-01T09:00:00+00:00' })
    const status = computeScheduleStatus({
      schedule,
      evaluationType: 'auto',
      lastActivityIso: null,
      todayIso: '2026-08-15',
    })
    // 01/07 + 1 mois = 01/08 ; aujourd'hui 15/08 → 14 j de retard.
    expect(status).toEqual({ kind: 'home', frequency: 'monthly', nextDate: '2026-08-01', overdueDays: 14, reminder: true })
  })

  it('report de fin d\'année (mensuel en décembre)', () => {
    const schedule = makeSchedule({ frequency: 'monthly' })
    const status = computeScheduleStatus({
      schedule,
      evaluationType: 'auto',
      lastActivityIso: '2026-12-20',
      todayIso: '2026-12-25',
    })
    if (status.kind !== 'home') throw new Error('attendu home')
    expect(status.nextDate).toBe('2027-01-20')
  })

  // Sanity : les types couvrent bien toutes les cadences récurrentes.
  const RECURRING: readonly ScheduleFrequency[] = ['weekly', 'biweekly', 'monthly', 'quarterly']
  const MODES: readonly ScheduleMode[] = ['home', 'in_session']
  it('exhaustivité : chaque cadence récurrente à domicile produit un statut home', () => {
    for (const frequency of RECURRING) {
      const status = computeScheduleStatus({
        schedule: makeSchedule({ mode: 'home', frequency }),
        evaluationType: 'auto',
        lastActivityIso: '2026-07-01',
        todayIso: '2026-07-02',
      })
      expect(status.kind).toBe('home')
    }
    expect(MODES).toHaveLength(2)
  })
})
