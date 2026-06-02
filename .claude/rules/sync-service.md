# Règle — Synchronisation distante via syncHelpers (mobile)

## Principe

Toute fonction de service mobile qui **écrit ou supprime** une entrée patient en SQLite
doit enchaîner la synchronisation vers Supabase via les deux helpers dédiés :

```
apps/mobile/src/services/syncHelpers.ts
  ├── syncUpsert(dbFn, params)  — écriture locale + enqueue upsert
  └── syncDelete(dbFn, id, moduleId, entryKind)  — suppression locale + enqueue delete
```

Ces helpers écrivent en SQLite (`await dbFn()`) **puis** placent l'opération dans la
`sync_outbox` SQLite locale. `RemoteSyncService.sync()` draine cette outbox vers
`patient_entries` (Supabase) quand le réseau est disponible.

## Pattern obligatoire

```ts
import { syncUpsert, syncDelete } from './syncHelpers'
import { saveMyEntry as dbSave, deleteMyEntry as dbDelete } from '../lib/database'

export async function saveMyEntry(entry: MyEntry): Promise<void> {
  await syncUpsert(() => dbSave(entry), {
    local_id: entry.id,
    module_id: entry.module_id,     // ex. 'mood_tracker'
    entry_kind: 'my_entry_kind',    // valeur de EntryKind dans syncOutbox.ts
    payload: {                      // champs à répliquer côté Supabase
      ...
    },
  })
}

export async function deleteMyEntry(id: string): Promise<void> {
  await syncDelete(() => dbDelete(id), id, 'my_module', 'my_entry_kind')
}
```

## Règles

### 1. Aucun appel direct à RemoteSyncService depuis un service de module

```ts
// ❌ NON — duplique syncUpsert, viole l'encapsulation
import { RemoteSyncService } from './sync'
await RemoteSyncService.getInstance().enqueue({ ... })

// ✅ OUI — via syncHelpers
import { syncUpsert } from './syncHelpers'
await syncUpsert(() => dbSave(entry), { ... })
```

### 2. Aucune écriture SQLite orpheline

```ts
// ❌ NON — données jamais synchronisées même si consentement activé
export async function saveMyEntry(entry: MyEntry): Promise<void> {
  await dbSave(entry)
}

// ✅ OUI — SQLite + outbox en une étape
export async function saveMyEntry(entry: MyEntry): Promise<void> {
  await syncUpsert(() => dbSave(entry), { ... })
}
```

### 3. EntryKind — ajouter avant d'écrire le service

Si le type de données du nouveau module n'apparaît pas dans `EntryKind`
(`apps/mobile/src/lib/syncOutbox.ts`) → l'ajouter à l'union **avant** d'écrire
le service. Ne jamais caster en `as EntryKind`.

```ts
// syncOutbox.ts — ajouter la valeur
export type EntryKind =
  | 'scale_entry'
  | ...
  | 'my_new_entry_kind'   // ← ajouter ici
```

### 4. Le gate de consentement n'appartient pas au service

`RemoteSyncService.enqueue()` est un no-op si `setConsentEnabled(false)`.
Le service applicatif **ne vérifie pas** le consentement — c'est la responsabilité
du `RemoteSyncService`. Pas de `if (consentEnabled)` dans le service de module.

### 5. Mock standard dans les tests

```ts
const mockEnqueue = jest.fn()
jest.mock('../services/sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

// Vérifier que saveMyEntry appelle bien enqueue
await saveMyEntry(entry)
expect(mockEnqueue).toHaveBeenCalledWith(
  expect.objectContaining({ local_id: entry.id, operation: 'upsert' })
)

// Vérifier que deleteMyEntry appelle bien enqueue avec operation: 'delete'
await deleteMyEntry('abc')
expect(mockEnqueue).toHaveBeenCalledWith(
  expect.objectContaining({ local_id: 'abc', operation: 'delete' })
)
```

## Portée

Cette règle s'applique à **tous les services mobiles** qui gèrent des entrées patient :

| Service existant | Pattern utilisé |
|---|---|
| `scaleEntryService.ts` | `syncUpsert` / `syncDelete` |
| `sleepDiaryService.ts` | `syncUpsert` / `syncDelete` |
| `formEntryService.ts` | `syncUpsert` / `syncDelete` |
| `dailyEntryService.ts` | `syncUpsert` / `syncDelete` |
| `activityRecordService.ts` | `syncUpsert` / `syncDelete` |
| `fearTrackerService.ts` | `syncUpsert` / `syncDelete` |
| `planItemService.ts` | `syncUpsert` / `syncDelete` |
| `breathingService.ts` | `syncUpsert` / `syncDelete` |
| `treeSelectionService.ts` | `syncUpsert` / `syncDelete` |

**Tout nouveau service de module mobile rejoint ce tableau.**

## Exceptions légitimes

- Services qui **ne stockent pas de données patient** (ex. `psyeduService` — lecture Supabase uniquement, zéro écriture locale patient).
- Services d'infrastructure (`authService`, `appointmentService`) — leurs données passent directement par Supabase, sans SQLite local.
- Modules sans stockage local du tout (ex. `grounding` — exercice sans persistance).

Dans tous les cas exceptionnels : justifier en commentaire JSDoc de la fonction pourquoi `syncUpsert` n'est pas utilisé.
