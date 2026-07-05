import { queryOptions } from '@tanstack/react-query'
import { fetchConfigVersion } from '@services/configVersionService'

// Jeton de version de la config (ETag applicatif). C'est le SEUL référentiel
// qu'on autorise à se revalider souvent — il ne pèse qu'une string — car c'est
// lui qui décide si le reste de la config (échelles, `field_props`, psyedu…)
// doit refetcher. `staleTime` court + `refetchOnWindowFocus` : au retour d'onglet
// on revérifie le jeton ; s'il a changé, les queries de config qui l'incluent
// dans leur `queryKey` se rechargent automatiquement. Voir #102.
export const configVersionQueries = {
  // `enabled` : la lecture est gardée par la RLS `auth.uid() is not null` — inutile
  // (et sans effet) de la lancer avant l'authentification (page login). L'appelant
  // passe l'état authentifié.
  current: (enabled = true) =>
    queryOptions({
      queryKey: ['configVersion'],
      queryFn: fetchConfigVersion,
      enabled,
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    }),
}
