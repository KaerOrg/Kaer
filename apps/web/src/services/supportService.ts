import { supabase } from '../lib/supabase'

/**
 * Motifs de demande de support — liste fermée (formulaire borné, aucune saisie libre :
 * zéro PII / contenu clinique transmis au support). Doit rester synchronisée avec le
 * CHECK de `support_requests.reason` et l'Edge Function `send-support-request`.
 */
export const SUPPORT_REASONS = ['mfa_lost', 'login_issue', 'account_issue', 'other'] as const
export type SupportReason = (typeof SUPPORT_REASONS)[number]

/**
 * Soumet une demande de support via l'Edge Function `send-support-request`, qui
 * enregistre la demande (table `support_requests`) et notifie le support par email.
 *
 * - **Connecté / aal1** : l'identité est dérivée du JWT côté serveur — `email` inutile.
 * - **Déconnecté (écran de login)** : passer `email` (contact obligatoire côté serveur).
 *   L'endpoint est public et protégé par un rate-limit par IP.
 */
export async function submitSupportRequest(
  reason: SupportReason,
  email?: string
): Promise<{ ok: boolean }> {
  const body: { reason: SupportReason; email?: string } = { reason }
  if (email) body.email = email
  const { error } = await supabase.functions.invoke('send-support-request', { body })
  return { ok: !error }
}
