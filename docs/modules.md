# Modules thérapeutiques

> Source de vérité pour la liste et le statut de tous les modules.  
> Un fichier de doc détaillé par module dans [`docs/modules/`](modules/) (nommé `<module_id>.md`).  
> Pour le moteur de rendu (FieldRenderer, preview_kind, field_types) : [`docs/module-engine.md`](module-engine.md).  
> Pour ajouter un nouveau module : skill `module-builder`.

---

## Modules thérapeutiques interactifs

| Clé | Nom | `preview_kind` | Stockage | Doc |
|-----|-----|---------------|----------|-----|
| `sleep_diary` | Agenda du sommeil | `sleep_journal` | SQLite `sleep_diary_entries` | [doc](modules/sleep_diary.md) |
| `beck_columns` | Colonnes de Beck (TCC) | `column_form` | SQLite `form_entries` | [doc](modules/beck_columns.md) |
| `fear_thermometer` | Thermomètre de la peur | `exposure_tracker` | SQLite `fear_situations` | [doc](modules/fear_thermometer.md) |
| `exposure_hierarchy` | Hiérarchie d'exposition (TCC) | `exposure_hierarchy` | SQLite `exposure_hierarchies` + `fear_situations` | — |
| `emotion_wheel` | Roue des émotions | `tree_selector` | SQLite `emotion_entries` | [doc](modules/emotion_wheel.md) |
| `crisis_plan` | Plan de crise (Safety Plan) | `editable_steps` | SQLite `crisis_anchors` + Supabase config | — |
| `rim` | RIM — Retraitement par Imagerie Mentale | `patient_scenario` | Supabase `patient_modules.config` (lecture seule patient) | [doc](modules/rim.md) |
| `cognitive_saturation` | Saturation cognitive (ACT) | `guided_exercise` | SQLite `cognitive_saturation_sessions` | [doc](modules/cognitive_saturation.md) |
| `decisional_balance` | Balance décisionnelle | `decision_grid` | SQLite `plan_items` + Supabase signal | — |
| `behavioral_activation` | Activation comportementale | `activity_log` | SQLite `activity_records` | [doc](modules/behavioral_activation.md) |
| `grounding` | Ancrage 5-4-3-2-1 (DBT) | `guided_exercise` | Aucun (exercice sans persistance) | [doc](modules/grounding.md) |
| `mood_tracker` | Thermomètre de l'humeur | `slider_dashboard` | SQLite `scale_entries` + `mood_markers` | [doc](modules/mood_tracker.md) |
| `motivational_balance` | Balance motivationnelle (EM) | `tabbed` | SQLite `em_rulers`, `em_balance_items`, `em_values` | [doc](modules/motivational_balance.md) |
| `medication_adherence` | Observance médicamenteuse | `daily_checkin` | SQLite local | [doc](modules/medication_adherence.md) |
| `medication_side_effects` | Effets indésirables du traitement | `slider_dashboard` | SQLite `scale_entries` ; config effets dans `patient_modules.config.tracked_effects` | [doc](modules/medication_side_effects.md) |
| `breathing_techniques` | Techniques de respiration | `fields` | SQLite local | [doc](modules/breathing_techniques.md) |
| `psychoeducation` | Psychoéducation | `cards` | IDs lus Supabase, statut lecture Supabase | [doc](modules/psychoeducation.md) |
| `diet_weight_psycho` | Alimentation et psychotropes | `psyedu` | Supabase `psyedu_topics`/`psyedu_blocks` | — |
| `chronobiology_tracker` | Régularité chronobiologique | `tabbed` (Fiches + Journal + Mois) | SQLite `chrono_entries` ; fiches Supabase | — |
| `distress_tolerance` | Tolérance à la détresse (DBT) | `tabbed` (Comprendre `psyedu` + Agir en crise `crisis_companion`) | Supabase `psyedu_topics`/`psyedu_blocks` ; onglet « Agir en crise » sans stockage | [doc](modules/distress_tolerance.md) |
| `craving_journal` | Journal de craving (TCC addictologie) | `tabbed` (Fiches + Journal) | SQLite `form_entries` ; fiches Supabase | — |

---

## Échelles cliniques (questionnaires)

Pattern générique : `ScaleHistoryScreen` + `ScaleEntryScreen` + `SCALE_SCORING` (scaleScoring.ts) + `scale_entries` SQLite + `module_content_fields` Supabase (`preview_kind = 'questionnaire'`). Détail : [`module-engine.md`](module-engine.md).

| Clé | Nom | Items | Score | Particularités | Doc |
|-----|-----|-------|-------|----------------|-----|
| `phq9` | PHQ-9 — Dépression | 9 | 0–27 | — | — |
| `gad7` | GAD-7 — Anxiété généralisée | 7 | 0–21 | — | — |
| `bsl23` | BSL-23 — Symptômes borderline | 23 | 0–4 (moyen) | — | — |
| `rcads` | RCADS-25 — Anxiété & dépression (enfant/ado) | 25 | 6 sous-échelles | Ebesutani (2012) | — |
| `snap_iv` | SNAP-IV — Dépistage TDAH (enfant/ado) | 26 | 3 sous-échelles (I/HI/TOD) | Hétéro-évaluation (`scale_warning`) | [doc](modules/snap_iv.md) |
| `asrs6` | ASRS v1.1 — Dépistage Rapide (adulte) | 6 | 0–24 | Kessler (2005), bouton info PubMed | [doc](modules/asrs6.md) |
| `asrs18` | ASRS v1.1 — Bilan Complet (adulte) | 18 | 0–72 + 2 sous-scores | Parties A+B, bouton info PubMed | [doc](modules/asrs18.md) |
| `epds` | EPDS — Dépression postnatale | 10 | 0–30 | — | [doc](modules/epds.md) |
| `nsi` | NSI — Sévérité des cauchemars | 9 scorés + 2 contextuels | 0–45 | Items contextuels (% récurrents, thèmes) stockés dans `nsi_entries` | [doc](modules/nsi.md) |
| `cssrs` | C-SSRS — Dépistage suicidaire | 6 idéation + 4 comportements | Arbre décisionnel | `no_toggle=true` : panel dédié `CSSRSScreenPanel` côté web praticien (pas de saisie patient). `cssrs_screen_assessments` Supabase. | [doc](modules/cssrs_screen.md) |

---

## Modules prévus

| Clé | Nom | Statut |
|-----|-----|--------|
| `cognitive_distortions` | Distorsions cognitives | `preview_kind='coming_soon'` |
| `therapeutic_commitment` | Engagement thérapeutique | `preview_kind='coming_soon'` |
| `cape42` | CAPE-42 — Expériences psychotiques | `preview_kind='coming_soon'` |
| `audit` | AUDIT — Consommation d'alcool | `preview_kind='coming_soon'` |

---

## Ajouter un nouveau module

Passer par le skill **`module-builder`** (`.claude/skills/module-builder/SKILL.md`). Il enforce la règle data-first (`modules` + `module_content_fields` + `field_props` → `FieldRenderer`) et garantit la parité web ≡ mobile.

### Pattern échelle clinique générique (checklist)

1. Ajouter la config dans `SCALE_SCORING` (`scaleScoring.ts`)
2. Ajouter les clés i18n dans `fr/en common.json` + `fr/en teen.json`
3. Ajouter le module dans `modules` Supabase avec `preview_kind = 'questionnaire'`
4. Insérer les `module_content_fields` (instructions, options, questions, footer) + `field_props`
5. Ajouter l'entrée dans `GENERIC_SCALE_TYPES` (`HomeScreen.tsx`)
6. Ajouter l'icône dans `MODULE_CONFIG` (`HomeScreen.tsx`)

Sous-scores → `computeSubscaleScores` + `CHIP_KEY_TO_SUBSCALE` dans `ScaleHistoryScreen.tsx`.  
Hétéro-évaluation → champ `scale_warning` dans `module_content_fields`.  
Logique conditionnelle (ex. C-SSRS) → écran custom dédié.
