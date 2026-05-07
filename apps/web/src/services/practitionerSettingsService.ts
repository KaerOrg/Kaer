import { supabase } from '../lib/supabase'
import type { ModuleType } from '../lib/database.types'

/**
 * Renvoie l'ensemble des modules activés pour un praticien.
 * Renvoie `null` si aucune restriction n'a été définie (= tous les modules visibles).
 */
export async function fetchEnabledModules(
  practitionerId: string
): Promise<Set<ModuleType> | null> {
  const { data } = await supabase
    .from('practitioner_module_settings')
    .select('enabled_modules')
    .eq('practitioner_id', practitionerId)
    .maybeSingle()
  if (!data) return null
  return new Set(data.enabled_modules as ModuleType[])
}

export async function saveEnabledModules(
  practitionerId: string,
  enabled: Iterable<ModuleType>
): Promise<{ ok: boolean }> {
  const { error } = await supabase.from('practitioner_module_settings').upsert(
    {
      practitioner_id: practitionerId,
      enabled_modules: [...enabled],
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'practitioner_id' }
  )
  return { ok: !error }
}
