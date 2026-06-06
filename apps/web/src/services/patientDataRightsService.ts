import { supabase } from '../lib/supabase'

// #27 — Droits patient RGPD côté praticien : export (art. 15/20) et effacement (art. 17).
// Aucun appel Supabase ne doit vivre dans un composant → tout passe par ce service.
// Les RPC export_patient_data / erase_patient_data vérifient la propriété côté base
// (SECURITY DEFINER + auth.uid()) ; la suppression du compte auth.users passe par
// l'Edge Function delete-patient-account (service_role).

/** Données brutes d'un patient, agrégées par table (miroir neutre — conforme MDR). */
export type PatientDataExport = Record<string, unknown>

export type ExportResult =
  | { ok: true; data: PatientDataExport }
  | { ok: false; message: string }

export type EraseResult =
  | { ok: true }
  | { ok: false; message: string }

/**
 * Exporte toutes les données d'un patient (valeurs brutes uniquement, aucune
 * interprétation clinique). L'appel est tracé dans `access_audit_log` par le RPC.
 */
export async function exportPatientData(patientId: string): Promise<ExportResult> {
  const { data, error } = await supabase.rpc('export_patient_data', {
    p_patient_id: patientId,
  })
  if (error || !data) {
    return { ok: false, message: error?.message ?? 'export_failed' }
  }
  return { ok: true, data: data as PatientDataExport }
}

/**
 * Efface complètement un patient (droit à l'oubli) :
 *   1. RPC `erase_patient_data` — trace l'effacement + purge le non-cascadant
 *      (invitations par email, dossiers de file active).
 *   2. Edge Function `delete-patient-account` — supprime le compte auth.users, ce
 *      qui cascade `patients` et toutes les tables enfant.
 * L'ordre est important : le RPC s'exécute pendant que la relation praticien↔patient
 * existe encore (vérification de propriété), avant que la cascade ne l'efface.
 */
export async function erasePatientData(patientId: string): Promise<EraseResult> {
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
  return { ok: true }
}
