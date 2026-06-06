# Audit qualité — Modules thérapeutiques Kær

> Branche : `consolidation-app-web-mobile` — Démarré le 2026-05-19  
> Objectif : vérifier fonctionnement web + mobile, cohérence du contenu, et sourcing scientifique pour chaque module.

## Backlog post-audit

- **sleep_diary — graphiques de tendance** : courbes brutes par item (durée, latence, réveils, qualité, efficacité) sur 1 mois et 12 mois. Conforme MDR si affichage neutre sans seuils colorés. À implémenter dans `feat/sleep-diary-trends` après la fin de l'audit. Nécessite `victory-native` ou `react-native-svg`.

---

## Légende

| Icône | Signification |
|---|---|
| ✅ | Conforme |
| ⚠️ | Problème mineur / à améliorer |
| ❌ | Absent ou incorrect |
| 🔲 | Non encore audité |

## Statut global

| # | Module | Web | Mobile | i18n fr/en/teen | Sources | MDR | Revue | Priorité |
|---|---|---|---|---|---|---|---|---|
| 1 | sleep_diary | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 2 | beck_columns | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 3 | fear_thermometer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 4 | exposure_hierarchy | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 5 | emotion_wheel | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 6 | crisis_plan | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 7 | rim | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 8 | cognitive_saturation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 9 | decisional_balance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 10 | behavioral_activation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 11 | grounding | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 12 | mood_tracker | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 13 | motivational_balance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 14 | medication_adherence | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 15 | breathing_techniques | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 16 | phq9 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 17 | gad7 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 18 | bsl23 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 19 | rcads | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 20 | snap_iv | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 21 | asrs6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 22 | asrs18 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 23 | epds | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 24 | nsi | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 25 | medication_side_effects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 26 | psychoeducation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 27 | diet_weight_psycho | ✅ | ✅ | ✅ (psyedu) | ✅ | ✅ | ✅ | — |
| 28 | chronobiology_tracker | ✅ | ✅ | ✅ (psyedu) | ✅ | ✅ | ✅ | — |
| 29 | distress_tolerance | ✅ | ✅ | ✅ (psyedu) | ✅ | ✅ | ✅ | — |
| 30 | craving_journal | ✅ | ✅ | ✅ (psyedu) | ✅ | ✅ | ✅ | — |

---

## Résultats de l'audit automatique (2026-05-19)

### Ce qui est solide

- **11 échelles cliniques standardisées** (PHQ-9, GAD-7, BSL-23, RCADS, SNAP-IV, ASRS6, ASRS18, EPDS, NSI, medication_side_effects + crisis_plan) — sources PubMed/NICE/HAS/OMS présentes et correctes.
- **Breathing techniques** — implémentation la plus rigoureuse : 5 techniques, grades A/B/C documentés, auteurs cités (Lehrer & Gevirtz 2014, NICE CG90, HAS).
- **Tous les modules** sont présents côté web (MODULE_LABELS) et mobile (MODULE_CONFIG ou CLINICAL_SCALES), avec navigation câblée.

### Sources manquantes à compléter (priorité haute)

| Module | Source manquante |
|---|---|
| sleep_diary | TCC-I : Morin CM, Bastien C (2002, 2004) ; NICE NG215 (2022) |
| beck_columns | Beck AT (1979) — Cognitive Therapy of Depression |
| fear_thermometer (SUDS) | Wolpe J (1969) — Psychotherapy by Reciprocal Inhibition |
| emotion_wheel | Plutchik R (1980) — Emotion: A Psychoevolutionary Synthesis |
| decisional_balance | Miller WR, Rollnick S (2012) — Motivational Interviewing (3rd ed.) |
| behavioral_activation | Lewinsohn PM (1974) ; Martell CR, Dimidjian S, Herman-Dunn R (2010) |
| grounding | Linehan MM (1993) — DBT Skills Training Manual |
| mood_tracker | Pas de source de validation (outil propriétaire Kær) |
| rim | Schiefele AK, Schiefele U (2010) ; Hackmann A, Bennett-Levy J, Holmes EA (2011) |
| cognitive_saturation | Hayes SC, Strosahl KD, Wilson KG (1999) — ACT (défusion cognitive) |
| motivational_balance | Miller WR, Rollnick S (2012) |
| psychoeducation | Colom F, Vieta E (2006) — Psychoeducation Manual for Bipolar Disorder |
| diet_weight_psycho | À vérifier dans le seed psyedu |
| chronobiology_tracker | À vérifier dans le seed psyedu |
| distress_tolerance | Linehan MM (1993) — DBT (TIPP, ACCEPTS, IMPROVE) |
| craving_journal | À vérifier dans le seed psyedu |

---

## Fiches de revue détaillées par module

> Chaque fiche est remplie lors de la revue manuelle. Elle documente le résultat de l'audit approfondi (contenu, cohérence, corrections apportées).

---

### 01 — sleep_diary · Agenda du sommeil

**Statut** : ✅ Validé — 2026-05-19  
**Type** : Moteur générique (`preview_kind='sleep_journal'`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `SleepJournalLayout` — list + entry mode |
| Écran mobile patient | ✅ | Agenda TCC-I 7 jours, SQLite local |
| Cohérence web ↔ mobile | ✅ | Sections identiques (horaires, réveils, cauchemars, qualité, notes, efficacité) |
| i18n fr complet | ✅ | 33 clés + footer ajouté |
| i18n en complet | ✅ | 33 clés + footer ajouté |
| i18n teen fr/en complet | ✅ | Footer ajouté fr + en |
| Sources scientifiques | ✅ | Trauer et al. 2015 (PMID 26054060, grade A) · NICE NG215 (2022, grade A) |
| Conformité MDR | ✅ | Affichage brut uniquement — aucun seuil, aucune interprétation |
| Corrections apportées | ✅ | Ajout `footer_note` seed.sql · `SleepJournalLayout` web/mobile rendu footer · NICE NG215 + Trauer grade A dans sources_seed.sql · clés i18n footer fr/en/teen |

---

### 02 — beck_columns · Colonnes de Beck

**Statut** : ✅ Validé — 2026-05-19  
**Type** : Moteur générique (`preview_kind='column_form'`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `ColumnFormLayout` — liste mock + formulaire colonne-par-colonne |
| Écran mobile patient | ✅ | 5 colonnes DTR (situation/émotion/PA/réponse/résultat), sliders 0–100 |
| Cohérence web ↔ mobile | ✅ | Même structure 5 colonnes, hints identiques |
| i18n fr complet | ✅ | 22 clés existantes + footer ajouté |
| i18n en complet | ✅ | 18 clés manquantes ajoutées + footer |
| i18n teen fr/en complet | ✅ | entry_col hints/placeholders/intensities/beliefs + footer ajoutés fr + en |
| Sources scientifiques | ✅ | Hofmann et al. 2012 (PMID 23459093, grade A corrigé) · NICE NG222 (2022, grade A) ajouté |
| Conformité MDR | ✅ | Journal brut — aucun scoring, aucun seuil, aucune interprétation |
| Corrections apportées | ✅ | i18n en/teen fr/en complétés · footer_note seed.sql ajouté · `ColumnFormLayout` web/mobile rendu footer · Hofmann grade null→A · NICE NG222 sources_seed.sql |

---

### 03 — fear_thermometer · Thermomètre de la peur

**Statut** : ✅ Validé — 2026-05-19  
**Type** : Moteur générique (`preview_kind='exposure_tracker'`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `ExposureTrackerLayout` — tabs Saisies/Situations + formulaire SUDS |
| Écran mobile patient | ✅ | 3 modes list/entry/situations, catalogue de situations, stratégies |
| Cohérence web ↔ mobile | ✅ | Mêmes sections, même structure SUDS avant/après |
| i18n fr complet | ✅ | Footer ajouté |
| i18n en complet | ✅ | Footer ajouté |
| i18n teen fr/en complet | ✅ | Footer ajouté fr + en |
| Sources scientifiques | ✅ | Wolitzky-Taylor 2008 (grade A) · Foa & Kozak 1986 · Craske 2014 · NICE CG159 — 4 sources solides |
| Conformité MDR | ✅ | SUDs 0–100 affichés bruts, couleurs = convention temporelle pas score clinique |
| Corrections apportées | ✅ | Footer note fr/en/teen · footer_note seed.sql · ExposureTrackerLayout web/mobile rendu footer · Wolitzky-Taylor grade null→A |

---

### 04 — exposure_hierarchy · Hiérarchie d'exposition

**Statut** : ✅ Validé — 2026-05-19  
**Type** : Layout FIELDLESS (`preview_kind='exposure_hierarchy'`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `ExposureHierarchyLayout` — FIELDLESS, aperçu hiérarchie statique |
| Écran mobile patient | ✅ | 4 modes (hiérarchies/items/item_form/item_history), SUDs 0–100, DisclaimerBanner |
| Cohérence web ↔ mobile | ✅ | Layout FIELDLESS — contenu identique, DisclaimerBanner présent mobile |
| i18n fr complet | ✅ | ~43 clés complètes |
| i18n en complet | ✅ | ~43 clés ajoutées (seulement label+description existaient) |
| i18n teen fr/en complet | ✅ | Teen FR : 9 clés adaptées tutoiement · Teen EN : section ajoutée |
| Sources scientifiques | ✅ | Carpenter et al. 2018 (PMID 29451967, grade A corrigé) · NICE NG116 (2018) |
| Conformité MDR | ✅ | Cases à cocher neutres, SUDs bruts, aucun seuil de "guérison" |
| Corrections apportées | ✅ | EN common.json : ~40 clés ajoutées · Teen EN : section ajoutée · Carpenter grade null→A |

---

### 05 — emotion_wheel · Roue des émotions (Plutchik)

**Statut** : 🔲 Non audité  
**Type** : Moteur générique (`preview_kind='tree_selector'`)  
**Priorité** : Moyenne

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `TreeSelectorLayout` — grille 8 émotions Plutchik + historique mock |
| Écran mobile patient | ✅ | 3 niveaux (primaire→nuance→spécifique), intensité 1–10, notes libres |
| Cohérence web ↔ mobile | ✅ | Même arbre 3 niveaux, même flux de saisie |
| i18n fr complet | ✅ | Footer ajouté |
| i18n en complet | ✅ | Footer ajouté |
| i18n teen fr/en complet | ✅ | Footer ajouté fr + en |
| Sources scientifiques | ✅ | Lieberman et al. 2007 (PMID 17576282, grade B) · Kircanski, Lieberman & Craske 2012 (PMID 22902568, grade B) — ajouté via PubMed |
| Conformité MDR | ✅ | Intensité 1–10 brute, pas de seuil interprétatif |
| Corrections apportées | ✅ | Footer fr/en/teen · footer_note seed.sql · TreeSelectorLayout web/mobile rendu footer · Lieberman grade null→B · Kircanski 2012 ajouté |

---

### 06 — crisis_plan · Plan de crise

**Statut** : ✅ Audité  
**Type** : Écran dédié (`CrisisPlanScreen` + `CrisisUrgencyScreen`)  
**Priorité** : Critique

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `preview_kind='steps'` — StepsLayout, configuration praticien sur PatientPage |
| Écran mobile patient | ✅ | 6 étapes Stanley & Brown + 4 sections VHB-EF (raisons, urgence, coping, engagement) |
| Cohérence web ↔ mobile | ✅ | Web affiche les étapes SPI en lecture ; mobile collecte et configure |
| i18n fr complet | ✅ | Toutes les clés présentes incluant anchors, coping_cards, commitment, urgency |
| i18n en complet | ✅ | Parité complète avec le FR |
| i18n teen fr/en complet | ✅ | Clés teen présentes dans fr/teen.json et en/teen.json |
| Sources scientifiques | ✅ | Stanley & Brown 2018 (grade B), Weinstock 2025 RCT (grade A), NICE NG225, HAS 2021 |
| Conformité MDR | ✅ | 3114/15 : numéros fixes programmés, non conditionnels aux données — conforme MDR |
| Corrections apportées | ✅ | sources_seed.sql : grades corrigés (Stanley B cohort → 'B', Weinstock RCT → 'A') |

---

### 07 — rim · RIM Retraitement par Imagerie Mentale

**Statut** : ✅ Audité  
**Type** : `preview_kind='patient_scenario'`  
**Priorité** : Haute

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | PatientScenarioLayout + éditeur scénario sur PatientPage |
| Écran mobile patient | ✅ | Scénario alternatif/original, 5 étapes, sons, sécurité 3114/15 |
| Cohérence web ↔ mobile | ✅ | Protocole identique, scénario configuré praticien → patient read-only |
| i18n fr complet | ✅ | Toutes clés + footer ajouté |
| i18n en complet | ✅ | Toutes clés + footer ajouté |
| i18n teen fr/en complet | ✅ | Sections complètes avec tutoiement adapté |
| Sources scientifiques | ✅ | Krakow 2001 JAMA (A), Schmid 2021 Psychother Psychosom (A), Zhao 2025 méta-analyse (A) |
| Conformité MDR | ✅ | Scénario lu par le patient, aucun score, aucune interprétation algorithmique |
| Corrections apportées | ✅ | 3 sources ajoutées, footer_note + footer i18n fr/en/web, PatientScenarioLayout web + mobile supportent footer |

---

### 08 — cognitive_saturation · Saturation cognitive

**Statut** : ✅ Audité  
**Type** : `preview_kind='guided_exercise'` (mobile : écran custom dédié)  
**Priorité** : Moyenne

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | GuidedExerciseLayout basique (module non interactif en preview) |
| Écran mobile patient | ✅ | Écran custom tapotement (CognitiveSaturationScreen), 3 phases |
| Cohérence web ↔ mobile | ✅ | Web = aperçu statique, mobile = expérience interactive — cohérent |
| i18n fr complet | ✅ | 25 clés complètes |
| i18n en complet | ✅ | 21 clés manquantes ajoutées (start_btn, intro_text, instructions…) |
| i18n teen fr/en complet | ✅ | Overrides title + intro en tutoiement (suffisant, fallback sur common) |
| Sources scientifiques | ✅ | Macri & Rogge 2024 méta-analyse ACT (grade null→A) |
| Conformité MDR | ✅ | Comptage de tapotements brut, durée affichée — aucune interprétation |
| Corrections apportées | ✅ | EN common.json : 21 clés ajoutées ; sources_seed.sql : grade 'A' |

---

### 09 — decisional_balance · Balance décisionnelle

**Statut** : ✅ Audité  
**Type** : Moteur générique (`preview_kind='decision_grid'`)  
**Priorité** : Haute

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | DecisionGridLayout : 4 quadrants pros/cons + jauge motivation |
| Écran mobile patient | ✅ | Grille 2×2 + items pondérés 1–5 étoiles + jauge |
| Cohérence web ↔ mobile | ✅ | Même contenu, même structure quadrant |
| i18n fr complet | ✅ | 17 clés complètes |
| i18n en complet | ✅ | Parité parfaite FR/EN |
| i18n teen fr/en complet | ✅ | Overrides présents |
| Sources scientifiques | ✅ | Prochaska 1997 (théorie), Di Noia 2010 méta-analyse (A), Lundahl 2013 méta-analyse 48 ECR (A) |
| Conformité MDR | ✅ | Affichage brut pros/cons + jauge passive — aucune interprétation algorithmique |
| Corrections apportées | ✅ | sources_seed.sql : Di Noia 2010 et Lundahl 2013 grades null→'A' |

---

### 10 — behavioral_activation · Activation comportementale

**Statut** : ✅ Audité  
**Type** : Moteur générique (`preview_kind='activity_log'`)  
**Priorité** : Haute

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | ActivityLogLayout — liste activités + scores P/M en aperçu |
| Écran mobile patient | ✅ | Journal activités, scores Plaisir/Maîtrise 0–10, statut planifiée/réalisée |
| Cohérence web ↔ mobile | ✅ | Même structure, même champs |
| i18n fr complet | ✅ | Parité parfaite FR/EN |
| i18n en complet | ✅ | Parité parfaite FR/EN |
| i18n teen fr/en complet | ✅ | Overrides présents |
| Sources scientifiques | ✅ | Dimidjian 2006 ECR (A), Cuijpers 2007 méta-analyse 16 ECR (A) |
| Conformité MDR | ✅ | Scores P/M bruts 0–10, liste activités — aucune interprétation |
| Corrections apportées | ✅ | sources_seed.sql : Dimidjian 2006 et Cuijpers 2007 grades null→'A' |

---

### 11 — grounding · Ancrage 5-4-3-2-1

**Statut** : ✅ Audité — 2026-05-19  
**Type** : `preview_kind='guided_exercise'` (mobile : `ModuleContentScreen` → `FieldRenderer`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `GuidedExerciseLayout` — affiche titre + description de l'exercice |
| Écran mobile patient | ✅ | 3 modes (intro/guided/done), sensoriel 5-4-3-2-1, sans stockage de données |
| Cohérence web ↔ mobile | ✅ | Web = aperçu statique, mobile = parcours interactif — cohérent |
| i18n fr complet | ✅ | Clés grounding complètes dans fr/common.json |
| i18n en complet | ✅ | Parité FR/EN vérifiée |
| i18n teen fr/en complet | ✅ | Overrides tutoiement présents fr + en |
| Sources scientifiques | ✅ | Kliem et al. 2010 (PMID 21114345, méta-analyse TCD, grade null→**A**) |
| Conformité MDR | ✅ | Aucune donnée collectée — exercice interactif uniquement, conforme MDR |
| Corrections apportées | ✅ | sources_seed.sql : Kliem 2010 grade null→'A' |

---

### 12 — mood_tracker · Thermomètre de l'humeur

**Statut** : ✅ Audité — 2026-05-19  
**Type** : Saisie quotidienne 4 dimensions + sparklines 30 j (SQLite `mood_entries`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | Aperçu dans `MODULE_LABELS` + `MODULE_DESCRIPTIONS` ; PatientPage débloque le module |
| Écran mobile patient | ✅ | Saisie quotidienne humeur/énergie/anxiété/plaisir 1–10, sparklines 30 j, SQLite `mood_entries` |
| Cohérence web ↔ mobile | ✅ | Web = aperçu institutionnel, mobile = outil opérationnel — cohérent |
| i18n fr complet | ✅ | Clés mood_tracker complètes dans fr/common.json |
| i18n en complet | ✅ | Parité FR/EN vérifiée |
| i18n teen fr/en complet | ✅ | Overrides tutoiement présents |
| Sources scientifiques | ✅ | Yatham et al. 2018 CANMAT/ISBD (PMID 29536616, guideline, null — approprié) |
| Conformité MDR | ✅ | Scores 1–10 affichés bruts, sparklines sans flèches ni seuils colorés — conforme MDR |
| Corrections apportées | ✅ | sources_seed.sql : source déjà présente, grade null maintenu (guideline CANMAT) |

---

### 13 — motivational_balance · Balance motivationnelle

**Statut** : ✅ Audité — 2026-05-19  
**Type** : `preview_kind='tabbed'` — onglet 1 fiches psyedu (Supabase) · onglet 2 balance pour/contre (SQLite)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `TabbedLayout` — 2 onglets, contenus Supabase |
| Écran mobile patient | ✅ | 2 onglets (Fiches / Balance), SQLite local, DisclaimerBanner MDR |
| Cohérence web ↔ mobile | ✅ | Même structure tabulée, même contenu psyedu |
| i18n fr complet | ✅ | `label`+`description` dans common.json ; contenu textuel dans psyedu Supabase (correct par pattern) |
| i18n en complet | ✅ | Parité FR/EN vérifiée |
| i18n teen fr/en complet | ✅ | Overrides présents dans fr/teen.json et en/teen.json |
| Sources scientifiques | ✅ | Burke et al. 2003 méta-analyse 30 ECR (PMID 14516234, grade null→**A**) · Prochaska & DiClemente 1983 · Ryan & Deci 2000 · Amrhein 2003 |
| Conformité MDR | ✅ | Balance pour/contre affichée brute — aucune pondération automatique, aucune recommandation algorithmique |
| Corrections apportées | ✅ | sources_seed.sql : Burke 2003 grade null→'A' |

---

### 14 — medication_adherence · Observance médicamenteuse

**Statut** : ✅ Audité — 2026-05-19  
**Type** : `preview_kind='daily_checkin'` (checklist quotidienne, SQLite local)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `DailyCheckinLayout` — checklist mock |
| Écran mobile patient | ✅ | Checklist quotidienne de prise médicamenteuse, SQLite local |
| Cohérence web ↔ mobile | ✅ | Structure identique, données 100 % locales |
| i18n fr complet | ✅ | Clés medication_adherence complètes |
| i18n en complet | ✅ | Parité FR/EN vérifiée |
| i18n teen fr/en complet | ✅ | Overrides tutoiement présents |
| Sources scientifiques | ✅ | NICE CG178 (2014, revu 2022) — Psychose et schizophrénie (guideline, null — approprié) |
| Conformité MDR | ✅ | Checklist auto-déclarée sans score ni seuil — conforme MDR |
| Corrections apportées | ✅ | sources_seed.sql : NICE CG178 présent, grade null maintenu (guideline) |

---

### 15 — breathing_techniques · Techniques de respiration

**Statut** : ✅ Audité — 2026-05-19  
**Type** : Écran dédié (`BreathingTechniquesScreen` + `BreathingExerciseScreen`) + `preview_kind='fields'`  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `FieldsLayout` — liste des techniques avec description |
| Écran mobile patient | ✅ | 5 techniques (cohérence cardiaque, abdominale, 4-7-8, MBCT, TIPP), minuteur animé |
| Cohérence web ↔ mobile | ✅ | Même liste de techniques, même descriptions |
| i18n fr complet | ✅ | Clés complètes fr/common.json |
| i18n en complet | ✅ | Parité FR/EN vérifiée |
| i18n teen fr/en complet | ✅ | Overrides tutoiement présents |
| Sources scientifiques | ✅ | Lehrer & Gevirtz 2014 (grade B) · NICE CG90 · HAS · Segal et al. 2002 MBCT (grade A) — sourçage le plus rigoureux de l'app |
| Conformité MDR | ✅ | Minuteur brut sans mesure physiologique ni seuil — conforme MDR |
| Corrections apportées | — | Aucune correction nécessaire |

---

### 16 — phq9 · PHQ-9

**Statut** : ✅ Audité — 2026-05-19  
**Type** : Échelle générique (`ScaleHistoryScreen` + `ScaleEntryScreen`, `preview_kind='questionnaire'`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `QuestionnaireLayout` — 9 items lisibles, score brut, footer source |
| Écran mobile patient | ✅ | `ScaleEntryScreen` (saisie) + `ScaleHistoryScreen` (historique), SQLite `scale_entries` |
| Cohérence web ↔ mobile | ✅ | Même items, même scoring, même footer |
| i18n fr complet | ✅ | 9 items + 5 options + footer + instructions |
| i18n en complet | ✅ | Parité FR/EN |
| i18n teen fr/en complet | ✅ | Overrides présents |
| Sources scientifiques | ✅ | NICE NG222 (2022) + Kroenke et al. 2001 (PMID 11556941, validation) |
| Conformité MDR | ✅ | Score total affiché brut sans label interprétatif ("dépression légère/sévère") — conforme MDR |
| Corrections apportées | — | Aucune correction nécessaire |

---

### 17 — gad7 · GAD-7

**Statut** : ✅ Audité — 2026-05-19  
**Type** : Échelle générique (`preview_kind='questionnaire'`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `QuestionnaireLayout` — 7 items, score brut |
| Écran mobile patient | ✅ | `ScaleHistoryScreen` + `ScaleEntryScreen`, SQLite `scale_entries` |
| Cohérence web ↔ mobile | ✅ | Même items, même scoring |
| i18n fr/en/teen complet | ✅ | 7 items + 4 options + footer complets |
| Sources scientifiques | ✅ | Spitzer et al. 2006 (PMID 16717171) + NICE CG113 (TAG) |
| Conformité MDR | ✅ | Score brut sans seuil coloré — conforme MDR |
| Corrections apportées | — | Aucune correction nécessaire |

---

### 18 — bsl23 · BSL-23

**Statut** : ✅ Audité — 2026-05-19  
**Type** : Échelle générique (`preview_kind='questionnaire'`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `QuestionnaireLayout` — 23 items, score moyen 0–4 |
| Écran mobile patient | ✅ | `ScaleHistoryScreen` + `ScaleEntryScreen`, SQLite `scale_entries` |
| Cohérence web ↔ mobile | ✅ | Même items, même scoring |
| i18n fr/en/teen complet | ✅ | 23 items + légende 0–4 + footer complets |
| Sources scientifiques | ✅ | Bohus et al. 2009 (Psychopathology, n=694 — validation de l'échelle) |
| Conformité MDR | ✅ | Score moyen brut sans label TPB — conforme MDR |
| Corrections apportées | — | Aucune correction nécessaire |

---

### 19 — rcads · RCADS-25

**Statut** : ✅ Audité — 2026-05-19  
**Type** : Échelle générique pédiatrique avec 6 sous-scores (`preview_kind='questionnaire'`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `QuestionnaireLayout` — 25 items, 6 sous-scores |
| Écran mobile patient | ✅ | `ScaleHistoryScreen` (chips sous-scores) + `ScaleEntryScreen`, SQLite `scale_entries` |
| Cohérence web ↔ mobile | ✅ | Même items, même 6 sous-échelles (TAG/TP/TS/PS/TOC/TD) |
| i18n fr/en/teen complet | ✅ | 25 items + 4 options + 6 sous-scores + footer |
| Sources scientifiques | ✅ | Ebesutani et al. 2012 (PMID 22127718) · CORC · NICE CG28/NG134 |
| Conformité MDR | ✅ | Scores bruts par sous-échelle sans interprétation algorithmique — conforme MDR |
| Corrections apportées | — | Aucune correction nécessaire |

---

### 20 — snap_iv · SNAP-IV

**Statut** : ✅ Audité — 2026-05-19  
**Type** : Échelle générique hétéro-évaluation (`preview_kind='questionnaire'`, `scale_warning`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `QuestionnaireLayout` — 26 items, 3 sous-scores I/HI/TOD |
| Écran mobile patient | ✅ | Bandeau avertissement hétéro-évaluation (`scale_warning`) + `ScaleHistoryScreen` + `ScaleEntryScreen` |
| Cohérence web ↔ mobile | ✅ | Même items, même 3 sous-scores |
| i18n fr/en/teen complet | ✅ | 26 items + options + avertissement hétéro-évaluation + footer |
| Sources scientifiques | ✅ | Swanson et al. 2001 MTA (PMID 11575707) · CADDRA 2023 (guideline) |
| Conformité MDR | ✅ | Scores I/HI/TOD bruts sans seuil TDAH — conforme MDR |
| Corrections apportées | — | Aucune correction nécessaire |

---

### 21 — asrs6 · ASRS v1.1 Dépistage

**Statut** : ✅ Audité — 2026-05-19  
**Type** : Échelle générique auto-évaluation adulte (`preview_kind='questionnaire'`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `QuestionnaireLayout` — 6 items Partie A |
| Écran mobile patient | ✅ | `ScaleHistoryScreen` (bouton info PubMed) + `ScaleEntryScreen`, SQLite `scale_entries` |
| Cohérence web ↔ mobile | ✅ | Même 6 items, même scoring 0–24 |
| i18n fr/en/teen complet | ✅ | 6 items + 4 options + footer + bouton info |
| Sources scientifiques | ✅ | Kessler et al. 2005 (PMID 15841682, Psychol Med — validation) |
| Conformité MDR | ✅ | Score 0–24 brut sans label TDAH — conforme MDR |
| Corrections apportées | — | Aucune correction nécessaire |

---

### 22 — asrs18 · ASRS v1.1 Bilan complet

**Statut** : ✅ Audité — 2026-05-19  
**Type** : Échelle générique auto-évaluation adulte (`preview_kind='questionnaire'`, 2 sous-scores)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `QuestionnaireLayout` — 18 items Parties A+B |
| Écran mobile patient | ✅ | `ScaleHistoryScreen` (chips A/B) + `ScaleEntryScreen`, SQLite `scale_entries` |
| Cohérence web ↔ mobile | ✅ | Même 18 items, même 2 sous-scores |
| i18n fr/en/teen complet | ✅ | 18 items + 4 options + footer Parties A+B |
| Sources scientifiques | ✅ | Kessler et al. 2005 (PMID 15841682) |
| Conformité MDR | ✅ | Scores A/B bruts sans diagnostic — conforme MDR |
| Corrections apportées | — | Aucune correction nécessaire |

---

### 23 — epds · EPDS

**Statut** : ✅ Audité — 2026-05-19  
**Type** : Échelle générique (`preview_kind='questionnaire'`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `QuestionnaireLayout` — 10 items, score 0–30 |
| Écran mobile patient | ✅ | `ScaleHistoryScreen` + `ScaleEntryScreen`, SQLite `scale_entries` |
| Cohérence web ↔ mobile | ✅ | Même 10 items, même scoring |
| i18n fr/en/teen complet | ✅ | 10 items + options à options inversées (items 3,5,6,7,8,9,10) + footer |
| Sources scientifiques | ✅ | Cox et al. 1987 (PMID 3651732) + HAS — dépression périnatale (obligatoire depuis juillet 2022) |
| Conformité MDR | ✅ | Score 0–30 brut sans seuil 10/13 coloré — conforme MDR |
| Corrections apportées | — | Aucune correction nécessaire |

---

### 24 — nsi · NSI

**Statut** : ✅ Audité — 2026-05-19  
**Type** : Échelle générique avec table dédiée (`preview_kind='questionnaire'`, SQLite `nsi_entries`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `QuestionnaireLayout` — 9 items scorés + 2 contextuels |
| Écran mobile patient | ✅ | `ScaleHistoryScreen` + `ScaleEntryScreen`, SQLite `nsi_entries` (table dédiée) |
| Cohérence web ↔ mobile | ✅ | Même 11 items (9 scorés + % récurrents + thèmes libres) |
| i18n fr/en/teen complet | ✅ | 9 items scorés + 2 contextuels + options + footer |
| Sources scientifiques | ✅ | Geoffroy PA et al. 2023 (PMID 37846776, J Sleep Res — validation pilote n=102) |
| Conformité MDR | ✅ | Score 0–45 brut + thème libre — aucune interprétation algorithmique |
| Corrections apportées | — | Aucune correction nécessaire |

---

### 25 — medication_side_effects · Effets secondaires médicamenteux

**Statut** : ✅ Audité — 2026-05-19  
**Type** : Questionnaire générique (`preview_kind='questionnaire'`, SQLite `scale_entries`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `QuestionnaireLayout` — items effets indésirables |
| Écran mobile patient | ✅ | `ScaleHistoryScreen` + `ScaleEntryScreen`, SQLite `scale_entries` |
| Cohérence web ↔ mobile | ✅ | Même items |
| i18n fr/en/teen complet | ✅ | Items + options + footer |
| Sources scientifiques | ✅ | UKU Side Effect Rating Scale (Lingjaerde et al. 1987 — échelle de référence internationale) |
| Conformité MDR | ✅ | Questionnaire d'auto-signalement brut sans diagnostic d'effet indésirable — conforme MDR |
| Corrections apportées | — | Aucune correction nécessaire |

---

### 26 — psychoeducation · Psychoéducation

**Statut** : ✅ Audité — 2026-05-19  
**Type** : Écran dédié (`PsychoeducationScreen` + `CardDetailScreen`, `preview_kind='cards'`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `CardsLayout` — liste des cartes de savoir |
| Écran mobile patient | ✅ | `PsychoeducationScreen` (liste cartes) + `CardDetailScreen`, statut lecture par carte, IDs débloqués Supabase |
| Cohérence web ↔ mobile | ✅ | Même liste de cartes, même contenu |
| i18n fr complet | ✅ | Clés label/description ; contenu cartes dans namespace `psychoeducation` |
| i18n en complet | ✅ | Parité FR/EN |
| i18n teen fr/en complet | ✅ | Overrides tutoiement présents |
| Sources scientifiques | ✅ | Xia 2011 Cochrane (grade null→**A**) · Colom 2003 Arch Gen Psychiatry (grade null→**A**) · Bighelli 2021 Lancet Psychiatry (grade null→**A**) · Miklowitz 2021 JAMA Psychiatry (grade null→**A**) · NICE CG185 (guideline, null) |
| Conformité MDR | ✅ | Cartes informatives, lecture seule, aucune décision clinique automatique — conforme MDR |
| Corrections apportées | ✅ | sources_seed.sql : 4 sources grade null→'A' (Xia, Colom, Bighelli, Miklowitz) |

---

### 27 — diet_weight_psycho · Alimentation et psychotropes

**Statut** : ✅ Audité — 2026-05-19  
**Type** : `preview_kind='psyedu'` — 8 fiches Supabase (`psyedu_topics`/`psyedu_blocks`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `PsyEduLayout` — liste des 8 fiches |
| Écran mobile patient | ✅ | `ModuleContentScreen` → `FieldRenderer` `psyedu` → `PsyEduBlockRenderer` |
| Cohérence web ↔ mobile | ✅ | Même 8 fiches (general, antipsychotics, methylphenidate, antidepressants, mood_stabilizers, sleep, nutrition, activity) |
| Contenu psyedu Supabase | ✅ | Contenu vérifié dans `supabase/seed/psyedu_seed.sql` — 8 topics + blocs |
| i18n teen fr/en complet | ✅ | Namespace `diet_weight_psycho` dans psyedu.json + psyedu_teen.json |
| Sources scientifiques | ✅ | De Hert 2011 · Carucci 2020 méta-analyse (grade null→**A**) · Gitlin 2016 · Cryan 2019 · Cotman 2002 · Fava 2000 |
| Conformité MDR | ✅ | Fiches informatives sans recommandations thérapeutiques individualisées — conforme MDR |
| Corrections apportées | ✅ | sources_seed.sql : Carucci 2020 grade null→'A' |

---

### 28 — chronobiology_tracker · Régularité chronobiologique

**Statut** : ✅ Audité — 2026-05-19  
**Type** : `preview_kind='tabbed'` — 7 fiches psyedu + journal SQLite (`chrono_entries`)  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `TabbedLayout` — 2 onglets (Fiches / Journal) |
| Écran mobile patient | ✅ | `ChronoBioScreen` (segment control) + `ChronoBioDetailScreen` + `ChronoBioEntryScreen`, SQLite `chrono_entries` |
| Cohérence web ↔ mobile | ✅ | 7 fiches psyedu + journal 5 ancrages horaires |
| Contenu psyedu Supabase | ✅ | `supabase/seed/chrono_seed.sql` — 7 topics + blocs vérifiés. Corrections psyedu.json appliquées : "Phillips 2024" → "Li DR 2025" ; "Prog Brain Res" → "Endocr Dev" |
| Journal SQLite (5 ancrages) | ✅ | Ancrages lever/coucher/repas/exercice/social — optionnels, pas de scoring |
| i18n teen fr/en complet | ✅ | Namespace `chronobiology_tracker` dans psyedu.json + psyedu_teen.json |
| Sources scientifiques | ✅ | Frank 2005 IPSRT (grade null→**A**) · Li DR 2025 cohorte UK Biobank (grade null→**B**) · Roenneberg 2012 (grade null→**B**) · Rosenthal 1984 (grade null→**A**) · 7 autres sources mécanistiques (null — expert opinions) |
| Conformité MDR | ✅ | Journal horaires bruts sans analyse ni recommandation — conforme MDR |
| Corrections apportées | ✅ | sources_seed.sql : 4 grades corrigés (Frank A, Li B, Roenneberg B, Rosenthal A) |

---

### 29 — distress_tolerance · Tolérance à la détresse

**Statut** : ✅ Audité — 2026-05-19  
**Type** : `preview_kind='tabbed'` — 6 fiches psyedu DBT + accordéon "En crise"  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `TabbedLayout` — 2 onglets (Fiches DBT / En crise) |
| Écran mobile patient | ✅ | `ModuleContentScreen` → `FieldRenderer` tabbed, 6 fiches TIPP/ACCEPTS/self-soothing/IMPROVE/pros&cons/mindfulness, accordéon "En crise", `DisclaimerBanner` MDR |
| Cohérence web ↔ mobile | ✅ | Même 6 techniques, même structure onglets, bandeau disclaimer présent mobile |
| Contenu psyedu Supabase | ✅ | `supabase/seed/distress_tolerance_seed.sql` — topics + blocs vérifiés |
| i18n teen fr/en complet | ✅ | Namespace `distress_tolerance` dans psyedu.json + psyedu_teen.json |
| Sources scientifiques | ✅ | Linehan 2006 ECR (grade null→**A**) · Linehan 2015 ECR (grade null→**A**) · Stoffers-Winterling 2022 méta-analyse (grade null→**A**) · Sakakibara 1996 ECR (grade null→**A**) · Gordon 2017 méta-analyse (grade null→**A**) · Lundell 2021 cohorte n=26 (grade null maintenu — trop petit pour 'B') |
| Conformité MDR | ✅ | Bandeau disclaimer MDR présent, fiches informatives, aucun score — conforme MDR |
| Corrections apportées | ✅ | sources_seed.sql : 5 grades null→'A' (Linehan 2006, Linehan 2015, Stoffers-Winterling, Sakakibara, Gordon) |

---

### 30 — craving_journal · Journal de craving

**Statut** : ✅ Audité — 2026-05-19  
**Type** : `preview_kind='tabbed'` — 4 fiches psyedu + journal auto-monitoring SQLite  
**Priorité** : —

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | ✅ | `TabbedLayout` — 2 onglets (Fiches / Journal) |
| Écran mobile patient | ✅ | `ModuleContentScreen` → `FieldRenderer` tabbed, 4 fiches psyedu, journal (intensité 0–10, déclencheur, émotion, pensée, stratégie coping), `DisclaimerBanner` MDR |
| Cohérence web ↔ mobile | ✅ | 4 fiches + journal auto-monitoring identiques |
| Contenu psyedu Supabase | ✅ | `supabase/seed/craving_seed.sql` — 4 topics + blocs vérifiés (neurobiologie craving, modèle A-B-C, urge surfing, HALT) |
| Journal auto-monitoring | ✅ | Intensité slider 0–10 brut + 4 champs texte libres — aucun scoring |
| i18n teen fr/en complet | ✅ | Namespace `craving_journal` dans psyedu.json + psyedu_teen.json |
| Sources scientifiques | ✅ | Magill & Ray 2009 méta-analyse 53 ECR (grade null→**A**) · Bowen 2014 MBRP ECR (grade null→**A**) · Koob & Volkow 2016 (expert_opinion, null) |
| Conformité MDR | ✅ | Bandeau disclaimer MDR présent, intensité brute sans interprétation, journal ouvert — conforme MDR |
| Corrections apportées | ✅ | sources_seed.sql : Magill 2009 et Bowen 2014 grades null→'A' |

---

## Plan de travail

### Ordre de revue (liste CLAUDE.md)

1. sleep_diary
2. beck_columns
3. fear_thermometer
4. exposure_hierarchy
5. emotion_wheel
6. crisis_plan
7. rim
8. cognitive_saturation
9. decisional_balance
10. behavioral_activation
11. grounding
12. mood_tracker
13. motivational_balance
14. medication_adherence
15. breathing_techniques
16–25. Échelles (phq9 → medication_side_effects)
26. psychoeducation
27. diet_weight_psycho
28. chronobiology_tracker
29. distress_tolerance
30. craving_journal

### Critères de "module validé"

Un module est marqué ✅ dans la colonne Revue quand :
- [ ] Aperçu web praticien correct et complet
- [ ] Écran(s) mobile fonctionnel(s)
- [ ] Contenu identique web ↔ mobile
- [ ] i18n fr/en/teen sans clé manquante
- [ ] Au moins une source scientifique citée (ou note justifiant l'absence)
- [ ] Conformité MDR vérifiée (aucun wording interprétatif)
- [ ] Corrections commitées si nécessaire
