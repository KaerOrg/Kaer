import {
  saveTreeSelection as dbSave,
  deleteTreeSelection as dbDelete,
  type TreeSelection,
} from '../lib/database'
import { syncUpsert, syncDelete } from './syncHelpers'

export type { TreeSelection }

export async function saveTreeSelection(entry: Omit<TreeSelection, 'created_at'>): Promise<void> {
  await syncUpsert(() => dbSave(entry), {
    local_id: entry.id,
    module_id: entry.module_id,
    entry_kind: 'tree_selection',
    payload: {
      module_id: entry.module_id,
      selected_id: entry.selected_id,
      selected_label: entry.selected_label,
      path: entry.path,
      intensity: entry.intensity,
      notes: entry.notes,
      context: entry.context,
    },
  })
}

export async function deleteTreeSelection(id: string, moduleId = ''): Promise<void> {
  await syncDelete(() => dbDelete(id), id, moduleId, 'tree_selection')
}
