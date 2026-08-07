import { dateToIso, shiftDate } from './weekDates'

/** Cadence de passation, telle que le praticien la choisit. */
export type ScheduleFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'on_demand'

/** Mode de passation : à domicile, ou en séance. */
export type ScheduleMode = 'home' | 'in_session'

/** Cadence récurrente réelle (hors « à la demande »), qui porte une prochaine échéance. */
export type RecurringFrequency = Exclude<ScheduleFrequency, 'on_demand'>

/**
 * Ce dont le calcul a besoin d'une programmation, et rien de plus.
 *
 * Contrat **structurel** plutôt que la ligne de l'une des deux apps : web et mobile
 * lisent la même table avec des conventions de nommage différentes, et chacune mappe
 * vers ce contrat. Sans lui, partager la fonction obligerait l'une des deux à adopter
 * les noms de l'autre.
 */
export interface SchedulePeriod {
  readonly mode: ScheduleMode
  readonly frequency: ScheduleFrequency
  /** Date de mise en place, ISO. Sert d'ancre quand aucune passation n'existe encore. */
  readonly createdAtIso: string
  /** Le patient reçoit-il un rappel calendaire ? Jamais conditionné par un score. */
  readonly patientReminder: boolean
}

/**
 * État de programmation d'une échelle, dérivé **uniquement de dates** (fait
 * administratif). Aucune interprétation clinique, aucun état issu d'un score : le
 * « en retard » est le simple constat qu'une date d'échéance est dépassée (MDR 2017/745).
 */
export type ScheduleStatus =
  /** Échelle auto sans programmation : à programmer. */
  | { readonly kind: 'unscheduled' }
  /** Passation à la demande (en séance, ou auto sans cadence récurrente) : sans date. */
  | { readonly kind: 'on_demand'; readonly mode: ScheduleMode }
  /** Auto récurrente à domicile : prochaine échéance + retard éventuel (jours). */
  | {
      readonly kind: 'home'
      readonly frequency: RecurringFrequency
      /** Prochaine échéance (ISO local) dérivée de l'ancre + la cadence. */
      readonly nextDate: string
      /**
       * Jours de retard (0 = à venir, > 0 = échéance dépassée).
       *
       * ⚠️ Destiné au PRATICIEN seulement : c'est un constat de calendrier adressé à un
       * professionnel. Il ne traverse pas vers le patient, où « en retard » deviendrait
       * un jugement adressé à quelqu'un dont le biais interprétatif négatif fait partie
       * du tableau clinique. Ne jamais s'en servir pour teinter un élément côté patient.
       */
      readonly overdueDays: number
      /** Le patient reçoit un rappel calendaire (jamais conditionné par un score). */
      readonly reminder: boolean
    }

/** Nombre de jours de `fromIso` à `toIso` (positif si `toIso` est postérieur). */
function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T12:00:00`).getTime()
  const to = new Date(`${toIso}T12:00:00`).getTime()
  return Math.round((to - from) / 86_400_000)
}

/** Ajoute une période de cadence à une date ISO (jours pour hebdo/bimensuel,
 *  mois calendaires pour mensuel/trimestriel). */
function addPeriod(iso: string, frequency: RecurringFrequency): string {
  if (frequency === 'weekly') return shiftDate(iso, 7)
  if (frequency === 'biweekly') return shiftDate(iso, 14)
  // Mensuel / trimestriel : arithmétique calendaire (setMonth gère le report d'année),
  // ancrée à midi local pour ne pas décaler de jour selon le fuseau.
  const d = new Date(`${iso}T12:00:00`)
  d.setMonth(d.getMonth() + (frequency === 'monthly' ? 1 : 3))
  return dateToIso(d)
}

/**
 * Calcule l'état de programmation d'une échelle.
 *
 * La prochaine échéance est dérivée d'une **ancre** : la dernière passation si elle
 * existe, sinon la date de mise en place de la programmation, décalée d'une période de
 * cadence. « En retard » = cette échéance est antérieure à aujourd'hui. Rien n'est lu
 * d'un score : c'est un pur constat de calendrier.
 *
 * **Partagée web ≡ mobile délibérément** : le praticien (colonne « Programmée », K-7) et
 * le patient (pastille d'échéance, #414) doivent voir la MÊME date pour la même
 * programmation. Deux implémentations divergeraient au premier changement de cadence.
 */
export function computeScheduleStatus(params: {
  readonly schedule: SchedulePeriod | null
  readonly evaluationType: 'auto' | 'hetero'
  readonly lastActivityIso: string | null
  readonly todayIso: string
}): ScheduleStatus {
  const { schedule, evaluationType, lastActivityIso, todayIso } = params

  // Pas de programmation enregistrée : une hétéro reste « en séance · à la demande »
  // par nature ; une auto est à programmer.
  if (!schedule) {
    return evaluationType === 'hetero' ? { kind: 'on_demand', mode: 'in_session' } : { kind: 'unscheduled' }
  }

  // En séance, ou cadence « à la demande » : passation ponctuelle, aucune date.
  if (schedule.mode === 'in_session' || schedule.frequency === 'on_demand') {
    return { kind: 'on_demand', mode: schedule.mode }
  }

  const anchor = lastActivityIso ?? schedule.createdAtIso.slice(0, 10)
  const nextDate = addPeriod(anchor, schedule.frequency)
  const overdueDays = Math.max(0, daysBetween(nextDate, todayIso))
  return { kind: 'home', frequency: schedule.frequency, nextDate, overdueDays, reminder: schedule.patientReminder }
}
