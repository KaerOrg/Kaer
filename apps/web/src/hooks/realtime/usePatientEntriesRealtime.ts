import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribePatientEntries, type PatientEntryChange } from '@services/patientRealtimeService'
import { engagementQueries } from '../queries'

/** Signalé quand une PASSATION d'échelle arrive (#423). Jamais son contenu. */
export type ScaleEntryArrival = (moduleId: string | null) => void

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
 *
 * `onScaleEntry` (#423) est appelé **en plus** quand la ligne arrivée est une passation
 * d'échelle. Le déclencheur est l'ARRIVÉE d'une passation, jamais ce qu'elle contient :
 * le service n'expose d'ailleurs pas le payload. Une notification dont le déclenchement
 * dépendrait d'une réponse serait hors limite MDR.
 */
export function usePatientEntriesRealtime(
  patientId: string | null | undefined,
  onScaleEntry?: ScaleEntryArrival,
): void {
  const queryClient = useQueryClient()
  // Ref plutôt que dépendance : un callback recréé au render du parent ne doit pas
  // rouvrir le canal, ce qui perdrait les événements pendant la reconnexion.
  const onScaleEntryRef = useRef(onScaleEntry)
  useEffect(() => { onScaleEntryRef.current = onScaleEntry }, [onScaleEntry])

  useEffect(() => {
    if (!patientId) return
    return subscribePatientEntries(patientId, (change: PatientEntryChange) => {
      for (const queryKey of engagementQueries.patientDataKeys(patientId)) {
        void queryClient.invalidateQueries({ queryKey })
      }
      if (change.eventType === 'INSERT' && change.entryKind === 'scale_entry') {
        onScaleEntryRef.current?.(change.moduleId)
      }
    })
  }, [patientId, queryClient])
}
