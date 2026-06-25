# Documentation Kær

Index général de la documentation du monorepo. Pour le contexte projet, voir [`CLAUDE.md`](../CLAUDE.md) à la racine.

## Convention d'organisation

- **`docs/`** — documentation transversale au monorepo (architecture, BDD, flux métier, moteur de modules, modules thérapeutiques)
- **`apps/<app>/docs/`** — documentation spécifique à une application (design system propre, composants UI internes)
- **`docs/modules/<module_id>.md`** — un fichier par module thérapeutique implémenté
- **Pas de design system à la racine** : chaque app maintient son propre `apps/<app>/docs/design-system.md`

## Documentation transversale

| Document | Contenu |
|---|---|
| [`architecture.md`](architecture.md) | Vue d'ensemble technique du monorepo |
| [`database.md`](database.md) | Schéma de la base de données et conventions |
| [`setup.md`](setup.md) | Installation, configuration et lancement |
| [`invitation-flow.md`](invitation-flow.md) | Flux complet d'invitation patient (web ↔ email ↔ mobile) |
| [`module-engine.md`](module-engine.md) | Circuit module : schéma SQL → service → FieldRenderer → widgets |
| [`module-sources.md`](module-sources.md) | Onglet « Sources & recommandations » du panneau praticien (table `module_sources`) |
| [`services.md`](services.md) | Couche services web et mobile (architecture en couches) |
| [`audit-log.md`](audit-log.md) | Journal d'audit des accès aux données patient (RGPD/HDS) — table `access_audit_log`, triggers + RPC |
| [`rgpd-droits-patient.md`](rgpd-droits-patient.md) | Droits patient RGPD — export (art. 15/20) & effacement (art. 17) : RPC + Edge Function + purge locale |
| [`retention-conservation.md`](retention-conservation.md) | Politique de conservation & purge automatique (RGPD art. 5.1.e) — table `retention_config` + Edge Function + pg_cron |
| [`auth-mfa.md`](auth-mfa.md) | Authentification forte praticien (MFA TOTP) — flux, AAL, récupération, bandeau de rappel |
| [`support-requests.md`](support-requests.md) | Demandes de support praticien (formulaire borné → table + email Resend) |
| [`modules.md`](modules.md) | Liste et statut de tous les modules thérapeutiques |
| [`terminologie-praticiens.md`](terminologie-praticiens.md) | Glossaire métier (IDE, IPA, etc.) |
| [`migration-engine-roadmap.md`](migration-engine-roadmap.md) | Roadmap moteur de migrations |
| [`dependency-pitfalls.md`](dependency-pitfalls.md) | Pièges connus de dépendances |
| [`spec/calendar.md`](spec/calendar.md) | Système de prise de rendez-vous (praticien web + patient mobile) |
| [`spec/file-active.md`](spec/file-active.md) | File active praticien — spec fonctionnelle (tour de contrôle) |
| [`spec/speech-to-text.md`](spec/speech-to-text.md) | Dictée vocale de notes praticien (SpeechRecorder + Edge Function) |
| [`spec/patient-public-ref.md`](spec/patient-public-ref.md) | Identifiant public opaque dans l'URL patient (`public_ref`) — masque la PK, défense en profondeur |
| [`spec/admin-users.md`](spec/admin-users.md) | Page admin « Gestion des utilisateurs » — rôle `is_admin`, droits RGPD centralisés, sécurité front + base |
| [`spec/module-taxonomy.md`](spec/module-taxonomy.md) | Taxonomie & filtres par facettes de l'armoire (tags indication/public/approche, `tag_dimensions`/`tags`/`module_tags`) |
| [`spec/refonte-roue-emotions.md`](spec/refonte-roue-emotions.md) | Refonte roue des émotions — taxonomie Willcox (8 familles / nuances / mots), profondeur libre, étapes intensité/contexte/notes |
| [`patient-data-sync.md`](patient-data-sync.md) | Circuit sync données patient : SQLite → Supabase via `RemoteSyncService` + gate consentement |
| [`practitioner-notes.md`](practitioner-notes.md) | Notes praticien par patient (privées, Supabase, `practitioner_patient_notes`) |

## Documentation par module thérapeutique

Voir [`modules.md`](modules.md) pour la liste complète, le statut et les liens vers chaque doc.

Tous les fichiers de modules sont dans [`modules/`](modules/) :

- [`asrs6.md`](modules/asrs6.md) — ASRS v1.1 Dépistage Rapide TDAH adulte (6 items)
- [`asrs18.md`](modules/asrs18.md) — ASRS v1.1 Bilan Complet TDAH adulte (18 items)
- [`beck_columns.md`](modules/beck_columns.md) — Colonnes de Beck (TCC)
- [`behavioral_activation.md`](modules/behavioral_activation.md) — Activation comportementale
- [`breathing_techniques.md`](modules/breathing_techniques.md) — Techniques de respiration
- [`cognitive_saturation.md`](modules/cognitive_saturation.md) — Saturation cognitive (ACT)
- [`cssrs_screen.md`](modules/cssrs_screen.md) — C-SSRS Dépistage suicidaire
- [`emotion_wheel.md`](modules/emotion_wheel.md) — Roue des émotions (Plutchik)
- [`epds.md`](modules/epds.md) — EPDS Dépression post-natale
- [`fear_thermometer.md`](modules/fear_thermometer.md) — Thermomètre de la peur (SUDs)
- [`grounding.md`](modules/grounding.md) — Ancrage 5-4-3-2-1 (DBT)
- [`medication_adherence.md`](modules/medication_adherence.md) — Observance du traitement
- [`medication_side_effects.md`](modules/medication_side_effects.md) — Effets du traitement
- [`mood_tracker.md`](modules/mood_tracker.md) — Thermomètre de l'humeur
- [`nsi.md`](modules/nsi.md) — NSI Inventaire neuropsychologique
- [`psychoeducation.md`](modules/psychoeducation.md) — Cartes de psychoéducation
- [`rim.md`](modules/rim.md) — RIM Imagerie mentale (IRT)
- [`sleep_diary.md`](modules/sleep_diary.md) — Agenda du sommeil
- [`snap_iv.md`](modules/snap_iv.md) — SNAP-IV Dépistage TDAH enfant/ado
- [`motivational_balance.md`](modules/motivational_balance.md) — Balance motivationnelle (EM)
- [`notification-routines.md`](modules/notification-routines.md) — Routines de notification patient

## Documentation par application

### Web praticien — [`apps/web/docs/`](../apps/web/docs/README.md)

| Document | Contenu |
|---|---|
| [`design-system.md`](../apps/web/docs/design-system.md) | CSS custom properties, classes `preview-*` et `fw-*`, widgets HTML |
| [`web-app.md`](../apps/web/docs/web-app.md) | Vue d'ensemble : structure, routing, pages, composants, store auth |
| [`invitation-flow.md`](../apps/web/docs/invitation-flow.md) | Volet web du flux d'invitation |
| [`components/module-renderer.md`](../apps/web/docs/components/module-renderer.md) | Rendu générique des modules (FieldText CONFIG) |
| [`components/banner.md`](../apps/web/docs/components/banner.md) | Bandeau d'information transversal (variantes, action, fermeture) |
| [`components/main-nav.md`](../apps/web/docs/components/main-nav.md) | Navigation principale |
| [`components/dropdown.md`](../apps/web/docs/components/dropdown.md) | Liste déroulante |
| [`components/step-breadcrumb.md`](../apps/web/docs/components/step-breadcrumb.md) | Fil d'Ariane d'étapes |
| [`components/toggle.md`](../apps/web/docs/components/toggle.md) | Composant toggle |

### Mobile patient — [`apps/mobile/docs/`](../apps/mobile/docs/README.md)

| Document | Contenu |
|---|---|
| [`design-system.md`](../apps/mobile/docs/design-system.md) | StyleSheet patterns, composants primitifs, Teen mode complet |
| [`mobile-app.md`](../apps/mobile/docs/mobile-app.md) | Vue d'ensemble : structure, navigation, écrans, SQLite, notifications |
| [`invitation-flow.md`](../apps/mobile/docs/invitation-flow.md) | Volet mobile du flux d'invitation |
| [`avatar.md`](../apps/mobile/docs/avatar.md) | Photo de profil patient : pick, upload Supabase Storage, RLS |
| [`notification-permission.md`](../apps/mobile/docs/notification-permission.md) | Écran d'onboarding : explication + demande de permission push |

## Ajouter un document

- Doc transversale (touche les deux apps ou la BDD) → `docs/`
- Doc d'un module thérapeutique → `docs/modules/<module_id>.md` (snake_case, même clé que `ModuleType`)
- Doc spécifique à une app (composant UI, design tokens propres) → `apps/<app>/docs/`
- Mettre à jour cet index ainsi que [`modules.md`](modules.md) si c'est un module
