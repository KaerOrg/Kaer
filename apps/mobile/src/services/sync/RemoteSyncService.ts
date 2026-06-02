import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase as defaultSupabase } from '../../lib/supabase'
import { getDb } from '../../lib/database'
import { getSyncOutboxStore } from '../../lib/syncOutbox'
import type { EnqueueParams, OutboxItem, SyncOutboxStore } from '../../lib/syncOutbox'
import { useAuthStore } from '../../store/authStore'

// ── Types publics ──────────────────────────────────────────────────────────

export interface SyncResult {
  synced: number
  failed: number
  skipped: number
}

// ── RemoteSyncService ──────────────────────────────────────────────────────
// Moteur de synchronisation patient → Supabase.
//
// Principe outbox-first :
//   1. enqueue() mémorise l'opération dans sync_outbox (SQLite local).
//   2. sync() draine l'outbox vers patient_entries (Supabase) par batchs.
//   3. On network reconnect / app foreground : appeler sync() depuis le
//      composant racine ou un hook AppState/NetInfo.
//
// Gate MDR 2017/745 : aucune donnée ne quitte l'appareil sans consentement
// explicite du patient (setConsentEnabled(true)). enqueue() est un no-op
// tant que le consentement est absent.
//
// Singleton de production, instance de test via createForTest().

const BATCH_SIZE = 50

export class RemoteSyncService {
  private static _instance: RemoteSyncService | null = null

  private _isSyncing = false
  private _consentEnabled = false

  private constructor(
    private readonly outbox: SyncOutboxStore,
    private readonly supabaseClient: SupabaseClient,
    private readonly getPatientId: () => string | null,
  ) {}

  // ── Singleton ─────────────────────────────────────────────────────────────

  static getInstance(): RemoteSyncService {
    if (!RemoteSyncService._instance) {
      RemoteSyncService._instance = new RemoteSyncService(
        getSyncOutboxStore(getDb()),
        defaultSupabase,
        () => useAuthStore.getState().patient?.id ?? null,
      )
    }
    return RemoteSyncService._instance
  }

  static createForTest(
    outbox: SyncOutboxStore,
    supabaseClient: SupabaseClient,
    getPatientId: () => string | null,
  ): RemoteSyncService {
    return new RemoteSyncService(outbox, supabaseClient, getPatientId)
  }

  static reset(): void {
    RemoteSyncService._instance = null
  }

  // ── Consentement ──────────────────────────────────────────────────────────

  setConsentEnabled(enabled: boolean): void {
    this._consentEnabled = enabled
  }

  isConsentEnabled(): boolean {
    return this._consentEnabled
  }

  // ── État ──────────────────────────────────────────────────────────────────

  isSyncing(): boolean {
    return this._isSyncing
  }

  async pendingCount(): Promise<number> {
    return this.outbox.pendingCount()
  }

  // ── Enqueue ───────────────────────────────────────────────────────────────

  async enqueue(params: EnqueueParams): Promise<void> {
    if (!this._consentEnabled) return
    await this.outbox.enqueue(params)
  }

  // ── Sync ──────────────────────────────────────────────────────────────────
  // Guard de ré-entrance : un seul drain simultané autorisé.
  // Les items sont traités en parallèle dans le batch pour limiter la latence.

  async sync(): Promise<SyncResult> {
    if (!this._consentEnabled) return { synced: 0, failed: 0, skipped: 0 }

    const patientId = this.getPatientId()
    if (!patientId) return { synced: 0, failed: 0, skipped: 1 }

    if (this._isSyncing) return { synced: 0, failed: 0, skipped: 1 }
    this._isSyncing = true

    const result = { synced: 0, failed: 0, skipped: 0 }

    try {
      const items = await this.outbox.getPending(BATCH_SIZE)
      await Promise.all(items.map(item => this.processItem(item, patientId, result)))
    } finally {
      this._isSyncing = false
    }

    return result
  }

  private async processItem(
    item: OutboxItem,
    patientId: string,
    result: { synced: number; failed: number; skipped: number },
  ): Promise<void> {
    try {
      if (item.operation === 'delete') {
        const { error } = await this.supabaseClient
          .from('patient_entries')
          .delete()
          .eq('patient_id', patientId)
          .eq('local_id', item.local_id)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await this.supabaseClient
          .from('patient_entries')
          .upsert(
            {
              patient_id: patientId,
              local_id: item.local_id,
              module_id: item.module_id,
              entry_kind: item.entry_kind,
              payload: item.payload,
              client_created_at: item.client_created_at,
            },
            { onConflict: 'patient_id,local_id' }
          )
        if (error) throw new Error(error.message)
      }
      await this.outbox.markDone(item.id)
      result.synced++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await this.outbox.recordFailure(item.id, message)
      result.failed++
    }
  }
}
