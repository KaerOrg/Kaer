# Armoire thérapeutique — Taxonomie & filtres des modules

> **Statut : implémentée** (branche `feat/improve-module-organization`, PR #46).
> Décrit le *quoi* et le *pourquoi*. Public : praticien novice en informatique,
> le document évite le jargon technique.

## 1. En une phrase

Rendre l'armoire thérapeutique **facile à filtrer** : le praticien retrouve en
quelques clics *« le bon module pour ce patient »* (anxiété, ado, approche TCC…),
au lieu de parcourir une à une des sections figées. On **range toujours par
sections** (comme aujourd'hui), mais on ajoute des **filtres transverses** par
problématique, âge et approche thérapeutique.

## 2. Le problème actuel

Aujourd'hui chaque module appartient à **une seule** catégorie (`category_id`).
Un même outil ne sert pourtant souvent plusieurs problématiques : le thermomètre
de la peur vaut pour l'anxiété **et** le trauma **et** le TOC, chez l'enfant
**comme** l'adulte. Rangé dans le seul tiroir « anxiété », il devient invisible
pour qui cherche autrement. **La taxonomie mono-axe range bien mais retrouve mal.**

Référence du domaine : Psychology Tools et Therapist Aid filtrent tous deux sur
**plusieurs axes croisables** (problématique × approche × type de ressource).
On s'en inspire.

## 3. Décisions cadrées (validées avec l'utilisateur)

| Décision | Choix retenu |
|---|---|
| **Architecture** | Les **sections existantes restent** (rangement par domaine). On **ajoute** des facettes de filtrage — on ne refait pas le rangement. |
| **Axes de filtrage** | **Indication** (problématique) · **Population** (âge) · **Approche** (modalité thérapeutique). Tous en V1. |
| **Séparation outils / échelles** | Deux mondes : onglet **Outils** et onglet **Échelles & questionnaires**. Mêmes filtres, contextes distincts. |
| **Un seul système** | La **même** barre de filtres sert (a) à la configuration de l'armoire et (b) au déblocage d'un module pour un patient. Construite une fois, réutilisée. |
| **Source des tags** | Définis **en base** par l'équipe (seed SQL), jamais en dur dans le code (règle *config d'abord*). Le praticien ne crée pas ses propres tags en V1. |
| **Pas de doublon** | L'axe « domaine » n'est **pas** réintroduit en facette : il est déjà porté par les sections. Les tags expriment ce que les sections ne disent pas. |

## 4. Conformité MDR 2017/745 — garde-fou par construction

Les tags sont une **métadonnée de catalogue** (ils décrivent l'*outil*), lue par
le praticien. C'est autorisé, comme un classement de bibliothèque.

> **Interdit et rendu impossible par le modèle :** aucune table ne relie un tag à
> une donnée patient (`patient_entries`, score d'échelle). Il est donc
> structurellement impossible de faire dériver une suggestion des données du
> patient (« score élevé → utilisez ce module »). **Le praticien filtre lui-même ;
> Kær ne recommande jamais automatiquement.** On reste non-dispositif médical.

## 5. Les axes et leur vocabulaire

Chaque valeur porte une **clé i18n** (`tags.<id>.label`), jamais de texte en base.
Variantes `fr` + `en` obligatoires ; mode ado non concerné (vocabulaire praticien).

### Axe « Indication » — `indication` (14 valeurs)

| id | Libellé fr | Couvre aussi |
|---|---|---|
| `anxiety` | Anxiété | phobies, panique, anxiété sociale |
| `ocd` | TOC | — *(isolé : chapitre DSM-5 distinct, traitement EPR spécifique)* |
| `depression` | Dépression | — |
| `bipolar` | Bipolarité | — |
| `trauma` | Trauma / ESPT | cauchemars traumatiques |
| `psychological_distress` | Souffrance psychique | tag transverse (modules généraux) |
| `emotion_dysregulation` | Dysrégulation émotionnelle | traits borderline |
| `suicidal_crisis` | Crise suicidaire | idéation, auto-agression |
| `addiction` | Addiction | mésusage de substances, craving |
| `sleep` | Sommeil | insomnie, cauchemars |
| `adhd` | TDAH | — |
| `eating_disorder` | Troubles alimentaires | — |
| `perinatal` | Périnatalité | dépression du post-partum |
| `psychosis` | Psychose | expériences psychotiques (CAPE-42) |

### Axe « Population » — `population` (4 valeurs)

`child` (Enfant) · `teen` (Ado) · `adult` (Adulte) · `senior` (Sujet âgé)

### Axe « Approche » — `approach` (9 valeurs)

| id | Libellé fr |
|---|---|
| `cbt` | TCC *(restructuration, exposition/EPR, activation comportementale, CBT-I)* |
| `act` | ACT |
| `dbt` | DBT |
| `motivational_interviewing` | Entretien motivationnel |
| `psychoeducation` | Psychoéducation |
| `relaxation` | Relaxation & ancrage *(respiration, pleine conscience)* |
| `self_monitoring` | Auto-observation *(agendas, journaux de suivi)* |
| `imagery` | Imagerie mentale *(RIM / IRT)* |
| `crisis_management` | Planification de crise |

## 6. Tagging des modules — source de vérité du seed

`★` = mapping étayé par une recherche probante dédiée (PubMed / Consensus, juin 2026,
voir §9). Sans `★` = consensus clinique courant.

### Outils

| Module | Indications | Population | Approche |
|---|---|---|---|
| `crisis_plan` | suicidal_crisis, psychological_distress | teen, adult, senior | crisis_management |
| `distress_tolerance` ★ | emotion_dysregulation, suicidal_crisis, addiction | teen, adult | dbt |
| `therapeutic_commitment` | psychological_distress | teen, adult | act |
| `medication_side_effects` | *(transverse traitement)* | teen, adult, senior | self_monitoring |
| `medication_adherence` | *(transverse traitement)* | teen, adult, senior | self_monitoring |
| `psychoeducation` | psychological_distress | child, teen, adult, senior | psychoeducation |
| `sleep_diary` ★ | sleep, depression | teen, adult, senior | cbt, self_monitoring |
| `diet_weight_psycho` | eating_disorder | teen, adult | cbt, self_monitoring |
| `chronobiology_tracker` | sleep, bipolar, depression | adult | self_monitoring |
| `mood_tracker` | depression, bipolar, psychological_distress | teen, adult, senior | self_monitoring |
| `emotion_wheel` | psychological_distress, emotion_dysregulation | child, teen, adult | psychoeducation |
| `behavioral_activation` ★ | depression, anxiety | teen, adult, senior | cbt |
| `beck_columns` | depression, anxiety | teen, adult | cbt |
| `cognitive_distortions` | depression, anxiety | teen, adult | cbt |
| `grounding` | trauma, anxiety, emotion_dysregulation | child, teen, adult | relaxation |
| `rim` ★ | trauma, sleep | teen, adult | imagery |
| `fear_thermometer` ★ | anxiety, ocd, trauma | child, teen, adult | cbt |
| `breathing_techniques` | anxiety | child, teen, adult, senior | relaxation |
| `cognitive_saturation` | anxiety | teen, adult | cbt |
| `craving_journal` | addiction | teen, adult | self_monitoring |
| `decisional_balance` | addiction | teen, adult | motivational_interviewing |
| `motivational_balance` | addiction, psychological_distress | teen, adult | motivational_interviewing |

### Échelles & questionnaires

| Échelle | Indications | Population |
|---|---|---|
| `phq9` | depression | adult, senior |
| `gad7` | anxiety | adult, senior |
| `bsl23` | emotion_dysregulation | adult |
| `snap_iv` | adhd | child, teen |
| `asrs6` | adhd | adult |
| `asrs18` | adhd | adult |
| `epds` | depression, perinatal | adult |
| `nsi` | sleep, trauma *(Nightmare Severity Index)* | adult |
| `rcads` | anxiety, depression | child, teen |
| `cape42` | psychosis | teen, adult |
| `audit` | addiction | teen, adult |
| `cssrs` | suicidal_crisis | child, teen, adult, senior |

## 7. Modèle de données (esquisse)

Trois tables, dans `supabase/schema.sql` (source de vérité), RLS activée
(lecture pour tout praticien authentifié — tables de référence, comme
`module_categories` ; écriture réservée au seed / service role).

```sql
create table public.tag_dimensions (
  id         text primary key,            -- 'indication' | 'population' | 'approach'
  sort_order int  not null default 0
);

create table public.tags (
  id           text primary key,          -- 'anxiety', 'teen', 'cbt'
  dimension_id text not null references public.tag_dimensions(id),
  sort_order   int  not null default 0
);

create table public.module_tags (         -- liaison N↔N
  module_id text not null references public.modules(id) on delete cascade,
  tag_id    text not null references public.tags(id)    on delete cascade,
  primary key (module_id, tag_id)
);
```

- **Libellés** : résolus côté client par convention (`tags.${tag.id}.label`,
  `tag_dimensions.${dim.id}.label`) — zéro texte en base, comme `category.*`.
- **Ajouter une indication à un module** = un `INSERT` dans `module_tags`,
  zéro redéploiement.
- `database.types.ts` (web) : ajouter les 3 tables à la main (cf. mémoire projet).

## 8. Contrat du composant de filtre (réutilisé partout)

Construit **une fois**, branché aux deux surfaces (armoire de config + déblocage patient).

| Élément | Emplacement | Rôle |
|---|---|---|
| `lib/moduleFilter.ts` | fonctions pures | filtrage (ET entre axes, OU dans un axe), `selectCardTagRows`. Testé, sans I/O. |
| `useTagFilters()` | `hooks/useTagFilters.ts` | charge la taxonomie + possède la sélection active (`toggleTag`, `resetFilters`). |
| `ModuleFilterBar` | `components/features/` | une rangée de puces par dimension + reset + compteur « 12 → 4 ». |
| `ModuleTagChips` | `components/features/` | présentation des tags d'un module sur sa carte. |
| `fetchModuleTaxonomy()` | `services/moduleCatalogService.ts` | étend le service existant (lecture `tag_dimensions` + `tags` + `module_tags`). |

Doc composants : [`apps/web/docs/design-system.md`](../../apps/web/docs/design-system.md)
§ « Composants `ModuleFilterBar` et `ModuleTagChips` ».

- **Pas de portage mobile** (décision validée) : voir §9bis. L'app patient reste
  inchangée.
- **Recherche texte existante** (`SearchInput`) : conservée, combinée aux facettes.

## 9. Base probante (recherches juin 2026)

Mappings marqués `★`, sources principales :

- **Behavioral activation** → dépression (fort) + anxiété comorbide ; ados &
  sujets âgés validés. *(Stein 2019, Psychological Medicine ; Tindall 2024,
  Eur Child Adolesc Psychiatry ; Janssen 2023, Psychother Psychosom.)*
- **RIM / Imagery Rehearsal Therapy** → cauchemars traumatiques/chroniques +
  sommeil + ESPT ; recommandé AASM ; efficace dès l'adolescence. *(Krakow 2001,
  JAMA ; Casement 2012, Clin Psychol Rev ; Morgenthaler 2018, AASM position.)*
- **Distress tolerance (DBT)** → dysrégulation émotionnelle, auto-agression,
  crise suicidaire, addiction ; DBT-A = 1ᵉʳ traitement bien établi de
  l'auto-agression à l'adolescence. *(McCauley 2018, JAMA Psychiatry ;
  Kothgassner 2021, Psychological Medicine ; Stoffers-Winterling 2022, BJPsych.)*
- **Exposition / thermomètre de la peur** → anxiété, phobie, TOC, panique, ESPT ;
  enfant & ado inclus. *(Foa 2016, Annu Rev Clin Psychol ; Carpenter 2018,
  Depress Anxiety ; Plaisted 2020, Clin Child Fam Psychol Rev.)*

## 9bis. Pas de portage mobile — décision et raison MDR

Cette feature est un **outil d'organisation praticien**. L'app mobile est l'app
**patient** (il n'existe pas d'app praticien mobile). Le portage est
**volontairement écarté**, pour deux raisons :

1. **Inutile** : le patient ne voit que ses quelques modules débloqués, déjà
   groupés par catégorie ([`HomeScreen`](../../apps/mobile/src/screens/HomeScreen.tsx)).
   Filtrer une liste de 4-8 éléments n'a pas d'intérêt.
2. **Veto MDR (RÈGLE D'OR)** : afficher au patient des puces d'indication clinique
   sur *ses* modules (« Crise suicidaire » sur son plan de crise, « Dépression »
   sur son agenda du sommeil) revient à **l'étiqueter avec une interprétation
   clinique**. Pour le praticien, c'est une métadonnée de catalogue (autorisé) ;
   devant le patient, c'est un label interprétatif (interdit). Les tags
   d'indication / âge / approche **ne doivent jamais** apparaître dans l'app patient.

La « parité web/mobile » est donc satisfaite par le **modèle de données partagé**
(`module_tags` en base, déjà accessible au mobile) + l'**UI praticien web**. Aucun
code mobile n'est à ajouter.

## 10. Hors périmètre V1

- Tags créés par le praticien (favoris personnels) — réserve future.
- Filtrage par « type de ressource » (worksheet/audio/vidéo) à la Therapist Aid —
  non pertinent tant que les modules sont homogènes.
- Étayage probant des lignes sans `★` (chronobiologie/bipolarité, TCA, ancrage) —
  à faire avant figeage du seed si souhaité.
