import { supabase } from '../lib/supabase'
import type { TrackedEffect } from '../lib/sideEffectsCatalog'

const MODULE = 'medication_side_effects'

// Lit la liste des effets suivis configurée pour ce patient (dans patient_modules.config).
// Config partagée praticien↔patient. Défaut : aucun effet (le patient/praticien choisit).
export async function fetchTrackedEffects(patientId: string): Promise<TrackedEffect[]> {
  const { data } = await supabase
    .from('patient_modules')
    .select('config')
    .eq('patient_id', patientId)
    .eq('module_type', MODULE)
    .maybeSingle()
  const cfg = (data?.config ?? {}) as Record<string, unknown>
  const tracked = cfg['tracked_effects']
  if (!Array.isArray(tracked)) return []
  return tracked as TrackedEffect[]
}

// Met à jour la liste des effets suivis en préservant le reste de la config.
export async function updateTrackedEffects(
  patientId: string,
  effects: TrackedEffect[],
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
    .update({ config: { ...existing, tracked_effects: effects } })
    .eq('patient_id', patientId)
    .eq('module_type', MODULE)
  return { ok: !error }
}
