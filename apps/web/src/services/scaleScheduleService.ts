import { supabase } from '../lib/supabase'

/** Mode de passation d'une échelle programmée. */
export type ScheduleMode = 'home' | 'in_session'

/** Cadence de passation, choisie par le praticien (jamais suggérée par l'app : MDR). */
export type ScheduleFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'on_demand'

/** Une programmation de passation (une par patient × échelle). Données brutes, jamais
 *  interprétées ; aucune relance déclenchée par un score (MDR 2017/745). */
export interface ScaleSchedule {
  readonly id: string
  readonly patient_id: string
  readonly practitioner_id: string
  readonly module_id: string
  readonly mode: ScheduleMode
  readonly frequency: ScheduleFrequency
  readonly day_of_week: number | null
  readonly time_of_day: string | null
  readonly ends_on: string | null
  readonly patient_reminder: boolean
  /**
   * Consigne affichée au patient (#421), ou `null`. Deux phrases au plus, écrites par
   * le praticien et restituées **telles quelles** : l'app ne les compose pas, ne les
   * complète pas, et ne les déclenche jamais à partir d'une réponse.
   */
  readonly instruction: string | null
  /** Date de mise en place de la programmation (ancre de calcul de la prochaine
   *  échéance quand aucune passation n'a encore eu lieu). */
  readonly created_at: string
}

/** Payload d'enregistrement (upsert) d'une programmation. */
export interface ScaleScheduleInput {
  patientId: string
  practitionerId: string
  moduleId: string
  mode: ScheduleMode
  frequency: ScheduleFrequency
  dayOfWeek: number | null
  timeOfDay: string | null
  endsOn: string | null
  patientReminder: boolean
  /** Consigne au patient, ou `null` pour n'en afficher aucune. */
  instruction: string | null
}

const COLUMNS = 'id, patient_id, practitioner_id, module_id, mode, frequency, day_of_week, time_of_day, ends_on, patient_reminder, instruction, created_at'

/** Programmation d'une échelle pour un patient, ou `null` si non programmée. */
export async function fetchScaleSchedule(
  patientId: string,
  moduleId: string,
): Promise<ScaleSchedule | null> {
  const { data, error } = await supabase
    .from('scale_schedules')
    .select(COLUMNS)
    .eq('patient_id', patientId)
    .eq('module_id', moduleId)
    .maybeSingle()

  if (error) throw error
  return data
}

/** Toutes les programmations d'un patient (une par échelle programmée). Alimente la
 *  colonne « Programmée » du tableau des échelles (K-7). */
export async function fetchScaleSchedules(patientId: string): Promise<ScaleSchedule[]> {
  const { data, error } = await supabase
    .from('scale_schedules')
    .select(COLUMNS)
    .eq('patient_id', patientId)

  if (error) throw error
  return data ?? []
}

/** Enregistre (upsert) la programmation d'une échelle. Une seule ligne par
 *  (patient, échelle) : `unique (patient_id, module_id)`. */
export async function saveScaleSchedule(input: ScaleScheduleInput): Promise<ScaleSchedule> {
  const { data, error } = await supabase
    .from('scale_schedules')
    .upsert(
      {
        patient_id: input.patientId,
        practitioner_id: input.practitionerId,
        module_id: input.moduleId,
        mode: input.mode,
        frequency: input.frequency,
        day_of_week: input.dayOfWeek,
        time_of_day: input.timeOfDay,
        ends_on: input.endsOn,
        patient_reminder: input.patientReminder,
        instruction: input.instruction,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'patient_id,module_id' },
    )
    .select(COLUMNS)
    .single()

  if (error) throw error
  return data
}

/** Supprime la programmation d'une échelle (repasse en « Non programmée »). */
export async function deleteScaleSchedule(patientId: string, moduleId: string): Promise<void> {
  const { error } = await supabase
    .from('scale_schedules')
    .delete()
    .eq('patient_id', patientId)
    .eq('module_id', moduleId)

  if (error) throw error
}
