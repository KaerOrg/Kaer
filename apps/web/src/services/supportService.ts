import { supabase } from '../lib/supabase'

/**
 * Motifs de demande de support — liste fermée d'**accès bloqué**, bornée au maximum.
 * Les trois premiers motifs sont **auto-suffisants** (le motif + l'email = contexte
 * actionnable, aucune saisie libre). `other` est le cas fourre-tout qui, lui, exige
 * une description libre (cf. `reasonRequiresDescription`). Doit rester synchronisée
 * avec le CHECK de `support_requests.reason` et l'Edge Function `send-support-request`.
 */
export const SUPPORT_REASONS = ['mfa_lost', 'password_forgotten', 'account_locked', 'other'] as const
export type SupportReason = (typeof SUPPORT_REASONS)[number]

/** Motifs « fourre-tout » où le motif seul ne suffit pas → description libre requise. */
const REASONS_REQUIRING_DESCRIPTION: ReadonlySet<SupportReason> = new Set<SupportReason>(['other'])

export function reasonRequiresDescription(reason: SupportReason): boolean {
  return REASONS_REQUIRING_DESCRIPTION.has(reason)
}

/** Longueur max de la description libre (cas `other`). */
export const SUPPORT_DESCRIPTION_MAX = 500

export interface SupportRequestOptions {
  /** Email de contact — requis côté serveur si non authentifié (écran de login). */
  email?: string
  /** Description libre — requise uniquement pour les motifs `reasonRequiresDescription`. */
  description?: string
}

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
  options: SupportRequestOptions = {}
): Promise<{ ok: boolean }> {
  const body: { reason: SupportReason; email?: string; description?: string } = { reason }
  if (options.email) body.email = options.email
  if (options.description) body.description = options.description
  const { error } = await supabase.functions.invoke('send-support-request', { body })
  return { ok: !error }
}
