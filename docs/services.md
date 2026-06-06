# Couche services — Web & Mobile

> Source de vérité des règles d'architecture : voir [`.claude/rules/coding-standards.md`](../.claude/rules/coding-standards.md) section *Architecture en couches*.

Kær sépare strictement la logique métier de l'affichage. **Les pages, écrans et composants ne contiennent jamais d'appel direct à Supabase, à SQLite ou à une API externe.** Tout passe par un service dédié, regroupé par domaine fonctionnel.

## Pourquoi cette couche

- **Réutilisation** — un même appel n'est jamais codé deux fois (ex. la liste des patients d'un praticien sert au dashboard *et* au dispensaire).
- **Testabilité** — un service est une fonction pure du point de vue de l'UI : on peut le mocker sans monter un faux client Supabase dans chaque test.
- **Lisibilité** — un écran de 600 lignes n'a plus besoin de parler `supabase.from('...')` ; il appelle `unlockModule(...)` ou `saveScaleEntry(...)`.
- **Conformité** — le service centralise la conversion `userInput → row insert`, ce qui aide à respecter [la règle d'or non-DM](../CLAUDE.md#règle-dor--statut-non-dispositif-médical-mdr-2017745) (le code affiche, jamais il ne conclut).

## Conventions communes

- Un fichier = un domaine. Nom en `camelCase` suffixé `Service.ts` (ex. `patientService.ts`).
- Fonctions exportées en `camelCase`, verbes au présent (`fetchX`, `saveX`, `unlockX`, `revokeX`).
- Types de retour explicites — on évite `any` et on préfère des unions discriminées (`{ ok: true } | { ok: false; message }`).
- Aucune dépendance React : un service est appelable depuis n'importe quel contexte (composant, store, autre service).
- Les clients infra (`supabase.ts`, `database.ts` SQLite) restent dans `src/lib/` — ils ne sont pas des services métier.
- Les utilitaires purs sans I/O (`dateUtils.ts`, `scaleScoring.ts`) restent aussi dans `src/lib/`.

## Partagé — `packages/shared/src/services/`

Quand une fonction de service est **strictement identique** entre web et mobile (mêmes tables, même logique, pas de SQLite ni de stockage natif), elle vit dans le package partagé et reçoit le client Supabase en paramètre. Les services par app gardent un wrapper trivial qui injecte leur client local — l'UI continue d'importer depuis son `services/moduleService.ts` habituel.

| Fichier | Domaine | Test |
|---|---|---|
| [`moduleFields.ts`](../packages/shared/src/services/moduleFields.ts) | `fetchModuleFields(client, moduleId)` — lecture du moteur générique (modules + module_content_fields + field_props avec hiérarchie parent/enfant) | [`moduleFields.test.ts`](../packages/shared/src/services/moduleFields.test.ts) — `npm run test:shared` |

**Règle pour ajouter un service partagé :**
1. La fonction doit prendre `client: SupabaseClient` comme premier argument — pas d'import direct.
2. Elle vit dans `packages/shared/src/services/<domaine>.ts` et est ré-exportée depuis `packages/shared/src/index.ts`.
3. Le test unitaire vit aux côtés du service (`<domaine>.test.ts` exécuté par Vitest).
4. Web et mobile exposent un wrapper d'une ligne : `return fetchX(supabase, ...args)` — pour que les composants n'aient jamais à connaître le client.
5. Si la logique diverge un jour (besoin SQLite mobile, cache web spécifique…), rapatrier dans l'app concernée et garder l'autre côté sur le partagé.

## Web — `apps/web/src/services/`

| Fichier | Domaine |
|---|---|
| [`authService.ts`](../apps/web/src/services/authService.ts) | Session praticien, login, register, mise à jour profil/langue, logout |
| [`patientService.ts`](../apps/web/src/services/patientService.ts) | Liste des patients (avec modules), header patient, options pour pickers, mode ado |
| [`moduleAssignmentService.ts`](../apps/web/src/services/moduleAssignmentService.ts) | Déblocage/révocation de modules, configuration psychoéducation/RIM, proposition d'échelle |
| [`invitationService.ts`](../apps/web/src/services/invitationService.ts) | Liste des invitations en attente, validation de token, envoi via edge function, signup patient |
| [`practitionerSettingsService.ts`](../apps/web/src/services/practitionerSettingsService.ts) | `practitioner_module_settings` (modules activés par praticien) |
| [`cssrsService.ts`](../apps/web/src/services/cssrsService.ts) | CRUD des évaluations C-SSRS |
| [`moduleService.ts`](../apps/web/src/services/moduleService.ts) | `fetchPsychoCards`, `fetchModulePreviewKind` (le `fetchModuleFields` partagé est ré-exporté depuis `@psytool/shared`) |
| [`moduleCatalogService.ts`](../apps/web/src/services/moduleCatalogService.ts) | Catégories + modules pour l'armoire thérapeutique et le formulaire d'invitation |
| [`moduleSourcesService.ts`](../apps/web/src/services/moduleSourcesService.ts) | `fetchSourcesByModule` (cache mémoire) + `clearModuleSourcesCache` — sources & recommandations d'un module ([doc](module-sources.md)) |
| [`caseloadService.ts`](../apps/web/src/services/caseloadService.ts) | File active praticien : `fetchCaseload` (assemble dossiers + actions + attentes), CRUD `caseload_entries` (création, édition inline, statut), `caseload_actions` (coche `setActionDone`…), `caseload_waits` (attentes de retour) et `caseload_notes` (observations : `fetchCaseloadNotes`/`createCaseloadNote`) + ré-export des fonctions pures de [`caseloadLogic.ts`](../apps/web/src/lib/caseloadLogic.ts). Spec : [`spec/file-active.md`](spec/file-active.md) |
| [`engagementService.ts`](../apps/web/src/services/engagementService.ts) | **Graphes d'évolution patient** (`PatientEvolutionTab`) : `fetchScaleEvolution` / `fetchMoodEvolution` / `fetchFearEvolution` / `fetchMedSideEffectsEvolution` / `fetchAvailableScales` — lit **`patient_entries.payload`** (filtré par RLS selon `patients.share_consent`). Affichage passif, zéro interprétation (MDR). |

> **Logique pure isolée** : `apps/web/src/lib/caseloadLogic.ts` ne dépend pas du client Supabase — alerte (`computeActionAlert`, `computeEntryAlert` = action ouverte la plus urgente), tri et liste « Aujourd'hui » y sont calculés (testables sans mock). Le service ne fait que l'accès aux données + ré-export. C'est le pattern à suivre pour toute logique métier dérivée (séparer le pur du réseau).

Le [`store/authStore.ts`](../apps/web/src/store/authStore.ts) est un thin wrapper Zustand : il délègue toutes les opérations Supabase à `authService.ts` et n'expose qu'un état réactif.

## Mobile — `apps/mobile/src/services/`

| Fichier | Domaine |
|---|---|
| [`authService.ts`](../apps/mobile/src/services/authService.ts) | Session patient, login, inscription via token (multi-étapes), teen context, logout |
| [`homeService.ts`](../apps/mobile/src/services/homeService.ts) | Liste des modules débloqués pour l'écran d'accueil, routines du jour, et `fetchModuleEvents(patientId, moduleType)` — événements praticien (`patient_modules.config.events`) |
| [`moduleService.ts`](../apps/mobile/src/services/moduleService.ts) | `fetchPatientModuleConfig` (le `fetchModuleFields` partagé est ré-exporté depuis `@psytool/shared`) |
| [`notificationService.ts`](../apps/mobile/src/services/notificationService.ts) | Permissions et planification des rappels (stubs Expo Go SDK 53+), `getAllRoutinesForPatient`, `pauseRoutine`/`resumeRoutine` (la pause écrit un événement dans `notification_events`) |
| [`avatarService.ts`](../apps/mobile/src/services/avatarService.ts) | Picker image, upload Supabase Storage, mise à jour `patients.avatar_url` |
| [`psychoeducationService.ts`](../apps/mobile/src/services/psychoeducationService.ts) | `markCardAsRead` — réécriture du JSONB `unlocked_cards` |
| [`syncHelpers.ts`](../apps/mobile/src/services/syncHelpers.ts) | `syncUpsert(dbFn, params)` + `syncDelete(dbFn, localId, moduleId, entryKind)` — helpers partagés par tous les services de données pour le dual-write SQLite + Supabase. |
| [`scaleEntryService.ts`](../apps/mobile/src/services/scaleEntryService.ts) | `saveScaleEntry`, `deleteScaleEntry` — questionnaires cliniques (PHQ-9, GAD-7, BSL-23…) |
| [`moodMarkerService.ts`](../apps/mobile/src/services/moodMarkerService.ts) | `getAllMoodMarkers`, `saveMoodMarker`, `deleteMoodMarker` — repères temporels (Life Chart) du thermomètre de l'humeur |
| [`sleepDiaryService.ts`](../apps/mobile/src/services/sleepDiaryService.ts) | `saveSleepEntry`, `deleteSleepEntry` — agenda du sommeil |
| [`formEntryService.ts`](../apps/mobile/src/services/formEntryService.ts) | `saveFormEntry`, `deleteFormEntry` — formulaires multi-colonnes (Beck, craving) |
| [`dailyEntryService.ts`](../apps/mobile/src/services/dailyEntryService.ts) | `saveDailyEntry`, `deleteDailyEntry` — saisies quotidiennes (observance) |
| [`treeSelectionService.ts`](../apps/mobile/src/services/treeSelectionService.ts) | `saveTreeSelection`, `deleteTreeSelection` — sélecteurs hiérarchiques (roue des émotions) |
| [`planItemService.ts`](../apps/mobile/src/services/planItemService.ts) | `savePlanItem`, `deletePlanItem`, `setModuleSetting` — plans éditables + settings module |
| [`activityRecordService.ts`](../apps/mobile/src/services/activityRecordService.ts) | `saveActivityRecord`, `deleteActivityRecord` — activation comportementale |
| [`fearTrackerService.ts`](../apps/mobile/src/services/fearTrackerService.ts) | `saveFearEntry`, `deleteFearEntry`, `saveFearSituation`, `deleteFearSituation`, `createExposureHierarchy`, `deleteExposureHierarchy` |
| [`breathingService.ts`](../apps/mobile/src/services/breathingService.ts) | `saveBreathingSession` — techniques de respiration |

Le [`store/authStore.ts`](../apps/mobile/src/store/authStore.ts) est un thin wrapper Zustand qui délègue à `authService.ts`.

### Sous-dossier `services/sync/`

| Fichier | Domaine |
|---|---|
| [`sync/RemoteSyncService.ts`](../apps/mobile/src/services/sync/RemoteSyncService.ts) | Singleton. Draine `sync_outbox` (SQLite) vers `patient_entries` (Supabase) par batchs de 50. Gate de consentement MDR, guard de ré-entrance, retry jusqu'à 5×. Voir [docs/patient-data-sync.md](patient-data-sync.md). |

La table `sync_outbox` (SQLite) est gérée par `SyncOutboxStore` dans `src/lib/syncOutbox.ts` — c'est un client infra, pas un service métier.

> **Historique** — le `engagementService.logEvent` mobile et la table `patient_engagement_logs`
> ont été **supprimés** (2026-06-04). Les saisies cliniques (et donc l'observance, dérivée en
> comptant les lignes) vivent désormais dans `patient_entries` via `syncUpsert`. Les événements
> de notification (pause des rappels) vivent dans `notification_events`. Plus aucun « signal
> d'observance » séparé à émettre.

## Pattern : ajout d'un nouveau service

1. Créer `apps/<app>/src/services/xxxService.ts` avec une seule responsabilité.
2. Exporter des fonctions typées et des types nommés (`Foo`, `FooDraft`, `FooResult`).
3. Importer `supabase` depuis `../lib/supabase` (jamais réinstancier le client).
4. Si le service a une logique non triviale (parsing, transformation), couvrir avec un test Jest/Vitest dédié au service.
5. Mettre à jour ce document si une nouvelle responsabilité émerge (auth, paiement, etc.).

## Ce qui ne va PAS dans `services/`

- Hooks React (`useXxx`) → dans `src/hooks/`.
- Composants visuels → dans `src/components/` ou `src/screens/`.
- Stores Zustand → dans `src/store/` ; ils consomment les services, ne les remplacent pas.
- Types métier purs partagés entre web et mobile → dans `packages/shared`.
- Constantes statiques (échelles, configs scoring) → dans `src/data/` (web) ou `src/constants/` (mobile).
