import { queryOptions } from '@tanstack/react-query'
import { fetchConfigVersion } from '@services/configVersionService'

// Jeton de version de la config (ETag applicatif). C'est le SEUL référentiel
// qu'on autorise à se revalider souvent — il ne pèse qu'une string — car c'est
// lui qui décide si le reste de la config (échelles, `field_props`, psyedu…)
// doit refetcher. `staleTime` court + `refetchOnWindowFocus` : au retour d'onglet
// on revérifie le jeton ; s'il a changé, les queries de config qui l'incluent
// dans leur `queryKey` se rechargent automatiquement. Voir #102.
export const configVersionQueries = {
  current: () =>
    queryOptions({
      queryKey: ['configVersion'],
      queryFn: fetchConfigVersion,
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    }),
}
