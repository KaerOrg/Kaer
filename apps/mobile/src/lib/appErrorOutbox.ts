import type * as ExpoSQLite from 'expo-sqlite'
import type { AppError } from '@kaer/shared'

// ── AppErrorOutboxStore (issue #96) ─────────────────────────────────────────
// File d'attente SQLite des erreurs applicatives côté patient. Le report est
// best-effort : si le réseau est absent, l'erreur est persistée ici puis
// drainée vers l'edge function `report-app-error` au retour réseau (foreground).
//
// ⚠️ Ce N'EST PAS de la donnée patient (télémétrie technique : kind / message /
// route / trace tronquée). Elle ne passe donc PAS par sync_outbox / patient_entries
// ni par la gate de consentement — c'est une file séparée, sur le modèle exact de
// `render_mismatch_outbox` (#90). (Voir sync-service.md § exceptions : services
// qui ne stockent pas de donnée patient.)
//
// Déduplication LOCALE par `signature` (UNIQUE) : une même erreur vue N fois hors
// ligne = 1 seule ligne. Borne la taille de la file. La dédup/cooldown définitifs
// (1 email pour N occurrences) vivent côté edge function.

export interface AppErrorOutboxRow {
  id: string
  payload: AppError
  created_at: string
}

// Signature locale : sert uniquement à dédupliquer la file hors-ligne (pas d'email).
export function localSignature(p: AppError): string {
  return [p.platform, p.kind, p.route, p.message].join('|')
}

// Sous-ensemble de l'API SQLite réellement utilisé — facilite le test avec un faux
// typé (sans cast) ; la vraie `SQLiteDatabase` le satisfait structurellement.
export type SqliteRunner = Pick<ExpoSQLite.SQLiteDatabase, 'execAsync' | 'runAsync' | 'getAllAsync'>

export class AppErrorOutboxStore {
  constructor(private readonly db: SqliteRunner) {}

  async init(): Promise<void> {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_error_outbox (
        id         TEXT PRIMARY KEY,
        signature  TEXT NOT NULL UNIQUE,
        payload    TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)
  }

  async enqueue(payload: AppError): Promise<void> {
    const signature = localSignature(payload)
    // L'id existant est réutilisé via COALESCE (comme `created_at`) plutôt que
    // régénéré à chaque appel : un `flushAppErrorOutbox` en cours tient l'id
    // capturé par son `getPending()` précédent, et un `markDone(id)` sur un id
    // qui vient de changer ne supprimerait plus rien, laissant une entrée
    // fantôme rejouée indéfiniment.
    await this.db.runAsync(
      `INSERT OR REPLACE INTO app_error_outbox (id, signature, payload, created_at)
       VALUES (
         COALESCE((SELECT id FROM app_error_outbox WHERE signature = ?), ?),
         ?,
         ?,
         COALESCE((SELECT created_at FROM app_error_outbox WHERE signature = ?), CURRENT_TIMESTAMP)
       )`,
      [signature, generateId(), signature, JSON.stringify(payload), signature],
    )
  }

  async getPending(limit = 50): Promise<AppErrorOutboxRow[]> {
    const rows = await this.db.getAllAsync<{ id: string; payload: string; created_at: string }>(
      `SELECT id, payload, created_at FROM app_error_outbox ORDER BY created_at ASC LIMIT ?`,
      [limit],
    )
    return rows.map(r => ({ id: r.id, payload: JSON.parse(r.payload) as AppError, created_at: r.created_at }))
  }

  async markDone(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM app_error_outbox WHERE id = ?', [id])
  }

  async clearAll(): Promise<void> {
    await this.db.execAsync('DELETE FROM app_error_outbox')
  }
}

// ── Singleton par défaut ─────────────────────────────────────────────────────

let _store: AppErrorOutboxStore | null = null

export function getAppErrorOutboxStore(db: SqliteRunner): AppErrorOutboxStore {
  if (!_store) _store = new AppErrorOutboxStore(db)
  return _store
}

export function resetAppErrorOutboxStore(): void {
  _store = null
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}
