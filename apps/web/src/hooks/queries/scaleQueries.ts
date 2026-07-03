import { queryOptions } from '@tanstack/react-query'
import { fetchScaleMeta } from '@services/scaleService'
import { CONFIG_QUERY_OPTIONS } from './configCache'

// Métadonnées des échelles cliniques (catégorie, population cible, référence…).
// Référentiel quasi-statique → cache infini + invalidation par jeton de version.
export const scaleQueries = {
  meta: () =>
    queryOptions({
      queryKey: ['scale', 'meta'],
      queryFn: fetchScaleMeta,
      ...CONFIG_QUERY_OPTIONS,
    }),
}
