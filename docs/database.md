# Base de données — Référence complète

Le fichier `supabase/schema.sql` est la **source de vérité**. Ce document en est la référence lisible.

## Tables

### `practitioners` — Profils praticiens

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | uuid | PK, FK → auth.users | Identifiant Supabase Auth |
| `email` | text | NOT NULL | Email du praticien |
| `name` | text | NOT NULL, default '' | Nom d'affichage |
| `professional_title` | text | nullable | Ex: "IPA en psychiatrie" |
| `created_at` | timestamptz | default now() | Date de création |

Créé automatiquement par le trigger `handle_new_user` lors de l'inscription.

---

### `patients` — Profils patients

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | uuid | PK, FK → auth.users | Identifiant Supabase Auth |
| `email` | text | NOT NULL | Email du patient |
| `first_name` | text | NOT NULL, default '' | Prénom (rempli depuis l'invitation) |
| `last_name` | text | NOT NULL, default '' | Nom (rempli depuis l'invitation) |
| `avatar_url` | text | nullable | URL photo de profil (bucket `avatars`) |
| `created_at` | timestamptz | default now() | Date de création |

Créé automatiquement par le trigger lors de l'acceptation d'une invitation.

---

### `practitioner_patients` — Relation praticien ↔ patient

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | uuid | PK | – |
| `practitioner_id` | uuid | FK → practitioners | – |
| `patient_id` | uuid | FK → patients | – |
| `patient_alias` | text | nullable | Surnom/initiales choisis par le praticien |
| `patient_first_name` | text | nullable | Prénom copié depuis l'invitation |
| `patient_last_name` | text | nullable | Nom copié depuis l'invitation |
| `patient_birth_date` | date | nullable | Date de naissance copiée depuis l'invitation |
| `patient_sex` | text | nullable | Sexe copié depuis l'invitation |
| `teen_mode` | boolean | NOT NULL, default false | Mode adolescent activé par le praticien |
| `public_ref` | text | NOT NULL, UNIQUE, default `gen_public_ref()` | Identifiant public opaque exposé dans l'URL (ex. `p_8Kf3aQ`) à la place de `patient_id` — défense en profondeur, voir [`spec/patient-public-ref.md`](spec/patient-public-ref.md) |
| `created_at` | timestamptz | default now() | – |

Contrainte d'unicité: `(practitioner_id, patient_id)`.

---

### `invitations` — Liens d'invitation

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | uuid | PK | – |
| `practitioner_id` | uuid | FK → practitioners | Qui a créé l'invitation |
| `patient_email` | text | NOT NULL | Email destinataire |
| `patient_first_name` | text | nullable | Prénom saisi à l'invitation |
| `patient_last_name` | text | nullable | Nom saisi à l'invitation |
| `patient_birth_date` | date | nullable | Date de naissance saisie à l'invitation |
| `patient_sex` | text | nullable | Sexe saisi à l'invitation |
| `teen_mode` | boolean | NOT NULL, default false | Mode ado pré-configuré |
| `pre_selected_modules` | text[] | NOT NULL, default '{}' | Modules à débloquer automatiquement à l'inscription |
| `token` | text | NOT NULL, UNIQUE | UUID envoyé dans le lien |
| `expires_at` | timestamptz | NOT NULL | `now() + 48h` à la création |
| `accepted_at` | timestamptz | nullable | NULL = en attente, timestamp = acceptée |
| `created_at` | timestamptz | default now() | – |

**Règle**: un token expiré (`expires_at < now()`) ou déjà accepté (`accepted_at IS NOT NULL`) ne peut pas être utilisé.

---

### `patient_modules` — Modules débloqués

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | uuid | PK | – |
| `patient_id` | uuid | FK → patients | – |
| `practitioner_id` | uuid | FK → practitioners | Qui a débloqué |
| `module_type` | text | NOT NULL | Clé du module (voir liste) |
| `config` | jsonb | default '{}' | Configuration JSON du module |
| `unlocked_at` | timestamptz | default now() | Date de débloquage |
| `revoked_at` | timestamptz | nullable | NULL = actif, timestamp = révoqué |

Contrainte d'unicité: `(patient_id, module_type)`.

Config spéciale pour `psychoeducation` :
```json
{ "unlocked_cards": [{ "card_id": "...", "is_read": false, "unlocked_at": "..." }] }
```

---

### `module_categories` — Catégories de modules

Données de référence statiques — lecture seule côté app.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | text PK | Clé de la catégorie |
| `sort_order` | int | Ordre d'affichage |

**Catégories et modules :**

| `id` | Modules inclus |
|------|---------------|
| `safety` | `crisis_plan`, `therapeutic_commitment`, `distress_tolerance` |
| `iatrogenic` | `medication_side_effects`, `medication_adherence`, `psychoeducation` |
| `lifestyle` | `sleep_diary`, `diet_weight_psycho`, `chronobiology_tracker` |
| `emotion` | `mood_tracker`, `emotion_wheel`, `behavioral_activation` |
| `cognitive` | `beck_columns`, `cognitive_distortions`, `grounding`, `rim` |
| `anxiety` | `fear_thermometer`, `exposure_hierarchy`, `breathing_techniques`, `cognitive_saturation` |
| `addiction` | `craving_journal`, `decisional_balance` |

---

### `modules` — Référentiel des modules thérapeutiques

Une ligne par module. `preview_kind` pilote le moteur de rendu.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | text PK | Clé du module (ex: `sleep_diary`) |
| `category_id` | text FK → module_categories | – |
| `preview_kind` | text | Layout cible (voir `docs/module-engine.md` pour la table complète) |
| `sort_order` | int | Ordre dans la catégorie |
| `is_invite_excluded` | boolean | Si true : exclu de la pré-sélection à l'invitation (config spéciale requise) |
| `icon` | text nullable | Icône Lucide (web) |
| `mobile_icon` | text nullable | Icône MaterialCommunityIcons (mobile) |
| `color` | text nullable | Couleur accent hex |

**Catalogue complet (35 modules) :**

| `id` | Catégorie | `preview_kind` | `is_invite_excluded` |
|------|-----------|---------------|----------------------|
| `crisis_plan` | safety | `editable_steps` | false |
| `therapeutic_commitment` | safety | `coming_soon` | false |
| `distress_tolerance` | safety | `tabbed` | false |
| `medication_side_effects` | iatrogenic | `slider_dashboard` | false |
| `medication_adherence` | iatrogenic | `daily_checkin` | false |
| `psychoeducation` | iatrogenic | `cards` | **true** |
| `sleep_diary` | lifestyle | `sleep_journal` | false |
| `diet_weight_psycho` | lifestyle | `psyedu` | false |
| `chronobiology_tracker` | lifestyle | `tabbed` | false |
| `mood_tracker` | emotion | `slider_dashboard` | false |
| `emotion_wheel` | emotion | `tree_selector` | false |
| `behavioral_activation` | emotion | `activity_log` | false |
| `beck_columns` | cognitive | `column_form` | false |
| `cognitive_distortions` | cognitive | `coming_soon` | false |
| `grounding` | cognitive | `guided_exercise` | false |
| `rim` | cognitive | `patient_scenario` | **true** |
| `fear_thermometer` | anxiety | `exposure_tracker` | false |
| `exposure_hierarchy` | anxiety | `exposure_hierarchy` | false |
| `breathing_techniques` | anxiety | `fields` | false |
| `cognitive_saturation` | anxiety | `guided_exercise` | false |
| `craving_journal` | addiction | `tabbed` | false |
| `decisional_balance` | addiction | `decision_grid` | false |
| `motivational_balance` | motivation | `tabbed` | false |
| `phq9` | assessments | `questionnaire` | false |
| `gad7` | assessments | `questionnaire` | false |
| `bsl23` | assessments | `questionnaire` | false |
| `snap_iv` | assessments | `questionnaire` | false |
| `asrs6` | assessments | `questionnaire` | false |
| `asrs18` | assessments | `questionnaire` | false |
| `epds` | assessments | `questionnaire` | false |
| `nsi` | assessments | `questionnaire` | false |
| `rcads` | assessments | `questionnaire` | false |
| `cssrs` | assessments | `coming_soon` | false |
| `cape42` | assessments | `coming_soon` | false |
| `audit` | assessments | `coming_soon` | false |

---

### `module_content_fields` — Champs de contenu

Un enregistrement par champ (titre, paragraphe, champ de saisie, étape…). Voir `docs/module-engine.md` pour la liste complète des `field_type`.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | text PK | Convention: `{module}.{type}_{n}` ex: `sleep.field_1` |
| `module_id` | text FK → modules | – |
| `section_id` | text nullable | Groupe les champs (étapes, quadrants, cartes) |
| `parent_field_id` | text nullable FK → self | Pour les spans inline (`card_inline_bold`, `card_inline_text`) |
| `field_type` | text | Détermine le composant React |
| `text_code` | text nullable | Clé i18n (NULL pour `card_divider`, `coming_soon`) |
| `sort_order` | int | – |

---

### `field_props` — Props des composants React

| Colonne | Type | Description |
|---------|------|-------------|
| `field_id` | text FK → module_content_fields | – |
| `prop_key` | text | Ex: `widget_type`, `icon`, `color` |
| `prop_value` | text | – |

PK composite `(field_id, prop_key)`. Voir `docs/module-engine.md` pour les props standard reconnues.

---

### `app_config_meta` — Version de la config (ETag applicatif)

Table **singleton** (une seule ligne) portant le jeton de version de toute la config
quasi-statique. Le web praticien lit ce jeton pour invalider son cache React Query
sans redéploiement. Bumpée en fin de `seed.sql` à chaque re-seed. Voir
`docs/services.md` § « Invalidation de la config par jeton de version ».

| Colonne | Type | Description |
|---------|------|-------------|
| `singleton` | boolean PK, default true | Contrainte `check (singleton)` → une seule ligne |
| `config_version` | text NOT NULL, default `now()::text` | Jeton opaque, change à chaque bump |
| `updated_at` | timestamptz NOT NULL, default now() | – |

RLS : lecture réservée aux praticiens authentifiés (`auth.uid() is not null`) ; **aucune**
policy d'écriture (bump via seed / `service_role` uniquement).

---

### `practitioner_module_settings` — Catalogue praticien

Paramètres optionnels de la bibliothèque de modules d'un praticien.

| Colonne | Type | Description |
|---------|------|-------------|
| `practitioner_id` | uuid PK FK → practitioners | – |
| `enabled_modules` | text[] NOT NULL, default '{}' | Modules activés pour ce praticien |
| `updated_at` | timestamptz | – |

Si aucune ligne n'existe pour un praticien → tous les modules sont disponibles.

---

## Trigger: création automatique de profil

```sql
handle_new_user() — s'exécute AFTER INSERT ON auth.users
```

**Si `role = 'practitioner'`** :
- Insère dans `practitioners` avec email, name, professional_title depuis les métadonnées

**Si `role = 'patient'`** :
1. Insère dans `patients` avec email, first_name, last_name (depuis les métadonnées)
2. Marque l'invitation `accepted_at = now()` (filtre: token valide + non expiré + non déjà accepté)
3. Crée la relation dans `practitioner_patients` en copiant `patient_first_name`, `patient_last_name`, `patient_birth_date`, `patient_sex`, `teen_mode` depuis l'invitation
4. Si `pre_selected_modules` non vide → insère chaque module dans `patient_modules`

Les métadonnées sont passées lors de l'inscription via `supabase.auth.signUp({ options: { data: { role, first_name, last_name, invitation_token } } })`.

---

## Storage — Bucket `avatars`

Bucket public pour les photos de profil patients. Structure: `avatars/{user_id}/filename`.

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `avatars_insert_own` | INSERT | `foldername[1] = auth.uid()` |
| `avatars_update_own` | UPDATE | `foldername[1] = auth.uid()` |
| `avatars_delete_own` | DELETE | `foldername[1] = auth.uid()` |
| `avatars_select_public` | SELECT | public (lecture sans auth) |

---

## Realtime — `patient_entries` (issue #103)

`patient_entries` est publiée dans `supabase_realtime` (`replica identity full`) : le web
praticien s'abonne aux INSERT/UPDATE/DELETE d'un patient pour rafraîchir instantanément
quand celui-ci saisit sur mobile. Postgres Changes **respecte la RLS** — un praticien ne
reçoit que les entrées de ses patients consentants (policy `patient_entries_practitioner_select`),
aucun élargissement d'accès. `replica identity full` est requise pour que les événements
DELETE/UPDATE portent l'ancien `patient_id` (routage vers le bon canal). Ajout à la
publication idempotent (`do $$ … pg_publication_tables … $$`). Côté web :
`patientRealtimeService.subscribePatientEntries` + hook `usePatientEntriesRealtime`.

## Index

| Table | Index | Colonne(s) | Usage |
|-------|-------|-----------|-------|
| practitioner_patients | idx_practitioner_patients_practitioner | practitioner_id | Charger les patients d'un praticien |
| practitioner_patients | idx_practitioner_patients_patient | patient_id | Trouver le praticien d'un patient |
| invitations | idx_invitations_token | token | Valider un token d'invitation |
| invitations | idx_invitations_practitioner | practitioner_id | Lister les invitations d'un praticien |
| patient_modules | idx_patient_modules_patient | patient_id | Charger les modules d'un patient |
| patient_modules | idx_patient_modules_practitioner | practitioner_id | Lister les modules accordés par un praticien |
| module_content_fields | idx_mcf_module | module_id | Charger tous les champs d'un module |
| module_content_fields | idx_mcf_parent | parent_field_id | Reconstituer l'arbre inline |
| module_content_fields | idx_mcf_section | (module_id, section_id) | Grouper par section dans les layouts |

---

## Row Level Security (RLS)

RLS activée sur toutes les tables. Résumé des policies :

### `practitioners`
| Policy | Opérations | Condition |
|--------|-----------|-----------|
| practitioners_own | ALL | `id = auth.uid()` |

### `patients`
| Policy | Opérations | Condition |
|--------|-----------|-----------|
| patients_own | ALL | `id = auth.uid()` |
| patients_read_by_practitioner | SELECT | Patient lié au praticien via `practitioner_patients` |

### `practitioner_patients`
| Policy | Opérations | Condition |
|--------|-----------|-----------|
| ptp_practitioner | ALL | `practitioner_id = auth.uid()` |
| ptp_patient | SELECT | `patient_id = auth.uid()` |

### `invitations`
| Policy | Opérations | Condition |
|--------|-----------|-----------|
| invitations_practitioner | ALL | `practitioner_id = auth.uid()` |
| invitations_by_token | SELECT | Lecture publique (validation du lien) |

### `patient_modules`
| Policy | Opérations | Condition |
|--------|-----------|-----------|
| modules_practitioner | ALL | `practitioner_id = auth.uid()` |
| modules_patient | SELECT | `patient_id = auth.uid()` ET `revoked_at IS NULL` |
| modules_patient_update | UPDATE | `patient_id = auth.uid()` ET `revoked_at IS NULL` |

### `module_categories`, `modules`, `module_content_fields`, `field_props`
| Policy | Opérations | Condition |
|--------|-----------|-----------|
| *_read | SELECT | Tout utilisateur authentifié |

### `app_config_meta`
| Policy | Opérations | Condition |
|--------|-----------|-----------|
| app_config_meta_select_authenticated | SELECT | `auth.uid() is not null` |

Aucune policy d'écriture : le bump du jeton passe par le seed / `service_role`.

### `practitioner_module_settings`
| Policy | Opérations | Condition |
|--------|-----------|-----------|
| module_settings_own | ALL | `practitioner_id = auth.uid()` |

### `render_mismatch_log` — Observabilité du moteur de rendu (issue #90)

Journal des non-match du moteur de rendu (config qu'une app ne sait pas afficher).
**Télémétrie technique, zéro donnée patient.** Écrite exclusivement par l'Edge Function
`report-render-mismatch` (service_role), dédupliquée par `signature`. Détail complet :
[`render-diagnostics.md`](render-diagnostics.md).

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `occurred_at` / `last_seen_at` | timestamptz | 1ʳᵉ et dernière observation de la signature |
| `platform` | text | `web` \| `mobile` |
| `app_version` | text | version de l'app émettrice |
| `level` | text | `preview_kind` \| `field_type` \| `widget_type` \| `missing_text_code` |
| `module_id`, `preview_kind`, `field_id`, `field_type`, `widget_type`, `reason` | text | contexte d'enquête |
| `signature` | text | UNIQUE — clé de déduplication (pilote l'upsert) |
| `occurrence_count` | int | nombre d'occurrences de la signature |
| `email_sent_at` | timestamptz | dernier email envoyé (pilote le cooldown) |

| Policy | Opérations | Condition |
|--------|-----------|-----------|
| render_mismatch_log_admin_select | SELECT | `fn_is_admin()` (insert/update : service_role uniquement) |

---

## Appliquer le schéma

Via le MCP Supabase (recommandé) ou via l'interface Supabase SQL Editor :

```bash
# Coller le contenu de supabase/schema.sql dans le SQL Editor Supabase
```

Le schéma est **idempotent** (`CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, migrations `DO $$ ... $$`) — il peut être re-exécuté sans erreur.
