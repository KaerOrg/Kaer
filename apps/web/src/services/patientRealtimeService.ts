import { supabase } from '../lib/supabase'

/**
 * Ce qu'un changement de `patient_entries` fait savoir : sa NATURE, jamais son contenu.
 *
 * ⚠️ `payload` n'est volontairement pas exposé, et ne doit pas l'être. Un abonné qui
 * lirait les réponses pour décider d'afficher quelque chose franchirait la ligne du
 * statut non-dispositif médical (#423). Le déclencheur est l'arrivée d'une saisie, quel
 * qu'en soit le contenu.
 */
export interface PatientEntryChange {
  readonly eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  /** `entry_kind` de la ligne (ex. `scale_entry`), ou `null` si l'événement ne le porte pas. */
  readonly entryKind: string | null
  /** Module concerné, pour router un signal vers le bon écran. */
  readonly moduleId: string | null
}

/** Callback appelé à chaque changement de patient_entries du patient abonné. */
export type PatientEntryChangeHandler = (change: PatientEntryChange) => void

/** Ligne telle que Postgres Changes la transporte. Seuls ces champs sont lus. */
interface EntryRow {
  entry_kind?: unknown
  module_id?: unknown
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}

/**
 * Réduit l'événement à sa nature. `new` porte la ligne sur INSERT/UPDATE, `old` sur
 * DELETE (grâce à `replica identity full`).
 */
function toChange(
  eventType: PatientEntryChange['eventType'],
  row: EntryRow | undefined,
): PatientEntryChange {
  return {
    eventType,
    entryKind: readString(row?.entry_kind),
    moduleId: readString(row?.module_id),
  }
}

/**
 * S'abonne en temps réel aux changements de `patient_entries` d'un patient
 * (INSERT / UPDATE / DELETE), filtrés côté serveur par `patient_id`.
 *
 * Supabase Realtime (Postgres Changes) **respecte la RLS** : la policy
 * `patient_entries_practitioner_select` garantit qu'un praticien ne reçoit que les
 * entrées de ses patients consentants — aucun élargissement d'accès (cf. #103).
 *
 * Le contenu de la saisie est **écarté ici**, à la frontière : l'abonné ne reçoit que
 * la nature du changement (`PatientEntryChange`). On ne fait que **signaler**, le hook
 * invalide alors les queries concernées, qui refetchent la donnée brute. Conforme MDR :
 * on ne conclut rien, on rafraîchit un affichage.
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
      payload => {
        const eventType = payload.eventType as PatientEntryChange['eventType']
        const row = (eventType === 'DELETE' ? payload.old : payload.new) as EntryRow | undefined
        onChange(toChange(eventType, row))
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
