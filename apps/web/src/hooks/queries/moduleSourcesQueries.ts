import { queryOptions } from '@tanstack/react-query'
import { fetchSourcesByModule } from '@services/moduleSourcesService'
import { CONFIG_QUERY_OPTIONS } from './configCache'

// Sources scientifiques d'un module (module_sources). Quasi-statique par module
// → cache infini + invalidation par jeton de version.
export const moduleSourcesQueries = {
  byModule: (moduleId: string) =>
    queryOptions({
      queryKey: ['moduleSources', 'byModule', moduleId],
      queryFn: () => fetchSourcesByModule(moduleId),
      ...CONFIG_QUERY_OPTIONS,
    }),
}
