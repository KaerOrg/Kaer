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

Deux onglets (l'ancien onglet **Fiches**/psyedu a été **retiré** — refonte 2026-06-15) :

| Onglet | `sub_preview_kind` | Contenu |
|---|---|---|
| Journal | `column_form` | Saisie des ancres horaires du jour (toutes optionnelles) |
| Mois | `chrono_month` | Vue mensuelle / historique neutre |

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

## Configuration par patient (Phase 2 web — implémenté)

Le praticien choisit, **par patient**, le sous-ensemble d'ancres suivi (pertinence clinique +
friction réduite), aligné sur le pattern `medication_side_effects` (`tracked_effects`) :

```
patient_modules.config = { "anchors": ["wake_time", "first_meal", "light", "bedtime"] }
```

Le catalogue (ancres disponibles) vit en base ; la **sélection** vit dans
`patient_modules.config.anchors`. **Config vide = toutes les ancres suivies** (défaut).
Un garde-fou impose au moins une ancre suivie.

Pièces livrées (web praticien) :
- `moduleAssignmentService.ts` : `fetchChronoAnchorCatalog` (catalogue lu en base, config-first),
  `fetchTrackedAnchors` / `updateTrackedAnchors` (sélection dans `patient_modules.config.anchors`).
- `hooks/useChronoAnchorsEditor.ts` : état d'édition (catalogue + sélection, toggle, garde-fou).
- `tabs/ChronobiologyCard.tsx` + `tabs/AnchorToggleRow.tsx` : carte praticien + éditeur d'ancres,
  branchée dans `PatientModulesTab`.

**Filtrage des ancres (Phase 3 — livré).** Le `column_form` mobile n'affiche que les ancres
sélectionnées par le praticien (`config.anchors`) ; config vide/absente = toutes. Le flux de
`patientConfig` : `ModuleContentScreen` (le `tabbed` rejoint `CONFIG_LAYOUTS` → fetch de
`patient_modules.config`) → `LayoutDispatcher` → `TabsLayout` → `FieldRenderer` récursif →
`ColumnFormLayout` (filtre les `column_time_field` par clé). No-op pour les autres modules
`tabbed`/`column_form` (pas de `config.anchors`).

## Capture anti-friction (Phase 3 — livré)

Bouton **« comme d'habitude »** (mobile, `ColumnFormLayout`) : en nouvelle saisie, reprend les
valeurs de la dernière entrée (le patient ajuste puis enregistre). Opt-in **config-first** via le
prop `prefill_from_last` du `column_form_config` (libellé `common.prefill_from_last`, fr+en).
Générique (tout module `column_form` peut l'activer), masqué en mode édition. Choix explicite
(pas de préremplissage silencieux) → intentionnalité préservée, conforme MDR.

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

## Dette i18n à combler AVANT release (bloquant Phase 2/3)

Le contenu complet `modules.chrono_bio.*` n'est traduit qu'en **mobile fr**. À compléter :

- [ ] Contenu **journal/mois** `modules.chrono_bio.*` (tab_journal, add_today, view_month…) absent
  en **mobile en**, **web fr/en** → à créer quand l'aperçu web (column_form) et l'écran mobile en
  seront finalisés (Phase 3/4). Les 6 **libellés d'ancres** `modules.chrono_bio.<ancre>` sont déjà
  présents en web fr/en (Phase 2).
- [ ] Variantes **teen** (`modules.chrono_bio.*` + `modules.chronobiology_tracker.*`) absentes
  (mobile fr/en) → à créer.
- [ ] Clés d'ancres `modules.chronobiology_tracker.anchor_*` absentes en mobile en.

Fait en Phase 1 : renommage « Rythmes & régularité » (mobile fr/en, web fr/en), ajout de l'ancre
`light` (seed + mobile fr), retrait du tab Fiches.

Fait en Phase 2 (web praticien) : config des ancres par patient (service + hook + carte), libellés
d'ancres `modules.chrono_bio.*` + clés `config_*` en web fr/en.
