import { supabase } from '../lib/supabase'

/** Longueur max d'une suggestion de thème (alignée sur l'Edge Function). */
export const THEME_SUGGESTION_MAX = 1000

/**
 * Soumet une suggestion de fiche psychoéducation via l'Edge Function
 * `send-theme-suggestion`, qui enregistre la demande (table `theme_suggestions`)
 * et notifie l'équipe éditoriale par email. Réservé aux praticiens connectés
 * (identité dérivée du JWT côté serveur).
 */
export async function submitThemeSuggestion(suggestion: string): Promise<{ ok: boolean }> {
  const { error } = await supabase.functions.invoke('send-theme-suggestion', {
    body: { suggestion },
  })
  return { ok: !error }
}
