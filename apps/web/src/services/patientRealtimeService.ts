import { supabase } from '../lib/supabase'

/** Callback appelé à chaque changement de patient_entries du patient abonné. */
export type PatientEntryChangeHandler = () => void

/**
 * S'abonne en temps réel aux changements de `patient_entries` d'un patient
 * (INSERT / UPDATE / DELETE), filtrés côté serveur par `patient_id`.
 *
 * Supabase Realtime (Postgres Changes) **respecte la RLS** : la policy
 * `patient_entries_practitioner_select` garantit qu'un praticien ne reçoit que les
 * entrées de ses patients consentants — aucun élargissement d'accès (cf. #103).
 *
 * Le payload reçu est ignoré : on ne fait que **signaler** un changement (le hook
 * invalide alors les queries concernées, qui refetchent la donnée brute). Conforme
 * MDR : on ne conclut rien, on rafraîchit un affichage.
 *
 * Renvoie la fonction de désabonnement (`removeChannel`). Toute la plomberie
 * Supabase reste ici (règle « zéro supabase hors service »).
 */
export function subscribePatientEntries(
  patientId: string,
  onChange: PatientEntryChangeHandler,
): () => void {
  const channel = supabase
    .channel(`patient_entries:${patientId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'patient_entries', filter: `patient_id=eq.${patientId}` },
      () => onChange(),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
