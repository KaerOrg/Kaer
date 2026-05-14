import { getDb } from '../lib/database'
import type { EMRuler, EMBalanceItem, EMValue } from '../lib/database'

// ─── EM Rulers (données par séance) ──────────────────────────────────────────

export async function saveEMRuler(
  ruler: Omit<EMRuler, 'created_at'>
): Promise<void> {
  const db = getDb()
  await db.runAsync(
    `INSERT OR REPLACE INTO em_rulers
       (id, behavior_target, stage, importance_score, importance_why,
        confidence_score, confidence_why, commitment_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ruler.id,
      ruler.behavior_target,
      ruler.stage,
      ruler.importance_score,
      ruler.importance_why,
      ruler.confidence_score,
      ruler.confidence_why,
      ruler.commitment_text,
    ]
  )
}

export async function listEMRulers(limit = 30): Promise<EMRuler[]> {
  const db = getDb()
  return db.getAllAsync<EMRuler>(
    'SELECT * FROM em_rulers ORDER BY created_at DESC LIMIT ?',
    [limit]
  )
}

export async function deleteEMRuler(id: string): Promise<void> {
  const db = getDb()
  await db.runAsync('DELETE FROM em_rulers WHERE id = ?', [id])
}

// ─── EM Balance Items ─────────────────────────────────────────────────────────

export async function saveEMBalanceItem(
  item: Omit<EMBalanceItem, 'created_at'>
): Promise<void> {
  const db = getDb()
  await db.runAsync(
    `INSERT OR REPLACE INTO em_balance_items
       (id, behavior_target, side, text, weight, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [item.id, item.behavior_target, item.side, item.text, item.weight, item.sort_order]
  )
}

export async function listEMBalanceItems(): Promise<EMBalanceItem[]> {
  const db = getDb()
  const rows = await db.getAllAsync<EMBalanceItem & { side: string }>(
    'SELECT * FROM em_balance_items ORDER BY side ASC, sort_order ASC, created_at ASC'
  )
  return rows.map(r => ({ ...r, side: r.side as 'for' | 'against' }))
}

export async function deleteEMBalanceItem(id: string): Promise<void> {
  const db = getDb()
  await db.runAsync('DELETE FROM em_balance_items WHERE id = ?', [id])
}

// ─── EM Values (valeurs sélectionnées) ───────────────────────────────────────

export async function saveEMValues(valueKeys: string[]): Promise<void> {
  const db = getDb()
  await db.execAsync('DELETE FROM em_values')
  for (let i = 0; i < valueKeys.length; i++) {
    await db.runAsync(
      `INSERT INTO em_values (id, value_key, sort_order)
       VALUES (?, ?, ?)`,
      [`val_${valueKeys[i]}`, valueKeys[i], i]
    )
  }
}

export async function listEMValues(): Promise<EMValue[]> {
  const db = getDb()
  return db.getAllAsync<EMValue>(
    'SELECT * FROM em_values ORDER BY sort_order ASC'
  )
}
