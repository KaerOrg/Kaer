# Sources & recommandations par module

Onglet **« Sources & recommandations »** du panneau d'aperçu praticien (`ModulePreviewPanel`). Il affiche, pour chaque module thérapeutique, la liste des références bibliographiques et recommandations officielles qui le fondent (essais, cohortes, méta-analyses, guidelines HAS/NICE…).

> **Objectif** : donner au praticien la base scientifique d'un module avant de le débloquer, sans quitter la fiche patient.

## Conformité MDR 2017/745

Cette feature est **passive** : elle affiche des références bibliographiques scientifiques. Le badge de grade de preuve (A/B/C) qualifie la **source** (qualité de l'étude selon GRADE/HAS), **jamais** une donnée clinique du patient. Aucun seuil, aucune interprétation des saisies patient — hors champ dispositif médical.

## Architecture

| Fichier | Rôle |
|---|---|
| `supabase/schema.sql` | Table `module_sources` (DDL + RLS + index) |
| `supabase/seed/sources_seed.sql` | Seed idempotent (`ON CONFLICT (id) DO UPDATE`), UUIDs fixes |
| `packages/shared/src/index.ts` | Types `ModuleSource`, `ModuleSourceType` |
| `apps/web/src/services/moduleSourcesService.ts` | `fetchSourcesByModule` (cache mémoire) + `clearModuleSourcesCache` |
| `apps/web/src/components/features/ModuleSources/ModuleSourcesPanel.tsx` | Panneau liste (états loading / vide / erreur / data), groupé par niveau de preuve |
| `apps/web/src/components/features/ModuleSources/sourceGroups.ts` | Groupement pur par niveau de preuve, dérivé de `source_type` |
| `apps/web/src/components/features/ModuleSources/ModuleIndicationsBlock.tsx` | Bloc « Indications » : puces de taxonomie + mention de non-instrument |
| `apps/web/src/components/features/ModulePreviewPanel/ModulePreviewPanel.tsx` | Hôte — 2 onglets via `<Tabs>` (Vue patient / Sources) |

## Ce que le panneau affiche, dans l'ordre (#270)

1. **Bloc « Indications »**, générique à tous les modules et rendu seulement si le
   module porte des tags. Deux lignes, **lues dans la taxonomie** (`indication` en ton
   *info*, `population` en ton *neutral*) : ce sont exactement les puces de la carte du
   module, par le même composant `ModuleTagChips` et la même sélection
   (`selectCardTagRows`). **Aucune liste d'indications n'existe dans le code.** Ajouter
   une indication à un module = lui attribuer un tag dans le seed, et elle apparaît du
   même coup dans les filtres du catalogue, sur la carte et ici. Une seule vérité.
2. Sous les puces, la **mention qui protège le module** (« ce n'est pas un instrument
   de mesure… »), lue elle aussi en base : c'est le champ `footer_note` du module,
   celui que le patient voit en pied d'écran. Pas de texte par module dans le code.
3. **Les sources, groupées par niveau de preuve** : *Revues et méta-analyses*
   (`meta_analysis`, `systematic_review`, `guideline`), puis *Essais randomisés*
   (`rct`, `cohort_study`), puis *Mécanisme et source de l'instrument*
   (`expert_opinion`). L'ordre dérive de `source_type`, **jamais d'un champ nouveau** ;
   les six valeurs de `ModuleSourceType` sont réparties, il n'en existe pas d'autre.
   À l'intérieur d'un groupe, l'ordre du seed (`sort_order`) est conservé.

Un module **sans source** affiche l'état vide, inchangé.

## Table `module_sources`

Une ligne = une source. Colonnes :

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | `gen_random_uuid()` ; UUID fixe dans le seed pour l'idempotence |
| `module_id` | text (FK → `modules.id`) | `on delete cascade` |
| `label` | text | Référence affichée (auteur, titre, revue, année) |
| `source_type` | text (check) | `rct` \| `cohort_study` \| `meta_analysis` \| `systematic_review` \| `guideline` \| `expert_opinion` |
| `url` | text \| null | Lien DOI / page officielle |
| `evidence_grade` | text (check) \| null | `A` \| `B` \| `C` — **uniquement si formulé explicitement** dans le document source, jamais extrapolé |
| `description` | text \| null | Résumé court du résultat |
| `sort_order` | int | Ordre d'affichage |

**RLS** : `enable row level security` + policy `module_sources_authenticated_select` (`for select to authenticated using (true)`). Lecture seule ; l'écriture passe par le seed (service role).

**Index** : `idx_module_sources_module_id (module_id, sort_order)`.

## Service

```ts
import { fetchSourcesByModule } from '../../../services/moduleSourcesService'

const sources = await fetchSourcesByModule(moduleId) // ModuleSource[] triées par sort_order
```

- **Cache mémoire** : `Map<moduleId, ModuleSource[]>` en session. `clearModuleSourcesCache()` exportée pour forcer un rechargement.
- Propage l'erreur Supabase (le composant la capte et affiche l'état vide).

## Règle de rigueur des sources

Le seed `sources_seed.sql` impose (voir en-tête du fichier) :

- **Études** : vérifiées via PubMed (PMID + abstract lu).
- **Guidelines** : URL vérifiée + contenu lu via WebFetch.
- **`evidence_grade`** : renseigné uniquement si explicitement formulé dans le document — aucun grade inventé ni extrapolé du type d'étude.

## i18n

Le chrome d'UI (intitulés d'onglets, libellés de type, intro, état vide, « Grade {{grade}} ») passe par `t('patient.*')` — clés présentes dans `fr/common.json` et `en/common.json`. Le web n'a pas de mode ado.

> **Limite connue** : `label` et `description` de `module_sources` sont actuellement stockés en français brut et rendus tels quels. Acceptable pour des citations scientifiques mono-langue ; à migrer vers des `text_code` i18n si une localisation `en` de ces contenus devient nécessaire.

## Tests

| Test | Couverture |
|---|---|
| `apps/web/src/services/moduleSourcesService.test.ts` | happy path trié, `data: null → []`, cache (1 requête), erreur propagée, `clearModuleSourcesCache` |
| `apps/web/src/components/features/ModuleSources/ModuleSourcesPanel.test.tsx` | loading, data, lien externe sécurisé, label sans url, état vide, erreur → vide, rechargement sur changement de `moduleId` |

## Ajouter des sources à un module

1. Insérer des lignes dans `supabase/seed/sources_seed.sql` (UUID fixe, `module_id` existant, sources vérifiées).
2. Ré-exécuter le seed (idempotent).
3. Aucun changement de code : le panneau lit la base au montage.
