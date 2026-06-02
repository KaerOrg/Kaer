import {
  saveScaleEntry as dbSave,
  deleteScaleEntry as dbDelete,
  type ScaleEntry,
} from '../lib/database'
import { syncUpsert, syncDelete } from './syncHelpers'

export type { ScaleEntry }

export async function saveScaleEntry(entry: ScaleEntry): Promise<void> {
  await syncUpsert(() => dbSave(entry), {
    local_id: entry.id,
    module_id: entry.scale_id,
    entry_kind: 'scale_entry',
    payload: {
      scale_id: entry.scale_id,
      answers: entry.answers,
      total_score: entry.total_score,
      subscale_scores: entry.subscale_scores,
    },
  })
}

export async function deleteScaleEntry(id: string): Promise<void> {
  await syncDelete(() => dbDelete(id), id, 'scale', 'scale_entry')
}
