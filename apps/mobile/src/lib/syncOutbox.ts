import type * as ExpoSQLite from 'expo-sqlite'

// ── Types publics ──────────────────────────────────────────────────────────

export type SyncOperation = 'upsert' | 'delete'

export type EntryKind =
  | 'scale_entry'
  | 'sleep_diary_entry'
  | 'form_entry'
  | 'daily_entry'
  | 'tree_selection'
  | 'plan_item'
  | 'activity_record'
  | 'fear_entry'
  | 'fear_situation'
  | 'exposure_hierarchy'
  | 'breathing_session'
  | 'cognitive_saturation_session'
  | 'crisis_anchor'
  | 'em_ruler'
  | 'em_balance_item'
  | 'em_value'
  | 'module_setting'
  | 'mood_marker'

export interface OutboxItem {
  id: string
  local_id: string
  module_id: string
  entry_kind: EntryKind
  operation: SyncOperation
  payload: Record<string, unknown>
  client_created_at: string
  attempts: number
  last_error: string | null
  created_at: string
}

export interface EnqueueParams {
  local_id: string
  module_id: string
  entry_kind: EntryKind
  operation: SyncOperation
  payload: Record<string, unknown>
  client_created_at: string
}

export const MAX_RETRY_ATTEMPTS = 5

// ── SyncOutboxStore ────────────────────────────────────────────────────────
// File d'attente SQLite pour les données à synchroniser vers Supabase.
// Pattern outbox : chaque écriture patient est d'abord persistée localement,
// puis drainée vers le serveur par RemoteSyncService quand le réseau est dispo.

export class SyncOutboxStore {
  constructor(private readonly db: ExpoSQLite.SQLiteDatabase) {}

  async init(): Promise<void> {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_outbox (
        id                TEXT PRIMARY KEY,
        local_id          TEXT NOT NULL,
        module_id         TEXT NOT NULL,
        entry_kind        TEXT NOT NULL,
        operation         TEXT NOT NULL DEFAULT 'upsert',
        payload           TEXT NOT NULL DEFAULT '{}',
        client_created_at TEXT NOT NULL,
        attempts          INTEGER NOT NULL DEFAULT 0,
        last_error        TEXT,
        created_at        TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(local_id)
      );
      CREATE INDEX IF NOT EXISTS idx_sync_outbox_pending
        ON sync_outbox(attempts, created_at);
    `)
  }

  // Enfile une opération. Si un upsert est déjà en attente pour ce local_id
  // et qu'on enqueue un delete, l'upsert est annulé (l'item n'a jamais existé
  // côté serveur — inutile de l'y créer pour le supprimer aussitôt).
  async enqueue(params: EnqueueParams): Promise<void> {
    if (params.operation === 'delete') {
      await this.db.runAsync('DELETE FROM sync_outbox WHERE local_id = ?', [params.local_id])
    }
    await this.db.runAsync(
      `INSERT OR REPLACE INTO sync_outbox
         (id, local_id, module_id, entry_kind, operation, payload, client_created_at, attempts, last_error)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL)`,
      [
        generateId(),
        params.local_id,
        params.module_id,
        params.entry_kind,
        params.operation,
        JSON.stringify(params.payload),
        params.client_created_at,
      ]
    )
  }

  async getPending(limit = 50): Promise<OutboxItem[]> {
    const rows = await this.db.getAllAsync<{
      id: string
      local_id: string
      module_id: string
      entry_kind: string
      operation: string
      payload: string
      client_created_at: string
      attempts: number
      last_error: string | null
      created_at: string
    }>(
      `SELECT * FROM sync_outbox WHERE attempts < ? ORDER BY created_at ASC LIMIT ?`,
      [MAX_RETRY_ATTEMPTS, limit]
    )
    return rows.map(r => ({
      ...r,
      entry_kind: r.entry_kind as EntryKind,
      operation: r.operation as SyncOperation,
      payload: JSON.parse(r.payload) as Record<string, unknown>,
    }))
  }

  async markDone(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM sync_outbox WHERE id = ?', [id])
  }

  async recordFailure(id: string, error: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE sync_outbox SET attempts = attempts + 1, last_error = ? WHERE id = ?`,
      [error, id]
    )
  }

  async pendingCount(): Promise<number> {
    const row = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sync_outbox WHERE attempts < ?`,
      [MAX_RETRY_ATTEMPTS]
    )
    return row?.count ?? 0
  }

  async clearAll(): Promise<void> {
    await this.db.execAsync('DELETE FROM sync_outbox')
  }
}

// ── Singleton par défaut ───────────────────────────────────────────────────
// Le db est injecté au premier appel (depuis initDatabase) — aucune dépendance
// circulaire avec database.ts.

let _store: SyncOutboxStore | null = null

export function getSyncOutboxStore(db: ExpoSQLite.SQLiteDatabase): SyncOutboxStore {
  if (!_store) {
    _store = new SyncOutboxStore(db)
  }
  return _store
}

export function resetSyncOutboxStore(): void {
  _store = null
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}
