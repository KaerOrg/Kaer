# Module — Alimentation et psychotropes (`diet_weight_psycho`)

## Objectif

Fiches psychoéducatives destinées au patient sur les interactions entre les médicaments psychotropes, l'alimentation et les habitudes de vie. Le module affiche uniquement des informations factuelles — aucun score, aucun seuil, aucune alerte conditionnelle (conformité MDR 2017/745).

## Contenu — v2 (8 fiches)

Le contenu est stocké en base de données (Supabase) via deux tables :
- `psyedu_topics` — métadonnées de chaque fiche (clé, icône, ordre)
- `psyedu_blocks` — blocs structurés de contenu (par section : why / how / sources)

Les textes sont stockés sous forme de `text_code` (clés i18n), traduits dans l'app via `apps/mobile/src/i18n/locales/fr/psyedu.json` (adulte) et `psyedu_teen.json` (surcharges tutoiement).

### Section 1 — Hygiène de vie

| `topic_key` | Titre | Icône Lucide |
|---|---|---|
| `sleep_chrono` | Le sommeil et la récupération | `Moon` |
| `nutrition_brain` | Alimentation et cerveau | `Apple` |
| `gentle_activity` | Activité physique douce | `Footprints` |

### Section 2 — Médicaments & alimentation

| `topic_key` | Titre | Icône Lucide |
|---|---|---|
| `general` | Psychotropes et alimentation | `Info` |
| `antipsychotics` | Antipsychotiques et poids | `Pill` |
| `methylphenidate` | Méthylphénidate et appétit | `Zap` |
| `antidepressants` | ISRS et antidépresseurs | `SmilePlus` |
| `mood_stabilizers` | Thymorégulateurs | `HeartPulse` |

## Architecture — v2

```
supabase/schema.sql                                          — tables psyedu_topics + psyedu_blocks (RLS)
supabase/seed/psyedu_seed.sql                                — seed idempotent (8 topics + blocs)
packages/shared/src/index.ts                                 — types PsyEduTopic, PsyEduBlock, PsyEduSectionKey, PsyEduBlockType
apps/mobile/src/services/psyeduService.ts                    — fetchTopicsByModule, fetchBlocksByTopic, clearPsyEduCache (cache mémoire session)
apps/mobile/src/components/InlineText.tsx                    — rendu inline avec **bold** + fallback teen mode
apps/mobile/src/components/PsyEduBlockRenderer.tsx           — rendu des blocs structurés (heading, paragraph, bullet_list, tip, blockquote, source_link)
apps/mobile/src/i18n/locales/fr/psyedu.json                 — traductions adulte (vouvoiement)
apps/mobile/src/i18n/locales/fr/psyedu_teen.json            — surcharges tutoiement (teen mode)
apps/mobile/src/screens/modules/DietWeightPsychoScreen.tsx   — SectionList avec 2 sections + icônes Lucide
apps/mobile/src/screens/modules/DietWeightPsychoDetailScreen.tsx — lecture d'une fiche (sections why → how → sources)
```

## Navigation mobile

```
HomeScreen → DietWeightPsycho (SectionList) → DietWeightPsychoDetail (scroll)
```

Paramètres de `DietWeightPsychoDetail` : `{ topicId: string; topicTitle: string }`.  
Le titre de l'écran est passé en paramètre de navigation (résolu à la sélection, depuis la clé i18n).

## Rendu des blocs

Chaque fiche est composée de blocs ordonnés, répartis en sections :

| Section (`section_key`) | Ordre affiché | Label i18n |
|---|---|---|
| `why` | 1 | `section.why` — "Pourquoi c'est important" |
| `how` | 2 | `section.how` — "Comment faire concrètement" |
| `sources` | 3 | `section.sources` — "Pour aller plus loin" |

Le tri des sections est fait côté client (`SECTION_ORDER` dans `DietWeightPsychoDetailScreen`).

Types de blocs supportés par `PsyEduBlockRenderer` :

| `block_type` | Rendu |
|---|---|
| `heading` | `<Text>` h2 bold |
| `paragraph` | `<InlineText>` avec parsing **bold** |
| `bullet_list` | Liste à puces (`items_codes[]`) |
| `tip` | Carte colorée `primaryLight` |
| `blockquote` | Bordure gauche grise, texte italique |
| `source_link` | `<Pressable>` → `Linking.openURL` |

## Teen mode

- `DietWeightPsychoScreen` et `DietWeightPsychoDetailScreen` utilisent `useTeen()` + `<TeenAccent>`.
- Les textes sont résolus via `InlineText` : si `psyedu_teen` contient la clé → tutoiement, sinon fallback vers `psyedu`.
- La couleur teen du module est `#06B6D4` (définie dans `apps/mobile/src/theme/teen.ts`).

## Tests

```
apps/mobile/src/services/psyeduService.test.ts   — 10 tests (service + cache + MDR)
```

## Côté praticien (web)

Module débloquable depuis la fiche patient dans la catégorie **Hygiène de Vie & Rythmes Biologiques**.

## Conformité MDR

- Aucun score calculé
- Aucun seuil déclenchant quoi que ce soit
- Affichage d'informations générales validées par des recommandations de bonne pratique
- L'interprétation appartient exclusivement au praticien et au patient
