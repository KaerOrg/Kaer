import type { EntryKind, EnqueueParams } from '../lib/syncOutbox'
import type { RemoteSyncService as _RST } from './sync'

// Lazy — évite de charger RemoteSyncService au module-load (compatibilité tests).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sync = () => (require('./sync') as { RemoteSyncService: typeof _RST }).RemoteSyncService

// `client_created_at` est optionnel : par défaut horodaté à l'appel, mais
// surchargeable quand la saisie porte une date métier propre (saisie rétroactive
// / antidatée) — cette date doit alors voyager jusqu'à `patient_entries` pour que
// la vue praticien (web) et la vue patient (mobile) placent la saisie au même jour.
type UpsertParams = Omit<EnqueueParams, 'operation' | 'client_created_at'> & {
  client_created_at?: string
}

// Écrit en SQLite puis enqueue un upsert vers Supabase (fire-and-forget).
// client_created_at par défaut = instant de l'appel, sauf surcharge explicite.
export async function syncUpsert(
  dbFn: () => Promise<unknown>,
  params: UpsertParams,
): Promise<void> {
  await dbFn()
  const { client_created_at, ...rest } = params
  void sync().getInstance().enqueue({
    ...rest,
    operation: 'upsert',
    client_created_at: client_created_at ?? new Date().toISOString(),
  })
}

// Supprime en SQLite puis enqueue un delete vers Supabase (fire-and-forget).
// Le payload est vide : seul local_id est nécessaire pour identifier la ligne.
export async function syncDelete(
  dbFn: () => Promise<unknown>,
  localId: string,
  moduleId: string,
  entryKind: EntryKind,
): Promise<void> {
  await dbFn()
  void sync().getInstance().enqueue({
    local_id: localId,
    module_id: moduleId,
    entry_kind: entryKind,
    operation: 'delete',
    payload: {},
    client_created_at: new Date().toISOString(),
  })
}
