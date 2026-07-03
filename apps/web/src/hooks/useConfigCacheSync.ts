import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useConfigVersion } from './useConfigVersion'

/**
 * Synchronise le cache de config avec le jeton de version (#102).
 *
 * Les queries de config sont en `staleTime: Infinity` (elles ne re-fetchent jamais
 * d'elles-mêmes) et portent `meta.configScoped`. Ce hook, monté une seule fois près
 * de la racine, observe le jeton `useConfigVersion` : dès qu'il **change** (un re-seed
 * a bumpé la version en base), il invalide EN BLOC toutes les queries `configScoped`
 * → elles refetchent, sans rechargement de page. Tant que le jeton ne bouge pas,
 * aucune invalidation : le cache reste infini.
 *
 * L'invalidation ne se déclenche pas au premier chargement (passage `undefined` →
 * première valeur) : on ne rafraîchit que sur un vrai changement de version.
 *
 * `enabled` (défaut `true`) diffère la lecture du jeton tant que l'utilisateur n'est
 * pas authentifié — inutile d'interroger `app_config_meta` sur la page login.
 */
export function useConfigCacheSync(enabled = true): void {
  const version = useConfigVersion(enabled)
  const queryClient = useQueryClient()
  const previousVersion = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (version === undefined) return
    const previous = previousVersion.current
    previousVersion.current = version
    if (previous !== undefined && previous !== version) {
      queryClient.invalidateQueries({
        predicate: query => query.meta?.configScoped === true,
      })
    }
  }, [version, queryClient])
}
