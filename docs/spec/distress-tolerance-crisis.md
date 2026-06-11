# Tolérance à la détresse — Compagnon de crise (urge surfing)

> **Statut : spec de conception (validée avec l'utilisateur le 2026-06-07).**
> Décrit le *quoi* et le *pourquoi*. Public : praticien novice en informatique — sans jargon.
> Module concerné : `distress_tolerance`. Branche : `refonte-tolerance-detresse`.

## 1. En une phrase

On ajoute au module « Tolérance à la détresse » un **3ᵉ onglet interactif** qui aide le
patient à **traverser une crise émotionnelle en temps réel** : on lui rappelle qu'une
pulsion intense est *comme une vague* (elle monte, atteint un pic, puis redescend), on
lui propose une activité d'apaisement DBT, et un **minuteur** l'accompagne le temps que
la vague passe.

## 2. Pourquoi (justification clinique et scientifique)

- La **tolérance à la détresse** est l'un des 4 modules fondateurs de la **DBT** (Linehan,
  1993/2015). Les compétences « de survie en crise » sont déjà couvertes par nos fiches
  (TIPP, ACCEPTS, self-soothing, IMPROVE, pros & cons).
- L'**« urge surfing »** (surfer la vague) est une technique introduite par **Marlatt
  (1985)**, reprise par la DBT et l'ACT, validée par l'ECR **Bowen et al. 2014**
  (JAMA Psychiatry, n=286). Ce n'est **pas** une marque déposée — terminologie clinique
  du domaine public, librement réutilisable.
- La référence du marché est **Calm Harm** (charité stem4, construite aux normes NHS sur
  le module distress tolerance de la DBT) : minuteur 5/15 min + métaphore de la vague +
  choix d'activité. Notre onglet s'en inspire **sans copier** son design ni ses textes.
- Le gap actuel de Kær : nos 2 onglets sont **passifs** (on lit des fiches à froid). On
  rate le moment qui compte le plus — *quand le patient est en détresse, là, maintenant*.

## 3. Décisions cadrées (validées avec l'utilisateur)

| Décision | Choix retenu |
|---|---|
| **Ambition** | Compagnon de crise interactif (on garde les 2 onglets existants, on en ajoute un 3ᵉ). |
| **Cœur de l'outil** | Minuteur « urge surfing » + métaphore de la vague. |
| **Saisie pendant la crise** | **Aucune.** Le patient traverse la crise, point. Zéro donnée, zéro stockage. (Le plus simple, le plus utilisable en détresse, le plus sûr MDR.) |
| **Choix de l'activité** | **Par catégorie DBT** (TIPP / Distraction / Apaiser les sens / Améliorer l'instant), puis une activité. |
| **Juridique** | Urge surfing = technique académique libre. On rédige nos propres textes (via `text_code` i18n). On ne copie aucun asset Calm Harm. |

## 4. Les 3 onglets après refonte

```
┌──────────────────────────────────────────────────────────────┐
│  [ Comprendre ]      [ En crise ]      [ 🌊 Maintenant ]       │  ← onglets
├──────────────────────────────────────────────────────────────┤
```

| Onglet | `tab_key` | `sub_preview_kind` | État |
|---|---|---|---|
| Comprendre (fiches DBT) | `fiches` | `psyedu` | ✅ existe — inchangé |
| En crise (cartes) | `crisis` | `cards` | ✅ existe — inchangé |
| **Maintenant** | `now` | `crisis_companion` 🆕 | à créer |

## 5. Le 3ᵉ onglet — déroulé interactif (machine à états, sans données)

Même philosophie que le module `grounding` (layout `guided_exercise`) : un écran
interactif multi-états, **sans aucune persistance** (ni SQLite, ni sync Supabase) → donc
conforme MDR par construction. Différence : ici, modèle « choix de catégorie + minuteur +
animation de vague » au lieu de la navigation linéaire pas-à-pas de `guided_exercise`.
C'est ce qui justifie un **nouveau layout** plutôt qu'une réutilisation.

```
État 1 — Accueil (« la vague »)
  Texte : « Une envie forte, c'est comme une vague : elle monte, atteint un pic,
            puis redescend. Tu n'as pas à agir dessus — juste à tenir le temps
            qu'elle passe. »
  [ Choisir une activité ]

État 2 — Choix de catégorie
  ┌───────────┬───────────┬───────────┬───────────┐
  │   TIPP    │Distraction│  Apaiser  │ Améliorer │
  │ (corps)   │ (ACCEPTS) │ les sens  │ l'instant │
  └───────────┴───────────┴───────────┴───────────┘

État 3 — Activité proposée
  Affiche UNE activité de la catégorie choisie (texte issu de la base).
  Choix du délai :  [ 5 minutes ]   [ 15 minutes ]
  (Optionnel : bouton « une autre » pour faire défiler les activités de la catégorie.)

État 4 — Minuteur « vague »
  Visuel : une vague qui monte puis redescend (animation transform/opacity).
  Compte à rebours fixe.   [ J'ai tenu ]   [ Arrêter ]

État 5 — Fin (neutre)
  « La vague est passée. Tu as tenu. »
  [ Recommencer ]   [ Terminer ]
```

## 6. Garde-fous MDR 2017/745 (vérifiés)

| Règle | Application ici |
|---|---|
| Le code affiche/minute, ne conclut jamais | Minuteur **fixe** (5/15 min), non conditionnel aux données → autorisé. |
| Pas d'alerte déclenchée par les données | Aucune donnée saisie → rien à déclencher. |
| Pas d'interprétation | Message de fin neutre. **Jamais** « tu vas mieux », **jamais** « cette technique marche pour toi » (≠ les *pattern insights* de DBT Pal, qu'on s'interdit). |
| Bandeau d'avertissement | `disclaimer_banner` conservé en haut du module. |

## 7. Architecture technique (config-first + parité web≡mobile)

Tout le contenu vit **en base** (règle config-first). Le nouveau layout ne fait que
*l'orchestration* (machine à états, minuteur, animation) ; il lit 100 % de ses textes
depuis les `module_content_fields`.

### 7.1 Données (Supabase — `module_content_fields` + `field_props`)

Nouveau `tab` :

| id | field_type | props |
|---|---|---|
| `dt.tab.now` | `tab` | `icon_name=Waves, sub_preview_kind=crisis_companion, tab_key=now` (sort_order 15) |

Champs du compagnon (rendus par le layout `crisis_companion`) :

| field_type | rôle | props clés |
|---|---|---|
| `crisis_intro` | paragraphe(s) d'accueil (métaphore de la vague) | — |
| `crisis_config` | libellés d'UI + durées | `durations=[5,15]`, `start_btn`, `pick_another_btn`, `hold_btn`, `stop_btn`, `restart_btn`, `done_text` (clés i18n) |
| `crisis_category` | une catégorie = un `section_id` | `icon`, `color`, `category_key` ; `text_code` = nom |
| `crisis_activity` | une activité, rattachée à un `section_id` (catégorie) | `text_code` = consigne de l'activité |

> Les catégories réutilisent le nom de motif générique. **Aucune clé i18n de module n'est
> hardcodée dans le layout** : on dérive `modules.${moduleId}.*` depuis le `module_id`
> porté par les fields (règle config-first).

### 7.2 Code

| Fichier | Rôle |
|---|---|
| `apps/mobile/.../layouts/CrisisCompanion/CrisisCompanionLayout.tsx` | Machine à états + minuteur + barre de progression (pilotée par l'état — **pas de Reanimated**, dépendance native absente du projet). Lit les fields. |
| `apps/mobile/.../layouts/CrisisCompanion/crisisLogic.ts` | Logique pure (formatage du compte à rebours, regroupement activités par catégorie, sélection « une autre ») + ses tests. |
| `apps/web/.../layouts/CrisisCompanion/CrisisCompanionLayout.tsx` | Même déroulé pour l'aperçu praticien (animation CSS). Parité garantie. |
| `LayoutDispatcher.tsx` (web + mobile) | Brancher `sub_preview_kind = 'crisis_companion'`. |

### 7.3 Ce qu'on NE fait PAS

- ❌ Réutiliser `guided_exercise` de force (modèle d'interaction différent : pas de
  minuteur ni de branchement par catégorie).
- ❌ Stockage local ou sync (`syncHelpers` non concerné — pas de données patient).
- ❌ Copier le design / les textes / la liste d'activités de Calm Harm.
- ❌ Tout `if (intensité > seuil)` ou *pattern insight*.

## 8. Internationalisation

- Toutes les nouvelles clés `modules.distress_tolerance.now.*` ajoutées dans
  `fr/common.json` + `en/common.json` **et** `fr/teen.json` + `en/teen.json` (tutoiement).
- `de/es/it/pt` : best-effort.
- Le label de l'onglet : `modules.distress_tolerance.tab_now`.

## 9. Sources (déjà traité — étape 1)

- Les **7 sources existantes** de `distress_tolerance` sont en base et affichées dans
  l'app web (onglet « Sources » du `ModulePreviewPanel`).
- **Ajout** : Bowen et al. 2014 (ECR, PMID 24647726) comme base probante de l'urge
  surfing — 8ᵉ source, ajoutée dans `supabase/seed/sources_seed.sql` et en base de prod.
  Marlatt & Gordon 1985 (livre, origine de la technique) cité en commentaire + dans la fiche.

## 10. Livrables (règle « feature = doc + tests »)

- [x] Sources urge surfing rattachées à `distress_tolerance` (seed + prod).
- [x] Ce fichier de spec.
- [x] Nouveau layout `crisis_companion` (web + mobile) + logique pure testée.
- [x] Champs Supabase (`dt.tab.now` + champs du compagnon) dans `seed.sql` + prod.
- [x] i18n fr/en common + teen.
- [x] Tests : Jest (mobile, logique + rendu, 14), Vitest (web, rendu, 3).
- [x] `docs/modules/distress_tolerance.md` (créé).
- [x] Mise à jour `docs/module-engine.md` : nouveaux `field_type` (crisis_category/crisis_activity) + nouveau `sub_preview_kind` (`crisis_companion`).
- [x] `docs/modules.md` mis à jour (CLAUDE.md délègue à docs/modules.md, module déjà listé).

## 11. Références

- Linehan MM (2015). *DBT Skills Training Manual*, 2nd ed. Guilford Press.
- Marlatt GA & Gordon JR (1985). *Relapse Prevention*. Guilford Press. (origine urge surfing)
- Bowen S et al. (2014). MBRP vs RP vs TAU. *JAMA Psychiatry*. PMID 24647726.
- Calm Harm (stem4) — référence marché : https://calmharm.stem4.org.uk/
