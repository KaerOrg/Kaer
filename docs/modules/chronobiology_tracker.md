# Module `chronobiology_tracker` — « Rythmes & régularité »

> **Statut : `coming_soon`** (refonte en cours, branche `refonte/chronobiologie`).
> Spec et feuille de route : [`docs/spec/rythmes-regularite.md`](../spec/rythmes-regularite.md).
> `module_id` inchangé (`chronobiology_tracker`) ; seul le **nom affiché** devient « Rythmes & régularité ».

## Objet

Carnet de suivi des **rythmes sociaux quotidiens** (zeitgebers comportementaux). Objet clinique :
la **régularité des horaires de vie**. Complémentaire de l'agenda du sommeil (`sleep_diary`), qui
reste l'outil fin du sommeil ; ici on suit la régularité des ancres de la journée.

Base scientifique et décisions de cadrage : voir la spec.

## Structure (preview_kind `tabbed`)

Trois onglets, dans cet ordre (on arrive directement sur l'action, pas sur la lecture) :

| Ordre | Onglet | `sub_preview_kind` | Contenu |
|---|---|---|---|
| 1 | Journal | `column_form` | Saisie des ancres horaires du jour (toutes optionnelles) |
| 2 | Vue mensuelle | `chrono_month` | Vue mensuelle / historique neutre |
| 3 | Fiches | `psyedu` | Lecture psychoéducative contextuelle (même contenu que la bibliothèque) |

## Catalogue d'ancres

Défini en base (`module_content_fields`, champs `column_time_field` enfants de `chrono.col.h`) :

| Clé | Ancre | i18n (contenu) |
|---|---|---|
| `wake_time` | Lever | `modules.chrono_bio.wake_time` |
| `first_meal` | Premier repas | `modules.chrono_bio.first_meal` |
| `main_activity` | Activité principale | `modules.chrono_bio.main_activity` |
| `last_meal` | Dernier repas | `modules.chrono_bio.last_meal` |
| `bedtime` | Coucher | `modules.chrono_bio.bedtime` |
| `light` | Exposition à la lumière / sortie | `modules.chrono_bio.light` |

Les 5 premières = Social Rhythm Metric-5 de l'IPSRT. `light` ajoutée à la refonte (zeitgeber
dominant, Dollish 2023). Toutes **optionnelles** (`field_props optional = '1'`).

## Ancres : toutes suivies, aucune configuration

**Décision produit (2026-06-18) :** pas de configuration des ancres par patient. Les 6 ancres sont
**toujours toutes proposées** ; la saisie est **optionnelle**. Une ancre que le patient ne remplit
pas n'apparaît simplement pas à son bilan — le panneau de régularité praticien n'affiche que les
ancres saisies au moins 2 fois. La sélection par patient (ex-`config.anchors`, carte praticien
`ChronobiologyCard` + hook + filtrage mobile) a été **retirée** : elle ajoutait une étape sans
bénéfice réel, la friction étant déjà couverte par l'optionalité + le bouton « comme d'habitude ».

La carte praticien `ChronobiologyCard` conserve : aperçu patient, panneau Données (régularité),
bouton de rappel.

## Capture anti-friction (Phase 3 — livré)

Bouton **« comme d'habitude »** (mobile, `ColumnFormLayout`) : en nouvelle saisie, reprend les
valeurs de la dernière entrée (le patient ajuste puis enregistre). Opt-in **config-first** via le
prop `prefill_from_last` du `column_form_config` (libellé `common.prefill_from_last`, fr+en).
Générique (tout module `column_form` peut l'activer), masqué en mode édition. Choix explicite
(pas de préremplissage silencieux) → intentionnalité préservée, conforme MDR.

## Saisie rétroactive — date éditable (livré)

Opt-in **config-first** via le prop `editable_date` du `column_form_config` : un sélecteur de date
apparaît en mode saisie (`ColumnFormLayout`), bornée à aujourd'hui (`maximumDate`). Permet au
patient de dater une saisie d'un jour précédent (ex. il remplit le lendemain). Persistée dans
`form_entries.created_at` (`saveFormEntry` accepte un `created_at` optionnel). Générique à tout
module `column_form`. Feature patient (l'indice de régularité praticien reste basé sur les horaires,
pas sur la date).

## Conformité MDR 2017/745

> Le code affiche, jamais il ne conclut.

- **Vue patient** : horaires saisis en historique neutre + visualisation de dispersion non jugée ;
  rappel d'horaire **fixe** (non conditionnel aux données) ; saisie **anti-friction** (bouton
  « comme d'habitude », < 10 s, rétroactif). Streak de **saisie** (engagement) autorisé.
- **Vue praticien** : indice de régularité **calculé** (chiffre brut, comme un score d'échelle).
- **Interdits** : score/label affiché au patient, alerte déclenchée par les données, comparaison à
  une norme, flèche/couleur de tendance, **streak de régularité**.

## Données

- Saisie patient → SQLite local `form_entries` via le `column_form` générique (offline-first) +
  `syncUpsert`/`syncDelete` (`entry_kind = 'form_entry'`, payload `{ module_id, values }`). Déjà
  câblé par `formEntryService` (mobile).
- Côté web, le praticien lit les entrées synchronisées dans `patient_entries`.

## Restitution de la régularité (Phase 4 — livré)

- **Calcul** (`apps/web/src/lib/anchorRegularity.ts`) : écart-type **circulaire** par ancre, en
  minutes, à partir des `payload.values`. Les statistiques circulaires gèrent le passage par minuit
  (23:50 et 00:10 sont proches). **Valeur brute** — aucun seuil, label, couleur ni norme (MDR).
- **Vue praticien** : `fetchChronoRegularity` (engagementService) → statut `regularity` dans
  `engagementQueries.moduleData` → `ChronoRegularityPanel` (rendu dans le panneau « Données » de la
  carte). Affiche l'écart-type brut par ancre + le nombre de jours, avec une note « valeurs brutes à
  interpréter en consultation ».
- **Vue patient** : restitution neutre **déjà** assurée par l'historique (`column_form`) et la vue
  mensuelle (`ChronoMonth`). Pas de viz de dispersion patient (serait interprétative → choix MDR).

## Contenu psychoéducatif (Phase 5 — livré)

`supabase/seed/chrono_seed.sql` contient 7 fiches psyedu sourcées (dont une sur l'ancre lumière).
L'onglet Fiches a été retiré du tracker (découplage fiche↔module) ; les fiches sont désormais
rattachées au thème **`lifestyle`** (Hygiène de vie) → elles apparaissent dans la **bibliothèque
Psychoéducation** aux côtés des fiches sommeil/alimentation/activité (`fetchLibraryTopics` ne
retourne que les fiches avec `theme_id`). Titres/contenus i18n dans `psyedu.json`.

## Rappels (Phase 5 — livré)

`ChronobiologyCard` expose un bouton cloche (`onConfigureNotif` → `NotificationRoutineModal`) :
le praticien configure un **rappel d'horaire fixe** invitant le patient à saisir ses ancres.
Rappel **non conditionnel aux données** (horaire fixe) → explicitement autorisé par la règle d'or
MDR (≠ alerte déclenchée par un score).

## i18n (soldé)

- [x] Contenu `modules.chrono_bio.*` + `modules.chronobiology_tracker.anchor_*` créés en
  **mobile en** (parité avec mobile fr).
- [x] Variantes **teen** ciblées (`modules.chrono_bio.*` + `chronobiology_tracker.description`)
  en **mobile fr/en** (tutoiement ; i18next retombe sur `common` pour les clés neutres).
- Web : seuls les libellés d'ancres + clés `config_*`/`regularity_*` sont nécessaires (présents
  fr/en) — le web ne rend pas l'écran patient journal/mois, donc pas de contenu `chrono_bio` à
  traduire côté web.
- `de/es/it/pt` : best-effort (i18next fallback `en`), non requis.

Fait en Phase 1 : renommage « Rythmes & régularité » (mobile fr/en, web fr/en), ajout de l'ancre
`light` (seed + mobile fr), retrait du tab Fiches.

Fait en Phase 2 (web praticien) : config des ancres par patient (service + hook + carte), libellés
d'ancres `modules.chrono_bio.*` + clés `config_*` en web fr/en.
