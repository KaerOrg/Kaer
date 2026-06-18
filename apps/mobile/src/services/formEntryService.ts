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
  })
}

export async function deleteFormEntry(id: string, moduleId = ''): Promise<void> {
  await syncDelete(() => dbDelete(id), id, moduleId, 'form_entry')
}
