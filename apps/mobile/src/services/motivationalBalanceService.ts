import { getDb } from '../lib/database'
import type { EMRuler, EMBalanceItem, EMValue } from '../lib/database'
import { syncUpsert, syncDelete } from './syncHelpers'

// ─── EM Rulers (données par séance) ──────────────────────────────────────────

export async function saveEMRuler(ruler: Omit<EMRuler, 'created_at'>): Promise<void> {
  await syncUpsert(
    () => getDb().runAsync(
      `INSERT OR REPLACE INTO em_rulers
         (id, behavior_target, stage, importance_score, importance_why,
          confidence_score, confidence_why, commitment_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ruler.id, ruler.behavior_target, ruler.stage,
        ruler.importance_score, ruler.importance_why,
        ruler.confidence_score, ruler.confidence_why, ruler.commitment_text,
      ]
    ),
    {
      local_id: ruler.id,
      module_id: 'motivational_balance',
      entry_kind: 'em_ruler',
      payload: {
        behavior_target: ruler.behavior_target,
        stage: ruler.stage,
        importance_score: ruler.importance_score,
        importance_why: ruler.importance_why,
        confidence_score: ruler.confidence_score,
        confidence_why: ruler.confidence_why,
        commitment_text: ruler.commitment_text,
      },
    }
  )
}

export async function listEMRulers(limit = 30): Promise<EMRuler[]> {
  return getDb().getAllAsync<EMRuler>(
    'SELECT * FROM em_rulers ORDER BY created_at DESC LIMIT ?',
    [limit]
  )
}

export async function deleteEMRuler(id: string): Promise<void> {
  await syncDelete(
    () => getDb().runAsync('DELETE FROM em_rulers WHERE id = ?', [id]),
    id, 'motivational_balance', 'em_ruler'
  )
}

// ─── EM Balance Items ─────────────────────────────────────────────────────────

export async function saveEMBalanceItem(item: Omit<EMBalanceItem, 'created_at'>): Promise<void> {
  await syncUpsert(
    () => getDb().runAsync(
      `INSERT OR REPLACE INTO em_balance_items
         (id, behavior_target, side, text, weight, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [item.id, item.behavior_target, item.side, item.text, item.weight, item.sort_order]
    ),
    {
      local_id: item.id,
      module_id: 'motivational_balance',
      entry_kind: 'em_balance_item',
      payload: {
        behavior_target: item.behavior_target,
        side: item.side,
        text: item.text,
        weight: item.weight,
        sort_order: item.sort_order,
      },
    }
  )
}

export async function listEMBalanceItems(): Promise<EMBalanceItem[]> {
  const rows = await getDb().getAllAsync<EMBalanceItem & { side: string }>(
    'SELECT * FROM em_balance_items ORDER BY side ASC, sort_order ASC, created_at ASC'
  )
  return rows.map(r => ({ ...r, side: r.side as 'for' | 'against' }))
}

export async function deleteEMBalanceItem(id: string): Promise<void> {
  await syncDelete(
    () => getDb().runAsync('DELETE FROM em_balance_items WHERE id = ?', [id]),
    id, 'motivational_balance', 'em_balance_item'
  )
}

// ─── EM Values (valeurs sélectionnées) ───────────────────────────────────────
// Sémantique replace-all : la liste complète remplace l'état précédent.
// Encodée comme module_setting unique pour la sync (local_id stable).

export async function saveEMValues(valueKeys: string[]): Promise<void> {
  const db = getDb()
  await syncUpsert(
    async () => {
      await db.execAsync('DELETE FROM em_values')
      for (let i = 0; i < valueKeys.length; i++) {
        await db.runAsync(
          `INSERT INTO em_values (id, value_key, sort_order) VALUES (?, ?, ?)`,
          [`val_${valueKeys[i]}`, valueKeys[i], i]
        )
      }
    },
    {
      local_id: 'motivational_balance:em_values',
      module_id: 'motivational_balance',
      entry_kind: 'module_setting',
      payload: { key: 'em_values', value: valueKeys },
    }
  )
}

export async function listEMValues(): Promise<EMValue[]> {
  return getDb().getAllAsync<EMValue>(
    'SELECT * FROM em_values ORDER BY sort_order ASC'
  )
}
