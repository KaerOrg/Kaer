import { supabase } from '../lib/supabase'

/**
 * Jeton de version de la config quasi-statique (ETag applicatif).
 *
 * Lit l'unique ligne de `app_config_meta`. Le web praticien injecte ce jeton
 * dans les `queryKey` des queries de config (échelles, `module_content_fields`,
 * `field_props`, psyedu…) : tant que le jeton ne change pas, React Query ne
 * refetche pas ; un re-seed de contenu bump le jeton (voir `supabase/seed.sql`)
 * et invalide le cache, sans redéploiement front. Voir #102 et `docs/services.md`.
 *
 * Fallback `'0'` : si la ligne singleton n'existe pas encore (base fraîchement
 * créée sans seed), on renvoie un jeton neutre stable plutôt que d'échouer.
 */
export async function fetchConfigVersion(): Promise<string> {
  const { data, error } = await supabase
    .from('app_config_meta')
    .select('config_version')
    .maybeSingle()
  if (error) throw error
  return data?.config_version ?? '0'
}
