import {
  getAllMoodMarkers as dbGetAll,
  saveMoodMarker as dbSave,
  deleteMoodMarker as dbDelete,
  type MoodMarker,
} from '../lib/database'
import { syncUpsert, syncDelete } from './syncHelpers'

export type { MoodMarker }

// Les repères temporels (Life Chart) sont attachés au module mood_tracker.
const MODULE_ID = 'mood_tracker'

/**
 * Repères temporels saisis par le patient (« début lithium », « arrêt de
 * travail »…). Lecture seule — pas de sync en lecture.
 */
export async function getAllMoodMarkers(): Promise<MoodMarker[]> {
  return dbGetAll()
}

/** Crée/met à jour un repère localement puis l'enfile pour synchronisation. */
export async function saveMoodMarker(marker: MoodMarker): Promise<void> {
  await syncUpsert(() => dbSave(marker), {
    local_id: marker.id,
    module_id: MODULE_ID,
    entry_kind: 'mood_marker',
    payload: {
      date: marker.date,
      label: marker.label,
      created_at: marker.created_at,
    },
  })
}

/** Supprime un repère localement puis enfile la suppression distante. */
export async function deleteMoodMarker(id: string): Promise<void> {
  await syncDelete(() => dbDelete(id), id, MODULE_ID, 'mood_marker')
}
