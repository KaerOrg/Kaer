import { queryOptions } from '@tanstack/react-query'
import { fetchLibraryTopics, fetchThemes } from '../../services/psyeduService'

// Factories `queryOptions` du contenu psychoéducatif : la bibliothèque de fiches
// (`libraryTopics`) et les thèmes (`themes`) sont des référentiels quasi statiques,
// partagés par l'armoire patient (onglet Modules) et la bibliothèque.
export const psyeduQueries = {
  libraryTopics: () =>
    queryOptions({
      queryKey: ['psyedu', 'libraryTopics'],
      queryFn: fetchLibraryTopics,
      staleTime: 10 * 60_000,
    }),

  themes: () =>
    queryOptions({
      queryKey: ['psyedu', 'themes'],
      queryFn: fetchThemes,
      staleTime: 10 * 60_000,
    }),
}
