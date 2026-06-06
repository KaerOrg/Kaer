import { supabase } from '../lib/supabase'

/**
 * Actions applicatives traçables dans le journal d'audit.
 *
 * Les écritures (`insert`/`update`/`delete`) NE passent PAS par ici : elles sont
 * capturées automatiquement par les triggers PostgreSQL `fn_audit_write` côté base.
 * Ce service ne couvre que les événements applicatifs non observables par trigger :
 * lecture d'un dossier, export RGPD, effacement, purge programmée.
 */
export type AuditAction = 'read' | 'export' | 'erase' | 'purge'

/**
 * Métadonnées techniques attachées à une entrée d'audit.
 *
 * ⚠️ Conformité MDR : ne JAMAIS y placer de contenu clinique (valeurs saisies,
 * scores, texte de note…). Uniquement des métadonnées techniques : portée d'une
 * lecture, nombre de lignes, identifiant de routine, etc.
 */
export type AuditMetadata = Record<string, string | number | boolean | null>

export interface LogDataAccessParams {
  action: AuditAction
  /** Nom de la table concernée (ex. `patients`, `patient_entries`). */
  targetTable: string
  /** Id de la ligne concernée, ou `null` pour une lecture de liste / opération de masse. */
  targetId?: string | null
  /** Patient concerné, pour le filtrage du journal. */
  patientId?: string | null
  metadata?: AuditMetadata
}

/**
 * Journalise un accès applicatif dans `access_audit_log` via le RPC `SECURITY DEFINER`
 * `log_data_access`. L'acteur (`actor_id`) est dérivé de `auth.uid()` **côté base** —
 * le client ne peut pas le forger.
 *
 * Best-effort : un échec de journalisation ne doit jamais interrompre l'opération
 * métier appelante (l'audit est secondaire par rapport au service rendu au praticien).
 * On trace l'erreur sans la propager.
 */
export async function logDataAccess(params: LogDataAccessParams): Promise<void> {
  const { error } = await supabase.rpc('log_data_access', {
    p_action: params.action,
    p_target_table: params.targetTable,
    p_target_id: params.targetId ?? null,
    p_patient_id: params.patientId ?? null,
    p_metadata: params.metadata ?? {},
  })
  if (error) {
    console.error('[auditService] logDataAccess a échoué :', error.message)
  }
}
