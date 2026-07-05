import { queryOptions } from '@tanstack/react-query'
import { fetchCaseload } from '@services/caseloadService'

// File active (« Mes suivis ») d'un praticien : dossiers + actions + relances.
// Donnée volatile éditée en continu → `staleTime` par défaut. Les écritures mettent
// à jour le cache de façon optimiste (`setQueryData`) et invalident cette clé en cas
// d'erreur pour resynchroniser. `includeArchived` : la vue gère elle-même le filtre.
export const caseloadQueries = {
  rows: (practitionerId: string | undefined) =>
    queryOptions({
      queryKey: ['caseload', 'rows', practitionerId ?? ''],
      queryFn: () => fetchCaseload(practitionerId!, { includeArchived: true }),
      enabled: !!practitionerId,
    }),
}
