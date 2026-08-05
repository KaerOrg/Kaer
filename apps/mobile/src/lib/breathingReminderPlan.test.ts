import { buildReminderPlan, type ReminderSettings } from './breathingReminderPlan'

const settings = (over: Partial<ReminderSettings> = {}): ReminderSettings => ({
  reminder_enabled: true,
  reminder_time: '21:00',
  reminder_days: [1, 3],
  ...over,
})

describe('buildReminderPlan', () => {
  it('rend une occurrence par jour coché, à l’heure choisie', () => {
    expect(buildReminderPlan(settings())).toEqual([
      { weekday: 2, hour: 21, minute: 0 },   // lundi
      { weekday: 4, hour: 21, minute: 0 },   // mercredi
    ])
  })

  it('traduit dimanche (0) en jour 1 du format expo', () => {
    expect(buildReminderPlan(settings({ reminder_days: [0] })))
      .toEqual([{ weekday: 1, hour: 21, minute: 0 }])
  })

  it('traduit samedi (6) en jour 7 du format expo', () => {
    expect(buildReminderPlan(settings({ reminder_days: [6] })))
      .toEqual([{ weekday: 7, hour: 21, minute: 0 }])
  })

  it('trie les jours quel que soit l’ordre stocké', () => {
    const plan = buildReminderPlan(settings({ reminder_days: [5, 0, 2] }))
    expect(plan.map(o => o.weekday)).toEqual([1, 3, 6])
  })

  it('ne programme pas deux fois le même jour', () => {
    expect(buildReminderPlan(settings({ reminder_days: [1, 1, 1] }))).toHaveLength(1)
  })

  it('lit les minutes, pas seulement les heures rondes', () => {
    expect(buildReminderPlan(settings({ reminder_time: '07:45', reminder_days: [2] })))
      .toEqual([{ weekday: 3, hour: 7, minute: 45 }])
  })

  it('accepte une heure sur un seul chiffre', () => {
    expect(buildReminderPlan(settings({ reminder_time: '7:05', reminder_days: [2] })))
      .toEqual([{ weekday: 3, hour: 7, minute: 5 }])
  })

  // ─── Les cas où il ne doit y avoir AUCUN rappel (opt-in strict) ──────────────

  it('ne programme rien quand la bascule est coupée', () => {
    expect(buildReminderPlan(settings({ reminder_enabled: false }))).toEqual([])
  })

  it('ne programme rien sans heure choisie', () => {
    expect(buildReminderPlan(settings({ reminder_time: null }))).toEqual([])
  })

  it('ne programme rien sans jour coché', () => {
    expect(buildReminderPlan(settings({ reminder_days: [] }))).toEqual([])
  })

  it('ne programme rien sur une heure illisible', () => {
    expect(buildReminderPlan(settings({ reminder_time: 'plus tard' }))).toEqual([])
    expect(buildReminderPlan(settings({ reminder_time: '25:00' }))).toEqual([])
    expect(buildReminderPlan(settings({ reminder_time: '21:70' }))).toEqual([])
  })

  it('écarte un jour hors de la semaine', () => {
    expect(buildReminderPlan(settings({ reminder_days: [1, 9, -2] })))
      .toEqual([{ weekday: 2, hour: 21, minute: 0 }])
  })

  it('accepte minuit', () => {
    expect(buildReminderPlan(settings({ reminder_time: '00:00', reminder_days: [1] })))
      .toEqual([{ weekday: 2, hour: 0, minute: 0 }])
  })
})
