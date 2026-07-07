import { supabase } from '../lib/supabase'
import type { CrisisPlanCopingCard } from '@kaer/shared'

export type { CrisisPlanCopingCard }

export interface CrisisPlanConfig {
  practitionerMessage: string
  copingCards: CrisisPlanCopingCard[]
  commitmentPhrase: string
}

export interface ServiceResult {
  ok: boolean
  message?: string
}

// Pas de cache module-level : React Query (crisisQueries.planConfig) est l'unique
// couche de cache et déduplique les 3 widgets d'aperçu ; l'invalidation à l'écriture
// (useSaveCrisisPlan) garantit la fraîcheur. Un cache Map masquerait cette invalidation.
export async function fetchCrisisPlanConfig(patientId: string): Promise<CrisisPlanConfig> {
  const [configResult, cardsResult] = await Promise.all([
    supabase
      .from('crisis_plan_configs')
      .select('practitioner_message, commitment_phrase')
      .eq('patient_id', patientId)
      .maybeSingle(),
    supabase
      .from('crisis_plan_coping_cards')
      .select('id, thought, response, sort_order')
      .eq('patient_id', patientId)
      .order('sort_order', { ascending: true }),
  ])

  const result: CrisisPlanConfig = {
    practitionerMessage: configResult.data?.practitioner_message ?? '',
    copingCards: (cardsResult.data ?? []).map(c => ({
      id: c.id as string,
      thought: c.thought as string,
      response: c.response as string,
    })),
    commitmentPhrase: configResult.data?.commitment_phrase ?? '',
  }

  return result
}

export async function saveCrisisPlanConfig(
  patientId: string,
  config: CrisisPlanConfig,
): Promise<ServiceResult> {
  // Upsert la config principale
  const { error: cfgErr } = await supabase
    .from('crisis_plan_configs')
    .upsert({
      patient_id: patientId,
      practitioner_message: config.practitionerMessage,
      commitment_phrase: config.commitmentPhrase,
      updated_at: new Date().toISOString(),
    })
  if (cfgErr) return { ok: false, message: cfgErr.message }

  // Remplacement des cartes : suppression puis insertion
  const { error: delErr } = await supabase
    .from('crisis_plan_coping_cards')
    .delete()
    .eq('patient_id', patientId)
  if (delErr) return { ok: false, message: delErr.message }

  if (config.copingCards.length > 0) {
    const { error: insErr } = await supabase
      .from('crisis_plan_coping_cards')
      .insert(
        config.copingCards.map((c, i) => ({
          patient_id: patientId,
          thought: c.thought,
          response: c.response,
          sort_order: i,
        })),
      )
    if (insErr) return { ok: false, message: insErr.message }
  }

  return { ok: true }
}
