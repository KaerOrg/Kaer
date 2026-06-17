import {
  saveMedicationIntake as dbSave,
  deleteMedicationIntake as dbDelete,
  getMedicationIntakes,
  type MedicationIntake,
} from '../lib/database'
import { syncUpsert, syncDelete } from './syncHelpers'

export type { MedicationIntake }
export { getMedicationIntakes }

// Détail optionnel par molécule du suivi d'observance. Écriture locale SQLite +
// synchronisation outbox (cf. .claude/rules/sync-service.md). Statut et motif sont
// des faits déclarés bruts — aucune interprétation (MDR 2017/745).
export async function saveMedicationIntake(entry: Omit<MedicationIntake, 'created_at'>): Promise<void> {
  await syncUpsert(() => dbSave(entry), {
    local_id: entry.id,
    module_id: entry.module_id,
    entry_kind: 'medication_intake',
    payload: {
      module_id: entry.module_id,
      date: entry.date,
      medication_id: entry.medication_id,
      status: entry.status,
      reason: entry.reason,
    },
  })
}

export async function deleteMedicationIntake(id: string, moduleId = ''): Promise<void> {
  await syncDelete(() => dbDelete(id), id, moduleId, 'medication_intake')
}
