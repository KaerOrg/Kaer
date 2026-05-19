import { supabase } from '../lib/supabase'

export interface PractitionerNote {
  id: string
  practitioner_id: string
  patient_id: string
  content: string
  tags: string[]
  created_at: string
  updated_at: string
}

const NOTE_FIELDS = 'id, practitioner_id, patient_id, content, tags, created_at, updated_at'

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
  tags: string[] = []
): Promise<{ ok: boolean; note?: PractitionerNote }> {
  const trimmed = content.trim()
  if (!trimmed) return { ok: false }

  const { data, error } = await supabase
    .from('practitioner_patient_notes')
    .insert({ practitioner_id: practitionerId, patient_id: patientId, content: trimmed, tags })
    .select(NOTE_FIELDS)
    .single()

  if (error || !data) return { ok: false }
  return { ok: true, note: data as PractitionerNote }
}

export async function updateNote(
  noteId: string,
  content: string,
  tags: string[]
): Promise<{ ok: boolean }> {
  const trimmed = content.trim()
  if (!trimmed) return { ok: false }

  const { error } = await supabase
    .from('practitioner_patient_notes')
    .update({ content: trimmed, tags })
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
