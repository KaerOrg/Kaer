# Module — Tolérance à la détresse (`distress_tolerance`)

## Base clinique

- **Thérapie Comportementale Dialectique (DBT)** — Marsha Linehan (1993, 2015). La
  tolérance à la détresse est l'un des 4 modules fondateurs, regroupant les
  *compétences de survie en crise* (TIPP, ACCEPTS, self-soothing, IMPROVE, pros & cons).
- **Urge surfing** — technique introduite par **Marlatt & Gordon (1985)**, reprise par
  la DBT et l'ACT, validée par l'ECR **Bowen et al. 2014** (JAMA Psychiatry, n=286,
  PMID 24647726). Métaphore : une pulsion intense est une vague qui monte, atteint un
  pic, puis redescend ; on la « surfe » sans agir dessus.
- **À qui** : adultes et adolescents (mode ado). Support entre consultations, abordé
  avec le soignant — ne remplace pas le suivi.

## Conformité MDR 2017/745

- Aucun seuil, aucune interprétation, aucune alerte conditionnelle aux données.
- L'onglet « Maintenant » **ne stocke aucune donnée** (pas de SQLite, pas de sync) — il
  accompagne une crise en temps réel, comme `grounding`.
- Minuteur **fixe** (5/15 min), non conditionnel aux données → autorisé.
- Message de fin **neutre** (« La vague est passée. Vous avez tenu. ») — jamais
  « vous allez mieux » ni « cette technique marche pour vous » (pas de *pattern insight*).
- Accents de catégorie en couleurs **neutres** (non interprétatives, pas de codage de gravité).

## Architecture technique

### `preview_kind`

`tabbed` — 2 onglets (modèle « apprendre à froid / agir à chaud ») :

| Onglet | `tab_key` | `sub_preview_kind` | Contenu |
|---|---|---|---|
| **Comprendre** | `fiches` | `psyedu` | 6 fiches DBT (`psyedu_topics`/`psyedu_blocks`) — apprendre à froid |
| **Agir en crise** | `now` | **`crisis_companion`** | Compagnon de crise interactif (urge surfing) — agir à chaud |

> L'ancien onglet « En crise » (cartes statiques) a été **supprimé** (2026-06-08) :
> redondant avec « Comprendre » (mêmes 5 techniques, en mieux) et avec « Agir en
> crise » (version actionnable). Modèle à 2 onglets clair, zéro redondance.

### Pourquoi un nouveau layout `crisis_companion` (et pas `guided_exercise`)

`guided_exercise` fait de la navigation **linéaire** pas-à-pas. Le compagnon de crise a
un modèle d'interaction différent : **choix de catégorie → activité (rotation) → minuteur
décompté → fin**, avec un visuel de « vague ». Aucun layout existant ne couvre ce motif
(vérifié dans l'inventaire `module-engine.md`) → création justifiée.

### Fields de l'onglet `now` (parent `dt.tab.now`)

| id | field_type | section | rôle |
|---|---|---|---|
| `dt.now.intro1/2` | `exercise_intro` | — | paragraphes d'accueil (métaphore de la vague) |
| `dt.now.config` | `exercise_config` | — | prop `durations="5,15"` (minutes) |
| `dt.now.cat.{tipp,distraction,sens,improve}` | `crisis_category` | catégorie | en-tête de catégorie (props `icon`, `color`) |
| `dt.now.act.{cat}{1..3}` | `crisis_activity` | catégorie | une activité d'apaisement |

> `crisis_category` et `crisis_activity` sont deux **nouveaux field_types** (inventaire
> mis à jour dans `module-engine.md`). Réutilisés : `exercise_intro`, `exercise_config`.

### Machine à états (mobile patient)

`home` (métaphore de la vague + choix de catégorie, **un seul écran** pour minimiser les
taps en crise) → `activity` (activité + délai) → `timer` (décompte) → `done` (fin neutre).
Boutons « Une autre idée » (rotation des activités), « J'ai tenu », « Arrêter », « Terminer ».

### Code

| Fichier | Rôle |
|---|---|
| `packages/shared/src/index.ts` | `PreviewKind` += `'crisis_companion'` |
| `apps/mobile/.../layouts/CrisisCompanion/CrisisCompanionLayout.tsx` | Machine à états + minuteur (état) |
| `apps/mobile/.../layouts/CrisisCompanion/crisisLogic.ts` | Logique pure (durées, compte à rebours, rotation) |
| `apps/mobile/.../layouts/CrisisCompanion/styles.ts` | StyleSheet (tokens thème) |
| `apps/web/.../layouts/CrisisCompanionLayout/CrisisCompanionLayout.tsx` | Aperçu praticien (storyboard lecture seule) |
| `apps/web/.../layouts/CrisisCompanionLayout/crisisLogic.ts` | `parseDurations` (miroir web) |
| `apps/{mobile,web}/.../FieldRenderer/LayoutDispatcher.tsx` | Routage `crisis_companion` |
| `apps/web/.../ModulePreviewPanel/ModulePreviewPanel.css` | Classes `cc-*` + animation CSS de vague |

### Animation

- **Web** : vague animée en CSS (`@keyframes cc-wave`, `transform`/`opacity`), désactivée
  sous `prefers-reduced-motion`.
- **Mobile** : pas d'animation continue — Reanimated n'est **pas** une dépendance du
  projet et l'`Animated` de base est proscrit. La « vague » est portée par le visuel
  (icône `Waves`) + une **barre de progression pilotée par l'état** (décompte du minuteur).
  Écart assumé vs la spec initiale ; aucune dépendance native ajoutée.

## Stockage patient

Aucun. L'onglet `now` est volatil par conception (conformité MDR + utilisabilité en crise).

## Tests

- `apps/mobile/.../CrisisCompanion/crisisLogic.test.ts` — logique pure (Jest).
- `apps/mobile/.../CrisisCompanion/CrisisCompanionLayout.test.tsx` — machine à états (Jest + RNTL).
- `apps/web/.../CrisisCompanionLayout/CrisisCompanionLayout.test.tsx` — storyboard (Vitest).

## i18n

- Clés `modules.distress_tolerance.tab_now` + `modules.distress_tolerance.now.*`
  (chrome, `cat.*`, `act.*`) dans `fr/common.json` et `en/common.json` (web + mobile).
- Surcharges teen (tutoiement) : `fr/teen.json` + `en/teen.json` (mobile).
- Langues `de/es/it/pt` : non remplies (fallback i18next sur `en`).

## Sources scientifiques (table `module_sources`)

8 sources affichées dans l'onglet « Sources » de l'aperçu web. Les 7 historiques
(Linehan 2006/2015, Stoffers-Winterling 2022, NICE CG78, + 3 physiologiques TIPP) +
**Bowen et al. 2014** (urge surfing). Seed : `supabase/seed/sources_seed.sql`.

## Écran(s) impacté(s)

- **Web** : `ModulePreviewPanel` — aperçu lecture seule praticien (3e onglet).
- **Mobile** : `ModuleContentScreen` — rendu patient (3e onglet, interactif).

## Décisions et trade-offs

- **Nouveau layout** plutôt qu'extension de `guided_exercise` : modèle d'interaction
  fondamentalement différent (minuteur + branchement par catégorie + rotation).
- **Aperçu web statique** (storyboard) vs machine à états mobile : convention du projet
  (l'aperçu praticien est une prévisualisation lecture seule). Tout le contenu patient
  (catégories + activités + durées) reste visible → parité de contenu respectée.
- **Pas d'animation Reanimated mobile** : éviter d'ajouter une dépendance native.

## Spec

[`docs/spec/distress-tolerance-crisis.md`](../spec/distress-tolerance-crisis.md)
