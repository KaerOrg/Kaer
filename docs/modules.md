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
| `fear_thermometer` | Exposition graduée | `exposure_tracker` | SQLite `fear_situations` / `fear_entries` | [doc](modules/fear_thermometer.md) |
| `emotion_wheel` | Nommer ce que je ressens (Willcox) | `tree_selector` | SQLite `tree_selections` | [doc](modules/emotion_wheel.md) |
| `crisis_plan` | Plan de crise (Safety Plan) | `safety_plan` (édition via `editable_steps`) | SQLite `crisis_anchors` + `plan_items` (contacts appelables étapes 4/5 : `phone`) + Supabase config | — |
| `rim` | RIM — Retraitement par Imagerie Mentale | `patient_scenario` | Supabase `patient_modules.config` (lecture seule patient) | [doc](modules/rim.md) |
| `cognitive_saturation` | Saturation cognitive (ACT) | `guided_exercise` | SQLite `cognitive_saturation_sessions` | [doc](modules/cognitive_saturation.md) |
| `decisional_balance` | Balance décisionnelle | `decision_grid` | SQLite `plan_items` + Supabase signal | — |
| `behavioral_activation` | Activation comportementale | `activity_log` | SQLite `activity_records` ; activités co-construites dans `patient_modules.config.ba_activities` | [doc](modules/behavioral_activation.md) |
| `grounding` | Ancrage 5-4-3-2-1 (DBT) | `guided_exercise` | Aucun (exercice sans persistance) | [doc](modules/grounding.md) |
| `mood_tracker` | Thermomètre de l'humeur | `slider_dashboard` | SQLite `scale_entries` + `mood_markers` | [doc](modules/mood_tracker.md) |
| `motivational_balance` | Balance motivationnelle (EM) | `tabbed` | SQLite `em_rulers`, `em_balance_items`, `em_values` | [doc](modules/motivational_balance.md) |
| `medication_adherence` | Observance médicamenteuse | `medication_tracker` | SQLite `daily_entries` + `medication_intakes` ; liste molécules dans `patient_modules.config.medications` | [doc](modules/medication_adherence.md) |
| `medication_side_effects` | Effets indésirables du traitement | `slider_dashboard` | SQLite `scale_entries` ; config effets dans `patient_modules.config.tracked_effects` | [doc](modules/medication_side_effects.md) |
| `breathing_techniques` | Techniques de respiration | `breathing_pacer` | SQLite local | [doc](modules/breathing_techniques.md) |
| `psychoeducation` | Psychoéducation (bibliothèque) | `psyedu_library` | Fiches `psyedu_topics` (par thème) débloquées via `patient_modules.config.unlocked_topics`. Inclut les fiches médicaments/poids (thème « Mon traitement ») et hygiène de vie, anciennement le module `diet_weight_psycho` retiré. | [doc](modules/psychoeducation.md) |
| `chronobiology_tracker` | Rythmes & régularité | `tabbed` (Journal + Mois) | SQLite `chrono_entries` (offline-first) | [doc](modules/chronobiology_tracker.md) |
| `distress_tolerance` | Tolérance à la détresse (DBT) | `tabbed` (Comprendre `psyedu` + Agir en crise `crisis_companion`) | Supabase `psyedu_topics`/`psyedu_blocks` ; onglet « Agir en crise » sans stockage | [doc](modules/distress_tolerance.md) |
| `craving_journal` | Journal de craving (TCC addictologie) | `tabbed` (Fiches + Journal) | SQLite `form_entries` ; fiches Supabase | — |

---

## Échelles cliniques (questionnaires)

Pattern générique : `ScaleHistoryScreen` + `ScaleEntryScreen` + `SCALE_SCORING` (scaleScoring.ts) + `scale_entries` SQLite + `module_content_fields` Supabase (`preview_kind = 'questionnaire'`). Détail : [`module-engine.md`](module-engine.md).

| Clé | Nom | Items | Score | Particularités | Doc |
|-----|-----|-------|-------|----------------|-----|
| `phq9` | Mon humeur ces 2 semaines (PHQ-9) | 9 | 0–27 | Renommé côté patient (#405). Sous-titre « Questionnaire PHQ-9 · 10 questions, 4 min » ; l'item 10 arrive avec #410 | — |
| `gad7` | GAD-7 — Anxiété généralisée | 7 | 0–21 | 💤 **En veille** (#406, `beta_scope`). Droits acquis, hors périmètre bêta | — |
| `bsl23` | BSL-23 — Symptômes borderline | 23 | 0–4 (moyen) | 🔒 **Masquée** (#247) | — |
| `rcads` | RCADS-25 — Anxiété & dépression (enfant/ado) | 25 | 6 sous-échelles | 🔒 **Masquée** (#247). Ebesutani (2012) | — |
| `snap_iv` | SNAP-IV — Dépistage TDAH (enfant/ado) | 26 | 3 sous-échelles (I/HI/TOD) | 🔒 **Masquée** (#247). Hétéro-évaluation (`scale_warning`) | [doc](modules/snap_iv.md) |
| `asrs6` | ASRS v1.1 — Dépistage Rapide (adulte) | 6 | 0–24 | 💤 **En veille** (#406, `beta_scope`). Kessler (2005), bouton info PubMed. Autorisée par NYU en usage commercial | [doc](modules/asrs6.md) |
| `asrs18` | ASRS v1.1 — Bilan Complet (adulte) | 18 | 0–72 + 2 sous-scores | 🔒 **Masquée** (#247). Parties A+B, bouton info PubMed | [doc](modules/asrs18.md) |
| `epds` | EPDS — Dépression postnatale | 10 | 0–30 | 🔒 **Masquée** (#247) | [doc](modules/epds.md) |
| `nsi` | NSI — Sévérité des cauchemars | 9 scorés + 2 contextuels | 0–45 | 🔒 **Masquée** (#247). Items contextuels (% récurrents, thèmes) stockés dans `nsi_entries` | [doc](modules/nsi.md) |
| `cssrs` | C-SSRS — Dépistage suicidaire | 6 idéation + 4 comportements | Arbre décisionnel | `no_toggle=true` : panel dédié `CSSRSScreenPanel` côté web praticien (pas de saisie patient). `cssrs_screen_assessments` Supabase. | [doc](modules/cssrs_screen.md) |

### 🔒 Échelles en veille : deux motifs distincts (#247, #406)

Huit échelles sont **en veille via `modules.is_hidden`**, c'est-à-dire retirées du
catalogue praticien, de l'invitation, de l'aperçu, de la liste patient et des
routines de rappel. Elles ne sont pas assignables : la barrière est un trigger en
base, pas seulement le filtre des services.

**Rien n'est supprimé** : items, i18n, scoring, écrans, tests et docs restent en
place, ainsi que les lignes `patient_modules` et les saisies patient existantes.
Elles réapparaissent telles quelles si le module est réactivé.

`modules.hidden_reason` porte le motif, et les deux ne se confondent jamais : le
praticien le lit dans la zone « En veille », et annoncer une question de licence
devant une échelle libre serait faux. Côté patient, en revanche, le motif n'existe
pas : le module disparaît sans mention, quel qu'il soit.

**Motif `rights` : droits de reproduction non acquis en usage commercial.** Kær est
un produit commercial, et un instrument téléchargeable gratuitement n'est pas pour
autant reproductible dans l'app. Réactivation = démarche juridique aboutie.

| Échelle | Motif |
|---|---|
| `asrs18` | Licence NYU *Commercial Use - Website Integration*, payante et annuelle. Régime distinct d'`asrs6` |
| `epds` | © Royal College of Psychiatrists, intégration numérique déjà refusée à un tiers |
| `snap_iv` | © J. M. Swanson, autorisation écrite requise, et aucune version française validée |
| `rcads` | UCLA : « Commercial distribution [...] in any form or medium is prohibited » |
| `nsi` | Échelle de 2024, droits non clarifiés |
| `bsl23` | Zentralinstitut de Mannheim, usage commercial explicitement exclu |

**Motif `beta_scope` : hors périmètre de la bêta**, qui porte le seul PHQ-9. Droits
acquis, réactivation par simple décision produit.

| Échelle | Motif |
|---|---|
| `gad7` | Libre au même titre que le PHQ-9 (Spitzer, 2006). Premier candidat à la réouverture : même détenteur, même licence, même format |
| `asrs6` | Autorisée par NYU en usage commercial, sous réserve d'attribution et de non-modification des items |

`cssrs` n'est pas concernée : elle est en `preview_kind = 'coming_soon'` et
n'a aucun item en base. Détail du mécanisme et procédure de réactivation :
[`database.md`](database.md) § `modules`.

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
