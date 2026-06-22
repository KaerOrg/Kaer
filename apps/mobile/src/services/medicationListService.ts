import { supabase } from '../lib/supabase'
import type { Medication } from '@kaer/shared'

const MODULE = 'medication_adherence'

// Liste des médicaments (traitement de fond + si-besoin) du patient, stockée dans
// patient_modules.config.medications. Config partagée patient↔praticien : le patient
// l'édite ici (mobile), le praticien depuis l'app web. Donnée de setup (occasionnelle),
// lue/écrite en ligne — le suivi quotidien, lui, reste offline-first (medication_intakes).
export async function fetchMedications(patientId: string): Promise<Medication[]> {
  const { data } = await supabase
    .from('patient_modules')
    .select('config')
    .eq('patient_id', patientId)
    .eq('module_type', MODULE)
    .maybeSingle()
  const cfg = (data?.config ?? {}) as Record<string, unknown>
  const meds = cfg['medications']
  if (!Array.isArray(meds)) return []
  return meds as Medication[]
}

export async function updateMedications(
  patientId: string,
  medications: Medication[],
): Promise<{ ok: boolean }> {
  const { data: current } = await supabase
    .from('patient_modules')
    .select('config')
    .eq('patient_id', patientId)
    .eq('module_type', MODULE)
    .maybeSingle()
  const existing = (current?.config ?? {}) as Record<string, unknown>
  const { error } = await supabase
    .from('patient_modules')
    .update({ config: { ...existing, medications } })
    .eq('patient_id', patientId)
    .eq('module_type', MODULE)
  return { ok: !error }
}
