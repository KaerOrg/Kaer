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
| `is_hidden` | boolean | Si true : module retiré de l'app sans suppression (droits non acquis). Voir ci-dessous |
| `icon` | text nullable | Icône Lucide (web) |
| `mobile_icon` | text nullable | Icône MaterialCommunityIcons (mobile) |
| `color` | text nullable | Couleur accent hex |

**Trois drapeaux, trois questions distinctes** (issue #247) : ne pas les confondre.

| Drapeau | Question à laquelle il répond |
|---|---|
| `is_hidden` | Le module existe-t-il pour l'app ? `true` = invisible partout et non déblocable |
| `is_invite_excluded` | Le module est visible, mais se propose-t-il à l'invitation ? |
| `preview_kind` | **Comment** le module se rend (`coming_soon` = pas encore d'écran) |

**`is_hidden` : masquer sans supprimer.** Kær est un produit commercial : un
instrument téléchargeable gratuitement n'est pas pour autant reproductible dans
l'app. Les modules concernés sont **masqués, pas supprimés** : items, i18n,
scoring, écrans et tests restent en place, ainsi que les lignes `patient_modules`
et les saisies déjà faites par les patients. Un module masqué disparaît du
catalogue praticien, de l'invitation, de l'aperçu, de la liste patient mobile et
des routines de rappel.

Modules actuellement masqués : `asrs18`, `epds`, `snap_iv`, `rcads`, `nsi`,
`bsl23`. Le motif juridique de chacun est documenté dans `supabase/seed.sql`,
au-dessus de l'instruction de masquage.

**Réactivation** le jour où les droits sont acquis : retirer l'id de la liste du
seed **et** de `MUST_BE_HIDDEN` dans `apps/web/src/test/hiddenModules.guard.test.ts`,
puis rejouer le seed. Rien d'autre à toucher.

**Pourquoi le filtre est dans les services et non dans la policy RLS.** Descendre
`is_hidden = false` dans `modules_read` semble plus sûr (impossible à oublier), mais
rendrait l'app **aveugle** à ces modules : `fetchHiddenModuleIds` ne verrait plus rien,
donc un module masqué **déjà débloqué** ne pourrait plus être écarté de la fiche
patient ni de la liste mobile. Pire côté mobile, le join `module:modules(...)`
renverrait `null` pour un module masqué, cas que le code traite comme « module à
garder » : les modules masqués **réapparaîtraient**. Le filtre reste donc dans la
couche service, et le garde-fou de test vérifie qu'aucune lecture ne l'oublie.

**Catalogue complet (35 modules) :**

| `id` | Catégorie | `preview_kind` | `is_invite_excluded` |
|------|-----------|---------------|----------------------|
| `crisis_plan` | safety | `safety_plan` | false |
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

### `breathing_sessions` — Sessions de respiration (module `breathing_techniques`, T0 #195)

Une ligne par session de respiration. **Données 100 % descriptives** (MDR 2017/745) :
aucun score, aucune moyenne, aucune tendance. `feeling` est un ressenti brut facultatif,
restitué tel quel.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid PK, default gen_random_uuid() | – |
| `patient_id` | uuid NOT NULL FK → patients (on delete cascade) | – |
| `technique_key` | text NOT NULL | Clé de la technique (`field_props.technique_key`) |
| `started_at` | timestamptz NOT NULL | Instant de début de session |
| `duration_seconds` | integer NOT NULL, default 0 | Durée réellement pratiquée |
| `planned_duration_seconds` | integer NOT NULL, default 0 | Durée choisie avant de démarrer |
| `cycles_completed` | integer NOT NULL, default 0 | – |
| `completed` | boolean NOT NULL, default false | Menée au bout vs interrompue |
| `feeling` | text, nullable | `calmer` \| `same` \| `tenser` \| null (facultatif) |
| `created_at` | timestamptz NOT NULL, default now() | – |

RLS : le patient a un CRUD complet sur ses propres lignes (`auth.uid() = patient_id`) ;
le praticien a une **lecture seule** sur les patients liés **et consentants**
(`share_consent = true`), même gate que `patient_entries`.

> **Note d'architecture (couture T0 à câbler en phases M).** La sync mobile
> offline-first passe par `patient_entries` (`entry_kind='breathing_session'`,
> payload jsonb) via `syncHelpers`, comme les autres modules : c'est là que les
> sessions sont réellement capturées aujourd'hui. Cette table dédiée est le modèle
> relationnel canonique déclaré par l'epic ; son alimentation directe (projection
> depuis `patient_entries` et/ou écriture praticien) sera câblée dans les
> sous-tickets M. T0 ne modifie pas `RemoteSyncService`.

---

### `safety_plan_items` — Plan de sécurité, document co-édité (PW-1 #320)

Les items du plan de sécurité vivaient dans `patient_entries`. C'était une **erreur de
nature** : `patient_entries` est un journal de saisies produites par l'appareil, drainé
par une outbox **strictement montante** (`RemoteSyncService` ne contient aucun `pull`,
aucun `select`, vérifié dans le code). Or un plan de sécurité est un **document co-édité
par deux acteurs**, écrit d'un côté et lu de l'autre. Un item ajouté par le praticien
depuis le web n'atteignait jamais le téléphone.

| Colonne | Type | Rôle |
|---|---|---|
| `id` | uuid PK | – |
| `patient_id` | uuid NOT NULL → `patients(id)` | Propriétaire du plan |
| `section_id` | text NOT NULL | `step_1` … `step_6` |
| `text` | text NOT NULL | Dans les mots de son auteur |
| `kind` | text, nullable | `person` \| `place` (P-14) |
| `role` | text, nullable | Lien au patient ou fonction (P-14) |
| `note` | text, nullable | Une ligne libre (P-14) |
| `phone` | text, nullable | – |
| `sort_order` | int NOT NULL, default 0 | Ordre d'affichage dans l'étape |
| `authored_by` | text NOT NULL, default `patient` | `patient` \| `practitioner` |
| `created_at` / `updated_at` | timestamptz NOT NULL | – |

**RLS : le patient et le praticien lisent ET écrivent.** Deux politiques `for all`, l'une
sur `auth.uid() = patient_id`, l'autre sur la jointure `practitioner_patients`.

> ⚠️ **Pas de garde `share_consent`, contrairement à `patient_entries`, et c'est
> délibéré.** Le plan est construit **en consultation, à deux** : le praticien en est
> co-auteur, et le lui masquer derrière le consentement de partage lui retirerait
> l'accès à ce qu'il a écrit lui-même. La ligne de confidentialité passe ailleurs, et
> elle est nette : les **ancres** (photos, phrase personnelle) restent dans
> `patient_entries` sous la garde du consentement, parce que ce sont des contenus
> intimes que le praticien n'a pas à lire. Même motif que `crisis_plan_configs`, dont
> la RLS est calquée ici.

**MDR 2017/745** : `authored_by` est **descriptif, jamais interprété**. Il sert à
l'affichage (« ajouté par le patient le 11 juin ») et au diff de PW-8. Aucune règle de
priorité, aucun verrou : chacun peut modifier ce que l'autre a écrit, c'est un document
commun.

> **`plan_item` reste dans `EntryKind`, contrairement à ce qu'annonce #320.** La table
> SQLite `plan_items` n'est pas propre au plan de sécurité : le module **Balance
> décisionnelle** (`decisional_balance`, layout `decision_grid`) y stocke ses arguments
> et les synchronise par le même `entry_kind`. Le retirer casserait ce module. Seuls les
> items de `crisis_plan` migrent vers la table dédiée ; le reste continue de passer par
> `patient_entries`.

---

### `crisis_plan_configs` : ce que le praticien pose autour du plan (PW-5 #324)

Une ligne par patient. Elle porte le **message de soutien** affiché au patient, et les
**deux dates de la relation** autour du plan. Le plan lui-même vit dans
`safety_plan_items` : cette table ne contient aucun item.

| Colonne | Type | Rôle |
|---|---|---|
| `patient_id` | uuid PK → `patients(id)` | - |
| `practitioner_message` | text NOT NULL, default `''` | Message de soutien, affiché à la clôture de la Séquence |
| `created_with_at` | date, nullable | Jour de la **première élaboration conjointe**. Posé à la première revue, jamais réécrit ensuite. |
| `last_reviewed_at` | date, nullable | Jour de la **dernière revue en consultation** |
| `updated_at` | timestamptz NOT NULL, default now() | - |

**Type `date`, pas `timestamptz`** : « élaboré le 12 mars · revu avec vous le 4 juin » est
un jour, jamais une heure. Le grain à la journée rend aussi l'idempotence **structurelle** :
deux appuis sur « Nous avons revu le plan aujourd'hui » le même jour écrivent la même
valeur, il n'y a rien à dédupliquer.

**Trois notions à ne jamais confondre**, et que le vocabulaire de l'interface sépare
partout :

| Notion | Où elle vit |
|---|---|
| « revu avec vous » : le geste praticien | `crisis_plan_configs.last_reviewed_at` |
| « modifié » : la dernière écriture sur un item | `safety_plan_items.updated_at` |
| « lu par le patient » | **N'est pas mesuré et ne le sera pas.** Aucune colonne ne l'accueille. |

**MDR 2017/745** : ces dates sont **affichées, jamais surveillées**. Aucune alerte
d'ancienneté, aucune relance automatique, aucun badge « à revoir », aucune couleur qui
change quand la revue date. Ne jamais les comparer à la date du jour pour produire un
signal visuel : un test de rendu verrouille cette règle côté web.

RLS : le patient lit sa propre ligne ; le praticien lit et écrit sur ses patients liés.

---

### `breathing_settings` — Config du module respiration par patient (T0 #195)

Une ligne par patient. `enabled_techniques` / `primary_technique` sont posés par le
praticien ; l'objectif, les rappels et les préférences sensorielles sont ajustables par
le patient.

| Colonne | Type | Description |
|---------|------|-------------|
| `patient_id` | uuid PK FK → patients (on delete cascade) | – |
| `enabled_techniques` | text[] NOT NULL, default '{}' | Techniques activées (géré praticien) |
| `primary_technique` | text, nullable | Technique « en séance » |
| `weekly_goal_sessions` | integer NOT NULL, default 5 | `check` entre 1 et 14 |
| `reminder_enabled` | boolean NOT NULL, default false | Rappels opt-in |
| `reminder_time` | time, nullable | Heure du rappel |
| `reminder_days` | smallint[] NOT NULL, default '{}' | Jours 0-6 (`check` sous-ensemble de 0..6) |
| `haptics` | boolean NOT NULL, default true | – |
| `ambient_sound` | boolean NOT NULL, default false | – |
| `ambient_sound_key` | text NOT NULL, default 'river' | `river` \| `waves` \| `rain` \| `wind` \| `bowl` |
| `breath_sound` | boolean NOT NULL, default false | – |
| `preferred_duration_min` | integer NOT NULL, default 5 | – |
| `created_at` / `updated_at` | timestamptz NOT NULL, default now() | – |

RLS : le patient a un CRUD complet sur sa propre config (`auth.uid() = patient_id`) ; le
praticien a un accès **lecture + écriture** sur la config de ses patients liés (même
modèle que `crisis_plan_configs` : config praticien, pas une donnée clinique).

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

### `app_error_log` — Alerte email sur erreur applicative (issue #96)

Journal des erreurs applicatives (`crash` / `failed_operation`). **Télémétrie
technique, zéro donnée patient.** Écrite exclusivement par l'Edge Function
`report-app-error` (service_role), dédupliquée par `signature`. État anti-flood
INDÉPENDANT de `render_mismatch_log`. Détail complet :
[`app-error-alerting.md`](app-error-alerting.md).

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `occurred_at` / `last_seen_at` | timestamptz | 1ʳᵉ et dernière observation de la signature |
| `platform` | text | `web` \| `mobile` |
| `app_version` | text | version de l'app émettrice |
| `kind` | text | `crash` \| `failed_operation` |
| `message`, `route`, `stack`, `reason` | text | contexte d'enquête (`stack` tronquée à 2000 caractères) |
| `signature` | text | UNIQUE — clé de déduplication (pilote l'upsert) |
| `occurrence_count` | int | nombre d'occurrences de la signature |
| `email_sent_at` | timestamptz | dernier email envoyé (pilote le cooldown) |

| Policy | Opérations | Condition |
|--------|-----------|-----------|
| app_error_log_admin_select | SELECT | `fn_is_admin()` (insert/update : service_role uniquement) |

---

## Appliquer le schéma

Via le MCP Supabase (recommandé) ou via l'interface Supabase SQL Editor :

```bash
# Coller le contenu de supabase/schema.sql dans le SQL Editor Supabase
```

Le schéma est **idempotent** (`CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, migrations `DO $$ ... $$`) — il peut être re-exécuté sans erreur.
