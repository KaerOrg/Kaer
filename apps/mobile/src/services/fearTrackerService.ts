import {
  saveFearEntry as dbSaveFearEntry,
  deleteFearEntry as dbDeleteFearEntry,
  saveFearSituation as dbSaveFearSituation,
  deleteFearSituation as dbDeleteFearSituation,
  type FearEntry,
  type FearSituation,
} from '../lib/database'
import { syncUpsert, syncDelete } from './syncHelpers'

export type { FearEntry, FearSituation }

export async function saveFearEntry(entry: Omit<FearEntry, 'created_at'>): Promise<void> {
  await syncUpsert(() => dbSaveFearEntry(entry), {
    local_id: entry.id,
    module_id: 'fear_thermometer',
    entry_kind: 'fear_entry',
    payload: {
      date: entry.date,
      situation_id: entry.situation_id,
      situation_label: entry.situation_label,
      suds_before: entry.suds_before,
      suds_peak: entry.suds_peak,
      strategies: entry.strategies,
      custom_strategy: entry.custom_strategy,
      suds_after: entry.suds_after,
      expectation_text: entry.expectation_text,
      outcome_text: entry.outcome_text,
      notes: entry.notes,
    },
  })
}

export async function deleteFearEntry(id: string): Promise<void> {
  await syncDelete(() => dbDeleteFearEntry(id), id, 'fear_thermometer', 'fear_entry')
}

export async function saveFearSituation(situation: Omit<FearSituation, 'created_at'>): Promise<void> {
  await syncUpsert(() => dbSaveFearSituation(situation), {
    local_id: situation.id,
    module_id: 'fear_thermometer',
    entry_kind: 'fear_situation',
    payload: {
      label: situation.label,
      hierarchy_id: situation.hierarchy_id,
      target_suds: situation.target_suds,
      is_done: situation.is_done,
    },
  })
}

export async function deleteFearSituation(id: string): Promise<void> {
  await syncDelete(() => dbDeleteFearSituation(id), id, 'fear_thermometer', 'fear_situation')
}
