import { supabase } from '../lib/supabase'

export interface CrisisPlanConfig {
  practitionerMessage: string
}

export interface ServiceResult {
  ok: boolean
  message?: string
}

// Pas de cache module-level : React Query (crisisQueries.planConfig) est l'unique
// couche de cache et déduplique les widgets d'aperçu ; l'invalidation à l'écriture
// (useSaveCrisisPlan) garantit la fraîcheur. Un cache Map masquerait cette invalidation.
export async function fetchCrisisPlanConfig(patientId: string): Promise<CrisisPlanConfig> {
  const { data } = await supabase
    .from('crisis_plan_configs')
    .select('practitioner_message')
    .eq('patient_id', patientId)
    .maybeSingle()

  return {
    practitionerMessage: data?.practitioner_message ?? '',
  }
}

export async function saveCrisisPlanConfig(
  patientId: string,
  config: CrisisPlanConfig,
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('crisis_plan_configs')
    .upsert({
      patient_id: patientId,
      practitioner_message: config.practitionerMessage,
      updated_at: new Date().toISOString(),
    })
  if (error) return { ok: false, message: error.message }

  return { ok: true }
}
