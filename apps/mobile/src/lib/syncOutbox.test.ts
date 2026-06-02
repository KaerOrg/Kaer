// Les mocks expo-sqlite sont injectés par construction : SyncOutboxStore prend
// un db en paramètre — pas besoin de mocker le module.

import { SyncOutboxStore, MAX_RETRY_ATTEMPTS } from './syncOutbox'
import type { EnqueueParams } from './syncOutbox'

// ── Fake db ────────────────────────────────────────────────────────────────

function makeDb() {
  const rows: Record<string, unknown>[] = []

  const db = {
    execAsync: jest.fn(async (sql: string) => {
      const s = sql.trim().toUpperCase()
      if (s.startsWith('DELETE FROM SYNC_OUTBOX') && !s.includes('WHERE')) {
        rows.length = 0
      }
      // CREATE TABLE / CREATE INDEX → no-op
    }),
    runAsync: jest.fn(async (sql: string, params: unknown[] = []) => {
      const s = sql.trim().toUpperCase()

      if (s.startsWith('INSERT OR REPLACE INTO SYNC_OUTBOX')) {
        const [id, local_id, module_id, entry_kind, operation, payload, client_created_at] = params as string[]
        const existing = rows.findIndex(r => (r as { local_id: string }).local_id === local_id)
        const row = { id, local_id, module_id, entry_kind, operation, payload, client_created_at, attempts: 0, last_error: null, created_at: new Date().toISOString() }
        if (existing >= 0) rows.splice(existing, 1, row)
        else rows.push(row)
      } else if (s.startsWith('DELETE FROM SYNC_OUTBOX WHERE LOCAL_ID')) {
        const [local_id] = params as string[]
        const idx = rows.findIndex(r => (r as { local_id: string }).local_id === local_id)
        if (idx >= 0) rows.splice(idx, 1)
      } else if (s.startsWith('DELETE FROM SYNC_OUTBOX WHERE ID')) {
        const [id] = params as string[]
        const idx = rows.findIndex(r => (r as { id: string }).id === id)
        if (idx >= 0) rows.splice(idx, 1)
      } else if (s.startsWith('UPDATE SYNC_OUTBOX SET ATTEMPTS')) {
        const [error, id] = params as string[]
        const row = rows.find(r => (r as { id: string }).id === id) as { attempts: number; last_error: string | null } | undefined
        if (row) { row.attempts++; row.last_error = error }
      }
    }),
    getAllAsync: jest.fn(async (_sql: string, params: unknown[] = []) => {
      const [maxAttempts, limit] = params as number[]
      return rows
        .filter(r => (r as { attempts: number }).attempts < maxAttempts)
        .sort((a, b) => ((a as { created_at: string }).created_at < (b as { created_at: string }).created_at ? -1 : 1))
        .slice(0, limit)
    }),
    getFirstAsync: jest.fn(async (_sql: string, params: unknown[] = []) => {
      const [maxAttempts] = params as number[]
      const count = rows.filter(r => (r as { attempts: number }).attempts < maxAttempts).length
      return { count }
    }),
    _rows: rows,
  }
  return db
}

// ── Helpers ────────────────────────────────────────────────────────────────

function upsertParams(localId = 'loc-1', moduleId = 'phq9'): EnqueueParams {
  return {
    local_id: localId,
    module_id: moduleId,
    entry_kind: 'scale_entry',
    operation: 'upsert',
    payload: { scale_id: 'phq9', total_score: 12 },
    client_created_at: new Date().toISOString(),
  }
}

function deleteParams(localId = 'loc-1'): EnqueueParams {
  return { ...upsertParams(localId), operation: 'delete' }
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('SyncOutboxStore', () => {
  let db: ReturnType<typeof makeDb>
  let store: SyncOutboxStore

  beforeEach(() => {
    db = makeDb()
    store = new SyncOutboxStore(db as unknown as import('expo-sqlite').SQLiteDatabase)
  })

  describe('init()', () => {
    it('crée la table sync_outbox', async () => {
      await store.init()
      expect(db.execAsync).toHaveBeenCalledTimes(1)
      expect(db.execAsync.mock.calls[0][0]).toContain('CREATE TABLE IF NOT EXISTS sync_outbox')
    })
  })

  describe('enqueue() — upsert', () => {
    it('ajoute une entrée dans la file', async () => {
      await store.enqueue(upsertParams())
      const pending = await store.getPending(100)
      expect(pending).toHaveLength(1)
      expect(pending[0].local_id).toBe('loc-1')
      expect(pending[0].module_id).toBe('phq9')
      expect(pending[0].operation).toBe('upsert')
      expect(pending[0].attempts).toBe(0)
    })

    it('désérialise le payload JSON correctement', async () => {
      await store.enqueue(upsertParams())
      const [item] = await store.getPending(100)
      expect(item.payload).toEqual({ scale_id: 'phq9', total_score: 12 })
    })

    it('remplace un upsert existant pour le même local_id (payload mis à jour)', async () => {
      await store.enqueue(upsertParams('loc-1'))
      await store.enqueue({ ...upsertParams('loc-1'), payload: { scale_id: 'phq9', total_score: 20 } })
      const pending = await store.getPending(100)
      expect(pending).toHaveLength(1)
      expect(pending[0].payload).toEqual({ scale_id: 'phq9', total_score: 20 })
    })
  })

  describe('enqueue() — delete', () => {
    it("annule un upsert en attente et remplace par le delete", async () => {
      await store.enqueue(upsertParams('loc-1'))
      await store.enqueue(deleteParams('loc-1'))
      const pending = await store.getPending(100)
      expect(pending).toHaveLength(1)
      expect(pending[0].operation).toBe('delete')
    })

    it('fonctionne même si aucun upsert en attente (enqueue orphelin)', async () => {
      await store.enqueue(deleteParams('loc-x'))
      const pending = await store.getPending(100)
      expect(pending).toHaveLength(1)
      expect(pending[0].operation).toBe('delete')
    })
  })

  describe('getPending()', () => {
    it('respecte la limite', async () => {
      await store.enqueue(upsertParams('a'))
      await store.enqueue(upsertParams('b'))
      await store.enqueue(upsertParams('c'))
      const pending = await store.getPending(2)
      expect(pending).toHaveLength(2)
    })

    it('exclut les items ayant atteint MAX_RETRY_ATTEMPTS', async () => {
      await store.enqueue(upsertParams('loc-1'))
      const [item] = await store.getPending(100)
      for (let i = 0; i < MAX_RETRY_ATTEMPTS; i++) {
        await store.recordFailure(item.id, 'err')
      }
      const pending = await store.getPending(100)
      expect(pending).toHaveLength(0)
    })
  })

  describe('markDone()', () => {
    it('supprime l\'item de la file', async () => {
      await store.enqueue(upsertParams())
      const [item] = await store.getPending(100)
      await store.markDone(item.id)
      expect(await store.pendingCount()).toBe(0)
    })
  })

  describe('recordFailure()', () => {
    it('incrémente attempts et enregistre le message d\'erreur', async () => {
      await store.enqueue(upsertParams())
      const [before] = await store.getPending(100)
      await store.recordFailure(before.id, 'network error')
      const [after] = await store.getPending(100)
      expect(after.attempts).toBe(1)
      expect(after.last_error).toBe('network error')
    })
  })

  describe('pendingCount()', () => {
    it('retourne le nombre d\'items non épuisés', async () => {
      await store.enqueue(upsertParams('a'))
      await store.enqueue(upsertParams('b'))
      expect(await store.pendingCount()).toBe(2)
    })

    it('exclut les items épuisés', async () => {
      await store.enqueue(upsertParams('a'))
      const [item] = await store.getPending(100)
      for (let i = 0; i < MAX_RETRY_ATTEMPTS; i++) {
        await store.recordFailure(item.id, 'err')
      }
      expect(await store.pendingCount()).toBe(0)
    })
  })

  describe('clearAll()', () => {
    it('vide complètement la file', async () => {
      await store.enqueue(upsertParams('a'))
      await store.enqueue(upsertParams('b'))
      await store.clearAll()
      expect(await store.pendingCount()).toBe(0)
    })
  })
})
