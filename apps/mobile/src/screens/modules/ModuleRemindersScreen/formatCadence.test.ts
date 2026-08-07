import { formatCadence } from './formatCadence'
import type { ScaleSchedule } from '@services/scaleScheduleService'

/** Traduction de test : rend la clé, et interpole pour vérifier l'assemblage. */
const t = (key: string, values?: Record<string, string | number>) => {
  const short = key.split('.').pop() ?? key
  if (values == null) return short
  return `${short}(${Object.entries(values).map(([k, v]) => `${k}=${String(v)}`).join(',')})`
}

function schedule(over: Partial<ScaleSchedule> = {}): ScaleSchedule {
  return {
    moduleId: 'phq9', mode: 'home', frequency: 'biweekly',
    dayOfWeek: 3, timeOfDay: '19:00', endsOn: null, patientReminder: true,
    instruction: null,
    createdAtIso: '2026-07-01T09:00:00.000Z',
    ...over,
  }
}

describe('formatCadence', () => {
  it('assemble cadence, jour et heure', () => {
    expect(formatCadence(schedule(), t))
      .toBe('cadence_day_time(frequency=frequency_biweekly,day=day_wed,time=19:00)')
  })

  it('omet l\'heure quand elle n\'est pas fixée', () => {
    expect(formatCadence(schedule({ timeOfDay: null }), t))
      .toBe('cadence_day(frequency=frequency_biweekly,day=day_wed)')
  })

  it('omet le jour quand il n\'est pas fixé', () => {
    expect(formatCadence(schedule({ dayOfWeek: null }), t))
      .toBe('cadence_time(frequency=frequency_biweekly,time=19:00)')
  })

  it('rend la seule cadence quand ni jour ni heure ne sont fixés', () => {
    expect(formatCadence(schedule({ dayOfWeek: null, timeOfDay: null }), t))
      .toBe('frequency_biweekly')
  })

  it('ignore jour et heure pour une passation à la demande', () => {
    // Les afficher laisserait croire à un rendez-vous fixe.
    expect(formatCadence(schedule({ frequency: 'on_demand' }), t)).toBe('frequency_on_demand')
  })

  it('mappe correctement les bornes de la semaine', () => {
    // 1 = lundi, 7 = dimanche : un décalage d'un cran afficherait le mauvais jour.
    expect(formatCadence(schedule({ dayOfWeek: 1, timeOfDay: null }), t)).toContain('day_mon')
    expect(formatCadence(schedule({ dayOfWeek: 7, timeOfDay: null }), t)).toContain('day_sun')
  })

  it('ignore un jour hors bornes plutôt que de rendre un libellé vide', () => {
    expect(formatCadence(schedule({ dayOfWeek: 9, timeOfDay: null }), t)).toBe('frequency_biweekly')
    expect(formatCadence(schedule({ dayOfWeek: 0, timeOfDay: null }), t)).toBe('frequency_biweekly')
  })

  it('rend chaque cadence connue', () => {
    for (const frequency of ['weekly', 'biweekly', 'monthly', 'quarterly'] as const) {
      expect(formatCadence(schedule({ frequency, dayOfWeek: null, timeOfDay: null }), t))
        .toBe(`frequency_${frequency}`)
    }
  })
})
