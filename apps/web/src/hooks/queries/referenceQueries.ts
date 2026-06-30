import { queryOptions } from '@tanstack/react-query'
import { fetchProfessionalTitles } from '@services/authService'

// Factories `queryOptions` des données de référence globales (sans paramètre,
// rarement modifiées). Mutualisables entre plusieurs écrans.
export const referenceQueries = {
  professionalTitles: () =>
    queryOptions({
      queryKey: ['reference', 'professionalTitles'],
      queryFn: fetchProfessionalTitles,
      staleTime: 60 * 60_000, // référentiel quasi statique → 1 h
    }),
}
