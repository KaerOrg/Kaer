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

// Cache session par patientId — évite les triple-fetches des widgets de prévisualisation.
const configCache = new Map<string, CrisisPlanConfig>()
export function clearCrisisPlanConfigCache() { configCache.clear() }

export async function fetchCrisisPlanConfig(patientId: string): Promise<CrisisPlanConfig> {
  if (configCache.has(patientId)) return configCache.get(patientId)!

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

  configCache.set(patientId, result)
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

  // Invalider le cache pour ce patient
  configCache.delete(patientId)
  return { ok: true }
}
