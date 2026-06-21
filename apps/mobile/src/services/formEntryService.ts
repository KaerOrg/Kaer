import {
  saveFormEntry as dbSave,
  deleteFormEntry as dbDelete,
  type FormEntry,
} from '../lib/database'
import { syncUpsert, syncDelete } from './syncHelpers'

export type { FormEntry }

export async function saveFormEntry(
  entry: Omit<FormEntry, 'created_at'> & { created_at?: string },
): Promise<void> {
  await syncUpsert(() => dbSave(entry), {
    local_id: entry.id,
    module_id: entry.module_id,
    entry_kind: 'form_entry',
    payload: { module_id: entry.module_id, values: entry.values },
    // Saisie rétroactive : la date choisie par le patient porte le jour concerné
    // côté serveur (la vue praticien lit `client_created_at`). Sinon = instant sync.
    ...(entry.created_at ? { client_created_at: entry.created_at } : {}),
  })
}

export async function deleteFormEntry(id: string, moduleId = ''): Promise<void> {
  await syncDelete(() => dbDelete(id), id, moduleId, 'form_entry')
}
