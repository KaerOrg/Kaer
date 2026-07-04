import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribePatientEntries } from '@services/patientRealtimeService'
import { engagementQueries } from '../queries'

/**
 * Rafraîchit les données du patient courant quand il saisit sur mobile (issue #103).
 *
 * Le web praticien n'a aucun événement d'écriture pour les saisies venues d'un autre
 * appareil : ce hook s'abonne aux changements de `patient_entries` du patient et, à
 * chaque événement, invalide les queries d'engagement de CE patient → refetch et
 * fraîcheur instantanée. Complète l'invalidation-sur-écriture web de #100.
 *
 * Un seul canal par patient consulté. Le cleanup de l'effet ferme le canal au
 * démontage ET au changement de `patientId` (React exécute le cleanup avant de
 * relancer l'effet) — pas de canaux orphelins.
 *
 * Best-effort : si le socket tombe, `staleTime` + `refetchOnWindowFocus` restent le
 * filet de sécurité.
 */
export function usePatientEntriesRealtime(patientId: string | null | undefined): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!patientId) return
    return subscribePatientEntries(patientId, () => {
      for (const queryKey of engagementQueries.patientDataKeys(patientId)) {
        void queryClient.invalidateQueries({ queryKey })
      }
    })
  }, [patientId, queryClient])
}
