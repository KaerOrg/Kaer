import { buildDueLabels } from './buildDueLabels'
import type { ScaleSchedule } from '@services/scaleScheduleService'

const t = (key: string, values?: Record<string, string | number>) =>
  `${key.split('.').pop()}:${String(values?.date ?? '')}`

function schedule(over: Partial<ScaleSchedule> = {}): ScaleSchedule {
  return {
    moduleId: 'phq9', mode: 'home', frequency: 'biweekly',
    dayOfWeek: 3, timeOfDay: '19:00', endsOn: null, patientReminder: true,
    createdAtIso: '2026-07-01T09:00:00.000Z',
    ...over,
  }
}

const base = {
  t,
  locale: 'fr-FR',
  today: '2026-07-25',
  lastActivityByModule: new Map<string, string>(),
}

describe('buildDueLabels', () => {
  it('rend l\'échéance d\'une cadence récurrente à domicile', () => {
    const labels = buildDueLabels({
      ...base,
      schedules: new Map([['phq9', schedule()]]),
      lastActivityByModule: new Map([['phq9', '2026-07-22']]),
    })
    expect(labels.get('phq9')).toBe('due_before:5 août')
  })

  it('ancre sur la mise en place quand aucune passation n\'existe', () => {
    const labels = buildDueLabels({
      ...base,
      schedules: new Map([['phq9', schedule({ frequency: 'weekly' })]]),
    })
    expect(labels.get('phq9')).toBe('due_before:8 juillet')
  })

  it('n\'affiche rien pour une passation en séance ou à la demande', () => {
    const labels = buildDueLabels({
      ...base,
      schedules: new Map([
        ['phq9', schedule({ mode: 'in_session' })],
        ['gad7', schedule({ frequency: 'on_demand' })],
      ]),
    })
    expect(labels.size).toBe(0)
  })

  it('n\'affiche rien pour un module sans programmation', () => {
    expect(buildDueLabels({ ...base, schedules: new Map() }).size).toBe(0)
  })

  it('traite chaque module indépendamment', () => {
    const labels = buildDueLabels({
      ...base,
      schedules: new Map([
        ['phq9', schedule({ frequency: 'weekly' })],
        ['gad7', schedule({ moduleId: 'gad7', frequency: 'on_demand' })],
      ]),
    })
    expect(labels.has('phq9')).toBe(true)
    expect(labels.has('gad7')).toBe(false)
  })

  // ── MDR : une date, rien d'autre ──────────────────────────────────────────

  it('ne rend jamais un retard, même quand l\'échéance est dépassée', () => {
    // `computeScheduleStatus` calcule bien `overdueDays`, et c'est légitime côté
    // praticien. Ici, « en retard » serait un jugement adressé à quelqu'un dont le
    // biais interprétatif négatif fait partie du tableau clinique.
    const labels = buildDueLabels({
      ...base,
      today: '2026-09-30',
      schedules: new Map([['phq9', schedule()]]),
      lastActivityByModule: new Map([['phq9', '2026-07-01']]),
    })
    const label = labels.get('phq9') ?? ''
    expect(label).toBe('due_before:15 juillet')
    expect(label).not.toMatch(/retard|jour|reste|depuis/i)
  })

  // ── Fuseau : date métier locale ───────────────────────────────────────────

  it('ne décale pas d\'un jour, quel que soit le fuseau', () => {
    // Le piège de lessons.md : `new Date('2026-08-05')` est lu en UTC et retombe sur
    // le 4 août en fuseau négatif. Le formatage est ancré à midi local.
    const labels = buildDueLabels({
      ...base,
      schedules: new Map([['phq9', schedule({ frequency: 'weekly' })]]),
      lastActivityByModule: new Map([['phq9', '2026-08-04']]),
    })
    expect(labels.get('phq9')).toBe('due_before:11 août')
  })

  it('formate la date selon la langue de l\'app', () => {
    const labels = buildDueLabels({
      ...base,
      locale: 'en-GB',
      schedules: new Map([['phq9', schedule({ frequency: 'weekly' })]]),
      lastActivityByModule: new Map([['phq9', '2026-08-04']]),
    })
    expect(labels.get('phq9')).toBe('due_before:11 August')
  })
})
