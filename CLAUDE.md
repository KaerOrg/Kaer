# Kær — Contexte général

## Qu'est-ce que Kær ?

Outil d'accompagnement thérapeutique : interface web praticien (gestion patients + modules) + app mobile patient (outils thérapeutiques débloqués par le praticien). Le praticien invite ses patients par email ; ils accèdent aux modules débloqués au fil des consultations.

## Utilisateur principal

Thérapeute (IDE, IPA, psychiatre, psychologue…). **Novice complet en développement** — toujours expliquer les étapes, donner des commandes exactes à copier-coller. La qualité du code reste optimale malgré cela.

## Stack technique

| Couche | Technologie |
|---|---|
| Backend / BDD | Supabase (PostgreSQL + Auth + API REST) |
| Web praticien | React + TypeScript + Vite |
| Mobile patient | React Native + Expo + TypeScript |
| State management | Zustand |
| Offline storage | expo-sqlite + MMKV |
| Hébergement | Supabase cloud (→ OVHcloud HDS à terme) |

## Structure & lancement

```
Kær/
├── apps/web/        # Interface praticien (React + Vite)
├── apps/mobile/     # App patient (Expo + React Native)
├── packages/shared/ # Types TypeScript partagés
└── supabase/        # schema.sql + seed.sql
```

```bash
npm run web     # App web praticien
npm run mobile  # App mobile patient
```

## Schéma de base de données

`supabase/schema.sql` (DDL) + `supabase/seed.sql` (données de référence) sont la **source de vérité** — idempotents, ré-exécutables à tout stade. À chaque modification : mettre à jour le fichier concerné.

Tables principales : `practitioners`, `patients`, `practitioner_patients`, `invitations`, `patient_modules`. RLS activée partout.

- Flux d'invitation : [`docs/invitation-flow.md`](docs/invitation-flow.md)
- Circuit sync données patient : [`docs/patient-data-sync.md`](docs/patient-data-sync.md)
- Schéma complet : [`docs/database.md`](docs/database.md)

## Règles métier fondamentales

- **Données stockées, jamais interprétées** : les saisies patient (`patient_entries`, `payload jsonb` opaque) sont stockées après opt-in — le serveur restitue brut, ne conclut jamais. Données de santé RGPD Art. 9 → hébergement HDS requis avant commercialisation.
- Auth email/mot de passe uniquement. Un patient ne peut pas s'inscrire seul.
- **Offline-first** : SQLite local en premier, sync vers Supabase via `RemoteSyncService` + gate de consentement `patients.share_consent`.
- Le praticien peut révoquer un module à tout moment.

## RÈGLE D'OR — Statut Non-Dispositif Médical (MDR 2017/745)

> **Cette règle s'applique à chaque ligne de code, sans exception.**

Kær est un **Carnet de Bord Numérique**. **Le code affiche, jamais il ne conclut.**

**INTERDIT :**

| Cas | Exemple |
|---|---|
| Interpréter et suggérer une action | "Vous avez mal dormi, faites ceci" |
| Alerte déclenchée par les données | Notification si score > seuil |
| Label interprétatif sur un score | "Score 18 = dépression sévère" |
| Graphique impliquant une dégradation | Flèche rouge, "état en baisse" |
| Notification conditionnelle aux données | "Tu n'as pas dormi 3 nuits, pense à…" |
| Comparaison à une norme | "Vous dormez moins que la moyenne" |
| Codage couleur d'une gravité clinique | Option "sévère" = rouge (même statique) |

**AUTORISÉ :** chiffre brut, historique neutre, score calculé pour le praticien, rappel d'horaire fixe non conditionnel aux données.

Si une demande franchit cette ligne : veto immédiat + alternative d'affichage passif conforme.

## Modules thérapeutiques

Liste complète avec statut et détails d'implémentation : [`docs/modules.md`](docs/modules.md).

**30+ modules implémentés** : `sleep_diary`, `beck_columns`, `fear_thermometer` (« Exposition graduée »), `emotion_wheel`, `crisis_plan`, `rim`, `cognitive_saturation`, `decisional_balance`, `behavioral_activation`, `grounding`, `mood_tracker`, `motivational_balance`, `medication_adherence`, `breathing_techniques`, `phq9`, `gad7`, `bsl23`, `rcads`, `snap_iv`, `asrs6`, `asrs18`, `epds`, `nsi`, `medication_side_effects`, `psychoeducation`, `chronobiology_tracker`, `distress_tolerance`, `craving_journal`.

Prévus : `cognitive_distortions`, `therapeutic_commitment`.

**Pattern générique échelles cliniques** : `ScaleHistoryScreen` + `ScaleEntryScreen` + `SCALE_SCORING` + `scale_entries` SQLite + `module_content_fields` Supabase. Détail moteur complet : [`docs/module-engine.md`](docs/module-engine.md).

## État d'avancement

Infrastructure complète (monorepo, auth, RLS, sync). 30+ modules livrés. Features transverses livrées : système de RDV ([`docs/spec/calendar.md`](docs/spec/calendar.md)), Mes suivis / File active ([`docs/spec/file-active.md`](docs/spec/file-active.md)), conformité RGPD (journal d'audit #25, MFA praticien #26, droits patient export/effacement #27, conservation/purge automatique #28 — [`docs/retention-conservation.md`](docs/retention-conservation.md)). Reste : notifications push, finitions file active.

## Règles de développement

- **Feature = doc + tests** avant d'être considérée terminée.
- **Design system d'abord — toujours** : avant la première ligne de JSX ou de StyleSheet, ouvrir `src/components/ui/`. Un `Pressable + Text + styles.xxxBtn` quand `<Button>` existe, ou une `View` avec shadow/radius quand `<Card>` existe, est une violation bloquante — même si ça marche. Détail et catalogue complet : [`.claude/rules/coding-standards.md`](.claude/rules/coding-standards.md) § "Le design system EST ta boîte à outils".
- **Feedback web** : toujours `useToast()` pour les opérations réseau — jamais d'état local. Doc : [`apps/web/docs/components/toast.md`](apps/web/docs/components/toast.md).
- **Zéro SQL dans un composant** : toute opération passe par `apps/<app>/src/services/<domaine>Service.ts`. Détail : [`.claude/rules/coding-standards.md`](.claude/rules/coding-standards.md).
- **Nouveau module** : passer par le skill `module-builder`. Lecture préalable : [`docs/module-engine.md`](docs/module-engine.md).
- **Avant tout merge** : skill `pr-review` puis procédure [`.claude/rules/merge-procedure.md`](.claude/rules/merge-procedure.md) (fetch → merge → conflits → tests → tsc, les deux apps).
- **Ordre web-puis-mobile** pour tout nouveau module (praticien doit pouvoir le débloquer avant que le patient y accède).
- **Synchronisation mobile** : toute écriture SQLite patient passe par `syncUpsert`/`syncDelete` de `syncHelpers.ts`. Détail : [`.claude/rules/sync-service.md`](.claude/rules/sync-service.md).
- **Patterns clés** : mode ado (`useTeen`, `TeenAccent`, mock obligatoire dans les tests), bandeau disclaimer MDR (`DisclaimerBanner`), fiches psyedu (`PsyEduBlockRenderer` + seed SQL, zéro texte en dur), rendez-vous (`computeAvailableSlots` pure function, `jsDayToSchema()`). Docs dans `apps/*/docs/` et `docs/spec/`.
- **Feature admin** : toute capacité admin est **verrouillée front ET base**. Rôle = `practitioners.is_admin` (lecture seule client, trigger `trg_guard_is_admin_write`) ; barrière réelle = `fn_is_admin()` re-vérifié dans chaque RPC/edge function (jamais un flag client). La garde de route React n'est que du confort UX. Modèle de référence : [`docs/spec/admin-users.md`](docs/spec/admin-users.md).

## Documentation technique

Index : [`docs/README.md`](docs/README.md)

| Document | Contenu |
|---|---|
| `docs/modules.md` | Liste et statut de tous les modules |
| `docs/module-engine.md` | Circuit SQL → service → FieldRenderer → widgets |
| `docs/services.md` | Couche services (conventions, patterns) |
| `docs/architecture.md` / `docs/database.md` | Vue d'ensemble technique et schéma BDD |
| `docs/audit-log.md` | Journal d'audit RGPD/HDS |
| `docs/patient-data-sync.md` | Circuit sync données patient + consentement |
| `docs/rgpd-droits-patient.md` | Export / effacement patient (art. 15/17/20) |
| `docs/retention-conservation.md` | Conservation & purge automatique (art. 5.1.e) — `retention_config` + pg_cron |
| `docs/auth-mfa.md` / `docs/support-requests.md` | MFA praticien TOTP + contact support |
| `apps/web/docs/design-system.md` | CSS tokens, classes utilitaires, widgets web |
| `apps/mobile/docs/design-system.md` | StyleSheet patterns, primitifs, teen mode complet |
| `apps/web/docs/components/module-renderer.md` | FieldRenderer web : field_type / preview_kind |

## MCP disponible

MCP Supabase configuré dans `~/.claude/settings.json` — gestion BDD, migrations, clés API.
