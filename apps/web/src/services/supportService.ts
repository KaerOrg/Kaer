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
 * L'identité du praticien est dérivée du JWT côté serveur (valable même en aal1,
 * avant le challenge MFA) — le client n'envoie que le motif.
 */
export async function submitSupportRequest(reason: SupportReason): Promise<{ ok: boolean }> {
  const { error } = await supabase.functions.invoke('send-support-request', {
    body: { reason },
  })
  return { ok: !error }
}
