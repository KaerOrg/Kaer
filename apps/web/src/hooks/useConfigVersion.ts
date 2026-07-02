
import { useQuery } from '@tanstack/react-query'
import { configVersionQueries } from './queries/configVersionQueries'

/**
 * Jeton de version de la config, prêt à être injecté dans les `queryKey` des
 * queries de config (#99). Renvoie `undefined` tant que le premier chargement
 * n'a pas abouti — l'appelant compose alors une clé neutre le temps du fetch,
 * puis la clé se stabilise dès que le jeton est disponible.
 */
export function useConfigVersion(): string | undefined {
  return useQuery(configVersionQueries.current()).data
}
