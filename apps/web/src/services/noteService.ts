import { supabase } from '../lib/supabase'
import type { AppointmentStatus } from '../lib/calendar.types'

export interface PractitionerNote {
  id: string
  practitioner_id: string
  patient_id: string
  /** RDV optionnellement rattaché à la note. null = note libre. */
  appointment_id: string | null
  content: string
  tags: string[]
  created_at: string
  updated_at: string
}

const NOTE_FIELDS = 'id, practitioner_id, patient_id, appointment_id, content, tags, created_at, updated_at'

// Fenêtre des RDV proposables au rattachement d'une note : une note est
// généralement rédigée à propos d'une séance récente ou d'un RDV imminent.
// Le passé est large (≈ 2 mois de séances), le futur plus court (quelques semaines).
const DAY_MS = 24 * 60 * 60 * 1000
export const NOTE_APPOINTMENT_PAST_DAYS = 60
export const NOTE_APPOINTMENT_FUTURE_DAYS = 30

/** Forme minimale d'un RDV requise par `selectableAppointmentsForNote`. */
type SelectableAppointment = { id: string; starts_at: string; status: AppointmentStatus }

/**
 * RDV proposables dans le sélecteur d'une note : non annulés et dans la fenêtre
 * temporelle [now - PAST, now + FUTURE], triés du plus récent au plus ancien.
 *
 * `currentAppointmentId` (le RDV déjà lié en mode édition) est TOUJOURS inclus,
 * même hors fenêtre ou annulé : sans cela, rouvrir une vieille note perdrait son
 * lien dans le sélecteur.
 */
export function selectableAppointmentsForNote<T extends SelectableAppointment>(
  appointments: readonly T[],
  now: Date,
  currentAppointmentId?: string | null,
): T[] {
  const min = now.getTime() - NOTE_APPOINTMENT_PAST_DAYS * DAY_MS
  const max = now.getTime() + NOTE_APPOINTMENT_FUTURE_DAYS * DAY_MS
  return appointments
    .filter(a => {
      if (a.id === currentAppointmentId) return true
      if (a.status === 'cancelled_by_patient' || a.status === 'cancelled_by_practitioner') return false
      const t = new Date(a.starts_at).getTime()
      return t >= min && t <= max
    })
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
}

export async function fetchNotes(
  practitionerId: string,
  patientId: string
): Promise<PractitionerNote[]> {
  const { data, error } = await supabase
    .from('practitioner_patient_notes')
    .select(NOTE_FIELDS)
    .eq('practitioner_id', practitionerId)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as PractitionerNote[]
}

export async function saveNote(
  practitionerId: string,
  patientId: string,
  content: string,
  tags: string[] = [],
  appointmentId: string | null = null
): Promise<{ ok: boolean; note?: PractitionerNote }> {
  const trimmed = content.trim()
  if (!trimmed) return { ok: false }

  const { data, error } = await supabase
    .from('practitioner_patient_notes')
    .insert({
      practitioner_id: practitionerId,
      patient_id: patientId,
      appointment_id: appointmentId,
      content: trimmed,
      tags,
    })
    .select(NOTE_FIELDS)
    .single()

  if (error || !data) return { ok: false }
  return { ok: true, note: data as PractitionerNote }
}

export async function updateNote(
  noteId: string,
  content: string,
  tags: string[],
  appointmentId: string | null = null
): Promise<{ ok: boolean }> {
  const trimmed = content.trim()
  if (!trimmed) return { ok: false }

  const { error } = await supabase
    .from('practitioner_patient_notes')
    .update({ content: trimmed, tags, appointment_id: appointmentId })
    .eq('id', noteId)

  return { ok: !error }
}

export async function deleteNote(noteId: string): Promise<{ ok: boolean }> {
  const { error } = await supabase
    .from('practitioner_patient_notes')
    .delete()
    .eq('id', noteId)

  return { ok: !error }
}

export function extractUniqueTags(notes: PractitionerNote[]): string[] {
  const seen = new Set<string>()
  for (const note of notes) {
    for (const tag of note.tags) {
      seen.add(tag)
    }
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b))
}

export function extractTopTags(notes: PractitionerNote[], limit = 7): string[] {
  const counts = new Map<string, number>()
  for (const note of notes) {
    for (const tag of note.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag]) => tag)
}
