import { queryOptions } from '@tanstack/react-query'
import { fetchProfessionalTitles } from '@services/authService'
import { CONFIG_QUERY_OPTIONS } from './configCache'

// Factories `queryOptions` des données de référence globales (sans paramètre,
// seedées, rarement modifiées). Config quasi-statique → cache infini + invalidation
// par jeton de version (cf. CONFIG_QUERY_OPTIONS).
export const referenceQueries = {
  professionalTitles: () =>
    queryOptions({
      queryKey: ['reference', 'professionalTitles'],
      queryFn: fetchProfessionalTitles,
      ...CONFIG_QUERY_OPTIONS,
    }),
}
