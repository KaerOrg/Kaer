import {
  saveActivityRecord as dbSave,
  deleteActivityRecord as dbDelete,
  type ActivityRecord,
} from '../lib/database'
import { syncUpsert, syncDelete } from './syncHelpers'

export type { ActivityRecord }

export async function saveActivityRecord(record: Omit<ActivityRecord, 'created_at'>): Promise<void> {
  await syncUpsert(() => dbSave(record), {
    local_id: record.id,
    module_id: 'behavioral_activation',
    entry_kind: 'activity_record',
    payload: {
      date: record.date,
      label: record.label,
      expected_pleasure: record.expected_pleasure,
      expected_mastery: record.expected_mastery,
      pleasure: record.pleasure,
      mastery: record.mastery,
      done: record.done,
      notes: record.notes,
      planned_time: record.planned_time,
      domain_id: record.domain_id,
      config_activity_id: record.config_activity_id,
    },
  })
}

export async function deleteActivityRecord(id: string): Promise<void> {
  await syncDelete(() => dbDelete(id), id, 'behavioral_activation', 'activity_record')
}
