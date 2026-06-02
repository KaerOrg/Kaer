# Sync des données patient vers Supabase

## Vue d'ensemble

Les données d'exercices patient (questionnaires, journaux, formulaires, etc.) sont historiquement stockées uniquement en SQLite local sur l'appareil. Ce document décrit l'architecture de synchronisation vers Supabase qui permet :

- La **sauvegarde cloud** des données (multi-appareil, perte d'appareil)
- La **lecture praticien** des données de ses patients depuis le tableau de bord web

## Principes fondamentaux

### 1. SQLite-first (offline-first)

L'écriture se fait toujours en SQLite en premier. Supabase est alimenté de façon asynchrone. L'app est 100 % fonctionnelle sans connexion.

### 2. Consentement explicite (MDR 2017/745)

Aucune donnée ne quitte l'appareil sans **opt-in explicite du patient**. `RemoteSyncService.enqueue()` est un no-op tant que `setConsentEnabled(true)` n'a pas été appelé. Le praticien ne peut donc lire les données d'un patient que si ce patient a consenti au partage.

### 3. Code affiche, jamais il ne conclut

La table `patient_entries` stocke les payloads bruts. Supabase ne réalise aucun calcul, aucune alerte, aucun seuil. L'interprétation reste exclusive au praticien et au patient.

---

## Architecture

```
Patient saisit une donnée
    │
    ├─► SQLite (table de données du module)    ← lecture locale immédiate
    │
    └─► RemoteSyncService.enqueue()
             │
             ├── si consent OFF  → no-op
             └── si consent ON   → SyncOutboxStore.enqueue()
                                       └─► sync_outbox (SQLite)

Au retour en foreground / reconnexion réseau :
    RemoteSyncService.sync()
        └─► SyncOutboxStore.getPending()
                └─► batch upsert/delete → patient_entries (Supabase)
                         ├── succès → SyncOutboxStore.markDone()
                         └── échec  → SyncOutboxStore.recordFailure() (retry max 5×)
```

---

## Table Supabase : `patient_entries`

Table générique qui reçoit toutes les données d'exercices.

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` | PK généré par Supabase |
| `patient_id` | `uuid` | FK → `patients.id` |
| `local_id` | `text` | Identifiant SQLite local (généré par `generateId()`) |
| `module_id` | `text` | Ex : `'phq9'`, `'sleep_diary'`, `'beck_columns'` |
| `entry_kind` | `text` | Type d'entrée (voir tableau ci-dessous) |
| `payload` | `jsonb` | Données brutes de l'entrée |
| `client_created_at` | `timestamptz` | Horodatage de création côté client |
| `synced_at` | `timestamptz` | Date du dernier upsert |

**Contrainte d'idempotence** : `UNIQUE(patient_id, local_id)` — les upserts sont sûrs à rejouer.

**RLS** :
- Patient : `SELECT / INSERT / UPDATE / DELETE` sur ses propres lignes (`patient_id = auth.uid()`)
- Praticien : `SELECT` uniquement, sur les patients liés via `practitioner_patients`

### Valeurs de `entry_kind`

| Valeur | Table SQLite source | Module(s) |
|---|---|---|
| `scale_entry` | `scale_entries` | PHQ-9, GAD-7, BSL-23, RCADS, ASRS, SNAP-IV, EPDS, NSI, mood_tracker, medication_side_effects |
| `sleep_diary_entry` | `sleep_diary_entries` | `sleep_diary` |
| `form_entry` | `form_entries` | `beck_columns`, `craving_journal` |
| `daily_entry` | `daily_entries` | `medication_adherence` |
| `tree_selection` | `tree_selections` | `emotion_wheel` |
| `plan_item` | `plan_items` | `crisis_plan`, `decisional_balance` |
| `activity_record` | `activity_records` | `behavioral_activation` |
| `fear_entry` | `fear_entries` | `fear_thermometer` |
| `fear_situation` | `fear_situations` | `fear_thermometer`, `exposure_hierarchy` |
| `exposure_hierarchy` | `exposure_hierarchies` | `exposure_hierarchy` |
| `breathing_session` | `breathing_sessions` | `breathing_techniques` |
| `cognitive_saturation_session` | `cognitive_saturation_sessions` | `cognitive_saturation` |
| `crisis_anchor` | `crisis_anchors` | `crisis_plan` |
| `em_ruler` | `em_rulers` | `motivational_balance` |
| `em_balance_item` | `em_balance_items` | `motivational_balance` |
| `em_value` | `em_values` | `motivational_balance` |
| `module_setting` | `module_settings` | tous modules avec config locale |

---

## Classes

### `SyncOutboxStore` — `apps/mobile/src/lib/syncOutbox.ts`

File d'attente SQLite. Découplée de `database.ts` (pas de dépendance circulaire) : elle prend la base en paramètre de constructeur.

```typescript
// Usage standard (singleton via getSyncOutboxStore)
const store = getSyncOutboxStore(db)
await store.init()

// Enqueue un upsert
await store.enqueue({
  local_id: 'abc123',
  module_id: 'phq9',
  entry_kind: 'scale_entry',
  operation: 'upsert',
  payload: { scale_id: 'phq9', answers: [0,1,2,...], total_score: 14 },
  client_created_at: new Date().toISOString(),
})

// Enqueue un delete (annule automatiquement un upsert en attente)
await store.enqueue({ ...params, operation: 'delete' })
```

**Comportement delete-annule-upsert** : si un `upsert` pour `local_id='abc'` est en attente et qu'on enqueue un `delete` pour le même `local_id`, l'upsert est supprimé de la file et seul le delete reste. L'item n'a jamais été envoyé au serveur — inutile de l'y créer pour le supprimer aussitôt.

**Table `sync_outbox`** (SQLite) :

| Colonne | Type | Description |
|---|---|---|
| `id` | TEXT PK | Identifiant outbox |
| `local_id` | TEXT UNIQUE | Identifiant de l'entrée source |
| `module_id` | TEXT | Module concerné |
| `entry_kind` | TEXT | Type d'entrée |
| `operation` | TEXT | `'upsert'` ou `'delete'` |
| `payload` | TEXT | JSON sérialisé |
| `client_created_at` | TEXT | Horodatage original |
| `attempts` | INTEGER | Nombre de tentatives échouées |
| `last_error` | TEXT | Dernier message d'erreur |

Un item est exclu des tentatives après `MAX_RETRY_ATTEMPTS = 5` échecs.

---

### `RemoteSyncService` — `apps/mobile/src/services/sync/RemoteSyncService.ts`

Moteur singleton. Orchestre le drain de l'outbox vers Supabase.

```typescript
// Activer le consentement patient (ex. après opt-in dans l'UI)
RemoteSyncService.getInstance().setConsentEnabled(true)

// Enqueue depuis un service de module (après écriture SQLite)
await RemoteSyncService.getInstance().enqueue({
  local_id: entry.id,
  module_id: 'phq9',
  entry_kind: 'scale_entry',
  operation: 'upsert',
  payload: { scale_id: 'phq9', answers: entry.answers, total_score: entry.total_score },
  client_created_at: entry.created_at,
})

// Déclencher un sync (depuis AppState listener ou reconnexion réseau)
const { synced, failed, skipped } = await RemoteSyncService.getInstance().sync()
```

**Guard de ré-entrance** : `sync()` est un no-op si un drain est déjà en cours (`isSyncing() === true`).

**Consentement** : `enqueue()` et `sync()` sont des no-ops si `isConsentEnabled() === false`.

---

## Intégration dans un service de module

Pattern à suivre pour brancher un module existant sur la sync :

```typescript
// apps/mobile/src/services/scaleService.ts (exemple)
import { RemoteSyncService } from './sync'

export async function saveScaleEntry(entry: ScaleEntry): Promise<void> {
  // 1. Écriture SQLite (toujours en premier)
  await dbSaveScaleEntry(entry)

  // 2. Sync cloud (non-bloquant — fire and forget)
  void RemoteSyncService.getInstance().enqueue({
    local_id: entry.id,
    module_id: entry.scale_id,
    entry_kind: 'scale_entry',
    operation: 'upsert',
    payload: {
      scale_id: entry.scale_id,
      answers: entry.answers,
      total_score: entry.total_score,
      subscale_scores: entry.subscale_scores,
      created_at: entry.created_at,
    },
    client_created_at: entry.created_at,
  })
}

export async function deleteScaleEntry(id: string, entry: ScaleEntry): Promise<void> {
  await dbDeleteScaleEntry(id)

  void RemoteSyncService.getInstance().enqueue({
    local_id: id,
    module_id: entry.scale_id,
    entry_kind: 'scale_entry',
    operation: 'delete',
    payload: {},
    client_created_at: entry.created_at,
  })
}
```

---

## Déclenchement du sync

Le sync doit être appelé aux moments suivants (Phase 2 — non encore implémenté) :

```typescript
// Hook à placer dans le composant racine (App.tsx)
import { AppState } from 'react-native'
import { RemoteSyncService } from './services/sync'

useEffect(() => {
  const sub = AppState.addEventListener('change', state => {
    if (state === 'active') {
      void RemoteSyncService.getInstance().sync()
    }
  })
  return () => sub.remove()
}, [])
```

Pour la reconnexion réseau, utiliser `@react-native-community/netinfo` (non encore installé).

---

## Phases d'implémentation

| Phase | État | Description |
|---|---|---|
| **1 — Infrastructure** | ✅ Livré | `patient_entries` Supabase, `SyncOutboxStore`, `RemoteSyncService`, 26 tests |
| **2 — Dual-write modules** | 🔜 À faire | Modifier chaque service mobile pour appeler `enqueue()` après save/delete |
| **3 — Vue praticien** | 🔜 À faire | `PatientDataService` web + composants de visualisation neutre (sans interprétation) |

---

## Conformité MDR 2017/745

- **Aucun calcul côté serveur** — les payloads sont stockés bruts dans `patient_entries.payload`.
- **Pas d'alerte conditionnelle** — Supabase ne déclenche rien en fonction des valeurs reçues.
- **Affichage passif** — la Phase 3 affiche des historiques de chiffres bruts, sans label interprétatif ni seuil coloré.
- **Consentement** — la gate `isConsentEnabled` garantit que rien ne part sans accord explicite.
