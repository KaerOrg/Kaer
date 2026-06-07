import { supabase } from '../lib/supabase'
import type {
  AvailabilityRule,
  AvailabilityException,
  Appointment,
  AppointmentStatus,
  AppointmentWithPatient,
  ComputedSlot,
  DayOfWeek,
} from '../lib/calendar.types'

// ─── Utilitaires horaires ─────────────────────────────────────────────────────

/** Convertit "HH:MM" en nombre de minutes depuis minuit. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Convertit des minutes depuis minuit en "HH:MM". */
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

/**
 * Convertit un jour JS (Date.getDay(), 0=Dimanche) en day_of_week schema
 * (0=Lundi, 6=Dimanche).
 */
export function jsDayToSchema(jsDay: number): DayOfWeek {
  return (jsDay === 0 ? 6 : jsDay - 1) as DayOfWeek
}

// ─── Calcul des créneaux ──────────────────────────────────────────────────────

/**
 * Retourne true si les plages horaires [aStart, aEnd[ et [bStart, bEnd[ se chevauchent.
 * Les heures sont des chaînes "HH:MM" ou "HH:MM:SS" — seuls les 5 premiers caractères sont comparés.
 */
export function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart.slice(0, 5) < bEnd.slice(0, 5) && aEnd.slice(0, 5) > bStart.slice(0, 5)
}

/**
 * Calcule les créneaux disponibles pour une date donnée.
 * Fonction pure — pas d'appel réseau.
 * Supporte plusieurs règles non-chevauchantes pour le même jour (ex. matin + après-midi).
 *
 * @param rules        Règles de disponibilité du praticien
 * @param exceptions   Exceptions ponctuelles
 * @param appointments Rendez-vous existants pour cette date (tous statuts)
 * @param date         "YYYY-MM-DD"
 */
export function computeAvailableSlots(
  rules: AvailabilityRule[],
  exceptions: AvailabilityException[],
  appointments: AppointmentWithPatient[],
  date: string,
): ComputedSlot[] {
  const d = new Date(`${date}T00:00:00`)
  const dayOfWeek = jsDayToSchema(d.getDay())

  const exception = exceptions.find(e => e.exception_date === date)
  if (exception?.is_closed) return []

  const dayRules = rules.filter(r => r.day_of_week === dayOfWeek)
  if (dayRules.length === 0) return []

  // Une exception avec des horaires explicites remplace l'ensemble des règles du jour
  // par une seule fenêtre (durée/buffer de la première règle).
  const windows: Array<{ start: string; end: string; duration: number; buffer: number }> =
    exception?.start_time != null && exception.end_time != null
      ? [{ start: exception.start_time, end: exception.end_time, duration: dayRules[0].slot_duration_minutes, buffer: dayRules[0].buffer_minutes ?? 0 }]
      : dayRules.map(r => ({ start: r.start_time, end: r.end_time, duration: r.slot_duration_minutes, buffer: r.buffer_minutes ?? 0 }))

  const slots: ComputedSlot[] = []

  for (const { start, end, duration, buffer } of windows) {
    let current = timeToMinutes(start)
    const endMin = timeToMinutes(end)

    while (current + duration <= endMin) {
      const slotStart = `${date}T${minutesToTimeString(current)}:00`
      const slotEnd = `${date}T${minutesToTimeString(current + duration)}:00`
      const sStart = new Date(slotStart).getTime()
      const sEnd = new Date(slotEnd).getTime()

      const overlapping = appointments.find(a => {
        if (
          a.status === 'cancelled_by_patient' ||
          a.status === 'cancelled_by_practitioner'
        ) return false
        const aStart = new Date(a.starts_at).getTime()
        const aEnd = new Date(a.ends_at).getTime()
        return aStart < sEnd && aEnd > sStart
      })

      slots.push({
        starts_at: slotStart,
        ends_at: slotEnd,
        is_available: !overlapping,
        appointment: overlapping ?? null,
      })

      current += duration + buffer
    }
  }

  return slots.sort((a, b) => a.starts_at.localeCompare(b.starts_at))
}

// ─── Règles de disponibilité ──────────────────────────────────────────────────

export async function fetchAvailabilityRules(
  practitionerId: string,
): Promise<AvailabilityRule[]> {
  const { data } = await supabase
    .from('availability_rules')
    .select('*')
    .eq('practitioner_id', practitionerId)
    .order('day_of_week')
    .order('start_time')
  return (data ?? []) as AvailabilityRule[]
}

export async function saveAvailabilityRule(
  rule: Omit<AvailabilityRule, 'id' | 'created_at'>,
): Promise<{ ok: boolean; data?: AvailabilityRule; error?: string }> {
  const { data, error } = await supabase
    .from('availability_rules')
    .insert(rule)
    .select()
    .single()
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: data as AvailabilityRule }
}

export async function deleteAvailabilityRule(
  ruleId: string,
): Promise<{ ok: boolean }> {
  const { error } = await supabase
    .from('availability_rules')
    .delete()
    .eq('id', ruleId)
  return { ok: !error }
}

// ─── Exceptions ───────────────────────────────────────────────────────────────

export async function fetchExceptions(
  practitionerId: string,
  from: string,
  to: string,
): Promise<AvailabilityException[]> {
  const { data } = await supabase
    .from('availability_exceptions')
    .select('*')
    .eq('practitioner_id', practitionerId)
    .gte('exception_date', from)
    .lte('exception_date', to)
    .order('exception_date')
  return (data ?? []) as AvailabilityException[]
}

export async function upsertException(
  exception: Omit<AvailabilityException, 'id' | 'created_at'>,
): Promise<{ ok: boolean; data?: AvailabilityException }> {
  const { data, error } = await supabase
    .from('availability_exceptions')
    .upsert(exception, { onConflict: 'practitioner_id,exception_date' })
    .select()
    .single()
  if (error) return { ok: false }
  return { ok: true, data: data as AvailabilityException }
}

export async function deleteException(
  exceptionId: string,
): Promise<{ ok: boolean }> {
  const { error } = await supabase
    .from('availability_exceptions')
    .delete()
    .eq('id', exceptionId)
  return { ok: !error }
}

// ─── Rendez-vous ──────────────────────────────────────────────────────────────

type PatientRelEntry = {
  patient_alias: string | null
  patient_first_name: string | null
  patient_last_name: string | null
  patients: { email: string; first_name: string | null; last_name: string | null } | { email: string; first_name: string | null; last_name: string | null }[] | null
}

type AppointmentRow = {
  id: string
  practitioner_id: string
  patient_id: string
  starts_at: string
  ends_at: string
  status: AppointmentStatus
  notes: string | null
  created_at: string
  updated_at: string
  // PostgREST retourne un objet (many-to-one via FK composite) ou un tableau selon la version
  patient_rel: PatientRelEntry | PatientRelEntry[] | null
}

function rowToAppointmentWithPatient(row: AppointmentRow): AppointmentWithPatient {
  const rel = Array.isArray(row.patient_rel) ? row.patient_rel[0] : row.patient_rel
  const profile = Array.isArray(rel?.patients) ? rel?.patients[0] : rel?.patients
  const firstName = rel?.patient_first_name ?? profile?.first_name ?? ''
  const lastName = rel?.patient_last_name ?? profile?.last_name ?? ''
  const alias = rel?.patient_alias
  const patient_display_name = alias
    ? alias
    : ([firstName, lastName].filter(Boolean).join(' ') || profile?.email) ?? ''
  return {
    id: row.id,
    practitioner_id: row.practitioner_id,
    patient_id: row.patient_id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    patient_display_name,
    patient_email: profile?.email ?? '',
  }
}

export async function fetchAppointmentsForPatient(
  practitionerId: string,
  patientId: string,
): Promise<AppointmentWithPatient[]> {
  const { data } = await supabase
    .from('appointments')
    .select(`
      *,
      patient_rel:practitioner_patients!inner(
        patient_alias, patient_first_name, patient_last_name,
        patients(email, first_name, last_name)
      )
    `)
    .eq('practitioner_id', practitionerId)
    .eq('patient_id', patientId)
    .order('starts_at', { ascending: false })
  return ((data ?? []) as AppointmentRow[]).map(rowToAppointmentWithPatient)
}

export async function fetchAppointmentsForWeek(
  practitionerId: string,
  from: string,  // ISO date "YYYY-MM-DD"
  to: string,    // ISO date "YYYY-MM-DD"
): Promise<AppointmentWithPatient[]> {
  const { data } = await supabase
    .from('appointments')
    .select(`
      *,
      patient_rel:practitioner_patients!inner(
        patient_alias, patient_first_name, patient_last_name,
        patients(email, first_name, last_name)
      )
    `)
    .eq('practitioner_id', practitionerId)
    .gte('starts_at', `${from}T00:00:00`)
    .lte('starts_at', `${to}T23:59:59`)
    .order('starts_at')

  return ((data ?? []) as AppointmentRow[]).map(rowToAppointmentWithPatient)
}

export async function createAppointment(params: {
  practitioner_id: string
  patient_id: string
  starts_at: string
  ends_at: string
  notes?: string
  auto_confirm?: boolean
}): Promise<{ ok: boolean; data?: Appointment; error?: string }> {
  const { starts_at, ends_at, auto_confirm, ...rest } = params
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      ...rest,
      starts_at: new Date(starts_at).toISOString(),
      ends_at: new Date(ends_at).toISOString(),
      status: auto_confirm ? 'confirmed' : 'pending',
    })
    .select()
    .single()
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: data as Appointment }
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<{ ok: boolean }> {
  const { error } = await supabase
    .from('appointments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  return { ok: !error }
}

export async function updateAppointmentNotes(
  id: string,
  notes: string,
): Promise<{ ok: boolean }> {
  const { error } = await supabase
    .from('appointments')
    .update({ notes: notes || null, updated_at: new Date().toISOString() })
    .eq('id', id)
  return { ok: !error }
}

// ─── Reprogrammation ──────────────────────────────────────────────────────────

export async function rescheduleAppointment(
  appointmentId: string,
  newStartsAt: string,
  newEndsAt: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('appointments')
    .update({
      starts_at: new Date(newStartsAt).toISOString(),
      ends_at: new Date(newEndsAt).toISOString(),
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
  return { ok: !error, error: error?.message }
}

// ─── Paramètre auto-confirm ───────────────────────────────────────────────────

export async function fetchAutoConfirmSetting(
  practitionerId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('practitioners')
    .select('auto_confirm_appointments')
    .eq('id', practitionerId)
    .single()
  return (data as { auto_confirm_appointments: boolean } | null)
    ?.auto_confirm_appointments ?? true
}

export async function saveAutoConfirmSetting(
  practitionerId: string,
  autoConfirm: boolean,
): Promise<{ ok: boolean }> {
  const { error } = await supabase
    .from('practitioners')
    .update({ auto_confirm_appointments: autoConfirm })
    .eq('id', practitionerId)
  return { ok: !error }
}
