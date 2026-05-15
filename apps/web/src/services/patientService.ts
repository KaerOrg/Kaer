import { supabase } from '../lib/supabase'
import type { PatientSummary, PatientModule } from '../lib/database.types'

export interface PatientRelation {
  patient_id: string
  patient_alias: string | null
  patient_first_name: string | null
  patient_last_name: string | null
  patient_birth_date: string | null
  patient_sex: string | null
  patients: { id: string; email: string; first_name: string | null; last_name: string | null } | { id: string; email: string; first_name: string | null; last_name: string | null }[] | null
}

export interface PatientOption {
  id: string
  label: string
}

/** Liste les patients d'un praticien avec leurs modules débloqués. */
export async function fetchPatientsWithModules(practitionerId: string): Promise<PatientSummary[]> {
  const { data: relations } = await supabase
    .from('practitioner_patients')
    .select(
      'patient_id, patient_alias, patient_first_name, patient_last_name, patient_birth_date, patient_sex, patients(id, email, first_name, last_name)'
    )
    .eq('practitioner_id', practitionerId) as { data: PatientRelation[] | null }

  if (!relations) return []

  const patientIds = relations.map(r => r.patient_id)
  const { data: modules } = patientIds.length > 0
    ? await supabase.from('patient_modules').select('*').in('patient_id', patientIds)
    : { data: [] as PatientModule[] }

  return relations
    .map(rel => {
      const patient = Array.isArray(rel.patients) ? rel.patients[0] : rel.patients
      return {
        id: rel.patient_id,
        email: patient?.email ?? '',
        patient_alias: rel.patient_alias ?? null,
        patient_first_name: rel.patient_first_name ?? patient?.first_name ?? null,
        patient_last_name: rel.patient_last_name ?? patient?.last_name ?? null,
        patient_birth_date: rel.patient_birth_date ?? null,
        patient_sex: rel.patient_sex ?? null,
        modules: (modules ?? []).filter(m => m.patient_id === rel.patient_id),
      }
    })
    .filter(p => p.id)
}

/** Liste compacte (id + label) pour les sélecteurs/modales. */
export async function fetchPatientOptions(practitionerId: string): Promise<PatientOption[]> {
  type RelRow = {
    patient_id: string
    patient_alias: string | null
    patients: { email: string } | { email: string }[] | null
  }
  const { data } = await supabase
    .from('practitioner_patients')
    .select('patient_id, patient_alias, patients(email)')
    .eq('practitioner_id', practitionerId) as { data: RelRow[] | null }

  return ((data ?? []) as RelRow[]).map(rel => {
    const p = Array.isArray(rel.patients) ? rel.patients[0] : rel.patients
    const email = (p as { email: string } | null)?.email ?? ''
    return { id: rel.patient_id, label: rel.patient_alias ?? email }
  })
}

export interface PatientHeader {
  email: string
  alias: string | null
  firstName: string | null
  lastName: string | null
  teenMode: boolean
  enrolledAt: string
  generalNote: string | null
}

export async function fetchPatientHeader(
  practitionerId: string,
  patientId: string
): Promise<PatientHeader | null> {
  interface RelationRow {
    patient_alias: string | null
    patient_first_name: string | null
    patient_last_name: string | null
    teen_mode: boolean
    created_at: string
    general_note: string | null
    patients: { email: string; first_name: string | null; last_name: string | null } | { email: string; first_name: string | null; last_name: string | null }[] | null
  }
  const { data } = await supabase
    .from('practitioner_patients')
    .select('patient_alias, patient_first_name, patient_last_name, teen_mode, created_at, general_note, patients(email, first_name, last_name)')
    .eq('practitioner_id', practitionerId)
    .eq('patient_id', patientId)
    .single() as { data: RelationRow | null }

  if (!data) return null
  const patient = Array.isArray(data.patients) ? data.patients[0] : data.patients
  return {
    email: patient?.email ?? '',
    alias: data.patient_alias,
    firstName: data.patient_first_name ?? patient?.first_name ?? null,
    lastName: data.patient_last_name ?? patient?.last_name ?? null,
    teenMode: data.teen_mode ?? false,
    enrolledAt: data.created_at,
    generalNote: data.general_note ?? null,
  }
}

export async function saveGeneralNote(
  practitionerId: string,
  patientId: string,
  content: string,
): Promise<{ ok: boolean }> {
  const { error } = await supabase
    .from('practitioner_patients')
    .update({ general_note: content || null } as never)
    .eq('practitioner_id', practitionerId)
    .eq('patient_id', patientId)
  return { ok: !error }
}

export async function setTeenMode(
  practitionerId: string,
  patientId: string,
  enabled: boolean
): Promise<{ ok: boolean }> {
  const { error } = await supabase
    .from('practitioner_patients')
    .update({ teen_mode: enabled } as never)
    .eq('practitioner_id', practitionerId)
    .eq('patient_id', patientId)
  return { ok: !error }
}
