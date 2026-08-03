import { buildSavePlan, isEmptyPlan } from './savePlan'
import { toDraft, newDraft, type ReminderDraft } from './reminderDraft'
import type { NotificationRoutine } from '@services/notificationService'

function routine(over: Partial<NotificationRoutine> = {}): NotificationRoutine {
  return {
    id: 'r1', patient_module_id: 'pm1', practitioner_id: 'pr1', patient_id: 'pt1',
    days_of_week: [1, 3, 5], time_of_day: '09:00', patient_time_override: null,
    practitioner_note: null, is_active: true, patient_paused: false,
    created_at: '', updated_at: '', ...over,
  } as NotificationRoutine
}

describe('buildSavePlan', () => {
  it('ne prévoit aucune écriture quand rien n\'a bougé', () => {
    const loaded = [routine()]
    const plan = buildSavePlan(loaded, loaded.map(toDraft))
    expect(isEmptyPlan(plan)).toBe(true)
  })

  it('enregistre une heure décalée par le patient', () => {
    const loaded = [routine({ time_of_day: '09:00' })]
    const drafts: ReminderDraft[] = [{ ...toDraft(loaded[0]), time: '08:30' }]
    expect(buildSavePlan(loaded, drafts).timeChanged).toEqual([{ id: 'r1', time: '08:30' }])
  })

  it('EFFACE le décalage quand le patient revient à l\'heure posée', () => {
    // Sinon le praticien continuerait de lire « décalé par le patient » pour un
    // décalage qui n'existe plus.
    const loaded = [routine({ time_of_day: '09:00', patient_time_override: '08:30' })]
    const drafts: ReminderDraft[] = [{ ...toDraft(loaded[0]), time: '09:00' }]
    expect(buildSavePlan(loaded, drafts).timeChanged).toEqual([{ id: 'r1', time: null }])
  })

  it('enregistre un changement de jours, quel que soit l\'ordre de saisie', () => {
    const loaded = [routine({ days_of_week: [5, 1, 3] })]
    const unchanged = buildSavePlan(loaded, [toDraft(loaded[0])])
    expect(unchanged.daysChanged).toEqual([])

    const drafts: ReminderDraft[] = [{ ...toDraft(loaded[0]), days: [1, 2, 3, 5] }]
    expect(buildSavePlan(loaded, drafts).daysChanged).toEqual([{ id: 'r1', days: [1, 2, 3, 5] }])
  })

  it('enregistre une mise en pause et une reprise', () => {
    const loaded = [routine({ patient_paused: false })]
    const paused: ReminderDraft[] = [{ ...toDraft(loaded[0]), paused: true }]
    expect(buildSavePlan(loaded, paused).pauseChanged).toEqual([{ id: 'r1', paused: true }])

    const wasPaused = [routine({ patient_paused: true })]
    const resumed: ReminderDraft[] = [{ ...toDraft(wasPaused[0]), paused: false }]
    expect(buildSavePlan(wasPaused, resumed).pauseChanged).toEqual([{ id: 'r1', paused: false }])
  })

  it('crée les rappels ajoutés et supprime ceux retirés', () => {
    const loaded = [routine({ id: 'r1' }), routine({ id: 'r2' })]
    const drafts = [toDraft(loaded[0]), newDraft('tmp-1')]
    const plan = buildSavePlan(loaded, drafts)

    expect(plan.deleted).toEqual(['r2'])
    expect(plan.created).toHaveLength(1)
    expect(plan.created[0].id).toBeNull()
  })

  it('cumule plusieurs changements sur un même rappel', () => {
    const loaded = [routine({ time_of_day: '09:00', days_of_week: [1], patient_paused: false })]
    const drafts: ReminderDraft[] = [{ ...toDraft(loaded[0]), time: '20:00', days: [1, 2], paused: true }]
    const plan = buildSavePlan(loaded, drafts)

    expect(plan.timeChanged).toHaveLength(1)
    expect(plan.daysChanged).toHaveLength(1)
    expect(plan.pauseChanged).toHaveLength(1)
    expect(isEmptyPlan(plan)).toBe(false)
  })

  it('ignore un brouillon dont la routine a disparu du chargement', () => {
    const drafts: ReminderDraft[] = [{ id: 'ghost', key: 'ghost', time: '09:00', days: [1], paused: false, baseTime: '09:00' }]
    const plan = buildSavePlan([], drafts)
    expect(plan.timeChanged).toEqual([])
    expect(plan.created).toEqual([])
  })
})
