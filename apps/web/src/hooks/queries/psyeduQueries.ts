import { queryOptions } from '@tanstack/react-query'
import {
  fetchLibraryTopics,
  fetchThemes,
  fetchTopicsByModule,
  fetchBlocksByTopic,
} from '@services/psyeduService'
import { CONFIG_QUERY_OPTIONS } from './configCache'

// Factories `queryOptions` du contenu psychoéducatif (psyedu_topics/themes/blocks).
// Contenu quasi-statique (change au re-seed) → cache infini + invalidation par jeton
// de version (cf. CONFIG_QUERY_OPTIONS).
export const psyeduQueries = {
  // Bibliothèque complète (fiches à thème) + thèmes — partagés par l'armoire patient
  // (onglet Modules) et la bibliothèque praticien.
  libraryTopics: () =>
    queryOptions({
      queryKey: ['psyedu', 'libraryTopics'],
      queryFn: fetchLibraryTopics,
      ...CONFIG_QUERY_OPTIONS,
    }),

  themes: () =>
    queryOptions({
      queryKey: ['psyedu', 'themes'],
      queryFn: fetchThemes,
      ...CONFIG_QUERY_OPTIONS,
    }),

  // Fiches d'un module précis (filtrées par module_key).
  topicsByModule: (moduleKey: string) =>
    queryOptions({
      queryKey: ['psyedu', 'topicsByModule', moduleKey],
      queryFn: () => fetchTopicsByModule(moduleKey),
      enabled: !!moduleKey,
      ...CONFIG_QUERY_OPTIONS,
    }),

  // Blocs de contenu d'une fiche (chargés à l'ouverture d'un topic).
  blocksByTopic: (topicId: string) =>
    queryOptions({
      queryKey: ['psyedu', 'blocksByTopic', topicId],
      queryFn: () => fetchBlocksByTopic(topicId),
      ...CONFIG_QUERY_OPTIONS,
    }),
}
