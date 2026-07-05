
import { useQuery } from '@tanstack/react-query'
import { configVersionQueries } from './queries/configVersionQueries'

/**
 * Jeton de version de la config, prêt à être injecté dans les `queryKey` des
 * queries de config (#99). Renvoie `undefined` tant que le premier chargement
 * n'a pas abouti — l'appelant compose alors une clé neutre le temps du fetch,
 * puis la clé se stabilise dès que le jeton est disponible.
 *
 * `enabled` (défaut `true`) permet de différer la lecture tant que l'utilisateur
 * n'est pas authentifié (la RLS la refuserait de toute façon).
 */
export function useConfigVersion(enabled = true): string | undefined {
  return useQuery(configVersionQueries.current(enabled)).data
}
