import {
  saveCustomChip as dbSave,
  getCustomChips as dbGetAll,
  deleteCustomChip as dbDelete,
  type CustomChip,
} from '../lib/database'
import { syncUpsert, syncDelete } from './syncHelpers'

export type { CustomChip }

/**
 * Chips personnelles créées par le patient via « + Autre… » (craving_journal #204),
 * réutilisables par groupe (lieu, émotion, stratégie…). Le code stocké dans les
 * saisies est `custom:<label>` ; cette table restitue le libellé, synchronisée pour
 * que le web (#209) l'affiche derrière le code.
 */
export async function fetchCustomChips(moduleId: string, groupKey?: string): Promise<CustomChip[]> {
  return dbGetAll(moduleId, groupKey)
}

/** Écrit la chip en SQLite puis l'enfile vers Supabase (cf. sync-service.md). */
export async function saveCustomChip(chip: Omit<CustomChip, 'created_at'>): Promise<void> {
  await syncUpsert(() => dbSave(chip), {
    local_id: chip.id,
    module_id: chip.module_id,
    entry_kind: 'custom_chip',
    payload: { group_key: chip.group_key, label: chip.label },
  })
}

/** Supprime la chip en SQLite puis enfile la suppression vers Supabase. */
export async function removeCustomChip(id: string, moduleId: string): Promise<void> {
  await syncDelete(() => dbDelete(id), id, moduleId, 'custom_chip')
}
