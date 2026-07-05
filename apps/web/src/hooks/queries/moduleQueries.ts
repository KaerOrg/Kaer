import { queryOptions } from '@tanstack/react-query'
import { fetchModuleFields } from '@services/moduleService'
import { CONFIG_QUERY_OPTIONS } from './configCache'

// Config de rendu d'un module (module_content_fields + field_props). Quasi-statique
// → cache infini, invalidé par le jeton de version (cf. CONFIG_QUERY_OPTIONS).
export const moduleQueries = {
  fields: (moduleType: string) =>
    queryOptions({
      queryKey: ['module', 'fields', moduleType],
      queryFn: () => fetchModuleFields(moduleType),
      ...CONFIG_QUERY_OPTIONS,
    }),
}
