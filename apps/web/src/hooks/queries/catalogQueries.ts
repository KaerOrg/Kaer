import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchModuleCategories, fetchComingSoonModuleIds } from '../../services/moduleCatalogService'
import { fetchEnabledModules, saveEnabledModules } from '../../services/practitionerSettingsService'
import { fetchPsychoCards, fetchModulePreviewKind } from '../../services/moduleService'
import type { ModuleType } from '../../lib/database.types'

// Factories `queryOptions` du catalogue de modules + réglages praticien.
// `categories` et `comingSoonIds` sont des référentiels (quasi statiques) ;
// `enabledModules` dépend du praticien.
export const catalogQueries = {
  categories: () =>
    queryOptions({
      queryKey: ['catalog', 'categories'],
      queryFn: fetchModuleCategories,
      staleTime: 10 * 60_000,
    }),

  comingSoonIds: () =>
    queryOptions({
      queryKey: ['catalog', 'comingSoonIds'],
      queryFn: fetchComingSoonModuleIds,
      staleTime: 10 * 60_000,
    }),

  psychoCards: () =>
    queryOptions({
      queryKey: ['catalog', 'psychoCards'],
      queryFn: fetchPsychoCards,
      staleTime: 10 * 60_000,
    }),

  previewKind: (moduleType: string | undefined) =>
    queryOptions({
      queryKey: ['catalog', 'previewKind', moduleType ?? ''],
      queryFn: () => fetchModulePreviewKind(moduleType!),
      enabled: moduleType != null,
      staleTime: 10 * 60_000,
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
