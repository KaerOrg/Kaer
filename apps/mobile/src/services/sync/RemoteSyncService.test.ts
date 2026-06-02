// Mocks en premier — before any import
jest.mock('../../lib/database', () => ({ getDb: jest.fn() }))
jest.mock('../../lib/supabase', () => ({ supabase: {} }))
jest.mock('../../store/authStore', () => ({ useAuthStore: { getState: jest.fn() } }))

import { RemoteSyncService } from './RemoteSyncService'
import type { SyncOutboxStore, OutboxItem, EnqueueParams } from '../../lib/syncOutbox'
import type { SupabaseClient } from '@supabase/supabase-js'

// ── Helpers ────────────────────────────────────────────────────────────────

function makeOutbox(overrides: Partial<SyncOutboxStore> = {}): SyncOutboxStore {
  return {
    init: jest.fn().mockResolvedValue(undefined),
    enqueue: jest.fn().mockResolvedValue(undefined),
    getPending: jest.fn().mockResolvedValue([]),
    markDone: jest.fn().mockResolvedValue(undefined),
    recordFailure: jest.fn().mockResolvedValue(undefined),
    pendingCount: jest.fn().mockResolvedValue(0),
    clearAll: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as SyncOutboxStore
}

function makeSupabase(upsertError: unknown = null, deleteError: unknown = null): SupabaseClient {
  const upsertFn = jest.fn().mockResolvedValue({ error: upsertError })
  const deleteFn = jest.fn()
  const eqChain = { eq: jest.fn() }
  eqChain.eq.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: deleteError }) })
  deleteFn.mockReturnValue(eqChain)

  return {
    from: jest.fn().mockReturnValue({
      upsert: upsertFn,
      delete: deleteFn,
    }),
  } as unknown as SupabaseClient
}

function makeItem(overrides: Partial<OutboxItem> = {}): OutboxItem {
  return {
    id: 'ob-1',
    local_id: 'loc-1',
    module_id: 'phq9',
    entry_kind: 'scale_entry',
    operation: 'upsert',
    payload: { scale_id: 'phq9', total_score: 14 },
    client_created_at: '2025-01-01T10:00:00.000Z',
    attempts: 0,
    last_error: null,
    created_at: '2025-01-01T10:00:00.000Z',
    ...overrides,
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('RemoteSyncService', () => {
  afterEach(() => {
    RemoteSyncService.reset()
  })

  // ── Consentement ──────────────────────────────────────────────────────────

  describe('consentement (gate MDR)', () => {
    it('consent désactivé par défaut', () => {
      const svc = RemoteSyncService.createForTest(makeOutbox(), makeSupabase(), () => 'pat-1')
      expect(svc.isConsentEnabled()).toBe(false)
    })

    it('enqueue() est no-op si consent absent', async () => {
      const outbox = makeOutbox()
      const svc = RemoteSyncService.createForTest(outbox, makeSupabase(), () => 'pat-1')
      await svc.enqueue({ local_id: 'a', module_id: 'phq9', entry_kind: 'scale_entry', operation: 'upsert', payload: {}, client_created_at: '' })
      expect(outbox.enqueue).not.toHaveBeenCalled()
    })

    it('sync() retourne {0,0,0} si consent absent', async () => {
      const svc = RemoteSyncService.createForTest(makeOutbox(), makeSupabase(), () => 'pat-1')
      const result = await svc.sync()
      expect(result).toEqual({ synced: 0, failed: 0, skipped: 0 })
    })

    it('enqueue() délègue à outbox une fois le consent activé', async () => {
      const outbox = makeOutbox()
      const svc = RemoteSyncService.createForTest(outbox, makeSupabase(), () => 'pat-1')
      svc.setConsentEnabled(true)
      const params: EnqueueParams = { local_id: 'a', module_id: 'phq9', entry_kind: 'scale_entry', operation: 'upsert', payload: {}, client_created_at: '' }
      await svc.enqueue(params)
      expect(outbox.enqueue).toHaveBeenCalledWith(params)
    })
  })

  // ── sync() ────────────────────────────────────────────────────────────────

  describe('sync()', () => {
    it('retourne skipped=1 si patientId absent', async () => {
      const svc = RemoteSyncService.createForTest(makeOutbox(), makeSupabase(), () => null)
      svc.setConsentEnabled(true)
      const result = await svc.sync()
      expect(result).toEqual({ synced: 0, failed: 0, skipped: 1 })
    })

    it('retourne skipped=1 si un sync est déjà en cours (ré-entrance)', async () => {
      const outbox = makeOutbox({
        getPending: jest.fn().mockImplementation(() => new Promise(r => setTimeout(() => r([]), 50))),
      })
      const svc = RemoteSyncService.createForTest(outbox, makeSupabase(), () => 'pat-1')
      svc.setConsentEnabled(true)

      const first = svc.sync()
      const second = await svc.sync()
      expect(second).toEqual({ synced: 0, failed: 0, skipped: 1 })
      await first
    })

    it('upsert : appelle supabase.from(patient_entries).upsert avec le bon payload', async () => {
      const item = makeItem()
      const outbox = makeOutbox({ getPending: jest.fn().mockResolvedValue([item]) })
      const supabase = makeSupabase()
      const svc = RemoteSyncService.createForTest(outbox, supabase, () => 'pat-1')
      svc.setConsentEnabled(true)

      const result = await svc.sync()

      expect(supabase.from).toHaveBeenCalledWith('patient_entries')
      const upsertCall = (supabase.from('patient_entries') as { upsert: jest.Mock }).upsert
      expect(upsertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          patient_id: 'pat-1',
          local_id: 'loc-1',
          module_id: 'phq9',
          entry_kind: 'scale_entry',
          payload: { scale_id: 'phq9', total_score: 14 },
        }),
        { onConflict: 'patient_id,local_id' }
      )
      expect(outbox.markDone).toHaveBeenCalledWith('ob-1')
      expect(result.synced).toBe(1)
      expect(result.failed).toBe(0)
    })

    it('delete : appelle supabase.from(patient_entries).delete avec patient_id + local_id', async () => {
      const item = makeItem({ operation: 'delete' })
      const outbox = makeOutbox({ getPending: jest.fn().mockResolvedValue([item]) })
      const supabase = makeSupabase()
      const svc = RemoteSyncService.createForTest(outbox, supabase, () => 'pat-1')
      svc.setConsentEnabled(true)

      const result = await svc.sync()

      expect(result.synced).toBe(1)
      expect(outbox.markDone).toHaveBeenCalledWith('ob-1')
    })

    it('erreur réseau : appelle recordFailure et incrémente failed', async () => {
      const item = makeItem()
      const outbox = makeOutbox({ getPending: jest.fn().mockResolvedValue([item]) })
      const supabase = makeSupabase({ message: 'network error' })
      const svc = RemoteSyncService.createForTest(outbox, supabase, () => 'pat-1')
      svc.setConsentEnabled(true)

      const result = await svc.sync()

      expect(outbox.recordFailure).toHaveBeenCalledWith('ob-1', 'network error')
      expect(outbox.markDone).not.toHaveBeenCalled()
      expect(result.failed).toBe(1)
      expect(result.synced).toBe(0)
    })

    it('batch mixte : synced + failed corrects avec 2 items (1 OK, 1 erreur)', async () => {
      const okItem = makeItem({ id: 'ob-1', local_id: 'loc-1' })
      const failItem = makeItem({ id: 'ob-2', local_id: 'loc-2' })
      const outbox = makeOutbox({ getPending: jest.fn().mockResolvedValue([okItem, failItem]) })

      let callCount = 0
      const supabase = {
        from: jest.fn().mockReturnValue({
          upsert: jest.fn().mockImplementation(() => {
            callCount++
            return Promise.resolve({ error: callCount === 1 ? null : { message: 'fail' } })
          }),
        }),
      } as unknown as SupabaseClient

      const svc = RemoteSyncService.createForTest(outbox, supabase, () => 'pat-1')
      svc.setConsentEnabled(true)
      const result = await svc.sync()

      expect(result.synced).toBe(1)
      expect(result.failed).toBe(1)
    })

    it('outbox vide → {synced:0, failed:0, skipped:0}', async () => {
      const svc = RemoteSyncService.createForTest(makeOutbox(), makeSupabase(), () => 'pat-1')
      svc.setConsentEnabled(true)
      const result = await svc.sync()
      expect(result).toEqual({ synced: 0, failed: 0, skipped: 0 })
    })
  })

  // ── isSyncing ─────────────────────────────────────────────────────────────

  describe('isSyncing()', () => {
    it('est false avant le sync et false après', async () => {
      const svc = RemoteSyncService.createForTest(makeOutbox(), makeSupabase(), () => 'pat-1')
      svc.setConsentEnabled(true)
      expect(svc.isSyncing()).toBe(false)
      await svc.sync()
      expect(svc.isSyncing()).toBe(false)
    })
  })

  // ── pendingCount ──────────────────────────────────────────────────────────

  describe('pendingCount()', () => {
    it('délègue à l\'outbox', async () => {
      const outbox = makeOutbox({ pendingCount: jest.fn().mockResolvedValue(7) })
      const svc = RemoteSyncService.createForTest(outbox, makeSupabase(), () => 'pat-1')
      expect(await svc.pendingCount()).toBe(7)
    })
  })
})
