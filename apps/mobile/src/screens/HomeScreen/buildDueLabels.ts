import { computeScheduleStatus, todayIso } from '@kaer/shared'
import type { ScaleSchedule } from '@services/scaleScheduleService'

/** Fonction de traduction minimale : une clé, des paramètres, une chaîne. */
type Translate = (key: string, values?: Record<string, string | number>) => string

/** Formate une date ISO en date métier LOCALE, jamais via `toISOString()`. */
function formatDueDate(iso: string, locale: string): string {
  // Ancrage à midi local : `new Date('2026-08-05')` est interprété en UTC et retombe
  // sur le 4 août en fuseau négatif, sur le 5 partout ailleurs. Midi neutralise
  // l'écart dans les deux sens (cf. lessons.md § Dates).
  return new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long' })
}

/**
 * Échéance affichable par module, pour les pastilles de la liste (#414).
 *
 * Fonction PURE, testée à part. Elle n'utilise que `computeScheduleStatus`, **partagé
 * avec le web**, pour que le patient et le praticien voient la même date : deux
 * implémentations divergeraient au premier changement de cadence.
 *
 * ⚠️ MDR 2017/745 : ne remonte **que** `nextDate`. `overdueDays`, calculé par la même
 * fonction, reste côté praticien : un constat de calendrier adressé à un professionnel.
 * Côté patient, « en retard » serait un jugement, et il n'y a donc ici ni retard, ni
 * compte à rebours, ni couleur.
 *
 * Un module sans programmation, en séance, ou à la demande n'entre pas dans la map :
 * sa carte ne porte alors aucune pastille.
 */
export function buildDueLabels(params: {
  readonly schedules: ReadonlyMap<string, ScaleSchedule>
  /** Dernière passation connue par module (ISO local), pour ancrer le calcul. */
  readonly lastActivityByModule: ReadonlyMap<string, string>
  readonly t: Translate
  readonly locale: string
  /** Aujourd'hui en ISO local. Injecté pour rendre la fonction testable. */
  readonly today?: string
}): Map<string, string> {
  const { schedules, lastActivityByModule, t, locale, today = todayIso() } = params
  const labels = new Map<string, string>()

  for (const [moduleId, schedule] of schedules) {
    const status = computeScheduleStatus({
      schedule: {
        mode: schedule.mode,
        frequency: schedule.frequency,
        createdAtIso: schedule.createdAtIso,
        patientReminder: schedule.patientReminder,
      },
      // Une programmation existe : c'est donc une échelle auto-administrée.
      evaluationType: 'auto',
      lastActivityIso: lastActivityByModule.get(moduleId) ?? null,
      todayIso: today,
    })
    if (status.kind !== 'home') continue
    labels.set(moduleId, t('home.due_before', { date: formatDueDate(status.nextDate, locale) }))
  }

  return labels
}
