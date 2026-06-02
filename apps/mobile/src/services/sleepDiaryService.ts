import {
  saveSleepEntry as dbSave,
  deleteSleepEntry as dbDelete,
  type SleepEntry,
} from '../lib/database'
import { syncUpsert, syncDelete } from './syncHelpers'

export type { SleepEntry }

export async function saveSleepEntry(entry: Omit<SleepEntry, 'created_at'>): Promise<void> {
  await syncUpsert(() => dbSave(entry), {
    local_id: entry.id,
    module_id: 'sleep_diary',
    entry_kind: 'sleep_diary_entry',
    payload: {
      date: entry.date,
      bedtime: entry.bedtime,
      wake_time: entry.wake_time,
      sleep_onset_minutes: entry.sleep_onset_minutes,
      awakenings: entry.awakenings,
      awakenings_duration_minutes: entry.awakenings_duration_minutes,
      quality: entry.quality,
      nightmares: entry.nightmares,
      notes: entry.notes,
    },
  })
}

export async function deleteSleepEntry(id: string): Promise<void> {
  await syncDelete(() => dbDelete(id), id, 'sleep_diary', 'sleep_diary_entry')
}
