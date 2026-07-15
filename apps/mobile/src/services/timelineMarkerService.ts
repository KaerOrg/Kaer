import {
  getAllTimelineMarkers as dbGetAll,
  saveTimelineMarker as dbSave,
  deleteTimelineMarker as dbDelete,
  type TimelineMarker,
} from '../lib/database'
import { syncUpsert, syncDelete } from './syncHelpers'

export type { TimelineMarker }

// ─── Repères temporels (Life Chart) — écriture SQLite + synchronisation ──────
//
// Repères datés et TYPÉS (traitement / événement de vie / autre) posés par le
// patient sur les courbes d'un module « tracker multi-dimensions » (mood_tracker,
// medication_side_effects…). Le web praticien (#164) réutilise ces repères.
//
// Conformité règle sync-service : toute écriture/suppression passe par
// syncUpsert / syncDelete (jamais dbSave seul). Le module_id porté par l'outbox
// dérive du `scale_id` du repère, pour cloisonner côté serveur.

/** Repères d'un module (lecture seule — pas de sync en lecture). */
export async function getAllTimelineMarkers(scaleId: string): Promise<TimelineMarker[]> {
  return dbGetAll(scaleId)
}

/** Crée/met à jour un repère localement puis l'enfile pour synchronisation. */
export async function saveTimelineMarker(marker: TimelineMarker): Promise<void> {
  await syncUpsert(() => dbSave(marker), {
    local_id: marker.id,
    module_id: marker.scale_id,
    entry_kind: 'mood_marker',
    payload: {
      scale_id: marker.scale_id,
      date: marker.date,
      label: marker.label,
      type: marker.type,
      created_at: marker.created_at,
    },
  })
}

/** Supprime un repère localement puis enfile la suppression distante. */
export async function deleteTimelineMarker(id: string, scaleId: string): Promise<void> {
  await syncDelete(() => dbDelete(id), id, scaleId, 'mood_marker')
}
