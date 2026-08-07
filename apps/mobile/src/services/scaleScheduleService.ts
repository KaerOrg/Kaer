import { supabase } from '../lib/supabase'

/** Mode de passation choisi par le praticien. */
export type ScheduleMode = 'home' | 'in_session'

/** Cadence de passation, choisie par le praticien (jamais suggérée par l'app : MDR). */
export type ScheduleFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'on_demand'

/**
 * Programmation d'une échelle, telle que le PATIENT la voit.
 *
 * Miroir en lecture seule de `apps/web/src/services/scaleScheduleService.ts`, qui
 * porte le CRUD côté praticien. Les deux lisent la même table, avec des droits
 * différents : la RLS n'accorde au patient qu'un `select` sur ses propres lignes
 * (`scale_schedules_patient_select`).
 */
export interface ScaleSchedule {
  moduleId: string
  mode: ScheduleMode
  frequency: ScheduleFrequency
  /** 1 = lundi … 7 = dimanche. `null` si la cadence n'a pas de jour fixe. */
  dayOfWeek: number | null
  /** « HH:MM », ou `null` pour une passation à la demande. */
  timeOfDay: string | null
  /** Date de fin, ou `null` si la programmation n'en a pas. */
  endsOn: string | null
  /** Le praticien souhaite-t-il qu'un rappel calendaire accompagne cette cadence ? */
  patientReminder: boolean
  /**
   * Consigne écrite par le praticien (#421), ou `null`. Restituée **telle quelle** :
   * ce sont ses mots, l'app ne les reformule pas et ne les complète pas.
   */
  instruction: string | null
  /** Mise en place de la programmation. Sert d'ancre quand aucune passation n'existe. */
  createdAtIso: string
}

interface ScheduleRow {
  module_id: string
  mode: string
  frequency: string
  day_of_week: number | null
  time_of_day: string | null
  ends_on: string | null
  patient_reminder: boolean
  instruction: string | null
  created_at: string
}

const FREQUENCIES: readonly string[] = ['weekly', 'biweekly', 'monthly', 'quarterly', 'on_demand']

function toSchedule(row: ScheduleRow): ScaleSchedule {
  return {
    moduleId: row.module_id,
    mode: row.mode === 'in_session' ? 'in_session' : 'home',
    // Une valeur inconnue (colonne élargie côté serveur, ligne écrite par un script)
    // retombe sur « à la demande » : le patient voit alors une proposition sans
    // cadence plutôt qu'un libellé faux.
    frequency: (FREQUENCIES.includes(row.frequency) ? row.frequency : 'on_demand') as ScheduleFrequency,
    dayOfWeek: row.day_of_week,
    timeOfDay: row.time_of_day,
    endsOn: row.ends_on,
    patientReminder: row.patient_reminder,
    // Une consigne vide en base vaut aucune consigne : pas de ligne fantôme à l'écran.
    instruction: row.instruction != null && row.instruction.trim() !== '' ? row.instruction : null,
    createdAtIso: row.created_at,
  }
}

/**
 * Programmation proposée par le praticien pour une échelle, ou `null` s'il n'y en a
 * pas. L'absence est un cas NOMINAL : une échelle peut être débloquée sans cadence.
 *
 * ⚠️ MDR 2017/745 : cette lecture ne porte que des données de PROGRAMMATION (cadence,
 * jour, heure). Aucune réponse, aucun score n'y entre, et rien ici ne déclenche quoi
 * que ce soit : c'est un calendrier, pas une surveillance.
 *
 * Le patient ne modifie pas cette programmation, la RLS ne lui accorde que la lecture.
 * Ses propres ajustements (heure, jours, pause) vivent dans `notification_routines`,
 * via `notificationService`, et remontent au praticien par ce canal.
 */
export async function fetchScaleSchedule(
  patientId: string,
  moduleId: string,
): Promise<ScaleSchedule | null> {
  const { data, error } = await supabase
    .from('scale_schedules')
    .select('module_id, mode, frequency, day_of_week, time_of_day, ends_on, patient_reminder, instruction, created_at')
    .eq('patient_id', patientId)
    .eq('module_id', moduleId)
    .maybeSingle()

  if (error || data == null) return null
  return toSchedule(data as ScheduleRow)
}

/** Toutes les programmations du patient, indexées par `module_id`. */
export async function fetchScaleSchedules(patientId: string): Promise<Map<string, ScaleSchedule>> {
  const { data } = await supabase
    .from('scale_schedules')
    .select('module_id, mode, frequency, day_of_week, time_of_day, ends_on, patient_reminder, instruction, created_at')
    .eq('patient_id', patientId)

  const byModule = new Map<string, ScaleSchedule>()
  for (const row of (data ?? []) as ScheduleRow[]) {
    byModule.set(row.module_id, toSchedule(row))
  }
  return byModule
}
