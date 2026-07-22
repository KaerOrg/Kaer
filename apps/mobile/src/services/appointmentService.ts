import { supabase } from '../lib/supabase'

// ─── Types (mirror de calendar.types.ts web) ─────────────────────────────────

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface AvailabilityRule {
  id: string
  practitioner_id: string
  day_of_week: DayOfWeek
  start_time: string
  end_time: string
  slot_duration_minutes: number
  buffer_minutes: number
  created_at: string
}

export interface AvailabilityException {
  id: string
  practitioner_id: string
  exception_date: string
  is_closed: boolean
  start_time: string | null
  end_time: string | null
  created_at: string
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled_by_patient'
  | 'cancelled_by_practitioner'
  | 'completed'

export interface Appointment {
  id: string
  practitioner_id: string
  patient_id: string
  starts_at: string
  ends_at: string
  status: AppointmentStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ComputedSlot {
  starts_at: string
  ends_at: string
  is_available: boolean
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

function jsDayToSchema(jsDay: number): DayOfWeek {
  return (jsDay === 0 ? 6 : jsDay - 1) as DayOfWeek
}

// ─── Calcul des créneaux (pure function) ──────────────────────────────────────

export function computeAvailableSlots(
  rules: AvailabilityRule[],
  exceptions: AvailabilityException[],
  bookedSlots: Pick<Appointment, 'starts_at' | 'ends_at' | 'status'>[],
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

      const isBooked = bookedSlots.some(a => {
        if (a.status === 'cancelled_by_patient' || a.status === 'cancelled_by_practitioner')
          return false
        return new Date(a.starts_at).getTime() < sEnd && new Date(a.ends_at).getTime() > sStart
      })

      slots.push({ starts_at: slotStart, ends_at: slotEnd, is_available: !isBooked })
      current += duration + buffer
    }
  }

  return slots.sort((a, b) => a.starts_at.localeCompare(b.starts_at))
}

// ─── Rendez-vous patient ──────────────────────────────────────────────────────

/** Rendez-vous à venir + passés pour le patient connecté. */
export async function fetchPatientAppointments(
  patientId: string,
): Promise<Appointment[]> {
  const { data } = await supabase
    .from('appointments')
    .select('*')
    .eq('patient_id', patientId)
    .order('starts_at', { ascending: false })
  return (data ?? []) as Appointment[]
}

/** Règles de disponibilité du praticien (pour calculer les créneaux). */
export async function fetchPractitionerRules(
  practitionerId: string,
): Promise<AvailabilityRule[]> {
  const { data } = await supabase
    .from('availability_rules')
    .select('*')
    .eq('practitioner_id', practitionerId)
    .order('day_of_week')
  return (data ?? []) as AvailabilityRule[]
}

/** Exceptions du praticien pour une plage de dates. */
export async function fetchPractitionerExceptions(
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
  return (data ?? []) as AvailabilityException[]
}

/** Créneaux déjà réservés pour une date (pour exclure les slots pris). */
export async function fetchBookedSlots(
  practitionerId: string,
  date: string,
  excludeAppointmentId?: string,
): Promise<Pick<Appointment, 'starts_at' | 'ends_at' | 'status'>[]> {
  const baseQuery = supabase
    .from('appointments')
    .select('starts_at, ends_at, status')
    .eq('practitioner_id', practitionerId)
    .gte('starts_at', `${date}T00:00:00`)
    .lte('starts_at', `${date}T23:59:59`)
  const { data } = excludeAppointmentId
    ? await baseQuery.neq('id', excludeAppointmentId)
    : await baseQuery
  return (data ?? []) as Pick<Appointment, 'starts_at' | 'ends_at' | 'status'>[]
}

/** Réserver un créneau. */
export async function bookAppointment(params: {
  practitioner_id: string
  patient_id: string
  starts_at: string
  ends_at: string
}): Promise<{ ok: boolean; error?: string }> {
  const { data: practRow } = await supabase
    .from('practitioners')
    .select('auto_confirm_appointments')
    .eq('id', params.practitioner_id)
    .single()
  const autoConfirm = (practRow as { auto_confirm_appointments: boolean } | null)
    ?.auto_confirm_appointments ?? true

  const { error } = await supabase.from('appointments').insert({
    ...params,
    starts_at: new Date(params.starts_at).toISOString(),
    ends_at: new Date(params.ends_at).toISOString(),
    status: autoConfirm ? 'confirmed' : 'pending',
  })
  return { ok: !error, error: error?.message }
}

/** Annuler un rendez-vous (patient). */
export async function cancelAppointment(
  appointmentId: string,
): Promise<{ ok: boolean }> {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled_by_patient', updated_at: new Date().toISOString() })
    .eq('id', appointmentId)
  return { ok: !error }
}

/** Reprogrammer un rendez-vous existant (patient). */
export async function rescheduleAppointment(params: {
  appointment_id: string
  practitioner_id: string
  starts_at: string
  ends_at: string
}): Promise<{ ok: boolean; error?: string }> {
  const { data: practRow } = await supabase
    .from('practitioners')
    .select('auto_confirm_appointments')
    .eq('id', params.practitioner_id)
    .single()
  const autoConfirm = (practRow as { auto_confirm_appointments: boolean } | null)
    ?.auto_confirm_appointments ?? true

  const { error } = await supabase
    .from('appointments')
    .update({
      starts_at: new Date(params.starts_at).toISOString(),
      ends_at: new Date(params.ends_at).toISOString(),
      status: autoConfirm ? 'confirmed' : 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.appointment_id)
  return { ok: !error, error: error?.message }
}

export interface PractitionerIdentity {
  id: string
  name: string
  professional_title: string | null
}

/**
 * Praticien lié au patient connecté : identité d'affichage (réservation, cartes RDV).
 *
 * Passe par la RPC `get_my_practitioner` et non par un select direct : la policy
 * `practitioners_own` réserve la table au praticien lui-même, un patient ne peut donc
 * pas lire le nom de son soignant en direct. La RPC dérive le patient de `auth.uid()`
 * côté serveur : aucun identifiant n'est accepté du client.
 */
export async function fetchMyPractitioner(): Promise<PractitionerIdentity | null> {
  const { data, error } = await supabase.rpc('get_my_practitioner')
  if (error || !data || data.length === 0) return null
  const row = data[0]
  return {
    id: row.id,
    name: row.name,
    professional_title: row.professional_title,
  }
}
