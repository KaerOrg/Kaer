import type * as ExpoSQLite from 'expo-sqlite'
import type { RenderMismatch } from '@kaer/shared'

// ── RenderMismatchOutboxStore (issue #90) ───────────────────────────────────
// File d'attente SQLite des non-match du moteur de rendu côté patient. Le report
// est best-effort : si le réseau est absent, le non-match est persisté ici puis
// drainé vers l'edge function `report-render-mismatch` au retour réseau (foreground).
//
// ⚠️ Ce N'EST PAS de la donnée patient (télémétrie technique : preview_kind /
// field_type / widget_type). Elle ne passe donc PAS par sync_outbox / patient_entries
// ni par la gate de consentement — c'est une file séparée. (Voir sync-service.md §
// exceptions : services qui ne stockent pas de donnée patient.)
//
// Déduplication LOCALE par `signature` (UNIQUE) : un même non-match vu N fois hors
// ligne = 1 seule ligne. Borne la taille de la file. La dédup/cooldown définitifs
// (1 email pour N occurrences) vivent côté edge function.

export interface RenderMismatchOutboxRow {
  id: string
  payload: RenderMismatch
  created_at: string
}

// Signature locale : sert uniquement à dédupliquer la file hors-ligne (pas d'email).
export function localSignature(p: RenderMismatch): string {
  return [p.platform, p.module_id, p.preview_kind, p.field_type, p.widget_type, p.reason].join('|')
}

// Sous-ensemble de l'API SQLite réellement utilisé — facilite le test avec un faux
// typé (sans cast) ; la vraie `SQLiteDatabase` le satisfait structurellement.
export type SqliteRunner = Pick<ExpoSQLite.SQLiteDatabase, 'execAsync' | 'runAsync' | 'getAllAsync'>

export class RenderMismatchOutboxStore {
  constructor(private readonly db: SqliteRunner) {}

  async init(): Promise<void> {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS render_mismatch_outbox (
        id         TEXT PRIMARY KEY,
        signature  TEXT NOT NULL UNIQUE,
        payload    TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)
  }

  async enqueue(payload: RenderMismatch): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO render_mismatch_outbox (id, signature, payload, created_at)
       VALUES (?, ?, ?, COALESCE((SELECT created_at FROM render_mismatch_outbox WHERE signature = ?), CURRENT_TIMESTAMP))`,
      [generateId(), localSignature(payload), JSON.stringify(payload), localSignature(payload)],
    )
  }

  async getPending(limit = 50): Promise<RenderMismatchOutboxRow[]> {
    const rows = await this.db.getAllAsync<{ id: string; payload: string; created_at: string }>(
      `SELECT id, payload, created_at FROM render_mismatch_outbox ORDER BY created_at ASC LIMIT ?`,
      [limit],
    )
    return rows.map(r => ({ id: r.id, payload: JSON.parse(r.payload) as RenderMismatch, created_at: r.created_at }))
  }

  async markDone(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM render_mismatch_outbox WHERE id = ?', [id])
  }

  async clearAll(): Promise<void> {
    await this.db.execAsync('DELETE FROM render_mismatch_outbox')
  }
}

// ── Singleton par défaut ─────────────────────────────────────────────────────

let _store: RenderMismatchOutboxStore | null = null

export function getRenderMismatchOutboxStore(db: SqliteRunner): RenderMismatchOutboxStore {
  if (!_store) _store = new RenderMismatchOutboxStore(db)
  return _store
}

export function resetRenderMismatchOutboxStore(): void {
  _store = null
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}
