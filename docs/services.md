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
| [`rhythmogram.ts`](../packages/shared/src/services/rhythmogram.ts) | Helper PUR (pas de client) du « rythmogramme » chronobiologique : `buildRhythmogram(entries, anchorKeys, year, month)` → séries heure×jour d'un mois, écart-type circulaire par repère, repères de début de semaine. + `minutesToHourLabel` / `minutesToClock`. Partagé pour une visualisation identique web (Recharts) ≡ mobile (SVG). MDR : horaires bruts, aucune interprétation. | [`rhythmogram.test.ts`](../packages/shared/src/services/rhythmogram.test.ts) |

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
| [`patientRefService.ts`](../apps/web/src/services/patientRefService.ts) | `resolvePatientRef` — résout l'identifiant public opaque de l'URL (`public_ref`) vers le `patient_id` réel. Défense en profondeur (masque la PK), la RLS reste la barrière. Voir [`spec/patient-public-ref.md`](spec/patient-public-ref.md). |
| [`moduleAssignmentService.ts`](../apps/web/src/services/moduleAssignmentService.ts) | Déblocage/révocation de modules, configuration psychoéducation/RIM, proposition d'échelle, effets suivis (`fetchTrackedEffects`/`updateTrackedEffects`), liste de médicaments (`fetchMedications`/`updateMedications`) |
| [`invitationService.ts`](../apps/web/src/services/invitationService.ts) | Liste des invitations en attente, validation de token, envoi via edge function, signup patient |
| [`practitionerSettingsService.ts`](../apps/web/src/services/practitionerSettingsService.ts) | `practitioner_module_settings` (modules activés par praticien) |
| [`cssrsService.ts`](../apps/web/src/services/cssrsService.ts) | CRUD des évaluations C-SSRS |
| [`moduleService.ts`](../apps/web/src/services/moduleService.ts) | `fetchPsychoCards`, `fetchModulePreviewKind` (le `fetchModuleFields` partagé est ré-exporté depuis `@kaer/shared`) |
| [`moduleCatalogService.ts`](../apps/web/src/services/moduleCatalogService.ts) | Catégories + modules pour l'armoire thérapeutique et le formulaire d'invitation ; `fetchModuleTaxonomy` (axes/tags/liaisons `tag_dimensions`+`tags`+`module_tags` pour les filtres par facettes — [`spec/module-taxonomy.md`](spec/module-taxonomy.md)) |
| [`moduleSourcesService.ts`](../apps/web/src/services/moduleSourcesService.ts) | `fetchSourcesByModule` (cache mémoire) + `clearModuleSourcesCache` — sources & recommandations d'un module ([doc](module-sources.md)) |
| [`caseloadService.ts`](../apps/web/src/services/caseloadService.ts) | File active praticien : `fetchCaseload` (assemble dossiers + actions + attentes), `syncCaseloadWithPatients` (crée un dossier lié pour chaque patient app — auto, idempotent), CRUD `caseload_entries` (création, édition inline, statut), `caseload_actions` (coche `setActionDone`…), `caseload_waits` (attentes de retour) et `caseload_notes` (observations : `fetchCaseloadNotes`/`createCaseloadNote`) + ré-export des fonctions pures de [`caseloadLogic.ts`](../apps/web/src/lib/caseloadLogic.ts). Spec : [`spec/file-active.md`](spec/file-active.md) |
| [`engagementService.ts`](../apps/web/src/services/engagementService.ts) | **Graphes d'évolution patient** (`PatientEvolutionTab`) : `fetchScaleEvolution` / `fetchMoodEvolution` / `fetchFearEvolution` / `fetchMedSideEffectsEvolution` / `fetchAvailableScales` — lit **`patient_entries.payload`** (filtré par RLS selon `patients.share_consent`). **Panneau « Données » d'une card module** (`PatientModulesTab` → `ModuleDataPanel`) : graphe d'évolution pour les modules à séries temporelles (mêmes fetchers que ci-dessus), sinon `fetchModuleSummary(patientId, moduleType)` → `{ lastDate, count, lastPayload }` (filtre par `module_id` seul, tri desc) rendu en tableau (`ModuleSummaryPanel`). Affichage passif, zéro interprétation (MDR). |
| [`patientDataRightsService.ts`](../apps/web/src/services/patientDataRightsService.ts) | **Droits patient RGPD** : `exportPatientData` (RPC `export_patient_data` → JSON brut) et `erasePatientData` (RPC `erase_patient_data` + Edge Function `delete-patient-account`). Voir [`rgpd-droits-patient.md`](rgpd-droits-patient.md). |
| [`adminService.ts`](../apps/web/src/services/adminService.ts) | **Gestion des utilisateurs (admin)** : `fetchAllUsers` (RPC `admin_list_users`, admin-only + audité) — patients ET médecins avec discriminant `kind`. Alimente `AdminUsersPage`. Voir [`spec/admin-users.md`](spec/admin-users.md). |
| [`appointmentService.ts`](../apps/web/src/services/appointmentService.ts) | Disponibilités (`fetchAvailabilityRules`, `saveAvailabilityRule`, `deleteAvailabilityRule`), exceptions (`fetchExceptions`, `upsertException`), RDV (`fetchAppointmentsForPatient`, `fetchAppointmentsForWeek`, `createAppointment`, `updateAppointmentStatus`, `updateAppointmentNotes`), paramètre auto-confirm. Fonctions pures : `computeAvailableSlots`, `jsDayToSchema`, `timeToMinutes`, `timesOverlap`. |
| [`auditService.ts`](../apps/web/src/services/auditService.ts) | `logDataAccess` — journal d'audit RGPD/HDS (`access_audit_log`). Voir [`audit-log.md`](audit-log.md). |
| [`avatarService.ts`](../apps/web/src/services/avatarService.ts) | `uploadPractitionerAvatar`, `savePractitionerAvatarUrl` — photo de profil praticien (bucket Supabase Storage `avatars`). |
| [`crisisPlanService.ts`](../apps/web/src/services/crisisPlanService.ts) | Config plan de crise praticien : `fetchCrisisPlanConfig` (cache mémoire), `saveCrisisPlanConfig` — pilote les widgets `crisis_anchors_preview`, `crisis_coping_cards_preview`, `crisis_commitment_preview` dans `EditableStepsLayout`. |
| [`noteService.ts`](../apps/web/src/services/noteService.ts) | Notes praticien : `fetchNotes`, `saveNote`, `updateNote`, `deleteNote` + utilitaires purs `extractUniqueTags`, `extractTopTags`. Table `practitioner_patient_notes`. Voir [`practitioner-notes.md`](practitioner-notes.md). |
| [`notificationRoutineService.ts`](../apps/web/src/services/notificationRoutineService.ts) | CRUD routines de notification par module : `getRoutinesForPatientModule`, `createRoutine`, `updateRoutine`, `deleteRoutine`, `getActivityFeed`. Tables `notification_routines` + `notification_events`. |
| [`psyeduService.ts`](../apps/web/src/services/psyeduService.ts) | `fetchTopicsByModule`, `fetchBlocksByTopic`, `clearPsyEduCache` — contenu psychoéducatif (tables `psyedu_topics` + `psyedu_blocks`). Cache mémoire intégré. |
| [`renderDiagnosticsService.ts`](../apps/web/src/services/renderDiagnosticsService.ts) | `reportRenderMismatch` — signale un non-match du moteur de rendu à l'Edge Function `report-render-mismatch` (**fire-and-forget**, ne casse jamais le rendu). Voir [`render-diagnostics.md`](render-diagnostics.md). |
| [`scaleService.ts`](../apps/web/src/services/scaleService.ts) | `fetchScaleMeta` — lit `module_content_fields` (`field_type='scale_meta'`) + `field_props` pour assembler les métadonnées des échelles cliniques (`ScaleMetaRow[]`). Remplace l'ancien tableau statique `CLINICAL_SCALES`. |
| [`speechRecorderService.ts`](../apps/web/src/services/speechRecorderService.ts) | `SpeechRecorder` — capture audio micro, gestion de l'état (`idle` / `recording` / `processing` / `error`). Voir [`spec/speech-to-text.md`](spec/speech-to-text.md). |
| [`supportService.ts`](../apps/web/src/services/supportService.ts) | `submitSupportRequest` — insère une demande de support (`support_requests`) et déclenche l'email Resend. Voir [`support-requests.md`](support-requests.md). |
| [`transcriptionService.ts`](../apps/web/src/services/transcriptionService.ts) | `transcribeAudio` — envoie le blob audio à l'Edge Function de transcription et retourne le texte (`TranscriptionResult`). Voir [`spec/speech-to-text.md`](spec/speech-to-text.md). |

> **Logique pure isolée** : `apps/web/src/lib/caseloadLogic.ts` ne dépend pas du client Supabase — alerte (`computeActionAlert`, `computeEntryAlert` = action ouverte la plus urgente), tri et liste « Aujourd'hui » y sont calculés (testables sans mock). Le service ne fait que l'accès aux données + ré-export. C'est le pattern à suivre pour toute logique métier dérivée (séparer le pur du réseau).

Le [`store/authStore.ts`](../apps/web/src/store/authStore.ts) est un thin wrapper Zustand : il délègue toutes les opérations Supabase à `authService.ts` et n'expose qu'un état réactif.

## Mobile — `apps/mobile/src/services/`

| Fichier | Domaine |
|---|---|
| [`authService.ts`](../apps/mobile/src/services/authService.ts) | Session patient, login, inscription via token (multi-étapes), teen context, logout |
| [`homeService.ts`](../apps/mobile/src/services/homeService.ts) | Liste des modules débloqués pour l'écran d'accueil, routines du jour, et `fetchModuleEvents(patientId, moduleType)` — événements praticien (`patient_modules.config.events`) |
| [`moduleService.ts`](../apps/mobile/src/services/moduleService.ts) | `fetchPatientModuleConfig` (le `fetchModuleFields` partagé est ré-exporté depuis `@kaer/shared`) |
| [`notificationService.ts`](../apps/mobile/src/services/notificationService.ts) | Permissions et planification des rappels (stubs Expo Go SDK 53+), `getAllRoutinesForPatient`, `pauseRoutine`/`resumeRoutine` (la pause écrit un événement dans `notification_events`) |
| [`avatarService.ts`](../apps/mobile/src/services/avatarService.ts) | Picker image, upload Supabase Storage, mise à jour `patients.avatar_url` |
| [`psychoeducationService.ts`](../apps/mobile/src/services/psychoeducationService.ts) | `markCardAsRead` — réécriture du JSONB `unlocked_cards` |
| [`renderDiagnosticsService.ts`](../apps/mobile/src/services/renderDiagnosticsService.ts) | `reportRenderMismatch`, `flushRenderMismatchOutbox` — signale un non-match du moteur de rendu (offline-first : file SQLite `render_mismatch_outbox` drainée au foreground). **Télémétrie technique, pas de donnée patient** → exception légitime à `syncHelpers`. Voir [`render-diagnostics.md`](render-diagnostics.md). |
| [`syncHelpers.ts`](../apps/mobile/src/services/syncHelpers.ts) | `syncUpsert(dbFn, params)` + `syncDelete(dbFn, localId, moduleId, entryKind)` — helpers partagés par tous les services de données pour le dual-write SQLite + Supabase. |
| [`scaleEntryService.ts`](../apps/mobile/src/services/scaleEntryService.ts) | `saveScaleEntry`, `deleteScaleEntry` — questionnaires cliniques (PHQ-9, GAD-7, BSL-23…) |
| [`moodMarkerService.ts`](../apps/mobile/src/services/moodMarkerService.ts) | `getAllMoodMarkers`, `saveMoodMarker`, `deleteMoodMarker` — repères temporels (Life Chart) du thermomètre de l'humeur |
| [`sleepDiaryService.ts`](../apps/mobile/src/services/sleepDiaryService.ts) | `saveSleepEntry`, `deleteSleepEntry` — agenda du sommeil |
| [`formEntryService.ts`](../apps/mobile/src/services/formEntryService.ts) | `saveFormEntry`, `deleteFormEntry` — formulaires multi-colonnes (Beck, craving) |
| [`dailyEntryService.ts`](../apps/mobile/src/services/dailyEntryService.ts) | `saveDailyEntry`, `deleteDailyEntry` — saisies quotidiennes (statut global observance, + `reason`) |
| [`medicationIntakeService.ts`](../apps/mobile/src/services/medicationIntakeService.ts) | `saveMedicationIntake`, `deleteMedicationIntake`, `getMedicationIntakes` — détail de prise par molécule (`medication_intakes`) + sync |
| [`medicationListService.ts`](../apps/mobile/src/services/medicationListService.ts) | `fetchMedications`, `updateMedications` — liste de molécules co-éditée patient↔praticien (`patient_modules.config.medications`) |
| [`treeSelectionService.ts`](../apps/mobile/src/services/treeSelectionService.ts) | `saveTreeSelection`, `deleteTreeSelection` — sélecteurs hiérarchiques (roue des émotions) |
| [`planItemService.ts`](../apps/mobile/src/services/planItemService.ts) | `savePlanItem`, `deletePlanItem`, `setModuleSetting` — plans éditables + settings module |
| [`activityRecordService.ts`](../apps/mobile/src/services/activityRecordService.ts) | `saveActivityRecord`, `deleteActivityRecord` — activation comportementale |
| [`fearTrackerService.ts`](../apps/mobile/src/services/fearTrackerService.ts) | `saveFearEntry`, `deleteFearEntry`, `saveFearSituation`, `deleteFearSituation`, `createExposureHierarchy`, `deleteExposureHierarchy` |
| [`breathingService.ts`](../apps/mobile/src/services/breathingService.ts) | `fetchBreathingTechniques` (config-first, lue en base), `fetchBreathingSessions`, `saveBreathingSession` — techniques de respiration |
| [`patientDataRightsService.ts`](../apps/mobile/src/services/patientDataRightsService.ts) | **Droits patient RGPD (self-service)** : `exportMyData` (RPC → JSON partagé) et `eraseMyAccount` (RPC + Edge Function + `purgeAllLocalData` + `signOut`). Exception légitime à `syncHelpers` (suppression totale, pas une entrée). Voir [`rgpd-droits-patient.md`](rgpd-droits-patient.md). |
| [`appointmentService.ts`](../apps/mobile/src/services/appointmentService.ts) | Lecture des RDV patient (`fetchPatientAppointments`), règles de disponibilité praticien (`fetchPractitionerRules`, `fetchPractitionerExceptions`) pour affichage dans `TodaySchedule`. Fonctions pures : `computeAvailableSlots`. |
| [`crisisPlanService.ts`](../apps/mobile/src/services/crisisPlanService.ts) | Plan de crise patient : ancres photos (`getAnchors`, `pickAndSaveAnchorPhoto`, `removeAnchorPhoto`, `getAnchorPhrase`, `saveAnchorPhrase`), engagement thérapeutique (`getCommitment`), config praticien (`fetchPractitionerConfig`). |
| [`motivationalBalanceService.ts`](../apps/mobile/src/services/motivationalBalanceService.ts) | Balance motivationnelle EM : CRUD `EMRuler` (`saveEMRuler`, `listEMRulers`, `deleteEMRuler`), `EMBalanceItem` (`saveEMBalanceItem`, `listEMBalanceItems`, `deleteEMBalanceItem`), valeurs personnelles (`saveEMValues`, `listEMValues`). |
| [`patientProfileService.ts`](../apps/mobile/src/services/patientProfileService.ts) | `updatePatientProfile` — mise à jour des informations de profil patient (`patients`). |
| [`sideEffectsConfigService.ts`](../apps/mobile/src/services/sideEffectsConfigService.ts) | `fetchTrackedEffects`, `updateTrackedEffects` — effets secondaires suivis par le patient (config `medication_side_effects`). |

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

## Cache des lectures — TanStack Query (`src/hooks/queries/`)

> Le client `supabase-js` **ne cache rien** : c'est un wrapper `fetch` sur PostgREST.
> Sans couche de cache, chaque montage d'écran refait la requête réseau et deux
> composants demandant la même donnée déclenchent deux appels. C'est
> [TanStack Query](https://tanstack.com/query) (`@tanstack/react-query` v5) qui
> apporte déduplication, cache mémoire et revalidation — sur les **deux apps**.

**Périmètre.** TanStack Query couvre les **lectures réseau** (Supabase). Il ne
remplace **pas** le stockage offline-first SQLite des saisies patient (services
`scaleEntryService`, `sleepDiaryService`, etc. via `syncHelpers`) : celles-ci
restent locales et ne passent pas par ce cache.

**Où.** Le `QueryClient` est configuré dans `src/lib/queryClient.ts` (par app) et
le `QueryClientProvider` enveloppe l'app (`main.tsx` web, `App.tsx` mobile). Les
factories de query vivent dans `src/hooks/queries/<domaine>Queries.ts`, re-exportées
par `src/hooks/queries/index.ts` (point d'import unique).

**Forme — factories `queryOptions`, pas un hook par fonction.** Chaque domaine
exporte UN objet `<domaine>Queries` de factories `queryOptions` : la clé et le
`queryFn` sont déclarés une seule fois, et n'importe quel composant fait
`useQuery(homeQueries.unlockedModules(id))`. **Pas de god-class** qui centralise
tous les appels (couplage, pas de tree-shaking) : un fichier par domaine, ta règle
« un fichier = une responsabilité » tient.

**Règle d'or — le `queryFn` appelle un service, jamais Supabase.** La factory ne
contient pas de SQL ni d'appel `supabase.*` : elle délègue au service fonctionnel.
La règle « zéro Supabase dans un composant » reste intacte.

```ts
// src/hooks/queries/homeQueries.ts
import { queryOptions } from '@tanstack/react-query'
import { fetchUnlockedModules } from '../../services/homeService'

export const homeQueries = {
  unlockedModules: (patientId: string | undefined) =>
    queryOptions({
      queryKey: ['home', 'unlockedModules', patientId ?? ''],
      queryFn: () => fetchUnlockedModules(patientId!),
      enabled: patientId != null,   // pas de fetch tant que l'id n'est pas connu
    }),
}

// composant : useQuery(homeQueries.unlockedModules(patient?.id))
// invalidation : queryClient.invalidateQueries({ queryKey: homeQueries.unlockedModules(id).queryKey })
```

**Conventions.**
- **Clés** : portées par la factory `queryOptions` → `xxxQueries.machin(id).queryKey`
  réutilisable tel quel pour invalider (`invalidateQueries`) ou patcher
  (`setQueryData`, typé via la clé brandée v5) exactement la donnée affichée.
- **Mutations** : restent des hooks `useMutation` (besoin du `queryClient`), exportés
  dans le même fichier de domaine ; `onSuccess` invalide ou patche les queries impactées.
- **`enabled`** : désactiver la query tant qu'un paramètre requis est indéfini.
- **État éditable amorcé du serveur** (note générale, Set de modules activés) : reste
  un `useState` local, amorcé UNE FOIS via un effet gardé par un `ref` quand la query
  réussit. Ne pas re-piloter un champ que l'utilisateur édite directement par la query.

**Exceptions — quand ne PAS migrer vers TanStack Query :**
- **`queryFn` doit être une lecture pure.** Un écran dont le « chargement » déclenche
  une **écriture** (ex. `FileActivePage` → `syncCaseloadWithPatients` puis re-fetch
  conditionnel) ne passe pas par une query : y forcer reviendrait à écrire dans un
  `queryFn` (anti-pattern). Il garde son orchestration `useEffect` + `useState`.
- **Pas de lecture cacheable.** Un écran dont les données viennent du store
  (`ProfileScreen` → `authStore`) et qui ne fait que des actions one-shot
  (upload, export, effacement) n'a aucune query à migrer.

Documenter le choix en commentaire à chaque exception.
- **`isLoading` vs `isPending`** : afficher le spinner via `isLoading`
  (`= isPending && isFetching`), faux quand la query est désactivée — `isPending`
  seul resterait vrai et bloquerait l'écran.
- **Focus mobile** : `useRefreshOnFocus(refetch)` (`src/hooks/`) rétablit le
  rafraîchissement au retour sur un écran d'une stack React Navigation (qui ne se
  démonte pas), sans casser la déduplication apportée par `staleTime`.
- **Tests** : chaque hook se teste avec `renderHook` + un `QueryClientProvider`
  enveloppant (client neuf, `retry: false`), service mocké. Tout écran qui rend un
  composant utilisant un hook de query doit être enveloppé d'un `QueryClientProvider`
  dans son test.

### Config quasi-statique = cache infini via React Query (web)

> Web praticien uniquement. Voir l'epic #104 et le ticket #99.

Toute lecture de config quasi-statique passe par React Query avec les options
partagées `CONFIG_QUERY_OPTIONS` (`src/hooks/queries/configCache.ts`) :
`staleTime: Infinity`, `gcTime: Infinity`, `meta.configScoped: true`. Concernées :
`moduleQueries.fields`, `scaleQueries.meta`, `moduleSourcesQueries.byModule`,
`psyeduQueries.*`, `referenceQueries.professionalTitles`, et les référentiels
`catalogQueries` (`categories`, `comingSoonIds`, `previewKind`).

- **Zéro fetch en `useEffect`.** Un composant qui a besoin de config appelle
  `useQuery(xxxQueries.y())`. Les anciens `useEffect` + `setState` (ModulePreviewPanel,
  PatientModulesTab, LoginPage, ModuleSourcesPanel, layouts psyedu) ont été supprimés.
- **React Query est l'UNIQUE couche de cache.** Aucun cache `Map` module-level dans
  les services (retirés de `psyeduService` et `moduleSourcesService`) : un cache local
  masquerait l'invalidation par jeton (la config resterait figée malgré un re-seed).
- **Fraîcheur** : le jeton de version (ci-dessous) invalide en bloc ces queries quand
  la config change en base — le `staleTime: Infinity` ne fige donc jamais durablement.
- **Défaut global inchangé.** Le `queryClient` garde ses défauts (30 s / 5 min) pour
  les données praticien volatiles ; seules les queries de config passent en infini.
- **Tests** : composant enveloppé par le helper `src/test/renderWithClient.tsx`
  (`QueryClientProvider` neuf, `retry: false`) ; un client partagé entre deux montages
  vérifie la déduplication (2e montage = 0 fetch).

### Lectures patient volatiles = React Query + invalidation à l'écriture (web)

> Web praticien uniquement. Voir l'epic #104 et le ticket #100.

Contrairement à la config, les données patient **changent quand le praticien écrit** :
elles n'ont donc **pas** de cache infini (staleTime par défaut 30 s), et la fraîcheur
vient de l'**invalidation à l'écriture**, pas d'une péremption longue. Factories :
`crisisQueries.planConfig`, `cssrsQueries.assessments`,
`notificationRoutineQueries.byPatientModule`, `caseloadQueries.rows`,
`activityFeedQueries.feed`.

- **Écriture = `useMutation` + `onSuccess: invalidateQueries`.** La mutation invalide
  la clé de la lecture concernée → refetch et fraîcheur immédiate (ex. le modal des
  rappels invalide `notificationRoutineQueries.byPatientModule` après create/toggle/delete).
- **Mise à jour optimiste** quand la feuille le faisait déjà : `FileActivePage` remplace
  ses anciens `setRows(prev => …)` par `queryClient.setQueryData(caseloadQueries.rows(id).queryKey, …)`
  au succès, et n'invalide (`invalidateQueries`) qu'en cas d'erreur pour resynchroniser.
- **Réutilisation des référentiels** : `FileActivePage` lit les patients via
  `dashboardQueries.patients` et les icônes via `catalogQueries.categories` (cache infini
  de #99) plutôt qu'un fetch dédié.
- **React Query = unique couche de cache** : le cache `Map` de `crisisPlanService` a été
  retiré (il déduplicait les 3 widgets d'aperçu et masquait l'invalidation — c'est
  désormais la clé partagée `crisisQueries.planConfig` qui déduplique).
- **`ActivityFeedPanel`** : migré aussi (pas de polling réel) ; le badge « nouveauté »
  est **dérivé pendant le render** (plus de `setState` piloté par le fetch).

### Invalidation de la config par jeton de version (ETag applicatif)

> Web praticien uniquement. Voir l'epic #104 et le ticket #102.

La config est **quasi-statique** : `module_content_fields`, `field_props`, `psyedu_*`,
échelles, référentiels ne changent qu'au **re-seed / déploiement**, jamais via une
écriture cliente. Le web est lecteur pur : il n'a donc **aucun événement** pour savoir
quand invalider son cache. On veut un cache très agressif **sans** jamais afficher du
périmé, et **sans** coupler l'invalidation au déploiement (ce qui casserait config-first :
« ajouter une échelle = INSERT en base, zéro redéploiement »).

**Mécanisme — un jeton de version, joué comme un ETag :**

- **Base** : la table singleton `app_config_meta(config_version, updated_at)` porte un
  jeton unique. Le `seed.sql` le **bump** en toute fin (`config_version = now()::text`) :
  tout re-seed de contenu produit un nouveau jeton. RLS : lecture réservée aux praticiens
  authentifiés, **aucune** écriture cliente (bump via seed / `service_role`).
- **Lecture** : `configVersionService.fetchConfigVersion()` → `configVersionQueries.current()`
  (`['configVersion']`). C'est le **seul** référentiel qu'on revalide souvent (`staleTime`
  court + `refetchOnWindowFocus`) — il ne pèse qu'une string. Hook prêt à l'emploi :
  `useConfigVersion()`.
- **Usage (#99)** : injecter le jeton dans les `queryKey` de config
  (`['module', 'fields', moduleId, configVersion]`). Tant que le jeton ne bouge pas,
  la clé est stable → **0 refetch**, `staleTime` long conservé. Dès qu'un re-seed bump
  le jeton, la clé change → refetch ciblé de la config, **sans redéploiement**.

> **Push vs pull.** Ce jeton (pull) convient à la config : froide, globale, tolérante à
> la latence. Les **données patient** (chaudes, ciblées, urgentes) utilisent au contraire
> l'invalidation sur écriture (#100) et le Realtime (#103). Apparier le mécanisme au
> profil de la donnée, pas chercher l'uniformité.
