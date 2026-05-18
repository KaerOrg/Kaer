import { supabase } from '../lib/supabase'
import type { CrisisPlanCopingCard } from '@psytool/shared'

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

export async function fetchCrisisPlanConfig(moduleId: string): Promise<CrisisPlanConfig> {
  const { data } = await supabase
    .from('patient_modules')
    .select('config')
    .eq('id', moduleId)
    .single()

  const cfg = (data?.config as Record<string, unknown> | null)?.crisisPlan as
    | Partial<CrisisPlanConfig>
    | undefined

  return {
    practitionerMessage: cfg?.practitionerMessage ?? '',
    copingCards: cfg?.copingCards ?? [],
    commitmentPhrase: cfg?.commitmentPhrase ?? '',
  }
}

export async function saveCrisisPlanConfig(
  moduleId: string,
  config: CrisisPlanConfig
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('patient_modules')
    .update({ config: { crisisPlan: config } as Record<string, unknown> })
    .eq('id', moduleId)

  if (error) return { ok: false, message: error.message }
  return { ok: true }
}
