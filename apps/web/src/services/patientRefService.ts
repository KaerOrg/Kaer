import { supabase } from '../lib/supabase'

/**
 * Résout l'identifiant public opaque (`public_ref`, ex. « p_8Kf3aQ ») exposé dans
 * l'URL praticien vers le `patient_id` réel utilisé par toute la couche service.
 *
 * Sécurité — défense en profondeur, PAS contrôle d'accès : le token masque la PK
 * dans l'URL (historique, logs, captures). La seule barrière reste la RLS : la
 * policy `ptp_practitioner` (`auth.uid() = practitioner_id`) ne renvoie une ligne
 * que si le praticien connecté possède cette relation. Un token inexistant et le
 * token d'un autre praticien sont donc indiscernables côté client (→ `null`).
 */
export async function resolvePatientRef(ref: string): Promise<string | null> {
  if (!ref) return null

  const { data } = await supabase
    .from('practitioner_patients')
    .select('patient_id')
    .eq('public_ref', ref)
    .single() as { data: { patient_id: string } | null }

  return data?.patient_id ?? null
}
