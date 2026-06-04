# Sync des données patient vers Supabase

## Vue d'ensemble

Les données d'exercices patient (questionnaires, journaux, formulaires, etc.) sont historiquement stockées uniquement en SQLite local sur l'appareil. Ce document décrit l'architecture de synchronisation vers Supabase qui permet :

- La **sauvegarde cloud** des données (multi-appareil, perte d'appareil)
- La **lecture praticien** des données de ses patients depuis le tableau de bord web

## Principes fondamentaux

### 1. SQLite-first (offline-first)

L'écriture se fait toujours en SQLite en premier. Supabase est alimenté de façon asynchrone. L'app est 100 % fonctionnelle sans connexion.

### 2. Consentement piloté par un flag de profil (MDR 2017/745)

Le partage est gouverné par le flag **`patients.share_consent`** (opt-out, `default true`), **contrôlé par le patient** depuis ses réglages (`ProfileScreen` → `authStore.setShareConsent`). Ce flag :

- est chargé au login (`fetchTeenContext`) et alimente `RemoteSyncService.setConsentEnabled(flag)` — `enqueue()`/`sync()` restent des no-ops si le flag est `false` ;
- **filtre aussi la RLS** de lecture praticien sur `patient_entries` (défense en profondeur) : un patient qui coupe le partage devient invisible côté praticien, sans condition à coder dans l'app web.

> **État au 2026-06-04 :** flag opt-out `default true` (les saisies remontent tant que le patient ne coupe pas). Un vrai écran de consentement explicite (opt-in) reste à arbitrer pour la mise en production — cf. [`TODO.md`](../TODO.md) §3.

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

Utiliser les helpers `syncUpsert` / `syncDelete` de `syncHelpers.ts` — ils encapsulent le lazy require, le fire-and-forget, `operation` et `client_created_at`.

```typescript
// apps/mobile/src/services/scaleEntryService.ts
import { saveScaleEntry as dbSave, deleteScaleEntry as dbDelete, type ScaleEntry } from '../lib/database'
import { syncUpsert, syncDelete } from './syncHelpers'

export async function saveScaleEntry(entry: ScaleEntry): Promise<void> {
  await syncUpsert(() => dbSave(entry), {
    local_id: entry.id,
    module_id: entry.scale_id,
    entry_kind: 'scale_entry',
    payload: {
      scale_id: entry.scale_id,
      answers: entry.answers,
      total_score: entry.total_score,
      subscale_scores: entry.subscale_scores,
    },
  })
}

export async function deleteScaleEntry(id: string): Promise<void> {
  await syncDelete(() => dbDelete(id), id, 'scale', 'scale_entry')
}
```

### `syncHelpers.ts` — `apps/mobile/src/services/syncHelpers.ts`

| Fonction | Rôle |
|---|---|
| `syncUpsert(dbFn, params)` | Attend `dbFn()`, puis enqueue un upsert fire-and-forget. Ajoute `operation: 'upsert'` et `client_created_at` automatiquement. |
| `syncDelete(dbFn, localId, moduleId, entryKind)` | Attend `dbFn()`, puis enqueue un delete avec `payload: {}`. |

Les deux fonctions utilisent un **lazy `require('./sync')`** : `RemoteSyncService` n'est jamais chargé au moment du montage du module, uniquement lors de l'appel (compatible tests Jest).

---

## Déclenchement du sync

Le hook `useSyncOnForeground` (`apps/mobile/src/hooks/useSyncOnForeground.ts`) déclenche `sync()` à chaque retour en foreground. Il est monté dans `Navigation` (composant racine) :

```typescript
// apps/mobile/src/hooks/useSyncOnForeground.ts
import { AppState } from 'react-native'
import { RemoteSyncService } from '../services/sync'

export function useSyncOnForeground(): void {
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active') void RemoteSyncService.getInstance().sync()
    })
    return () => sub.remove()
  }, [])
}
```

Pour la reconnexion réseau, utiliser `@react-native-community/netinfo` (non encore installé).

---

## Phases d'implémentation

| Phase | État | Description |
|---|---|---|
| **1 — Infrastructure** | ✅ Livré | `SyncOutboxStore`, `RemoteSyncService`, 26 tests. ⚠️ La table `patient_entries` n'a été **appliquée en prod que le 2026-06-04** (elle existait dans `schema.sql` mais n'avait jamais été exécutée — d'où le gap historique). |
| **2 — Dual-write modules** | ✅ Livré | `syncUpsert`/`syncDelete` helpers, 9 services + crisis + motivational, hook foreground, 54 tests |
| **3 — Vue praticien** | 🟡 Partiel | Les **graphes d'évolution** (`PatientEvolutionTab` + `apps/web/src/services/engagementService.ts`) lisent `patient_entries.payload` (échelles, mood, fear, effets indésirables). Reste : vues neutres pour les modules non encore graphés (sommeil, Beck, émotions…). |

## Historique — suppression de `patient_engagement_logs`

Avant la bascule, les graphes praticien lisaient une table d'« événements » distincte,
`patient_engagement_logs` (`event_type` + `metadata` léger), alimentée directement par
`engagementService.logEvent` (mobile) et `notificationService.logScaleSubmission`.

Le 2026-06-04, cette table a été **supprimée** et le système consolidé :
- Les saisies cliniques (et l'observance, dérivée en comptant les lignes) vivent dans **`patient_entries`** (payload complet, offline-first, idempotent). Les 416 lignes de démo ont été backfillées.
- Les **événements de notification** (`NOTIFICATION_PAUSED`, alimentant le flux d'activité praticien) vivent dans la table dédiée **`notification_events`** — concept distinct des saisies.
- `engagementService.logEvent` (mobile) et `logScaleSubmission` ont été supprimés ; les layouts/écrans n'émettent plus de signal séparé.

---

## Conformité MDR 2017/745

- **Aucun calcul côté serveur** — les payloads sont stockés bruts dans `patient_entries.payload`.
- **Pas d'alerte conditionnelle** — Supabase ne déclenche rien en fonction des valeurs reçues.
- **Affichage passif** — la Phase 3 affiche des historiques de chiffres bruts, sans label interprétatif ni seuil coloré.
- **Consentement** — la gate `isConsentEnabled` garantit que rien ne part sans accord explicite.
