import { supabase } from '../lib/supabase'

export interface PatientProfileUpdate {
  first_name: string
  last_name: string
  phone: string | null
}

export async function updatePatientProfile(
  patientId: string,
  data: PatientProfileUpdate
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('patients')
    .update({
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      phone: data.phone?.trim() || null,
    })
    .eq('id', patientId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
