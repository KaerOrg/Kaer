import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchModuleCategories, fetchComingSoonModuleIds } from '@services/moduleCatalogService'
import { fetchEnabledModules, saveEnabledModules } from '@services/practitionerSettingsService'
import { fetchModulePreviewKind } from '@services/moduleService'
import { CONFIG_QUERY_OPTIONS } from './configCache'
import type { ModuleType } from '../../lib/database.types'

// Factories `queryOptions` du catalogue de modules + réglages praticien.
// `categories`, `comingSoonIds` et `previewKind` sont des référentiels de config
// quasi-statiques (cache infini + invalidation par jeton) ; `enabledModules` dépend
// du praticien et s'invalide sur écriture (cf. useSaveEnabledModules), pas via le jeton.
export const catalogQueries = {
  categories: () =>
    queryOptions({
      queryKey: ['catalog', 'categories'],
      queryFn: fetchModuleCategories,
      ...CONFIG_QUERY_OPTIONS,
    }),

  comingSoonIds: () =>
    queryOptions({
      queryKey: ['catalog', 'comingSoonIds'],
      queryFn: fetchComingSoonModuleIds,
      ...CONFIG_QUERY_OPTIONS,
    }),

  previewKind: (moduleType: string | undefined) =>
    queryOptions({
      queryKey: ['catalog', 'previewKind', moduleType ?? ''],
      queryFn: () => fetchModulePreviewKind(moduleType!),
      enabled: moduleType != null,
      ...CONFIG_QUERY_OPTIONS,
    }),

  enabledModules: (practitionerId: string | undefined) =>
    queryOptions({
      queryKey: ['catalog', 'enabledModules', practitionerId ?? ''],
      queryFn: () => fetchEnabledModules(practitionerId!),
      enabled: practitionerId != null,
    }),
}

// Persistance des modules activés par le praticien. Invalide la query
// `enabledModules` au succès pour garder le cache aligné.
export function useSaveEnabledModules() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ practitionerId, enabled }: { practitionerId: string; enabled: Set<ModuleType> }) =>
      saveEnabledModules(practitionerId, enabled),
    onSuccess: (result, { practitionerId }) => {
      if (result.ok) {
        queryClient.invalidateQueries({
          queryKey: catalogQueries.enabledModules(practitionerId).queryKey,
        })
      }
    },
  })
}
