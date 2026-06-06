import { supabase } from '../lib/supabase'
import { purgeAllLocalData } from '../lib/database'
import { signOut } from './authService'

// #27 — Droits patient RGPD côté patient (self-service depuis les réglages) :
// export de ses propres données (art. 15/20) et suppression de son compte (art. 17).
//
// NOTE sync-service : ce service ne passe pas par syncHelpers. Ce n'est pas une écriture
// d'entrée patient à répliquer, mais une SUPPRESSION TOTALE (compte + données serveur +
// SQLite local). La purge locale est volontairement déconnectée de l'outbox de sync.

export type ExportResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; message: string }

export type EraseResult =
  | { ok: true }
  | { ok: false; message: string }

/** Exporte toutes les données du patient courant (valeurs brutes, conforme MDR). */
export async function exportMyData(patientId: string): Promise<ExportResult> {
  const { data, error } = await supabase.rpc('export_patient_data', {
    p_patient_id: patientId,
  })
  if (error || !data) {
    return { ok: false, message: error?.message ?? 'export_failed' }
  }
  return { ok: true, data: data as Record<string, unknown> }
}

/**
 * Supprime le compte du patient et toutes ses données (droit à l'oubli) :
 *   1. RPC `erase_patient_data` — trace + purge le non-cascadant côté serveur.
 *   2. Edge Function `delete-patient-account` — supprime le compte auth.users (cascade).
 *   3. `purgeAllLocalData()` — efface le stockage SQLite local de l'appareil.
 *   4. `signOut()` — termine la session locale (retour à l'écran de connexion).
 */
export async function eraseMyAccount(patientId: string): Promise<EraseResult> {
  const { error: rpcError } = await supabase.rpc('erase_patient_data', {
    p_patient_id: patientId,
  })
  if (rpcError) {
    return { ok: false, message: rpcError.message }
  }

  const { error: fnError } = await supabase.functions.invoke('delete-patient-account', {
    body: { patient_id: patientId },
  })
  if (fnError) {
    return { ok: false, message: fnError.message }
  }

  await purgeAllLocalData()
  await signOut()
  return { ok: true }
}
