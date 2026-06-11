# Module Psychoéducation — Bibliothèque de fiches

> Refonte 2026-06 : voir [`docs/spec/refonte-psychoeducation.md`](../spec/refonte-psychoeducation.md).
> Ce module n'utilise plus de cartes codées en dur — tout le contenu vit en base.

## Vue d'ensemble

Le module **Psychoéducation** est une **bibliothèque de fiches** que le praticien
débloque, fiche par fiche, pour chaque patient. Les fiches sont rangées par **thème**
(🟣 *Mon traitement*, 🟢 *Hygiène de vie*, …) et le patient les consulte dans l'app
mobile, où il peut confirmer sa lecture.

C'est un cas particulier du moteur `psyedu` : même contenu (`psyedu_topics` +
`psyedu_blocks`), mais affiché comme une bibliothèque **multi-thèmes / multi-modules**
filtrée par les fiches débloquées du patient, au lieu de l'ensemble des fiches d'un
seul module.

## Modèle de données

- `psyedu_topics` : la fiche (rattachée à un `theme_id`, porte des `psyedu_topic_tags`).
- `psyedu_blocks` : le contenu structuré (sections why/how/sources, clés i18n `text_code`).
- `psyedu_themes` : les thèmes de la bibliothèque (`treatment`, `lifestyle`, …).
- `patient_modules.config.unlocked_topics` : `[{ topic_id, is_read, unlocked_at }]` —
  les fiches débloquées pour ce patient + leur statut de lecture.

Découplage fiche ↔ module : une fiche peut être réutilisée par un module interactif
(onglet « Comprendre ») via `module_topics`, sans duplication.

## Rendu

`preview_kind = 'psyedu_library'`, routé par le `LayoutDispatcher` :

| App | Composant | Comportement |
|---|---|---|
| Mobile patient | `layouts/PsyEduLibrary/PsyEduLibraryLayout` | Lit `config.unlocked_topics`, fiches groupées par thème, détail + « marquer comme lu » |
| Web praticien (aperçu) | `layouts/PsyEduLibraryLayout` | Toutes les fiches à thème, groupées par thème (aperçu de ce que verrait un patient) |

Helpers i18n partagés : `layouts/PsyEdu/psyeduLocalize.ts` (`topicTitle`/`topicSummary`/`sortBlocks`).

## Côté praticien (web)

Le praticien débloque/édite les fiches via `PsychoLibraryPicker`
(`pages/PatientPage/tabs/PsychoLibraryPicker.tsx`) : sélection groupée par thème +
recherche. Services : `unlockPsychoeducation` / `updatePsychoeducationTopics`
(`moduleAssignmentService`), qui écrivent `config.unlocked_topics`.

## Côté patient (mobile)

`markTopicRead(patientId, topicId)` (`psyeduService`) met à jour
`config.unlocked_topics[].is_read` — écriture Supabase directe (RLS
`modules_patient_update`), pas de stockage SQLite (hors périmètre `syncHelpers`).

## Conformité MDR

Affichage passif de savoir neutre, sourcé et daté. Statut lu/non-lu = fait d'usage.
Personnalisation = **curation humaine du praticien**, jamais une recommandation
automatique basée sur les données du patient. Liens fiche→outil statiques.

## Tests

```bash
cd apps/mobile && npx jest PsyEduLibraryLayout
cd apps/web    && npx vitest run src/services/psyeduService.test.ts
```
