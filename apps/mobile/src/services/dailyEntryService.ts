import {
  saveDailyEntry as dbSave,
  deleteDailyEntry as dbDelete,
  type DailyEntry,
} from '../lib/database'
import { syncUpsert, syncDelete } from './syncHelpers'

export type { DailyEntry }

export async function saveDailyEntry(entry: Omit<DailyEntry, 'created_at'>): Promise<void> {
  await syncUpsert(() => dbSave(entry), {
    local_id: entry.id,
    module_id: entry.module_id,
    entry_kind: 'daily_entry',
    payload: {
      module_id: entry.module_id,
      date: entry.date,
      status: entry.status,
      notes: entry.notes,
    },
  })
}

export async function deleteDailyEntry(id: string, moduleId = ''): Promise<void> {
  await syncDelete(() => dbDelete(id), id, moduleId, 'daily_entry')
}
