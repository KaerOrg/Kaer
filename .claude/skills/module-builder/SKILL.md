---
name: module-builder
description: Cadre l'implémentation d'un nouveau module thérapeutique Kær — depuis la modélisation en base jusqu'au rendu web praticien et mobile patient, en garantissant la parité, la réutilisation des composants génériques du design system, la couverture de tests et la documentation. Triggers — "nouveau module", "implémente le module X", "ajoute le module X", "crée un module X", "module thérapeutique", "module patient".
---

# Module Builder — Kær

Tu cadres la création d'un **module thérapeutique** Kær. Un module a deux visages indissociables : l'écran patient (mobile) et l'aperçu praticien (web). Les deux doivent montrer **exactement la même chose** : mêmes textes, mêmes widgets, mêmes structures, mêmes libellés.

## Principe fondateur — la parité est garantie par construction, pas par discipline

Un module **n'est pas une page** que l'on code deux fois. C'est une **ligne de données** dans `modules` + une arborescence dans `module_content_fields` + des `field_props`. Le même composant `FieldRenderer` (existant en deux dialectes — web et mobile — mais drivé par les mêmes données) en assure le rendu.

```
supabase: modules + module_content_fields + field_props
                       ↓ fetchModuleFields(moduleId)
                       ↓
        ┌──────────────┴──────────────┐
        ↓                              ↓
  apps/web FieldRenderer        apps/mobile FieldRenderer
  (ModulePreviewPanel)          (ModuleContentScreen)
```

**Conséquences directes :**
1. **Zéro page hardcodée.** Aucun module ne s'introduit dans le code par une route React/React-Native dédiée avec son JSX propre. Le module vit en base ; le rendu est dérivé. Pour une dérogation, voir la section *Écran dédié* — strictement encadrée.
2. **L'aperçu praticien est au pixel près identique au mobile — pas vaguement proche.** La "Vue patient" web doit montrer **exactement** les mêmes sections dans le même ordre que l'écran mobile, en lecture seule. Si une section est visible par le patient sur mobile, elle doit être visible dans l'aperçu web. Il n'y a pas d'exception tolérée.
3. **Les composants sont génériques, abstraits du métier.** Un widget ne « sait » pas qu'il sert au module de sommeil. Il prend des props (`min`, `max`, `unit`, `icon`, `variant`, `tone`…) et se comporte. **Plusieurs variations d'un même composant > X composants quasi-identiques.**

### Parité pour les modules à écran dédié (non-FieldRenderer)

Pour les modules dont l'interaction mobile est trop complexe pour `FieldRenderer` (animations Reanimated, machine d'état multi-écrans), la parité web est assurée par un **composant `<ModuleId>Preview`** dédié :

```
apps/web/src/components/features/<ModuleId>Preview/
├── <ModuleId>Preview.tsx   ← miroir lecture-seule de l'écran mobile
├── <ModuleId>Preview.css
└── index.ts
```

Ce composant est **branché dans `ModulePreviewPanel`** via `moduleType === '<module_id>'`. Il reproduit **chaque section** de l'écran mobile, en lecture seule :
- Les données configurées par le praticien (depuis Supabase via le service) sont affichées.
- Les données locales du patient (photos, phrases, signatures SQLite) sont représentées par des placeholders visuels fidèles.
- L'ordre des sections est identique à l'écran mobile.

**Patron de référence** : `CrisisPlanPreview` pour `crisis_plan` — banière urgence → 6 étapes → raisons de tenir (message praticien + placeholders photos) → cartes de coping → engagement → barre d'urgence.

---

## Lectures obligatoires avant toute action

Ouvrir et **lire intégralement** :

| Fichier | Pourquoi |
|---|---|
| `docs/module-engine.md` | Circuit complet schéma SQL → service → FieldRenderer → widgets — **source de vérité du moteur** |
| `docs/modules.md` | Liste des modules implémentés, statuts, conventions |
| `CLAUDE.md` | Contexte projet, tableau des modules, règle MDR, règles de dev |
| `.claude/rules/coding-standards.md` | Standards stricts (TS, render, services, sécurité, sync) |
| `.claude/rules/config-first.md` | Données en base, jamais dans des tableaux TypeScript statiques |
| `.claude/rules/sync-service.md` | Pattern syncUpsert/syncDelete — obligatoire pour tout service mobile qui écrit des données patient |
| `apps/web/docs/design-system.md` | Tokens CSS, classes `preview-*`, widgets HTML |
| `apps/mobile/docs/design-system.md` | StyleSheet, primitives, Teen mode |
| `apps/mobile/src/services/syncHelpers.ts` | Helpers de sync — `syncUpsert` / `syncDelete` — source de vérité du pattern |
| `supabase/schema.sql` | DDL — toujours la source de vérité du schéma |
| `supabase/seed.sql` + `supabase/seed/*.sql` | Convention de seed idempotent |

Puis **lister** :

- `apps/web/src/components/ModuleRenderer/layouts/` — l'ensemble des `preview_kind` déjà disponibles.
- `apps/web/src/components/ModuleRenderer/fields/widgets/` + `apps/mobile/src/components/ModuleRenderer/fields/widgets/` — l'ensemble des widgets déjà disponibles.

**Tant que ces lectures ne sont pas faites, ne pas écrire une ligne de code.**

---

## Cartographie de référence — schéma & services

> Carte durable du modèle de données et de la couche services. Les **noms et rôles**
> changent lentement ; le détail volatil (colonnes, signatures) reste dans les
> sources de vérité citées. Cette section existe pour qu'un module ne se trompe
> **jamais** sur l'endroit où sa donnée vit. Source de vérité DDL : `supabase/schema.sql`.

### A. Schéma — où vit la donnée d'un module

**1. Config de rendu (source de vérité du moteur générique) — Supabase**

| Table | Rôle |
|---|---|
| `modules` | 1 ligne par module : `preview_kind`, catégorie, `sort_order` |
| `module_content_fields` | Arbre des champs affichés (`field_type`, `text_code` = clé i18n, `section_id`, `parent_field_id`) |
| `field_props` | Props clé/valeur attachées à un field (`widget_type`, `icon`, `min`, `max`…) |
| `module_categories` | Catégories de l'armoire thérapeutique |
| `module_sources` | Références scientifiques d'un module (bouton « i ») |
| `psyedu_topics` / `psyedu_blocks` | Contenu des fiches psychoéducatives (`preview_kind='psyedu'`) |

> Règle [`config-first`](../../rules/config-first.md) : tout ce qui décrit le comportement/contenu d'un
> module va **en base**, jamais dans un tableau TypeScript statique.

**2. Saisies patient — le chemin canonique (à respecter pour tout nouveau module)**

```
Patient saisit
   ├─► SQLite local (table du module + générique scale_entries)   ← lecture immédiate, offline-first
   └─► syncUpsert()/syncDelete() ─► sync_outbox (SQLite)
                                        └─► RemoteSyncService.sync() ─► patient_entries (Supabase)
```

| Couche | Table(s) | Rôle |
|---|---|---|
| Local | tables SQLite par module + **`scale_entries`** (générique échelles & trackers multi-dimensions) | Source de vérité sur l'appareil, fonctionne hors-ligne |
| File de sync | `sync_outbox` (SQLite) | Tampon idempotent drainé vers Supabase |
| **Serveur** | **`patient_entries`** (Supabase) | **Source de vérité serveur UNIQUE des saisies cliniques** : lecture praticien + graphes d'évolution. Colonnes : `patient_id`, `local_id`, `module_id`, `entry_kind`, `payload` jsonb, `client_created_at` |

> **Consentement = flag `patients.share_consent`** (opt-out, contrôlé par le patient). Il pilote
> la sync (`RemoteSyncService.setConsentEnabled`) ET filtre la RLS de lecture praticien sur
> `patient_entries`. Pas d'autre gate à coder dans un module.
>
> Les **événements de notification** (pause des rappels) vont dans `notification_events` (concept
> distinct, pas une saisie). L'ancienne table `patient_engagement_logs` a été **supprimée** (2026-06-04) :
> ne jamais la réintroduire — toute saisie clinique passe par `patient_entries` via `syncUpsert`.

**Contrat de `payload` lu par les graphes web** (`apps/web/src/services/engagementService.ts`) :
- Échelles : `payload.total_score` (+ `payload.subscale_scores` pour les sous-scores)
- Trackers multi-dimensions (mood, effets indésirables) : `payload.subscale_scores.{dimension}`
- Thermomètre de la peur : `payload.suds_before` / `payload.suds_after`

Donc : un module dont le service écrit un `payload` cohérent avec ce contrat est **graphable
sans toucher au web**. Un `entry_kind` nouveau s'ajoute à la fois dans `EntryKind`
(`syncOutbox.ts`) **et** dans le `check` de `patient_entries` (`schema.sql`).

**3. Relation praticien ↔ patient — Supabase**

| Table | Rôle |
|---|---|
| `practitioners` / `patients` | Profils (liés à `auth.users`) |
| `practitioner_patients` | Lien praticien↔patient (+ `teen_mode`) — pilote la RLS de lecture praticien |
| `invitations` | Liens d'invitation (token unique, 48 h) |
| `patient_modules` | Modules débloqués + `config` jsonb (paramètres praticien) |

### B. Services — toute la logique métier (jamais dans un composant)

**Partagé — `packages/shared/src/services/`**

| Fichier | Rôle |
|---|---|
| `moduleFields.ts` | `fetchModuleFields(client, moduleId)` — lit `modules` + `module_content_fields` + `field_props` (hiérarchie parent/enfant). Utilisé par web ET mobile. |

**Web — `apps/web/src/services/`** (lecture praticien)

| Fichier | Rôle |
|---|---|
| `patientService` | Patients + modules, header patient, mode ado |
| `moduleAssignmentService` | Déblocage/révocation de modules, config psyedu/RIM |
| `moduleCatalogService` / `moduleService` | Armoire thérapeutique, `preview_kind`, cartes psyedu |
| `moduleSourcesService` | Sources scientifiques (cache mémoire + `clearModuleSourcesCache`) |
| `engagementService` | **Graphes d'évolution — lit `patient_entries.payload`** (échelles, mood, fear, effets indésirables) |
| `caseloadService` | File active (dossiers/actions/attentes/observations) |
| `appointmentService` / `cssrsService` / `authService` / `invitationService` | RDV, C-SSRS, session, invitations |

**Mobile — `apps/mobile/src/services/`** (saisie patient)

| Fichier | Rôle |
|---|---|
| `syncHelpers` | **`syncUpsert` / `syncDelete`** — dual-write SQLite + outbox (passage obligé) |
| `sync/RemoteSyncService` | Singleton : draine `sync_outbox` → `patient_entries`, gate de consentement |
| `scaleEntryService` | Échelles + trackers multi-dimensions (mood, effets indésirables) → `scale_entry` |
| `sleepDiaryService` / `formEntryService` / `dailyEntryService` / `treeSelectionService` | Sommeil, formulaires (Beck/craving), saisies quotidiennes, sélecteurs (émotions) |
| `planItemService` / `activityRecordService` / `fearTrackerService` / `breathingService` / `moodMarkerService` / `motivationalBalanceService` / `crisisPlanService` | Plans, activation, peur/exposition, respiration, repères, balance motiv., plan de crise |
| `homeService` / `moduleService` / `psychoeducationService` / `notificationService` / `avatarService` | Accueil, config module patient, fiches lues, rappels, avatar |

> Détail exhaustif (signatures, tests, cache) : [`docs/services.md`](../../../docs/services.md).
> Pipeline de sync : [`docs/patient-data-sync.md`](../../../docs/patient-data-sync.md).

---

## Phase 1 — Discovery

### 1.1 Définir l'intention métier

Avant la moindre décision technique, formuler en 3-4 lignes ce que le module fait *du point de vue clinique* :

- À qui s'adresse-t-il (adulte, ado, parent, hétéro-éval) ?
- Quelle base scientifique (référence DSM, NICE, HAS, étude validée) ?
- Que saisit le patient (texte libre, échelle Likert, slider numérique, time, date, étoiles, choix multiples) ?
- Que voit le praticien dans son aperçu (le même écran patient, sans pouvoir saisir — c'est une *prévisualisation* lecture seule).
- Statut MDR : aucun seuil, aucune interprétation, aucune alerte automatique sur les données. Si la demande franchit cette ligne → veto immédiat + proposer une alternative d'affichage passif.

### 1.2 Auditer le réutilisable

L'audit se fait sur trois plans **avant toute écriture de code** : services, widgets, layouts. Le but est de répondre à *« cette logique / ce visuel existe-t-il déjà ? »*

#### A. Services — la source unique de la logique métier

Le module va lire des données, en écrire, peut-être en mettre en cache. **Toute opération qui n'est pas du rendu** vit dans un service. Avant d'écrire une fonction de service :

1. Ouvrir [`docs/services.md`](../../docs/services.md) — tableau exhaustif des services par app.
2. Ouvrir `apps/web/src/services/` et `apps/mobile/src/services/` — lister les fichiers et leurs exports.
3. **Si une fonction quasi-équivalente existe** → l'étendre par paramètre, ne pas dupliquer. La copier-coller est un bug d'architecture.
4. **Si elle n'existe pas** → créer (ou étendre) un service du domaine concerné, avec :
   - une **JSDoc** au-dessus de chaque fonction exportée (paramètres, retour, side-effects, conditions d'erreur)
   - un **fichier de test à côté** (`xxxService.test.ts`)
   - une **mise à jour de `docs/services.md`** dans le même commit que le service.

Un service non documenté dans `docs/services.md` n'existe pas. C'est cette discipline qui empêche la prochaine PR de re-dupliquer la même requête.

#### B. Widgets, layouts et field_types

> **Avant de concevoir un nouveau `field_type` ou layout, ouvrir `docs/module-engine.md` section "Inventaire complet des field_types" et la lire entièrement.** Cette table recense les 44+ types déjà implémentés. Un `field_type` créé alors qu'un équivalent existait est un bug d'architecture — le veto #15 s'applique.

**Widgets de saisie disponibles** (web + mobile, dialecte miroir) :

| Widget | Variantes utiles |
|---|---|
| `TimeWidget` | format 12h/24h, picker natif |
| `SliderWidget` | `min`, `max`, `unit`, pas, couleur d'accent |
| `StarsWidget` | nombre d'étoiles configurable |
| `BooleanWidget` | oui/non, on/off |
| `RadioWidget` | variants `ok` / `partial` / `miss`, étendable |
| `DateWidget` | format de date, restrictions |
| `TextWidget` / `TextareaWidget` | placeholder, longueur max |
| `CheckboxWidget` | groupable, indeterminate |
| `InfoWidget` | rend `detail_code` en aide statique |
| `LikertWidget` (mobile) | options scale_option / scale_legend_item |

**Layouts (`preview_kind`) disponibles** :

| `preview_kind` | Quand l'utiliser |
|---|---|
| `fields` | Formulaire linéaire de saisies hétérogènes — chaque ligne = `field_row` + un widget |
| `steps` | Liste verticale ordonnée de sections (étapes) — badges colorés |
| `editable_steps` | Variante éditable côté patient (Plan de crise) |
| `cards` | Accordéon de cartes psychoéducatives — header + résumé + corps |
| `grid2x2` | Matrice 2×2 (Balance décisionnelle) |
| `questionnaire` | Échelle Likert / pip slider / numeric / text — scoring séparé |
| `guided_exercise` | Multi-étapes avec timer (Saturation cognitive) |
| `patient_scenario` | Lecture scénario + sons + urgence (RIM) |
| `tabbed` | Onglets, composition de sous-`preview_kind` |
| `psyedu` | Fiches psychoéducatives (table `psyedu_topics` / `psyedu_blocks`) |
| `chrono_month`, `exposure_hierarchy`, `decision_grid`, `column_form`, `sleep_journal`, `activity_log`, `tree_selector`, `daily_checkin`, `exposure_tracker` | Layouts spécialisés — réutiliser tels quels avant d'en inventer |

**Règle d'arbitrage** :

1. **Le besoin tient avec un `preview_kind` existant + widgets existants** → 100 % data-driven. Pas de code, juste un seed SQL + des i18n + des tests des fields/widgets impactés. **C'est le cas idéal.**
2. **Le besoin tient avec un layout existant + un widget existant manquant une variante (prop)** → ajouter la prop au widget, mettre à jour son test, documenter la variante. Pas de nouveau composant.
3. **Le besoin demande un nouveau widget** → l'ajouter dans `fields/widgets/<NewWidget>/` **dans les deux apps** (web + mobile), avec test, et étendre `FieldWidget` (le dispatcher). Garder l'API symétrique entre web et mobile.
4. **Le besoin demande un nouveau layout** → cas rare. Ne créer que si plusieurs `preview_kind` existants ont été examinés et rejetés pour raisons justifiables (à inscrire dans la doc du module). Ajouter dans `layouts/<NewLayout>/` web + mobile, étendre `FieldRenderer`, ajouter test.

### 1.3 Cartographier les touches

Lister `CREATE / MODIFY / DELETE` pour :

- `supabase/schema.sql` (DDL — toujours, ou rien)
- `supabase/seed/<module_id>_seed.sql` (nouveau fichier dédié, idempotent)
- `packages/shared/src/index.ts` (`ModuleType`)
- `apps/web/src/lib/database.types.ts` (`MODULE_LABELS`, `MODULE_DESCRIPTIONS`)
- `apps/web/src/pages/PatientPage.tsx` (catégorie d'armoire thérapeutique)
- `apps/mobile/src/screens/HomeScreen.tsx` (`MODULE_CONFIG`, icône)
- `apps/mobile/src/navigation/AppStack.tsx` (uniquement si écran dédié)
- `apps/{web,mobile}/src/i18n/locales/{fr,en}/common.json`
- `apps/mobile/src/i18n/locales/{fr,en}/teen.json` (clés `modules.<id>.*` obligatoires en tutoiement)
- Widgets / Layouts impactés
- Tests de chacun des éléments touchés
- `docs/modules/<id>.md` (nouveau fichier — obligatoire)
- `docs/modules.md` (ajouter une ligne au tableau)
- `CLAUDE.md` (mettre à jour le tableau des modules et l'état d'avancement)

---

## Phase 2 — Design DB-first

### 2.1 Décider le `preview_kind`

Le choix de `preview_kind` **précède** toute écriture de code. Il détermine :
- quel layout React s'active dans `FieldRenderer.tsx` (web et mobile),
- quels `field_type` sont attendus dans `module_content_fields`,
- quelles `field_props` ont du sens pour ces fields.

Référer à la table de `docs/module-engine.md` (section *modules*). Si aucun `preview_kind` existant ne convient, justifier en 5 lignes dans `docs/modules/<id>.md` *avant* d'en créer un nouveau.

### 2.2 Modéliser l'arbre de fields

Pour chaque champ visible :

```
id              : "<module_id>.<type>_<n>"     ex. "sleep.field_1"
module_id       : "<module_id>"
section_id      : groupe logique (étape, quadrant, carte) — null si plat
parent_field_id : pour les inline spans (card_inline)
field_type      : voir tableau dans docs/module-engine.md
text_code       : clé i18n (jamais de texte brut)
sort_order      : position dans la section
```

Props attachées par `field_props` :
- `widget_type` = `"slider:0:120:min"`, `"stars:5"`, `"time"`, `"boolean"`, `"radio:ok"`, `"date"`, `"text"`, `"checkbox"`, `"textarea"`, `"info"`
- `icon` = nom Lucide (web) / Ionicons (mobile) — choisir un nom **commun aux deux écosystèmes** quand possible
- `detail_code`, `color`, `step_number`, `value`, `min`, `max`, `placeholder_code`, etc.

**Convention d'IDs** : `{module}.{type}_{n}` — ex. `sleep.field_1`, `crisis.step_1_title`. Ces IDs sont durables — ne jamais les renommer après seed appliqué.

### 2.3 Préparer les clés i18n

Toutes les clés référencées par `text_code`, `detail_code`, `low_hint_code`, `high_hint_code`, `placeholder_code` doivent exister :

- `apps/{web,mobile}/src/i18n/locales/fr/common.json`
- `apps/{web,mobile}/src/i18n/locales/en/common.json`
- `apps/mobile/src/i18n/locales/fr/teen.json` — **obligatoire pour toutes les clés `modules.<id>.*`** (tutoiement)
- `apps/mobile/src/i18n/locales/en/teen.json` — idem

> **Override conversation** : les autres langues (`de`, `es`, `it`, `pt`) sont **skippables** si l'utilisateur le précise pour économiser des tokens. Le fallback i18next sur `en` couvre le rendu. Mentionner cet écart dans la doc du module.

Convention : `modules.<module_id>.<élément>` (ex. `modules.sleep_diary.field_1.label`).

### 2.4 Écrire le seed

Créer `supabase/seed/<module_id>_seed.sql` — **idempotent** :

```sql
-- modules
INSERT INTO modules (id, category_id, preview_kind, sort_order, is_invite_excluded)
VALUES ('<module_id>', '<category>', '<preview_kind>', <n>, false)
ON CONFLICT (id) DO UPDATE
  SET preview_kind = EXCLUDED.preview_kind,
      sort_order   = EXCLUDED.sort_order;

-- module_content_fields
INSERT INTO module_content_fields (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order)
VALUES
  ('<module>.field_1', '<module_id>', NULL, NULL, 'field_row', 'modules.<module>.field_1.label', 1),
  ...
ON CONFLICT (id) DO UPDATE
  SET text_code  = EXCLUDED.text_code,
      sort_order = EXCLUDED.sort_order,
      section_id = EXCLUDED.section_id;

-- field_props
INSERT INTO field_props (field_id, prop_key, prop_value)
VALUES
  ('<module>.field_1', 'widget_type', 'time'),
  ('<module>.field_1', 'icon', 'moon')
ON CONFLICT (field_id, prop_key) DO UPDATE
  SET prop_value = EXCLUDED.prop_value;
```

Appliquer **via MCP Supabase** :
```
mcp__supabase__apply_migration(name='<module_id>_seed', query=<contenu sql>)
```

Vérifier ensuite avec `mcp__supabase__execute_sql` :
```sql
SELECT id, preview_kind FROM modules WHERE id = '<module_id>';
SELECT id, field_type, text_code, sort_order
FROM module_content_fields WHERE module_id = '<module_id>'
ORDER BY sort_order;
```

---

## Phase 3 — Choix « étendre vs créer »

Ce skill **interdit la duplication implicite**. **Créer un nouveau composant est exceptionnel — rarissime.** La règle par défaut est de réutiliser ou d'étendre ce qui existe.

### Ordre de priorité strict

1. **Existe-t-il déjà un widget/layout/field_type qui couvre 80 % du besoin ?** → Ajouter une `prop` (variante) au widget existant — pas de nouveau fichier. Documenter la nouvelle prop dans son test et dans la doc du widget.
2. **Y a-t-il un cas équivalent ailleurs ?** → Grep le code (`Grep` tool) sur le besoin (ex. un slider à pips numérotés → `scale_slider_question` existe déjà). Réutiliser.
3. **L'extension requiert un virage trop important (changement de contrat d'API, rupture de comportement) ?** → Créer un composant générique **uniquement après avoir justifié explicitement pourquoi l'extension n'était pas possible** (inscrire la justification dans le fichier de doc du module).

### Si — et seulement si — un nouveau composant doit être créé

**Nom non-métier** (`PipPicker`, pas `SleepDurationPicker`), API par props, pas de strings hardcodés, pas de couplage à un module précis. Une variation = une prop. Plusieurs comportements = un `variant: 'tone-a' | 'tone-b'` documenté.

**Mise à jour obligatoire des docs** — créer un composant sans mettre à jour la documentation correspondante est interdit (veto #14) :

| Ce qui est créé | Document à mettre à jour |
|---|---|
| Nouveau `field_type` (ou extension d'un existant) | `docs/module-engine.md` — section "Inventaire complet des field_types" |
| Nouveau widget (web ou mobile) | `apps/web/docs/design-system.md` ou `apps/mobile/docs/design-system.md` — section Widgets |
| Nouveau service ou nouvelle fonction de service | `docs/services.md` — tableau exhaustif des services |
| Nouveau layout (`preview_kind`) | `docs/module-engine.md` — section "Layouts disponibles (`preview_kind`)" + tableau `FieldRenderer` |
| Nouveau composant UI primitif | Design system doc de l'app concernée — section Composants primitifs |

Cette règle vaut pour les **modifications d'API** d'un composant existant (nouvelle prop) : si la prop change le comportement documenté, mettre à jour la doc.

Anti-pattern à refuser en revue :

```tsx
// ❌ NON — composant spécifique au métier
function SleepHourField(...)

// ✅ OUI — composant générique configuré par props/data
<FieldRow field={f} />  // f.props.widget_type === 'time'
```

---

## Phase 4 — Standards de code expert React

> Le code produit doit être de niveau expert. Stabilité et scalabilité au cœur. Clair, simple, bien commenté **uniquement là où le pourquoi n'est pas évident**.

### 4.1 TypeScript strict — sans concession

- Zéro `any`, zéro `as unknown`, zéro `as any`.
- Discriminated unions pour les états (`{ status: 'idle' } | { status: 'loading' } | { status: 'error'; error: Error } | { status: 'ready'; data: T }`).
- `readonly` sur les données venant de Supabase.
- Props de composant toujours **explicitement typées** via `interface` exporté pour les composants partagés.
- Jamais de `// @ts-ignore`, `// @ts-expect-error`, `// @ts-nocheck`, `// eslint-disable`. Si le compilo râle → corriger la cause.

### 4.2 Render — zéro alloc inline

Tout ce qui est ré-alloué à chaque render brise les optimisations React. À hisser **hors du render** :

| Cas | Solution |
|---|---|
| Lookup map statique (`{ ok: 'green', miss: 'red' }`) | **Module-level** `const` |
| Fonction pure sans dépendance | **Module-level** `function` |
| Style dynamique calculé de props/state | `useMemo` |
| Callback passé à un enfant | `useCallback` |
| Objet passé en prop (`style={{}}`, `action={{}}`) | `useMemo` ou variable pré-calculée |
| Animated `inputRange` / `outputRange` | Constantes module-level `number[]` |
| Items de liste complexes | Composant dédié + `React.memo` |

### 4.3 Hooks — bonne utilisation

- **`useState` est INTERDIT si la valeur ne provoque pas de rerender.** Avant chaque `useState`, se poser la question : « modifier cette valeur seule doit-il mettre à jour l'UI ? ». Si non → `useRef`. Cas typiques de `useRef` :
  - `Animated.Value` (React Native)
  - Snapshot de `route.params`
  - Conteneurs mutés (`Map`, `Set`)
  - Valeur lue seulement dans callbacks ou effects
- `useEffect` : dépendances primitives uniquement. Pas d'objets instables. Pas de logique dérivable en render.
- `useMemo` / `useCallback` : pas un réflexe, mais obligatoire pour les valeurs/fonctions passées à des composants mémoïsés ou utilisées comme deps d'effects.
- **Dériver l'état pendant le render**, pas dans des effects.
- `functional setState` (`setX(prev => …)`) pour stabiliser les callbacks.

### 4.4 Séparation des concepts — non-négociable

Quatre couches, **étanches** :

| Couche | Contenu | Interdit |
|---|---|---|
| **UI** (`screens/`, `pages/`, `components/`) | Affichage et interactions utilisateur uniquement | Zéro accès Supabase / SQLite / fetch, zéro JSON.stringify de payload réseau, zéro logique de cache, zéro règle métier |
| **Services** (`services/*.ts`) | Logique, fetching, écriture, cache, transformation de données — paramètres typés, sans side-effects cachés | Pas de dépendance React, pas de JSX, pas de StyleSheet |
| **Store** (Zustand) | État réactif partagé entre écrans | Pas de logique d'accès ; **délègue** aux services |
| **Types partagés** (`packages/shared/`) | Interfaces réutilisables web+mobile | Pas de couplage à un client concret |

**Interdit en composant** : `import { supabase } from '../lib/supabase'` suivi de `supabase.from(...)` ; `db.execAsync(...)` direct ; `fetch(...)` direct ; `localStorage.setItem(...)` direct. **Obligatoire** : passer par une fonction d'un service.

#### Synchronisation distante — toujours via syncHelpers

Toute fonction de service mobile qui **écrit ou supprime** des données patient en
SQLite doit passer par `syncUpsert` / `syncDelete` de `syncHelpers.ts`.
Ne jamais appeler `dbSave()` seul — les données resteraient orphelines côté patient
même si le consentement de partage est activé.

```ts
// ✅ Patron canonique — le même dans tous les services existants
import { syncUpsert, syncDelete } from './syncHelpers'

export async function saveMyEntry(entry: MyEntry): Promise<void> {
  await syncUpsert(() => dbSave(entry), {
    local_id: entry.id,
    module_id: entry.module_id,
    entry_kind: 'my_entry_kind',   // doit exister dans EntryKind (syncOutbox.ts)
    payload: { /* champs à répliquer */ },
  })
}
```

Si le type de données du module n'est pas encore dans `EntryKind`
(`apps/mobile/src/lib/syncOutbox.ts`) → l'ajouter à l'union **avant** le service.
Ne jamais caster `'my_kind' as EntryKind`.

Règle complète, exceptions légitimes et mock de test dans [`.claude/rules/sync-service.md`](../../.claude/rules/sync-service.md).

#### Zéro duplication — règle dure

Avant d'écrire `await supabase.from('xxx')` dans un service :

1. Grep le code (`Grep` tool) sur le nom de la table et la forme du select. Si la même requête existe déjà → **appeler la fonction existante**, ne pas re-écrire.
2. Si un paramètre manque pour qu'elle réponde au nouveau besoin → l'**ajouter** à la fonction existante avec une valeur par défaut, mettre à jour le test, mettre à jour la JSDoc, mettre à jour `docs/services.md`.
3. Ne *jamais* introduire deux fonctions qui retournent la même donnée — même si elles vivent dans deux services différents.

#### Caching — toujours dans le service, jamais dans le composant

Le cache mémoire (Map en module-scope), le cache de session, l'invalidation : **uniquement côté service**. Modèle de référence : `apps/mobile/src/services/psyeduService.ts` (cache `Map` privé + fonction `clearXCache()` exportée pour les tests et les rechargements forcés).

Règles :
- Un cache de service expose **toujours** une fonction `clearXxxCache()` exportée — sinon les tests ne peuvent pas s'isoler.
- L'invalidation se déclenche dans le **service qui écrit** (pattern « le service qui mute, invalide »), jamais depuis le composant.
- Documenter le cache et sa durée de vie dans la JSDoc de la fonction *et* dans `docs/services.md`.

Anti-pattern à refuser :

```tsx
// ❌ NON — cache local au composant
function MyScreen() {
  const cacheRef = useRef<Map<string, Data>>(new Map())
  const fetch = async (id: string) => {
    if (cacheRef.current.has(id)) return cacheRef.current.get(id)
    const data = await supabase.from('xxx').select(...)
    cacheRef.current.set(id, data)
    ...
  }
}

// ✅ OUI — cache dans le service, contrôlable depuis les tests
import { fetchXxx, clearXxxCache } from '../services/xxxService'

function MyScreen() {
  const data = await fetchXxx(id) // cache transparent côté service
}
```

#### Service = test + JSDoc + entrée dans `docs/services.md`

Un service livré sans **les trois** est un service incomplet. Le skill bloque la clôture de la tâche tant que les trois conditions ne sont pas remplies.

### 4.5 Sécurité

- Toute nouvelle table → RLS + policies dans `supabase/schema.sql`
- `user_id` toujours depuis `auth.uid()` côté Supabase — jamais depuis le payload client
- Tokens d'invitation : usage unique, expiration 48 h
- Secrets mobile dans `expo-secure-store` uniquement

### 4.6 Performance

- `Promise.all` pour les fetches indépendants (démarrer tôt, `await` tard)
- `FlashList` > `FlatList` pour les listes longues, items `React.memo`, callbacks stables, zéro style inline dans les items
- `Map`/`Set` pour les lookups O(1) répétés
- `RegExp` hoisté hors des boucles
- JSX statique hissé hors du composant

### 4.7 Commentaires

Par défaut : **aucun**. Un commentaire vit pour expliquer un *pourquoi non-évident* : une contrainte cachée, un workaround pour un bug spécifique, un invariant, une race condition. Jamais pour décrire ce que le code fait — les identifiants doivent suffire.

### 4.8 Design system — interdiction de hardcoder

- Web : CSS custom properties + classes `preview-*` / `fw-*` documentées dans `apps/web/docs/design-system.md`
- Mobile : `colors`, `spacing`, `radius`, `typography` de `apps/mobile/src/theme/index.ts`
- Animer **uniquement** `transform` et `opacity` (Reanimated)
- Mobile : `Pressable` > `TouchableOpacity` ; `expo-image` pour les images ; safe areas dans les `ScrollView` ; texte toujours dans `<Text>` (jamais string nue dans le JSX)

### 4.9 Mode Ado (mobile) — obligatoire sans exception

Tout écran de module mobile **doit** :
- Importer `useTeen` et `TeenAccent`
- Passer `teenColor('<module_id>')` à `TeenAccent`
- Utiliser `tt(moduleId, textKey)` pour tous les textes propres au module (pas `t()`)
- Avoir des clés `modules.<id>.*` dans `teen.json` fr + en (tutoiement, registre ado)

Cela vaut aussi pour les **écrans dédiés** (non-`FieldRenderer`) : même si la palette teen n'est pas appliquée pour des raisons UX (ex. écran d'urgence rouge), `useTeen` doit être importé pour adapter les textes.

Patron minimal à respecter :

```tsx
import { useTeen } from '../../hooks/useTeen'
import TeenAccent from '../../components/features/TeenAccent'

export default function MyModuleScreen() {
  const { isTeenMode, tt, teenColor } = useTeen()

  return (
    <View style={styles.root}>
      <TeenAccent moduleId="my_module_id" color={teenColor('my_module_id')} />
      {/* tt('my_module_id', 'title') résout modules.my_module_id.title en teen si actif */}
      <Text>{tt('my_module_id', 'title')}</Text>
      ...
    </View>
  )
}
```

Teen mode dans `teen.json` — chaque clé `modules.<id>.*` de `common.json` a sa variante :

```json
// fr/teen.json
{
  "modules": {
    "my_module_id": {
      "title": "Ton titre en tutoiement",
      "disclaimer": "Ce module est un support à tes consultations."
    }
  }
}
```

### 4.10 Style — zéro CSS / StyleSheet dans les composants

Le style **ne décrit pas le composant**, il est consommé par lui. Les composants restent des **structures fonctionnelles** ; l'apparence vient du design system.

#### Web

- **Aucun `style={{ ... }}` ad hoc** dans le JSX, **aucun bloc `<style>` inline**, **aucune string de CSS-in-JS** dans le `.tsx`.
- Une feuille `.css` co-localisée par composant (`MyComponent/MyComponent.css`), importée en haut du fichier. Toutes les valeurs (couleur, spacing, radius, font) passent par les **CSS custom properties** du design system documentées dans [`apps/web/docs/design-system.md`](../../apps/web/docs/design-system.md).
- **Pas de couleur, taille ou spacing en clair** dans le CSS — uniquement `var(--…)`.
- Les seules exceptions tolérées au `style={{}}` : valeurs dynamiques *calculées* qui ne peuvent pas être exprimées en classe (ex. `style={{ borderTopColor: accentColor }}`), avec la **variable obligatoirement issue d'une prop ou d'un token**, jamais une valeur littérale.

#### Mobile

- **Aucun objet style littéral** dans le JSX (`style={{ marginTop: 12 }}` → interdit).
- Un seul `StyleSheet.create({...})` **en bas du fichier** par composant. Toutes les valeurs (`colors`, `spacing`, `radius`, `typography`) viennent du thème `apps/mobile/src/theme/index.ts` — **jamais hardcodées**.
- Pour les styles qui dépendent de props/state : **`useMemo`** retournant un objet mémoïsé construit à partir des tokens du thème. Jamais d'allocation à chaque render.
- Animer **uniquement** `transform` et `opacity` via Reanimated.

#### Anti-patterns à refuser

```tsx
// ❌ NON — style en dur, alloué à chaque render
<View style={{ marginTop: 12, backgroundColor: '#4F46E5' }} />

// ❌ NON — couleur hardcodée même dans StyleSheet
const styles = StyleSheet.create({ box: { backgroundColor: '#4F46E5' } })

// ✅ OUI — tokens du thème
import { colors, spacing } from '../../theme'
const styles = StyleSheet.create({
  box: { marginTop: spacing.sm, backgroundColor: colors.primary },
})
```

### 4.11 Un seul composant React par fichier — règle stricte

**Un fichier `.tsx` exporte exactement un composant React.** Pas deux, pas trois. Cela vaut pour les widgets, les layouts, les écrans, les sous-composants visuels.

Pourquoi :
- Lisibilité : on trouve un composant par son nom de fichier.
- Tests : on teste un composant à la fois, sans ambiguïté de cible.
- Refactor : un composant qui grossit se déplace sans casser les imports.
- Mémoïsation : `React.memo` est attaché clairement à *son* fichier.

Conséquences pratiques :

- Un sous-composant utilisé seulement dans le parent → **son propre fichier** dans le même dossier (`MyLayout/MyLayoutHeader.tsx`).
- Un dossier de composant suit le pattern existant : `<Name>/<Name>.tsx` + `<Name>.test.tsx` + `index.ts` (qui ré-exporte).
- Pas de helpers JSX inline déclarés dans le fichier (`function renderXxx()` qui renvoie du JSX) — soit c'est un *vrai* composant React (alors fichier dédié), soit c'est une fonction pure qui renvoie un primitif/string (alors elle reste).
- `useTranslation` n'est **jamais passé en prop** — chaque composant appelle `useTranslation()` lui-même (cf. règles d'architecture du projet).

Anti-pattern à refuser :

```tsx
// ❌ NON — deux composants dans le même fichier
// MyLayout.tsx
function HeaderRow({ ... }) { ... }
export function MyLayout({ ... }) { return <HeaderRow ... /> }

// ✅ OUI — un fichier par composant
// MyLayout/MyLayoutHeader.tsx
export function MyLayoutHeader({ ... }) { ... }
// MyLayout/MyLayout.tsx
import { MyLayoutHeader } from './MyLayoutHeader'
export function MyLayout({ ... }) { return <MyLayoutHeader ... /> }
```

---

## Phase 5 — Plan d'implémentation type

> Le plan ci-dessous est le squelette canonique. **Sortir ce plan à l'utilisateur et attendre confirmation** avant d'écrire du code.

```
0. [GIT]        OBLIGATOIRE — depuis main à jour, créer la branche dédiée :
                  git checkout main && git pull origin main
                  git checkout -b feat/module-<module_id>
                Aucun fichier n'est touché tant que la branche n'est pas active.
1. [DOC]        Lectures obligatoires (docs/module-engine.md, modules.md, coding-standards.md)
2. [DECISION]   Choix preview_kind + arbre de fields + props + clés i18n — sortir un récap
3. [TYPES]      packages/shared/src/index.ts → ajouter ModuleType
4. [SCHEMA]     supabase/schema.sql → si nouvelle colonne / index / RLS nécessaire
5. [SEED]       supabase/seed/<module_id>_seed.sql idempotent → mcp__supabase__apply_migration
5b.[SYNC]       syncOutbox.ts → ajouter l'EntryKind si absent ; service → syncUpsert/syncDelete
6. [VERIFY]     mcp__supabase__execute_sql → vérifier modules / module_content_fields / field_props
7. [I18N]       fr/en common.json + fr/en teen.json (mobile) — autres langues skippables si demandé
8. [WIDGETS]    Étendre les widgets existants ou en créer (web + mobile en miroir) — tests inclus
9. [LAYOUT]     Étendre un layout existant — cas rare : créer un nouveau preview_kind, justifier
10.[WEB-META]   apps/web/src/lib/database.types.ts → MODULE_LABELS, MODULE_DESCRIPTIONS
11.[WEB-CAT]    apps/web/src/pages/PatientPage.tsx → catégorie armoire thérapeutique
12.[MOB-META]   apps/mobile/src/screens/HomeScreen.tsx → MODULE_CONFIG + icône
13.[ECRAN]      (UNIQUEMENT si interaction impossible avec FieldRenderer) écran dédié + AppStack
14.[TESTS]      Widgets, Layout, ModuleContentScreen, ModulePreviewPanel (mock useTeen côté mobile)
15.[DOC-MOD]    Créer docs/modules/<module_id>.md
16.[DOC-LIST]   Mettre à jour docs/modules.md (tableau)
17.[CLAUDE]     Mettre à jour CLAUDE.md (tableau modules + État d'avancement)
18.[VERIFY]     npm run test:shared && npm run test:web && npm run test:mobile
19.[PR]         feat: module <module_id> — résumé clinique + technique
```

### Quand un écran mobile dédié est légitime

`FieldRenderer` ne convient pas si :
- Animation Reanimated complexe nécessaire (ex. respiration guidée)
- Machine d'état multi-écrans interactive avec navigation interne
- Flux multi-étapes avec persistance partielle de saisie

Sinon, **rester sur `ModuleContentScreen` + un `preview_kind`**.

---

## Phase 6 — Tests systématiques

> **Aucun composant n'est livré sans test.** Aucune exception.

### 6.1 Couverture minimale

| Niveau | Fichier | Couvre |
|---|---|---|
| Widget | `<Widget>/<Widget>.test.tsx` | Rendu par défaut + chaque variante de props + interactions silencieuses (préview = lecture seule côté web) |
| Layout | `FieldRenderer.<preview_kind>.test.tsx` | Rendu à partir d'un fixture `ContentField[]` minimal + arbre complet + edge cases (footer, section vide, props manquantes) |
| Écran mobile | `<Module>Screen.test.tsx` | Mock `useTeen`, mock services, vérifier flow saisie + persistance locale |
| Service | `<domain>Service.test.ts` | happy + erreur Supabase + edge case (lien praticien-patient) |

### 6.2 Mocks indispensables côté mobile

```ts
jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({
    isTeenMode: false,
    tt: () => '',
    tg: () => '',
    teenColor: () => undefined,
  }),
}))
```

### 6.3 Commandes

```bash
npm run test:shared   # packages/shared (vitest)
npm run test:web      # apps/web (vitest)
npm run test:mobile   # apps/mobile (jest)
```

Le skill termine **toujours** par les trois commandes. Aucune n'est skippable.

### 6.4 Type-check

```bash
# Web
cd apps/web && npx tsc --noEmit
# Mobile
cd apps/mobile && npx tsc --noEmit
# Shared
cd packages/shared && npx tsc --noEmit
```

Tout est `tsc --noEmit` clean avant de considérer la tâche terminée.

---

## Phase 7 — Documentation

### 7.1 `docs/modules/<module_id>.md` — fichier obligatoire

Modèle :

```markdown
# Module — <Nom affiché> (`<module_id>`)

## Base clinique
- Référence(s) scientifique(s)
- À qui s'adresse-t-il
- Ce qu'il mesure / aide à faire

## Conformité MDR 2017/745
- Pas de seuil, pas d'interprétation, pas d'alerte
- Stockage local (le cas échéant) — pas de donnée clinique côté serveur

## Architecture technique

### `preview_kind`
<kind> — justification du choix.

### Fields
| id | field_type | text_code | section | sort_order |
|---|---|---|---|---|
| sleep.field_1 | field_row | modules.sleep_diary.field_1.label | NULL | 1 |
| ...

### Field props
| field_id | prop_key | prop_value |
|---|---|---|
| sleep.field_1 | widget_type | time |
| ...

### Widgets utilisés
- TimeWidget — variante par défaut
- SliderWidget — `min=0 max=120 unit=min`

### Layout
- `<preview_kind>` — pas de nouveau layout

### Stockage patient (si applicable)
- Table SQLite `<table>` — schéma, index, contraintes UNIQUE

## Tests
- <Widget>.test.tsx
- FieldRenderer.<preview_kind>.test.tsx
- <Module>Screen.test.tsx (le cas échéant)

## i18n
- Clés `modules.<id>.*` dans `fr/common.json` et `en/common.json`
- Surcharges `teen.json` (fr + en)
- Langues skippées (le cas échéant) : <liste>

## Écran(s) impacté(s)
- Web : ModulePreviewPanel (aperçu lecture seule praticien)
- Mobile : ModuleContentScreen (saisie patient)

## Décisions et trade-offs
- Pourquoi ce preview_kind plutôt qu'un autre
- Variantes de composants étendues vs créées
```

### 7.2 `docs/modules.md`

Ajouter une ligne dans le tableau « Modules thérapeutiques » avec statut, nom, clé, et lien vers la doc.

### 7.3 `CLAUDE.md`

- Tableau « Modules thérapeutiques » : nouvelle ligne avec clé + statut « Implémenté ».
- Section « État d'avancement » : case cochée.

---

## Phase 8 — Format de sortie initial

Avant d'écrire du code, produire ce récap et **attendre la confirmation utilisateur** :

```
## Module : <module_id>

### Branche git
- Branche dédiée : `feat/module-<module_id>` créée depuis main à jour : <oui — affiché avant toute action>

### Visée clinique
<3 lignes>

### preview_kind retenu
<kind> — réutilisation pure / extension d'un widget existant / nouveau layout (à justifier)

### Services
- Audit `docs/services.md` effectué : <oui>
- Réutilisés : <liste de fonctions appelées>
- Étendus (nouveau paramètre) : <liste avec paramètre ajouté>
- Créés : <liste avec JSDoc + test + entrée prévue dans `docs/services.md`>
- Caching prévu : <oui/non — si oui, dans quel service et avec quel `clearXxxCache`>

### Composants impactés
- Réutilisés : <liste>
- Étendus (nouvelles props) : <liste avec props ajoutées>
- Créés : <liste avec justification obligatoire — pourquoi l'extension était impossible — un fichier par composant>
- Docs mises à jour pour chaque création : <liste — docs/module-engine.md / design-system.md / docs/services.md selon le type>
- Style : <vérification — aucun style inline, tokens du design system uniquement>

### Schéma / Seed
- Nouvelle table SQLite ? <oui/non> — colonnes
- Nouvelle table Supabase ? <oui/non> — RLS
- Seed : supabase/seed/<module_id>_seed.sql — N fields, N props

### i18n
- Clés ajoutées : `modules.<id>.*` (fr + en common.json + fr + en teen.json)
- Langues additionnelles skippées : <liste si confirmé>

### Tests prévus
- <liste>

### Mode Ado — confirmation
- `useTeen` + `TeenAccent` intégrés dans chaque écran mobile : <oui>
- Clés `modules.<id>.*` ajoutées dans `fr/teen.json` et `en/teen.json` : <oui>
- `tt(moduleId, key)` utilisé pour les textes propres au module : <oui>

### Synchronisation — confirmation
- Chaque fonction `save*` du service appelle `syncUpsert` : <oui/non — si non, justification>
- Chaque fonction `delete*` du service appelle `syncDelete` : <oui/non — si non, justification>
- `EntryKind` ajouté dans `syncOutbox.ts` si nouveau type : <oui/N/A>
- Mock `jest.mock('../services/sync', ...)` présent dans les tests du service : <oui>

### MDR — confirmation
- Aucun seuil interprétatif, aucune alerte conditionnelle, aucun label clinique apposé sur des chiffres saisis : <oui>

### Plan d'implémentation
<étapes 0-19 numérotées>

### Risques / questions
<ambiguïtés>
```

---

## Garde-fous critiques

0. **Branche git dédiée — obligatoire avant toute écriture.** Aucun fichier n'est créé ni modifié tant que la branche `feat/module-<module_id>` n'est pas active et partie d'un `main` à jour :
   ```bash
   git checkout main && git pull origin main
   git checkout -b feat/module-<module_id>
   ```
   Si la branche actuelle est `main` ou une autre branche non liée au module : **stopper et créer la branche avant de continuer**. Jamais de commit direct sur `main`. Le merge se fait uniquement via PR.

1. **Veto MDR** — si la demande implique seuil, alerte conditionnelle, interprétation automatique sur des données patient, **refuser** et proposer une alternative d'affichage passif.
2. **Veto duplication composant** — si l'utilisateur demande un composant ad hoc qui dédouble un widget existant, **refuser** et proposer une extension par prop.
3. **Veto duplication service** — toute requête / écriture / cache qui dédouble une fonction existante d'un service est refusée. Étendre la fonction existante (paramètre optionnel + valeur par défaut), mettre à jour son test et `docs/services.md`.
4. **Veto SQL / fetch / storage dans un composant** — `supabase.from(...)`, `db.execAsync(...)`, `fetch(...)`, `localStorage.*` directement dans un `.tsx` sont refusés. Tout passe par un service.
5. **Veto cache dans un composant** — `useRef<Map>`, `useState<Map>` à fin de cache de données réseau dans un composant sont refusés. Le cache vit dans le service.
6. **Veto page hardcodée** — toute tentative d'introduire une page React au lieu de passer par `module_content_fields` est refusée, sauf justification d'interaction non exprimable (animation Reanimated, machine d'état multi-écrans).
7. **Veto style en dur** — `style={{...}}` ad hoc, `StyleSheet` avec valeurs hardcodées, classes CSS contenant des couleurs / spacing / radius en clair sont refusés. **Tokens du design system uniquement.**
8. **Veto multi-composants par fichier** — un fichier `.tsx` n'exporte qu'un seul composant React. Tout sous-composant a son propre fichier.
9. **Veto service non documenté** — un nouveau service (ou un service étendu) sans JSDoc + test + ligne mise à jour dans `docs/services.md` n'est pas considéré comme livré.
10. **Web ≡ Mobile — parité stricte, pas vague proximité** — chaque section visible par le patient sur mobile doit apparaître dans la "Vue patient" web, dans le même ordre, en lecture seule. Si l'aperçu web omet une section ou la rétrécit à une note statique alors que le mobile l'affiche en plein, c'est une régression bloquante — pas un design choice. Pour les modules data-driven : corriger le seed ou le `FieldRenderer`. Pour les modules à écran dédié : créer ou compléter un composant `<ModuleId>Preview` (voir section *Parité pour les modules à écran dédié*).
11. **Tests avant clôture** — la tâche n'est pas terminée tant que `tsc --noEmit` et les trois commandes de tests (`test:shared`, `test:web`, `test:mobile`) ne passent pas.
12. **Doc avant clôture** — `docs/modules/<id>.md`, `docs/modules.md`, `docs/services.md` (si service touché), `CLAUDE.md` mis à jour, sinon la tâche n'est pas terminée.
13. **Veto teen mode absent** — tout écran mobile sans `useTeen` + `TeenAccent` + clés `teen.json` (fr + en) est refusé. Aucune exception, même pour les écrans d'urgence ou plein-écran : `useTeen` doit être importé pour les textes même si la palette teen est ignorée pour des raisons UX légitimes.
14. **Veto nouveau composant sans mise à jour doc** — créer un nouveau composant (widget, layout, field_type, service, primitif UI) sans mettre à jour le document de référence correspondant est refusé. La table en Phase 3 liste quel doc mettre à jour selon ce qui est créé. Un composant livré sans sa trace documentaire n'est pas livré — c'est de la dette invisible qui cause le biais de réimplémentation dans les sessions futures.
15. **Veto nouveau field_type sans consultation de l'inventaire** — avant d'introduire un `field_type` qui n'apparaît pas dans `docs/module-engine.md`, vérifier que aucun des 44+ types existants ne couvre le besoin (par prop ou variante). Si un équivalent existe → l'utiliser ou l'étendre. Si aucun équivalent ne convient → justifier en 3 lignes dans le doc du module et mettre à jour l'inventaire.
16. **Veto sync absent** — tout service mobile de module qui appelle `dbSave()` / `db.execAsync()` sans passer par `syncUpsert` / `syncDelete` (`syncHelpers.ts`) est refusé. Aucune exception pour les modules avec stockage SQLite patient. Un `EntryKind` absent de `syncOutbox.ts` plutôt que casté `as EntryKind` est également un veto.
17. **Veto config TypeScript statique** — tout tableau ou objet TypeScript (`const MY_DATA = [...]`) qui encode des métadonnées de module (labels, descriptions, catégories, contenu éditorial) au lieu d'être lu depuis `module_content_fields` / `field_props` est refusé. Règle complète : [`.claude/rules/config-first.md`](../../.claude/rules/config-first.md).
