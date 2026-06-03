import {
  savePlanItem as dbSavePlanItem,
  deletePlanItem as dbDeletePlanItem,
  setModuleSetting as dbSetModuleSetting,
  type PlanItem,
} from '../lib/database'
import { syncUpsert, syncDelete } from './syncHelpers'

export type { PlanItem }

export async function savePlanItem(item: Omit<PlanItem, 'created_at'>): Promise<void> {
  await syncUpsert(() => dbSavePlanItem(item), {
    local_id: item.id,
    module_id: item.module_id,
    entry_kind: 'plan_item',
    payload: {
      module_id: item.module_id,
      section_id: item.section_id,
      text: item.text,
      sort_order: item.sort_order,
      weight: item.weight ?? null,
    },
  })
}

export async function deletePlanItem(id: string, moduleId = ''): Promise<void> {
  await syncDelete(() => dbDeletePlanItem(id), id, moduleId, 'plan_item')
}

// Sync d'un module_setting vers Supabase.
// local_id = "${moduleId}:${key}" pour garantir l'unicité par (module, clé).
export async function setModuleSetting(moduleId: string, key: string, value: string): Promise<void> {
  await syncUpsert(() => dbSetModuleSetting(moduleId, key, value), {
    local_id: `${moduleId}:${key}`,
    module_id: moduleId,
    entry_kind: 'module_setting',
    payload: { key, value },
  })
}
