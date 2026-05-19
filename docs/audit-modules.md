# Audit qualité — Modules thérapeutiques PsyTool

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
| 9 | decisional_balance | ✅ | ✅ | ✅ | ❌ | ✅ | 🔲 | Haute |
| 10 | behavioral_activation | ✅ | ✅ | ✅ | ❌ | ✅ | 🔲 | Haute |
| 11 | grounding | ✅ | ✅ | ✅ | ❌ | ✅ | 🔲 | Moyenne |
| 12 | mood_tracker | ✅ | ✅ | ✅ | ❌ | ✅ | 🔲 | Haute |
| 13 | motivational_balance | ✅ | ✅ | ⚠️ | ❌ | ✅ | 🔲 | Haute |
| 14 | medication_adherence | ✅ | ✅ | ✅ | ❌ | ✅ | 🔲 | Moyenne |
| 15 | breathing_techniques | ✅ | ✅ | ✅ | ✅✅ | ✅ | 🔲 | Basse |
| 16 | phq9 | ✅ | ✅ | ✅ | ✅ | ✅ | 🔲 | Basse |
| 17 | gad7 | ✅ | ✅ | ✅ | ✅ | ✅ | 🔲 | Basse |
| 18 | bsl23 | ✅ | ✅ | ✅ | ✅ | ✅ | 🔲 | Basse |
| 19 | rcads | ✅ | ✅ | ✅ | ✅ | ✅ | 🔲 | Basse |
| 20 | snap_iv | ✅ | ✅ | ✅ | ✅ | ✅ | 🔲 | Basse |
| 21 | asrs6 | ✅ | ✅ | ✅ | ✅ | ✅ | 🔲 | Basse |
| 22 | asrs18 | ✅ | ✅ | ✅ | ✅ | ✅ | 🔲 | Basse |
| 23 | epds | ✅ | ✅ | ✅ | ✅ | ✅ | 🔲 | Basse |
| 24 | nsi | ✅ | ✅ | ✅ | ✅ | ✅ | 🔲 | Basse |
| 25 | medication_side_effects | ✅ | ✅ | ✅ | ✅ | ✅ | 🔲 | Basse |
| 26 | psychoeducation | ✅ | ✅ | ✅ | ❌ | ✅ | 🔲 | Moyenne |
| 27 | diet_weight_psycho | ✅ | ✅ | ✅ (psyedu) | ⚠️ | ✅ | 🔲 | Haute |
| 28 | chronobiology_tracker | ✅ | ✅ | ✅ (psyedu) | ⚠️ | ✅ | 🔲 | Haute |
| 29 | distress_tolerance | ✅ | ✅ | ✅ (psyedu) | ⚠️ | ✅ | 🔲 | Haute |
| 30 | craving_journal | ✅ | ✅ | ✅ (psyedu) | ⚠️ | ✅ | 🔲 | Haute |

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
| mood_tracker | Pas de source de validation (outil propriétaire PsyTool) |
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

**Statut** : 🔲 Non audité  
**Type** : Moteur générique (`preview_kind='decision_grid'`)  
**Priorité** : Haute

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | 🔲 | |
| Écran mobile patient | 🔲 | |
| Cohérence web ↔ mobile | 🔲 | |
| i18n fr complet | 🔲 | |
| i18n en complet | 🔲 | |
| i18n teen fr/en complet | 🔲 | |
| Sources scientifiques | 🔲 | Manquantes : Miller & Rollnick 2012 (Entretien Motivationnel) |
| Conformité MDR | 🔲 | |
| Corrections apportées | — | |

---

### 10 — behavioral_activation · Activation comportementale

**Statut** : 🔲 Non audité  
**Type** : Moteur générique (`preview_kind='activity_log'`)  
**Priorité** : Haute

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | 🔲 | |
| Écran mobile patient | 🔲 | |
| Cohérence web ↔ mobile | 🔲 | |
| i18n fr complet | 🔲 | |
| i18n en complet | 🔲 | |
| i18n teen fr/en complet | 🔲 | |
| Sources scientifiques | 🔲 | Manquantes : Lewinsohn 1974 ; Martell et al. 2010 |
| Conformité MDR | 🔲 | |
| Corrections apportées | — | |

---

### 11 — grounding · Ancrage 5-4-3-2-1

**Statut** : 🔲 Non audité  
**Type** : `preview_kind='guided_exercise'`  
**Priorité** : Moyenne

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | 🔲 | |
| Écran mobile patient | 🔲 | |
| Cohérence web ↔ mobile | 🔲 | |
| i18n fr complet | 🔲 | |
| i18n en complet | 🔲 | |
| i18n teen fr/en complet | 🔲 | |
| Sources scientifiques | 🔲 | Manquantes : Linehan 1993 (DBT) |
| Conformité MDR | 🔲 | |
| Corrections apportées | — | |

---

### 12 — mood_tracker · Thermomètre de l'humeur

**Statut** : 🔲 Non audité  
**Type** : Saisie quotidienne + sparklines  
**Priorité** : Haute

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | 🔲 | |
| Écran mobile patient | 🔲 | |
| Cohérence web ↔ mobile | 🔲 | |
| i18n fr complet | 🔲 | |
| i18n en complet | 🔲 | |
| i18n teen fr/en complet | 🔲 | |
| Sources scientifiques | 🔲 | Outil propriétaire — note à ajouter |
| Conformité MDR | 🔲 | Vérifier affichage brut sans interprétation |
| Corrections apportées | — | |

---

### 13 — motivational_balance · Balance motivationnelle

**Statut** : 🔲 Non audité  
**Type** : `preview_kind='tabbed'` (psyedu + balance)  
**Priorité** : Haute

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | 🔲 | |
| Écran mobile patient | 🔲 | |
| Cohérence web ↔ mobile | 🔲 | |
| i18n fr complet | 🔲 | Minimal détecté côté i18n (contenu en psyedu Supabase) |
| i18n en complet | 🔲 | |
| i18n teen fr/en complet | 🔲 | |
| Sources scientifiques | 🔲 | Manquantes : Miller & Rollnick 2012 |
| Conformité MDR | 🔲 | |
| Corrections apportées | — | |

---

### 14 — medication_adherence · Observance médicamenteuse

**Statut** : 🔲 Non audité  
**Type** : `preview_kind='daily_checkin'`  
**Priorité** : Moyenne

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | 🔲 | |
| Écran mobile patient | 🔲 | |
| Cohérence web ↔ mobile | 🔲 | |
| i18n fr complet | 🔲 | |
| i18n en complet | 🔲 | |
| i18n teen fr/en complet | 🔲 | |
| Sources scientifiques | 🔲 | À définir (HAS recommandations observance ?) |
| Conformité MDR | 🔲 | |
| Corrections apportées | — | |

---

### 15 — breathing_techniques · Techniques de respiration

**Statut** : 🔲 Non audité  
**Type** : Écran dédié (`BreathingTechniquesScreen` + `BreathingExerciseScreen`)  
**Priorité** : Basse (déjà bien sourcé)

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | 🔲 | |
| Écran mobile patient | 🔲 | |
| Cohérence web ↔ mobile | 🔲 | |
| i18n fr complet | 🔲 | |
| i18n en complet | 🔲 | |
| i18n teen fr/en complet | 🔲 | |
| Sources scientifiques | ✅ | Lehrer & Gevirtz 2014 (Grade B), NICE CG90, HAS, MBCT Segal 2002 (Grade A) |
| Conformité MDR | 🔲 | |
| Corrections apportées | — | |

---

### 16 — phq9 · PHQ-9

**Statut** : 🔲 Non audité  
**Type** : Échelle générique (`ScaleHistoryScreen` + `ScaleEntryScreen`)  
**Priorité** : Basse (déjà bien sourcé)

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | 🔲 | |
| Écran mobile patient | 🔲 | |
| Cohérence web ↔ mobile | 🔲 | |
| i18n fr complet | 🔲 | |
| i18n en complet | 🔲 | |
| i18n teen fr/en complet | 🔲 | |
| Sources scientifiques | ✅ | NICE NG222 (2022) |
| Conformité MDR | 🔲 | |
| Corrections apportées | — | |

---

### 17 — gad7 · GAD-7

**Statut** : 🔲 Non audité  
**Type** : Échelle générique  
**Priorité** : Basse

| Critère | Statut | Notes |
|---|---|---|
| Sources scientifiques | ✅ | NICE CG113 |
| Autres critères | 🔲 | |

---

### 18 — bsl23 · BSL-23

**Statut** : 🔲 Non audité  
**Type** : Échelle générique  
**Priorité** : Basse

| Critère | Statut | Notes |
|---|---|---|
| Sources scientifiques | ✅ | Bohus et al. 2009 (Psychopathology, n=694) |
| Autres critères | 🔲 | |

---

### 19 — rcads · RCADS-25

**Statut** : 🔲 Non audité  
**Type** : Échelle générique pédiatrique  
**Priorité** : Basse

| Critère | Statut | Notes |
|---|---|---|
| Sources scientifiques | ✅ | CORC, NICE CG28/NG134 |
| Autres critères | 🔲 | |

---

### 20 — snap_iv · SNAP-IV

**Statut** : 🔲 Non audité  
**Type** : Échelle générique hétéro-évaluation  
**Priorité** : Basse

| Critère | Statut | Notes |
|---|---|---|
| Sources scientifiques | ✅ | Swanson et al. 2001 (MTA), CADDRA 2023 |
| Autres critères | 🔲 | |

---

### 21 — asrs6 · ASRS v1.1 Dépistage

**Statut** : 🔲 Non audité  
**Type** : Échelle générique  
**Priorité** : Basse

| Critère | Statut | Notes |
|---|---|---|
| Sources scientifiques | ✅ | Kessler RC et al. 2005 (Psychol Med), PubMed 15841682 |
| Autres critères | 🔲 | |

---

### 22 — asrs18 · ASRS v1.1 Bilan complet

**Statut** : 🔲 Non audité  
**Type** : Échelle générique  
**Priorité** : Basse

| Critère | Statut | Notes |
|---|---|---|
| Sources scientifiques | ✅ | Kessler RC et al. 2005 |
| Autres critères | 🔲 | |

---

### 23 — epds · EPDS

**Statut** : 🔲 Non audité  
**Type** : Échelle générique  
**Priorité** : Basse

| Critère | Statut | Notes |
|---|---|---|
| Sources scientifiques | ✅ | HAS — dépression périnatale (obligatoire depuis juillet 2022) |
| Autres critères | 🔲 | |

---

### 24 — nsi · NSI

**Statut** : 🔲 Non audité  
**Type** : Échelle générique  
**Priorité** : Basse

| Critère | Statut | Notes |
|---|---|---|
| Sources scientifiques | ✅ | Geoffroy PA et al. J Sleep Res 2023 |
| Autres critères | 🔲 | |

---

### 25 — medication_side_effects · Effets secondaires

**Statut** : 🔲 Non audité  
**Type** : Échelle générique  
**Priorité** : Basse

| Critère | Statut | Notes |
|---|---|---|
| Sources scientifiques | ✅ | UKU Side Effect Rating Scale (Lingjaerde et al. 1987) |
| Autres critères | 🔲 | |

---

### 26 — psychoeducation · Psychoéducation

**Statut** : 🔲 Non audité  
**Type** : Écran dédié (`PsychoeducationScreen` + `CardDetailScreen`)  
**Priorité** : Moyenne

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | 🔲 | |
| Écran mobile patient | 🔲 | |
| Cohérence web ↔ mobile | 🔲 | |
| i18n fr complet | 🔲 | |
| i18n en complet | 🔲 | |
| i18n teen fr/en complet | 🔲 | |
| Sources scientifiques | 🔲 | Contenu cartes à vérifier (Colom & Vieta 2006 ?) |
| Conformité MDR | 🔲 | |
| Corrections apportées | — | |

---

### 27 — diet_weight_psycho · Alimentation et psychotropes

**Statut** : 🔲 Non audité  
**Type** : `preview_kind='psyedu'` — 8 fiches en Supabase  
**Priorité** : Haute

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | 🔲 | |
| Écran mobile patient | 🔲 | |
| Cohérence web ↔ mobile | 🔲 | |
| Contenu psyedu Supabase | 🔲 | Vérifier les 8 fiches (general, antipsychotics, methylphenidate, antidepressants, mood_stabilizers, sleep, nutrition, activity) |
| i18n teen fr/en complet | 🔲 | |
| Sources scientifiques | 🔲 | À vérifier dans seed psyedu |
| Conformité MDR | 🔲 | Bandeau disclaimer présent ? |
| Corrections apportées | — | |

---

### 28 — chronobiology_tracker · Régularité chronobiologique

**Statut** : 🔲 Non audité  
**Type** : `preview_kind='tabbed'` — 7 fiches psyedu + journal SQLite  
**Priorité** : Haute

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | 🔲 | |
| Écran mobile patient | 🔲 | |
| Cohérence web ↔ mobile | 🔲 | |
| Contenu psyedu Supabase | 🔲 | Vérifier les 7 fiches |
| Journal SQLite (5 ancrages) | 🔲 | |
| i18n teen fr/en complet | 🔲 | |
| Sources scientifiques | 🔲 | À vérifier dans seed psyedu (Frank E 2005 — Social Rhythm Therapy ?) |
| Conformité MDR | 🔲 | |
| Corrections apportées | — | |

---

### 29 — distress_tolerance · Tolérance à la détresse

**Statut** : 🔲 Non audité  
**Type** : `preview_kind='tabbed'` — 6 fiches psyedu DBT + accordéon  
**Priorité** : Haute

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | 🔲 | |
| Écran mobile patient | 🔲 | |
| Cohérence web ↔ mobile | 🔲 | |
| Contenu psyedu Supabase | 🔲 | Vérifier TIPP, ACCEPTS, self-soothing, IMPROVE, pros & cons |
| i18n teen fr/en complet | 🔲 | |
| Sources scientifiques | 🔲 | Linehan MM 1993 (DBT Skills Manual) — à vérifier si présent en seed |
| Conformité MDR | 🔲 | Bandeau disclaimer MDR présent ? |
| Corrections apportées | — | |

---

### 30 — craving_journal · Journal de craving

**Statut** : 🔲 Non audité  
**Type** : `preview_kind='tabbed'` — 4 fiches psyedu + journal SQLite  
**Priorité** : Haute

| Critère | Statut | Notes |
|---|---|---|
| Aperçu web praticien | 🔲 | |
| Écran mobile patient | 🔲 | |
| Cohérence web ↔ mobile | 🔲 | |
| Contenu psyedu Supabase | 🔲 | Vérifier les 4 fiches |
| Journal auto-monitoring | 🔲 | intensity slider, déclencheur, émotion, pensée, coping |
| i18n teen fr/en complet | 🔲 | |
| Sources scientifiques | 🔲 | TCC addictologie — Marlatt & Gordon 1985 ? à vérifier |
| Conformité MDR | 🔲 | Bandeau disclaimer MDR présent ? |
| Corrections apportées | — | |

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
