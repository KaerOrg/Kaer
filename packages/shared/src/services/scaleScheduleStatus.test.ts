import { describe, it, expect } from 'vitest'
import { computeScheduleStatus, type SchedulePeriod } from './scaleScheduleStatus'

function period(over: Partial<SchedulePeriod> = {}): SchedulePeriod {
  return {
    mode: 'home', frequency: 'biweekly',
    createdAtIso: '2026-07-01T09:00:00.000Z', patientReminder: true,
    ...over,
  }
}

describe('computeScheduleStatus, partagé web ≡ mobile (#414)', () => {
  it('dérive la prochaine échéance de la dernière passation', () => {
    const status = computeScheduleStatus({
      schedule: period(), evaluationType: 'auto',
      lastActivityIso: '2026-07-22', todayIso: '2026-07-25',
    })
    expect(status).toEqual({
      kind: 'home', frequency: 'biweekly', nextDate: '2026-08-05', overdueDays: 0, reminder: true,
    })
  })

  it('retombe sur la date de mise en place quand aucune passation n\'existe', () => {
    const status = computeScheduleStatus({
      schedule: period({ frequency: 'weekly' }), evaluationType: 'auto',
      lastActivityIso: null, todayIso: '2026-07-05',
    })
    expect(status.kind === 'home' && status.nextDate).toBe('2026-07-08')
  })

  it('compte les jours de retard, sans jamais descendre sous zéro', () => {
    const late = computeScheduleStatus({
      schedule: period(), evaluationType: 'auto',
      lastActivityIso: '2026-07-01', todayIso: '2026-07-20',
    })
    expect(late.kind === 'home' && late.overdueDays).toBe(5)

    const early = computeScheduleStatus({
      schedule: period(), evaluationType: 'auto',
      lastActivityIso: '2026-07-01', todayIso: '2026-07-10',
    })
    expect(early.kind === 'home' && early.overdueDays).toBe(0)
  })

  it('rend une passation ponctuelle sans date, en séance ou à la demande', () => {
    expect(computeScheduleStatus({
      schedule: period({ mode: 'in_session' }), evaluationType: 'auto',
      lastActivityIso: null, todayIso: '2026-07-22',
    })).toEqual({ kind: 'on_demand', mode: 'in_session' })

    expect(computeScheduleStatus({
      schedule: period({ frequency: 'on_demand' }), evaluationType: 'auto',
      lastActivityIso: null, todayIso: '2026-07-22',
    })).toEqual({ kind: 'on_demand', mode: 'home' })
  })

  it('distingue « à programmer » d\'une hétéro sans programmation', () => {
    expect(computeScheduleStatus({
      schedule: null, evaluationType: 'auto', lastActivityIso: null, todayIso: '2026-07-22',
    })).toEqual({ kind: 'unscheduled' })

    expect(computeScheduleStatus({
      schedule: null, evaluationType: 'hetero', lastActivityIso: null, todayIso: '2026-07-22',
    })).toEqual({ kind: 'on_demand', mode: 'in_session' })
  })

  it('gère l\'arithmétique calendaire du mensuel et du trimestriel', () => {
    const monthly = computeScheduleStatus({
      schedule: period({ frequency: 'monthly' }), evaluationType: 'auto',
      lastActivityIso: '2026-12-15', todayIso: '2026-12-20',
    })
    // Report d'année compris.
    expect(monthly.kind === 'home' && monthly.nextDate).toBe('2027-01-15')

    const quarterly = computeScheduleStatus({
      schedule: period({ frequency: 'quarterly' }), evaluationType: 'auto',
      lastActivityIso: '2026-01-31', todayIso: '2026-02-01',
    })
    expect(quarterly.kind === 'home' && quarterly.nextDate).toBe('2026-05-01')
  })

  // ── Fuseau : la date d'échéance est une DATE MÉTIER LOCALE ────────────────

  it('ne décale pas d\'un jour en fuseau positif', () => {
    // Le piège consigné dans lessons.md : une date métier passée par `toISOString()`
    // retombe sur la veille en Europe, minuit local valant 22:00 UTC. Le calcul est
    // ancré à midi local précisément pour que ce décalage soit impossible.
    const status = computeScheduleStatus({
      schedule: period({ frequency: 'weekly' }), evaluationType: 'auto',
      lastActivityIso: '2026-07-01', todayIso: '2026-07-02',
    })
    expect(status.kind === 'home' && status.nextDate).toBe('2026-07-08')
  })

  it('ne décale pas non plus au passage à l\'heure d\'été', () => {
    // Nuit du 28 au 29 mars 2026 en Europe : une arithmétique en millisecondes brute
    // perdrait une heure et pourrait basculer de jour.
    const status = computeScheduleStatus({
      schedule: period({ frequency: 'weekly' }), evaluationType: 'auto',
      lastActivityIso: '2026-03-25', todayIso: '2026-04-02',
    })
    expect(status.kind === 'home' && status.nextDate).toBe('2026-04-01')
  })

  it('accepte une ancre horodatée comme une date nue', () => {
    // `created_at` est un timestamptz côté base : seule la partie date compte.
    const status = computeScheduleStatus({
      schedule: period({ frequency: 'weekly', createdAtIso: '2026-07-01T23:30:00.000Z' }),
      evaluationType: 'auto', lastActivityIso: null, todayIso: '2026-07-05',
    })
    expect(status.kind === 'home' && status.nextDate).toBe('2026-07-08')
  })
})
