import { supabase } from '../lib/supabase'

/**
 * Accusés de lecture des passations, côté patient (#419, QW-2).
 *
 * Ce que le patient voit : « Vu par votre soignant le 29 juillet ». C'est le seul
 * retour humain que l'app lui rend, et la littérature soutient que c'est **ça** le
 * levier de rétention, pas la donnée qu'il produit.
 *
 * **Lecture seule, jamais de `syncUpsert`.** L'exception à la règle de synchronisation
 * mobile est ici structurelle : cette donnée n'est pas produite par le patient et ne
 * peut pas l'être. Elle est posée par le praticien via un RPC, et la base rejette toute
 * écriture venant du patient. Il n'y a donc rien à mettre en file de sortie, et rien à
 * stocker en SQLite : une date d'ouverture hors ligne n'aurait aucun sens (elle n'existe
 * que parce que quelqu'un a ouvert la passation sur le serveur).
 *
 * Un échec de lecture retombe sur une carte vide, jamais sur un état inventé : si l'on
 * ne sait pas, on n'affiche rien. Mieux vaut un silence qu'une fausse promesse.
 */

/** Accusés d'une échelle, indexés par l'identifiant local de la passation. */
export type ReadReceiptsByEntry = ReadonlyMap<string, string>

/** Ligne lue : l'identifiant local de la passation et sa date d'ouverture. */
interface ReceiptRow {
  local_id: string
  practitioner_read_at: string | null
}

/**
 * Dates de première ouverture des passations d'une échelle, pour le patient connecté.
 *
 * La RLS de `patient_entries` restreint déjà la lecture aux lignes du patient : aucune
 * autre passation que les siennes n'est atteignable, quel que soit l'argument passé.
 *
 * Les passations jamais ouvertes ne figurent PAS dans la map. Absence = aucun accusé,
 * ce qui est un état normal et non une donnée manquante : côté écran, rien ne s'affiche.
 */
export async function fetchScaleReadReceipts(scaleId: string): Promise<ReadReceiptsByEntry> {
  const { data, error } = await supabase
    .from('patient_entries')
    .select('local_id, practitioner_read_at')
    .eq('entry_kind', 'scale_entry')
    .eq('module_id', scaleId)
    .not('practitioner_read_at', 'is', null)

  if (error || !data) return new Map()

  const receipts = new Map<string, string>()
  for (const row of data as ReceiptRow[]) {
    if (row.practitioner_read_at != null) receipts.set(row.local_id, row.practitioner_read_at)
  }
  return receipts
}
