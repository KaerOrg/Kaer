# Roadmap — Migration vers le moteur de rendu DB-driven (mobile)

> **Document pour futures sessions Claude Code.**  
> Objectif : supprimer le maximum d'écrans custom dans `apps/mobile/src/screens/modules/`  
> et les remplacer par le moteur générique `ModuleContentScreen` + `FieldRenderer`.  
> Mettre à jour le tableau de statut après chaque migration complétée.

---

## Architecture du moteur (état actuel)

```
Supabase
  modules             → preview_kind pilote le layout
  module_content_fields → champs typés + section_id + parent_field_id
  field_props         → props React (color, icon, widget_type…)
          ↓
apps/mobile/src/lib/moduleService.ts  fetchModuleFields(moduleId)
          ↓
ContentField[]  (props hydratées, arbre parent/enfant)
          ↓
Deux entrées possibles :
  ├── preview_kind = 'questionnaire'
  │     → ScaleHistoryScreen (historique + suppression + chips sous-scores)
  │         → ScaleEntryScreen (saisie interactive answers[], saveScaleEntry)
  │             → FieldRenderer preview_kind='questionnaire'
  │                 → QuestionnaireLayout
  └── autres preview_kinds
        → ModuleContentScreen
            ├── guided_exercise → SafeAreaView direct (flex:1) → FieldRenderer
            └── autres         → SafeAreaView + ScrollView → FieldRenderer
                    ↓
          FieldRenderer.tsx  (dispatch preview_kind → layout)
            ├── guided_exercise    → GuidedExerciseLayout  (intro / guidé / terminé)
            ├── patient_scenario   → PatientScenarioLayout (per-patient depuis patient_modules.config)
            ├── editable_steps     → EditableStepsLayout  (plan de crise avec plan_items SQLite)
            ├── timed_tap_exercise → TimedTapExerciseLayout (cognitive_saturation : timer + taps + 4 modes)
            ├── daily_checkin      → DailyCheckinLayout    (medication_adherence : 1 saisie/jour + onglets)
            ├── column_form        → ColumnFormLayout      (beck_columns : sections + champs enfants + form_entries)
            ├── tree_selector      → TreeSelectorLayout    (emotion_wheel : arbre N niveaux + tree_selections)
            ├── sleep_journal      → SleepJournalLayout    (sleep_diary : 3 modes internes list/entry/month, time pickers natifs, grille calendrier, table sleep_diary_entries)
            ├── activity_log       → ActivityLogLayout     (behavioral_activation : 3 modes internes week/list/entry, cycle prédire/faire/constater P/M attendus vs ressentis, suggestions chips groupées par domaines de vie, activités co-construites config.ba_activities, table activity_records)
            ├── exposure_tracker   → ExposureTrackerLayout (fear_thermometer : tabs Saisies/Situations, mode entry avec SUDs avant/après, catalogue + texte libre, stratégies DB-driven, tables fear_entries + fear_situations)
            ├── decision_grid      → DecisionGridLayout    (decisional_balance : grille 2×2 + items pondérés 1–5 étoiles + jauge motivation, tables plan_items.weight + module_settings, sous-composant EditableItemsList partagé avec editable_steps)
            ├── steps              → StepsLayout
            ├── cards              → CardsLayout
            ├── fields             → FieldsLayout
            └── grid2x2            → Grid2x2Layout
```

### Fichiers clés à modifier lors d'une migration

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/components/ModuleRenderer/FieldRenderer.tsx` | Dispatch preview_kind → layout. Ajouter nouveaux layouts ici |
| `apps/mobile/src/screens/modules/ScaleEntryScreen.tsx` | Saisie questionnaire générique (answers[], saveScaleEntry) |
| `apps/mobile/src/screens/modules/ScaleHistoryScreen.tsx` | Historique générique (chips sous-scores, suppression) |
| `apps/mobile/src/lib/scaleScoring.ts` | Map `SCALE_SCORING[scale_id]` — ajouter une entrée par échelle |
| `apps/mobile/src/lib/database.ts` | SQLite — table `scale_entries` générique, migrations |
| `apps/mobile/src/screens/HomeScreen.tsx` | `CUSTOM_ROUTES` — retirer le module migré |
| `apps/mobile/src/navigation/AppStack.tsx` | Retirer l'import + le `Stack.Screen` du module |
| `supabase/schema.sql` | Source de vérité schéma — synchroniser |
| `apps/mobile/src/i18n/locales/fr/common.json` | Clés i18n (+ en/common, fr/teen, en/teen) |

### Schéma SQLite — table `scale_entries`

```sql
CREATE TABLE IF NOT EXISTS scale_entries (
  id              TEXT PRIMARY KEY,
  scale_id        TEXT NOT NULL,          -- ex. 'epds', 'mood_tracker', 'nsi'
  answers         TEXT NOT NULL,          -- JSON array (number | null)[]
  total_score     REAL NOT NULL,
  subscale_scores TEXT,                   -- JSON Record<string, number> (optionnel)
  created_at      TEXT NOT NULL
);
```

### Schéma Supabase — `module_content_fields`

```
id              text PK
module_id       text FK → modules.id
field_type      text     (détermine le composant React)
text_code       text     (clé i18n — ex. 'modules.epds.q1')
sort_order      int
section_id      text     (regroupe des champs en section — ex. 'epds.sec_a')
parent_field_id text FK self  (options enfants d'une question)
```

### CUSTOM_ROUTES (HomeScreen.tsx) — état actuel

Tout module absent de cette map ET `preview_kind = 'questionnaire'` → `ScaleHistory`.  
Tout module absent de cette map ET autre `preview_kind` → `ModuleContent` (moteur générique).

```ts
const CUSTOM_ROUTES = {
  psychoeducation, decisional_balance,
  breathing_techniques,
}
```

---

## Tableau de suivi des migrations

`✅ Migré` · `🔄 En cours` · `⏳ Planifié` · `❌ Rester custom — contrainte non-technique`

| Module | Ancien écran | Pattern | Approche | Statut |
|---|---|---|---|---|
| `phq9` | PHQ9Screen + PHQ9EntryScreen | Questionnaire Likert 4 options | ScaleEntryScreen + ScaleHistoryScreen génériques | ✅ Migré |
| `gad7` | GAD7Screen + GAD7EntryScreen | Questionnaire Likert 4 options | ScaleEntryScreen + ScaleHistoryScreen génériques | ✅ Migré |
| `bsl23` | BSL23Screen + BSL23EntryScreen | Questionnaire Likert 5 options | ScaleEntryScreen + ScaleHistoryScreen génériques | ✅ Migré |
| `snap_iv` | SNAPIVScreen + SNAPIVEntryScreen | Questionnaire 26 items + 3 subscales | ScaleEntryScreen + ScaleHistoryScreen + chips | ✅ Migré |
| `asrs6` | ASRS6Screen + ASRS6EntryScreen | Questionnaire 6 items | ScaleEntryScreen + ScaleHistoryScreen génériques | ✅ Migré |
| `asrs18` | ASRS18Screen + ASRS18EntryScreen | Questionnaire 18 items + 2 subscales | ScaleEntryScreen + ScaleHistoryScreen + chips | ✅ Migré |
| `rcads` | RCADS25Screen + RCADS25EntryScreen | Questionnaire 25 items + 6 subscales | ScaleEntryScreen + ScaleHistoryScreen + chips | ✅ Migré |
| `epds` | EPDSScreen + EPDSEntryScreen | Questionnaire options/item | QuestionnaireLayout avec parent_field_id | ✅ Migré |
| `nsi` | NSIScreen + NSIEntryScreen | Questionnaire + champs libres | QuestionnaireLayout + scale_text_input | ✅ Migré |
| `medication_side_effects` | MedicationSideEffectsScreen | Questionnaire 6×4 | ScaleEntryScreen + 6 subscales | ✅ Migré |
| `mood_tracker` | MoodTrackerScreen | 4 sliders + historique | QuestionnaireLayout scale_slider_question | ✅ Migré |
| `crisis_plan` | CrisisPlanScreen | Document éditable 6 étapes | Nouveau layout `editable_steps` | ✅ Migré |
| `rim` | RimScreen | Scénario per-patient Supabase | `preview_kind: 'patient_scenario'` + `patientConfig` | ✅ Migré |
| `cognitive_saturation` | CognitiveSaturationScreen + ExerciseScreen | Timer + compteur de taps + historique | Nouveau layout `timed_tap_exercise` (4 modes internes) | ✅ Migré |
| `medication_adherence` | MedicationAdherenceScreen | Saisie 1 item/jour + notes | Nouveau layout `daily_checkin` (onglets + UPSERT date UNIQUE + `logEvent`) | ✅ Migré |
| `beck_columns` | BeckColumnsScreen + BeckEntryScreen | 5 colonnes hétérogènes TCC | Nouveau layout `column_form` (sections = colonnes, champs enfants via `parent_field_id`, table `form_entries`) | ✅ Migré |
| `emotion_wheel` | EmotionWheelScreen + Entry + Month | Roue 3 niveaux hiérarchiques | Nouveau layout `tree_selector` (niveaux modélisés via `parent_field_id`, table SQLite générique `tree_selections`) | ✅ Migré |
| `sleep_diary` | SleepDiaryScreen + Entry + Month | Journal + time pickers + calendrier | Nouveau layout `sleep_journal` (3 modes internes + time pickers natifs + grille mois, table SQLite dédiée `sleep_diary_entries`) | ✅ Migré |
| `behavioral_activation` | BehavioralActivationScreen + Entry | CRUD activités + calendrier mensuel | Nouveau layout `activity_log` (3 modes list/entry/month, calendrier dots done/planned, suggestions chips, 2 sliders P/M, table SQLite dédiée `activity_records`) | ✅ Migré |
| `fear_thermometer` | FearThermometerScreen + FearEntryScreen | SUDS avant/après + catalogue situations + stratégies | Nouveau layout `exposure_tracker` (tabs Saisies/Situations, mode entry SUDs avant/après, stratégies DB-driven, tables `fear_entries` + `fear_situations`) | ✅ Migré |
| `decisional_balance` | DecisionalBalanceScreen | Grille 2×2 + items pondérés (1–5 étoiles) + jauge motivation | Nouveau layout `decision_grid` (4 quadrants 2×2 via `column_header.gauge_role`, items via `plan_items.weight`, target_behavior via `module_settings`, sous-composant `EditableItemsList` partagé avec `editable_steps`) | ✅ Migré |

---

## Migrations complétées — Détail technique

---

### 1. `epds` — Questionnaire à options variables par item

**Fonctionnel**  
EPDS (Edinburgh Postnatal Depression Scale) — 10 questions de dépression post-partum.  
Chaque question a 4 options dont les libellés sont DIFFÉRENTS par item (pas d'options globales).  
Score total 0–30. Historique avec score + date. Suppression.

**Blocage actuel**  
`QuestionnaireLayout` utilise un seul pool d'options global (`scale_option` sans parent).  
Les 10 questions de l'EPDS ont des libellés distincts → impossible avec le moteur actuel.

**Solution : support `parent_field_id` pour options par question**

*Changement Supabase (module_content_fields) :*  
Insérer des `scale_option` enfants de chaque `scale_question` via `parent_field_id = question.id`.  
Ex. pour Q1 de l'EPDS :
```
id='epds.q1'  field_type='scale_question'  text_code='modules.epds.q1'  sort_order=10
  └── id='epds.q1.opt0'  parent_field_id='epds.q1'  field_type='scale_option'  text_code='modules.epds.q1_opt0'  prop value='0'
  └── id='epds.q1.opt1'  parent_field_id='epds.q1'  field_type='scale_option'  text_code='modules.epds.q1_opt1'  prop value='1'
  └── id='epds.q1.opt2'  parent_field_id='epds.q1'  field_type='scale_option'  text_code='modules.epds.q1_opt2'  prop value='2'
  └── id='epds.q1.opt3'  parent_field_id='epds.q1'  field_type='scale_option'  text_code='modules.epds.q1_opt3'  prop value='3'
```
→ Répéter pour les 10 questions. Chacune a 4 opts avec libellés distincts.

*Changement `QuestionnaireLayout` dans `FieldRenderer.tsx` :*  
```ts
// Actuellement (options globales) :
const options = fields.filter(f => f.field_type === 'scale_option').sort(...)

// Après la modification, dans la boucle de rendu des questions :
const questionOptions = question.children.filter(c => c.field_type === 'scale_option')
const finalOptions = questionOptions.length > 0 ? questionOptions : globalOptions
// Passer finalOptions à LikertWidget
```
Le service `fetchModuleFields` construit déjà `field.children` — les opts enfants sont accessibles via `question.children`.

*Changement `ScaleEntryScreen.tsx` :*  
Aucun changement — il passe déjà `fields` complet à `FieldRenderer`, et `answers[]` est indexé par ordre des `scale_question`.

*Changement `scaleScoring.ts` :*  
```ts
epds: {
  formula: 'sum', items_count: 10, score_decimals: 0,
  computeScore: sum,
}
```

*Migration SQLite dans `database.ts` :*  
```sql
INSERT OR IGNORE INTO scale_entries (id, scale_id, answers, total_score, subscale_scores, created_at)
SELECT id, 'epds', answers, total_score, NULL, created_at FROM epds_entries;
```
Puis supprimer `createEPDSTable`, `EPDSEntry`, `getAllEPDSEntries`, `saveEPDSEntry`, `deleteEPDSEntry`.

*Clés i18n à ajouter dans `fr/common.json` + `en/common.json` + `fr/teen.json` + `en/teen.json` :*  
Vérifier que les clés `modules.epds.q1` … `modules.epds.q10` et `modules.epds.q{n}_opt{0-3}` existent.  
Elles existent probablement déjà dans `EPDSEntryScreen.tsx` (lire le fichier pour extraire les strings).

*Supabase (modules) :*  
Mettre `preview_kind = 'questionnaire'` si pas déjà fait.

*Nettoyage :*  
- Retirer `epds` et `EPDSEntry` de `CUSTOM_ROUTES` dans `HomeScreen.tsx`
- Retirer les routes `EPDS` et `EPDSEntry` de `AppStack.tsx`
- Supprimer `EPDSScreen.tsx`, `EPDSEntryScreen.tsx`, et leurs tests
- Ajouter `CHIP_KEY_TO_SUBSCALE` entry dans `ScaleHistoryScreen` si sous-scores

**Vérification**  
`npx tsc --noEmit` → zéro erreur.  
`ScaleHistoryScreen` avec `scale_id='epds'` affiche l'historique.  
`ScaleEntryScreen` avec `scale_id='epds'` affiche 10 questions avec leurs options propres.

---

### 2. `nsi` — Questionnaire + champs texte libres

**Fonctionnel**  
NSI (Nightmare Severity Index) — 9 items sur échelle 0-5 (même échelle pour tous).  
Après les 9 items : champ numérique optionnel (% rêves récurrents) + 3 champs texte (thèmes récurrents).  
Score total 0–45, % récurrents, sous-score 3 thèmes.

**Solution : ajouter `scale_text_input` et `scale_number_input`**

Les 9 questions utilisent les MÊMES options (0-5) → aucun changement `parent_field_id` nécessaire.  
Seuls les champs additionnels post-questions sont nouveaux.

*Nouveaux field_types à gérer dans `QuestionnaireLayout` :*
- `scale_number_input` — champ numérique (% récurrents). Props : `min`, `max`, `unit`
- `scale_text_input` — champ texte libre. Props : `placeholder_code` (clé i18n)

Ces champs se rendraient APRÈS le bloc questions, avant le footer.  
Leurs valeurs seraient stockées dans `subscale_scores` du `scale_entries` :
```json
{ "pct_recurrent": 40, "theme_1": "chute", "theme_2": "agression", "theme_3": "" }
```

*Changement `ScaleEntryScreen.tsx` :*  
Ajouter un state `textInputValues: Record<string, string>` pour les champs libres.  
Au save : inclure ces valeurs dans `subscale_scores` avant `saveScaleEntry`.

*Changement `scaleScoring.ts` :*  
```ts
nsi: {
  formula: 'sum', items_count: 9, score_decimals: 0,
  computeScore: sum,
  // subscale_scores géré par les text_inputs dans ScaleEntryScreen
}
```

*Migration SQLite :*  
```sql
INSERT OR IGNORE INTO scale_entries (id, scale_id, answers, total_score, subscale_scores, created_at)
SELECT id, 'nsi', answers, total_score,
  json_object('pct_recurrent', pct_recurrent, 'theme_1', theme_1, 'theme_2', theme_2, 'theme_3', theme_3),
  created_at
FROM nsi_entries;
```

*Nettoyage :* Retirer de `CUSTOM_ROUTES`, AppStack, supprimer NSIScreen + NSIEntryScreen + tests.

---

### 3. `medication_side_effects` — Questionnaire 6 × 4 options

**Fonctionnel**  
6 effets secondaires (sédation, akathisie, tremors, sécheresse buccale, perturbations du sommeil, nausées) notés 0-3.  
Historique 30j. Score total 0–18. Affichage en pills colorées dans l'historique.

**Solution : questionnaire standard**

C'est exactement un questionnaire Likert à 6 questions × 4 options (0/1/2/3).  
Les options SONT identiques pour toutes les questions → aucune extension nécessaire.

*`scaleScoring.ts` :*  
```ts
medication_side_effects: {
  formula: 'sum', items_count: 6, score_decimals: 0,
  chips: ['chip_sedation', 'chip_akathisia', 'chip_tremors', 'chip_dry_mouth', 'chip_sleep', 'chip_nausea'],
  computeScore: sum,
  computeSubscaleScores: (answers) => ({
    sedation: answers[0] ?? 0,
    akathisia: answers[1] ?? 0,
    tremors:   answers[2] ?? 0,
    dry_mouth: answers[3] ?? 0,
    sleep:     answers[4] ?? 0,
    nausea:    answers[5] ?? 0,
  }),
}
```

*`ScaleHistoryScreen.tsx` — ajouter dans `CHIP_KEY_TO_SUBSCALE` :*  
```ts
medication_side_effects: {
  chip_sedation: 'sedation', chip_akathisia: 'akathisia', chip_tremors: 'tremors',
  chip_dry_mouth: 'dry_mouth', chip_sleep: 'sleep', chip_nausea: 'nausea',
},
```

*Supabase — insérer les champs :*  
`scale_instruction` + 4 `scale_option` (0/1/2/3 avec libellés) + 6 `scale_question` dans l'ordre.  
`preview_kind = 'questionnaire'` sur le module.

*Migration SQLite, nettoyage CUSTOM_ROUTES, AppStack, delete fichier* — même pattern que EPDS.

---

### 4. `medication_adherence` → voir **section 7 (complété)** ci-dessous

L'approche questionnaire générique (`ScaleEntryScreen`) a été abandonnée au profit d'un layout dédié `daily_checkin` qui gère la contrainte `UNIQUE(module_id, date)`, les onglets Aujourd'hui/Historique et le signal `logEvent`.

---

### 5. `mood_tracker` — Questionnaire 4 sliders 1–10

**Fonctionnel**  
4 dimensions quotidiennes : humeur, énergie, anxiété, plaisir (chacune 1–10).  
Historique 30j avec sparklines (visualisation graphique des tendances).  
Notes libres. Affichage historique avec 4 valeurs par entrée.

**Solution : questionnaire 4 items avec widget slider**

*Extension `QuestionnaireLayout` — nouveau field_type `scale_slider_question` :*  
Props sur le champ : `min` (ex. `"1"`), `max` (ex. `"10"`), `step` (ex. `"1"`).  
Rend un slider natif React Native (`@react-native-community/slider` ou implémentation maison).  
Valeur stockée dans `answers[]` comme un entier 1–10.

*`scaleScoring.ts` :*  
```ts
mood_tracker: {
  formula: 'sum', items_count: 4, score_decimals: 0,
  chips: ['chip_mood', 'chip_energy', 'chip_anxiety', 'chip_pleasure'],
  computeScore: (answers) => Math.round(answers.reduce<number>((s, a) => s + (a ?? 0), 0) / 4),
  computeSubscaleScores: (answers) => ({
    mood: answers[0] ?? 0, energy: answers[1] ?? 0,
    anxiety: answers[2] ?? 0, pleasure: answers[3] ?? 0,
  }),
}
```

Note : les sparklines 30j de l'écran actuel ne seront PAS reproduites dans `ScaleHistoryScreen` (trop spécifique). L'historique affichera les 4 chips par entrée. C'est un compromis accepté.

*Même pattern de migration* que EPDS (SQLite, CUSTOM_ROUTES, AppStack, delete).

---

### 6. `crisis_plan` — Document éditable 6 étapes (nouveau layout)

**Fonctionnel**  
Plan de crise (Safety Plan — Stanley & Brown 2012).  
6 étapes fixes : signes avant-coureurs / stratégies / contacts de soutien / contacts pairs / professionnels de santé / sécurisation de l'environnement.  
Chaque étape est un accordéon avec une liste d'items éditables (ajout / édition / suppression inline).  
Données persistées en SQLite, boutons urgence 15/3114 en pied de page.

**Solution : nouveau `preview_kind: 'editable_steps'` + `EditableStepsLayout`**

Ce layout est plus complexe que les autres car il gère un état mutable persisté.

*Nouveau `preview_kind` : `editable_steps`*

*`EditableStepsLayout` dans `FieldRenderer.tsx` :*  
- Reçoit `sections: Map<section_id, ContentField[]>` (chaque section = une étape)
- Chaque section contient un `step_title` (titre de l'étape) et optionnellement un `step_hint` (description)
- État local : `items: Record<section_id, string[]>` chargé depuis SQLite au mount
- Rendu : accordéon par section, liste d'items texte éditables inline, bouton "+ Ajouter"
- Persistance : `saveCrisisPlanItems(sectionId, items[])` → SQLite

*Table SQLite générique `plan_items` à créer dans `database.ts` :*  
```sql
CREATE TABLE IF NOT EXISTS plan_items (
  id         TEXT PRIMARY KEY,
  module_id  TEXT NOT NULL,   -- ex. 'crisis_plan'
  section_id TEXT NOT NULL,   -- ex. 'crisis.sec_signs'
  text       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
```
→ Remplace la table `crisis_plan_items` existante. Migration : `INSERT OR IGNORE INTO plan_items SELECT id, 'crisis_plan', step, text, 0 FROM crisis_plan_items`.

*Boutons urgence :* présents en tant que champs `exercise_safety` (déjà supporté par `ExerciseSafetySection` dans `GuidedExerciseLayout`). Ajouter la même logique à `EditableStepsLayout`.

*Supabase — structure pour crisis_plan :*  
```
crisis.sec_signs:   step_title 'modules.crisis_plan.step_signs_title'
crisis.sec_skills:  step_title 'modules.crisis_plan.step_skills_title'
crisis.sec_support: step_title 'modules.crisis_plan.step_support_title'
crisis.sec_peers:   step_title 'modules.crisis_plan.step_peers_title'
crisis.sec_pros:    step_title 'modules.crisis_plan.step_pros_title'
crisis.sec_safety:  step_title 'modules.crisis_plan.step_safety_title'
+ exercise_safety fields (3114, 15) sans section_id
```

---

### 7 (complété). `medication_adherence` — Saisie quotidienne + historique

**Fonctionnel**
1 saisie par jour : statut (Pris / Partiellement / Non pris) + notes libres optionnelles.
Historique 30j avec badges couleur. Signal `logEvent('SAVE_MEDICATION_ADHERENCE')` côté Supabase.

**Solution : `preview_kind: 'daily_checkin'` + `DailyCheckinLayout`**

Layout auto-suffisant à 2 onglets internes : `today | history`. KeyboardAvoidingView + scroll interne + footer fixe.

*`field_types` configurables depuis Supabase :*
- `daily_checkin_config` — props : `engagement_event_type` (string `EngagementEventType`)
- `daily_status_option` (multiple, sortés par `sort_order`) — props : `value`, `icon` (MaterialCommunityIcons), `color`, `bg_color`
- `daily_question`, `daily_today_label`, `daily_already_saved_label`
- `daily_tab_today_label`, `daily_tab_history_label`
- `daily_notes_label`, `daily_notes_placeholder`
- `daily_save_label`, `daily_update_label`
- `daily_history_empty_text`
- `daily_status_missing_title`, `daily_status_missing_msg`
- `daily_delete_title`, `daily_saved_message`

*SQLite — nouvelle table générique `daily_entries` :*
```sql
CREATE TABLE IF NOT EXISTS daily_entries (
  id         TEXT PRIMARY KEY,
  module_id  TEXT NOT NULL,
  date       TEXT NOT NULL,
  status     TEXT,
  notes      TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(module_id, date)
);
```
Pattern UPSERT via `ON CONFLICT(module_id, date) DO UPDATE`. Migration depuis `medication_adherence_entries` au boot (`createMedicationAdherenceTable` conservée comme source).

*`ModuleContentScreen.tsx` :* ajouté à la branche `flex:1` (le layout gère son propre `KeyboardAvoidingView` + scroll + footer fixe).

*Tests :* `FieldRenderer.daily_checkin.test.tsx` — 10 tests (chargement, onglets, validation manquante, save + logEvent, pré-remplissage, historique, suppression).

---

### 8 (complété). `beck_columns` — Formulaire à colonnes hétérogènes

**Fonctionnel**
5 colonnes TCC (Beck, Rush, Shaw & Emery 1979) : Situation / Émotion+intensité / Pensée automatique+belief / Réponse rationnelle / Résultat (intensité+belief).
Liste d'enregistrements + édition + suppression + nouveau formulaire. Signal `logEvent('SAVE_BECK_THOUGHT_RECORD')` côté Supabase à la création (jamais à l'édition).

**Solution : `preview_kind: 'column_form'` + `ColumnFormLayout`**

Layout auto-suffisant à 2 modes internes : `list | entry`. Mode liste = cartes avec aperçu des champs texte annotés par leur slider de la colonne (ex. « je suis nul (80%) »). Mode entry = sections empilées avec accent coloré, badge step_number, hint, et widgets enfants. KeyboardAvoidingView en mode entry, footer fixe (Annuler / Enregistrer).

*`field_types` configurables depuis Supabase :*
- `column_form_config` — props : `engagement_event_type`, `required_keys_any` (CSV de clés logiques dont au moins une doit être non vide pour valider)
- `column_header` (1 par section) — text_code (titre) ; props : `color` (accent), `step_number`, `hint_code` (clé i18n du sous-titre)
- `column_text_field` (enfant via `parent_field_id`) — text_code (placeholder) ; props : `key` (clé logique JSON), `multiline` ('1'/'0'), `min_height`
- `column_slider_field` (enfant via `parent_field_id`) — text_code (label) ; props : `key`, `min`, `max`, `step`, `color`
- UI labels (sans section) : `column_form_save_label`, `column_form_new_btn_label`, `column_form_empty_title`, `column_form_empty_text`, `column_form_delete_title`, `column_form_validation_title`, `column_form_validation_msg`

*SQLite — nouvelle table générique `form_entries` :*
```sql
CREATE TABLE IF NOT EXISTS form_entries (
  id         TEXT PRIMARY KEY,
  module_id  TEXT NOT NULL,
  values     TEXT NOT NULL,  -- JSON Record<key, string|number>
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```
Migration depuis `beck_thought_records` au boot via `json_object(...)` SQLite. `createBeckColumnsTable` conservée comme source.

*`ModuleContentScreen.tsx` :* ajouté à la branche `flex:1` (le layout gère son propre `KeyboardAvoidingView` + scroll + footer fixe).

*Tests :* `FieldRenderer.column_form.test.tsx` — 10 tests (chargement, état vide, liste, passage en entry, rendu enfants, validation manquante, save + logEvent, édition sans logEvent, annulation, suppression).

---

### 9 (complété). `cognitive_saturation` — Timer + tapotements + historique

**Solution : `preview_kind: 'timed_tap_exercise'` + `TimedTapExerciseLayout`**

Layout auto-suffisant à 4 modes internes : `history → input → exercise → done`. Aucune navigation externe.

*`field_types` configurables depuis Supabase :*
- `timed_tap_config` — props : `duration_seconds` (défaut 90), `max_word_length` (défaut 40), `vibration_ms` (défaut 30)
- `timed_tap_intro_text`, `timed_tap_input_title`, `timed_tap_input_hint`, `timed_tap_input_placeholder`
- `timed_tap_how_title`, `timed_tap_how_body` (interpole `{{seconds}}` depuis config)
- `timed_tap_tap_hint`, `timed_tap_rep_label`
- `timed_tap_done_title`, `timed_tap_done_text`, `timed_tap_rep_stat_label`, `timed_tap_duration_stat_label`
- `timed_tap_start_btn`, `timed_tap_history_label` (interpole `{{count}}`), `timed_tap_empty_title`, `timed_tap_empty_text`, `timed_tap_delete_label`

*SQLite :* réutilise `cognitive_saturation_sessions` existant — aucune migration nécessaire.

*`ModuleContentScreen.tsx` :* ajouté à la branche `flex:1` (pas de ScrollView externe).

*Tests :* `FieldRenderer.timed_tap_exercise.test.tsx` — 23 tests (tous les modes + config via props).

---

## Vision architecturale — Règle d'extension du moteur

> **Principe (révisé) :** tout module peut être migré. La limite n'est pas l'architecture, c'est le temps d'investissement.

Le moteur est extensible à volonté via deux mécanismes :

1. **Nouveau `preview_kind`** → nouveau layout dans `FieldRenderer.tsx`. Le layout reçoit `fields: ContentField[]` et gère son propre état interne (modes, timers, SQLite…). Exemples existants : `editable_steps` (état mutable persisté), `timed_tap_exercise` (timer + vibration + 4 modes internes).

2. **`parent_field_id`** → relation parent/enfant entre champs. Exemples d'usage :
   - Options per-question (EPDS) : `scale_option` enfant d'un `scale_question`
   - Colonnes hétérogènes (beck_columns à venir) : champs de type variable enfants d'une `column_header`
   - Niveaux hiérarchiques (emotion_wheel à venir) : émotions enfants de leur parent

**Seule contrainte réelle : MDR 2017/745.**  
Un layout qui *interprète* les données (affiche une conclusion, déclenche une action selon le score) requalifie l'app en Dispositif Médical. Un layout qui *affiche* et *collecte* sans conclure reste conforme.  
→ Aucun module ne tombe dans cette catégorie : tous les calculs affichés (totaux, moyennes, ratios, jauges) sont des synthèses arithmétiques des saisies du patient, sans seuil clinique ni label interprétatif.

---

## Analyse des modules restants

### Planifiés (effort estimé S/M/L/XL)

_Plus aucun module restant à migrer — tous les modules thérapeutiques fonctionnels ont été migrés vers le moteur générique. Seul `decisional_balance` reste custom pour des raisons de conformité MDR (jauge interprétative)._

### Conservé custom — contrainte non-technique

_Aucun module restant custom pour des raisons MDR. La jauge de `decisional_balance` initialement marquée comme « interprétative » s'est révélée être en réalité une simple synthèse arithmétique des poids saisis par le patient (`Σ(pros_change.weight) / [Σ(pros_change.weight) + Σ(pros_status_quo.weight)]`), de même nature que les scores totaux affichés par PHQ-9, GAD-7 ou mood_tracker — déjà migrés. Aucun seuil clinique, aucune comparaison à une norme : la barre affiche un ratio brut, pas un diagnostic. La migration a remplacé la justification fragile « ❌ MDR » par une migration propre vers le moteur générique._

---

## Ordre de migration recommandé

Modules déjà migrés (barrés) — restants classés par effort croissant :

1. ~~`medication_side_effects`~~ ✅
2. ~~`epds`~~ ✅
3. ~~`nsi`~~ ✅
4. ~~`mood_tracker`~~ ✅
5. ~~`crisis_plan`~~ ✅
6. ~~`cognitive_saturation`~~ ✅
7. ~~`medication_adherence`~~ ✅ (layout `daily_checkin`, table SQLite générique `daily_entries`)
8. ~~`beck_columns`~~ ✅ (layout `column_form`, table SQLite générique `form_entries`)
9. ~~`emotion_wheel`~~ ✅ (layout `tree_selector`, arbre 3 niveaux via `parent_field_id`, table SQLite générique `tree_selections`)
10. ~~`sleep_diary`~~ ✅ (layout `sleep_journal`, 3 modes internes list/entry/month, time pickers natifs, grille calendrier, table SQLite dédiée `sleep_diary_entries`)
11. ~~`behavioral_activation`~~ ✅ (layout `activity_log`, 3 modes internes list/entry/month, suggestions chips, 2 sliders P/M, calendrier dots done/planned, table SQLite dédiée `activity_records`)
12. ~~`fear_thermometer`~~ ✅ (layout `exposure_tracker`, tabs Saisies/Situations + mode entry SUDs avant/après, catalogue de situations + texte libre, stratégies DB-driven, tables SQLite existantes `fear_entries` + `fear_situations`)
13. ~~`decisional_balance`~~ ✅ (layout `decision_grid`, grille 2×2 + items pondérés 1–5 étoiles + jauge motivation, `plan_items.weight` + `module_settings`, sous-composant `EditableItemsList` partagé avec `editable_steps`)

Pour chaque migration :
1. Lire le(s) fichier(s) écran actuel(s) pour extraire TOUTES les clés i18n et la structure SQLite
2. Concevoir la structure de champs Supabase (`module_content_fields` + `field_props`) et les `field_type` nécessaires
3. Insérer les champs dans Supabase (MCP)
4. Ajouter le nouveau layout dans `FieldRenderer.tsx` (nouveau `preview_kind`)
5. Modifier `database.ts` si nouvelles tables SQLite requises (ou migration depuis l'ancienne)
6. Modifier `ModuleContentScreen.tsx` si le layout gère son propre scroll (ajouter à la branche `flex:1`)
7. Retirer de `CUSTOM_ROUTES` + `AppStack.tsx`
8. Supprimer les fichiers custom + tests anciens
9. Écrire `FieldRenderer.<preview_kind>.test.tsx` (pattern : `FieldRenderer.editable_steps.test.tsx`)
10. Vérifier `npx tsc --noEmit` → zéro erreur
11. Mettre à jour le tableau de suivi ci-dessus

---

## Migrations planifiées — Détail technique

---

### 8. `beck_columns` — Formulaire à colonnes hétérogènes (M)

**Fonctionnel**
5 colonnes TCC : Situation (texte) / Émotions+intensité (texte + slider 0–10) / Pensées automatiques (texte) / Distorsions (texte) / Pensée alternative (texte).
Historique des enregistrements. Ajout / suppression.

**`preview_kind: 'column_form'`**

*Layout `ColumnFormLayout`*

- Lit les sections Supabase : chaque `section_id` = une colonne.
- Chaque colonne contient une `column_header` (titre) + des champs enfants via `parent_field_id` qui définissent le type de widget : `column_text_field`, `column_slider_field` (props : `min`, `max`), `column_select_field` (options enfants).
- État : `values: Record<field_id, string | number>`.
- Persistance : table SQLite `form_entries (id, module_id, values TEXT JSON, created_at)`.
- Historique : liste des entrées passées en accordéon (comme `CardsLayout`).

*SQLite — nouvelle table générique `form_entries` :*
```sql
CREATE TABLE IF NOT EXISTS form_entries (
  id         TEXT PRIMARY KEY,
  module_id  TEXT NOT NULL,
  values     TEXT NOT NULL,  -- JSON Record<field_id, string|number>
  created_at TEXT NOT NULL
);
```

---

### 9 (complété). `emotion_wheel` — Sélecteur hiérarchique d'émotions

**Fonctionnel**
Sélection d'une émotion en 3 niveaux (Plutchik 1980) : primaire (8) → secondaire (3 par primaire = 24) → spécifique (3 par secondaire = 72). Intensité brute 1–10 et notes libres optionnelles. Historique chronologique avec suppression. Conformité MDR : aucune interprétation, valeurs brutes uniquement.

**Solution : `preview_kind: 'tree_selector'` + `TreeSelectorLayout`**

Layout auto-suffisant à 4 modes internes : `history → selection → intensity → notes`. Aucune navigation externe. Le mode `selection` itère N niveaux selon la profondeur de l'arbre — sélectionner un noeud avec enfants descend d'un niveau, sélectionner une feuille passe à l'étape `intensity` (ou `notes` ou save direct selon la config). La couleur courante est héritée du noeud le plus profond ayant un `color` (en général la primaire).

*`field_types` configurables depuis Supabase :*
- `tree_selector_config` — props : `enable_intensity` ('1'|'0'), `intensity_min` (défaut '1'), `intensity_max` (défaut '10'), `enable_notes` ('1'|'0')
- `tree_node` (multiple, hiérarchique via `parent_field_id`) — props : `color`, `icon` (MaterialCommunityIcons name) ; généralement portés par les noeuds racine
- UI labels (sans section) : `tree_selector_intro`, `tree_selector_step_1_title`, `tree_selector_step_1_hint`, `tree_selector_step_2_hint`, `tree_selector_step_3_title`, `tree_selector_step_3_hint`, `tree_selector_intensity_title`, `tree_selector_intensity_hint`, `tree_selector_notes_title`, `tree_selector_notes_hint`, `tree_selector_notes_placeholder`, `tree_selector_continue_btn`, `tree_selector_save_btn`, `tree_selector_new_btn`, `tree_selector_history_label`, `tree_selector_empty_title`, `tree_selector_empty_text`, `tree_selector_delete_title`

*SQLite — nouvelle table générique `tree_selections` :*
```sql
CREATE TABLE IF NOT EXISTS tree_selections (
  id              TEXT PRIMARY KEY,
  module_id       TEXT NOT NULL,
  selected_id     TEXT NOT NULL,
  selected_label  TEXT,
  path_json       TEXT NOT NULL,  -- JSON [{ id, text_code?, label?, color?, icon? }, …]
  intensity       INTEGER,
  notes           TEXT,
  created_at      TEXT DEFAULT CURRENT_TIMESTAMP
);
```
Migration depuis `emotion_entries` au boot (les labels copiés directement dans `path_json` puisque les anciennes lignes stockaient les libellés et non des clés i18n). `createEmotionEntriesTable` conservée comme source.

*`ModuleContentScreen.tsx` :* ajouté à la branche `flex:1` (le layout gère son propre scroll + `KeyboardAvoidingView` en mode notes).

*Tests :* `FieldRenderer.tree_selector.test.tsx` — 11 tests (chargement, état vide, liste, descente dans l'arbre, intensité, transition vers notes, save complet, annulation, suppression).

---

### 10 (complété). `sleep_diary` — Journal de sommeil + time pickers + calendrier mensuel

**Fonctionnel**
Saisie quotidienne d'une nuit : heure de coucher / lever, temps d'endormissement, nombre & durée des réveils, cauchemars, qualité (étoiles 1-5), notes libres. Calcul live de l'efficacité du sommeil (TST/TPL). Liste des 14 dernières nuits avec aperçu durée + étoiles. Vue mensuelle avec calendrier coloré par qualité, badges cauchemar, et 4 statistiques agrégées (durée moyenne, réveils moyens, nuits saisies, cauchemars). Conformité MDR : aucun seuil interprétatif, valeurs brutes uniquement, palette couleurs = convention d'affichage des étoiles saisies.

**Solution : `preview_kind: 'sleep_journal'` + `SleepJournalLayout`**

Layout auto-suffisant à 3 modes internes : `list → entry → month`. Aucune navigation externe. Mode `entry` utilise `KeyboardAvoidingView` + `DateTimePicker` natif (`@react-native-community/datetimepicker`). Mode `month` réutilise la grille calendrier de l'écran custom.

*`field_types` configurables depuis Supabase :*
- `sleep_journal_config` — props : `history_days` (défaut 14), `awakenings_max` (20), `onset_max_minutes` (180), `awak_duration_max_minutes` (300), `efficiency_good` (85), `efficiency_warning` (70), `quality_max` (5), `quality_good_threshold` (4), `quality_avg_threshold` (3)
- UI labels (sans section) : `sleep_journal_cta_title`, `sleep_journal_monthly_button_label`, `sleep_journal_list_header`, `sleep_journal_incomplete_label`, `sleep_journal_empty_day_label`, `sleep_journal_section_schedule_title`, `sleep_journal_section_awakenings_title`, `sleep_journal_section_nightmares_title`, `sleep_journal_section_quality_title`, `sleep_journal_section_notes_title`, `sleep_journal_bedtime_label`, `sleep_journal_wake_time_label`, `sleep_journal_onset_label`, `sleep_journal_awakenings_label`, `sleep_journal_awakenings_duration_label`, `sleep_journal_nightmares_label`, `sleep_journal_quality_label`, `sleep_journal_quality_label_1`…`_5`, `sleep_journal_quality_missing_title`, `sleep_journal_quality_missing_msg`, `sleep_journal_efficiency_label`, `sleep_journal_date_label`, `sleep_journal_save_label`, `sleep_journal_update_label`, `sleep_journal_delete_label`, `sleep_journal_delete_title`, `sleep_journal_notes_placeholder`, `sleep_journal_minutes_unit`, `sleep_journal_tap_to_modify_hint`, `sleep_journal_confirm_label`, `sleep_journal_back_label`, `sleep_journal_month_summary_title`, `sleep_journal_legend_title`, `sleep_journal_legend_good_label`, `sleep_journal_legend_average_label`, `sleep_journal_legend_bad_label`, `sleep_journal_legend_empty_label`, `sleep_journal_legend_nightmare_label`, `sleep_journal_stat_avg_duration_label`, `sleep_journal_stat_avg_awakenings_label`, `sleep_journal_stat_nights_filled_label`, `sleep_journal_stat_nightmares_label`

*SQLite :* réutilise `sleep_diary_entries` existant (UNIQUE par date) — aucune migration nécessaire. La structure de la table couvrait déjà toutes les valeurs (`bedtime`, `wake_time`, `sleep_onset_minutes`, `awakenings`, `awakenings_duration_minutes`, `nightmares`, `quality`, `notes`).

*Supabase (schema.sql) :*
- `UPDATE modules SET preview_kind = 'sleep_journal' WHERE id = 'sleep_diary'`
- Suppression des anciens widget_type props `sleep.field_1`–`sleep.field_8` (preview_kind 'fields' obsolète) avant insertion des nouveaux `sj.*` champs.

*`ModuleContentScreen.tsx` :* ajouté à la branche `flex:1` (le layout gère son propre scroll + `KeyboardAvoidingView` en mode entry).

*Tests :* `FieldRenderer.sleep_journal.test.tsx` — 12 tests (chargement, liste 14 jours, ouverture entry, pré-remplissage entrée existante, calcul SE live, validation qualité manquante, save nouveau, save avec cauchemars, compteur awakenings, mode month, navigation month, suppression).

---

### 11 (complété). `behavioral_activation` — Journal d'activités plaisir/maîtrise + calendrier mensuel

**Fonctionnel**
Planification ou enregistrement d'activités, chacune notée selon deux dimensions brutes Plaisir (0–10) et Maîtrise (0–10), avec un statut « réalisée / planifiée », une date libre (passée ou future) et des notes optionnelles. Liste groupée par date avec toggle done en place. Vue mensuelle avec calendrier coloré (points verts = réalisée, bleus = planifiée), légende et filtre par jour sélectionné. Conformité MDR 2017/745 : aucune interprétation, aucun seuil, aucun score agrégé — les couleurs des points = convention d'affichage des statuts saisis.

**Solution : `preview_kind: 'activity_log'` + `ActivityLogLayout`**

Layout auto-suffisant à 3 modes internes : `list → entry → month`. Aucune navigation externe. Mode `entry` utilise `KeyboardAvoidingView` + `DateTimePicker` natif (`@react-native-community/datetimepicker`) + suggestions horizontales (chips configurables depuis Supabase). Mode `month` réutilise une grille calendrier avec points colorés `done/planned`. Signal `logEvent('SAVE_BEHAVIORAL_ACTIVATION')` côté Supabase à la création seulement (jamais à l'édition).

*`field_types` configurables depuis Supabase :*
- `activity_log_config` — props : `engagement_event_type`, `pleasure_min` (0), `pleasure_max` (10), `pleasure_step` (1), `mastery_min` (0), `mastery_max` (10), `mastery_step` (1), `pleasure_color` (#059669), `mastery_color` (#4F46E5), `dot_done_color` (#10B981), `dot_planned_color` (#3B82F6), `locale` (fr-FR)
- `activity_log_suggestion` (multiple, sortés par `sort_order`) — text_code = clé i18n du label de la suggestion (ex. `modules.behavioral_activation.suggestion_walk`)
- UI labels (sans section) : `activity_log_tab_list_label`, `activity_log_tab_month_label`, `activity_log_add_btn`, `activity_log_empty_title`, `activity_log_empty_text`, `activity_log_section_activity_title`, `activity_log_section_evaluation_title`, `activity_log_section_notes_title`, `activity_log_activity_placeholder`, `activity_log_pleasure_label`, `activity_log_pleasure_sublabel`, `activity_log_mastery_label`, `activity_log_mastery_sublabel`, `activity_log_done_label`, `activity_log_mark_done_label`, `activity_log_mark_undone_label`, `activity_log_notes_placeholder`, `activity_log_date_label`, `activity_log_date_confirm_label`, `activity_log_save_label`, `activity_log_update_label`, `activity_log_delete_label`, `activity_log_delete_title`, `activity_log_name_missing_title`, `activity_log_name_missing_msg`, `activity_log_legend_done_label`, `activity_log_legend_planned_label`, `activity_log_month_hint_tap`, `activity_log_month_hint_empty`, `activity_log_back_label`

*SQLite :* réutilise `activity_records` existant — aucune migration nécessaire. La structure couvrait déjà toutes les valeurs (`date`, `label`, `pleasure`, `mastery`, `done`, `notes`).

*Supabase (schema.sql) :*
- `UPDATE modules SET preview_kind = 'activity_log' WHERE id = 'behavioral_activation'`
- Suppression des anciens `widget_type` props `ba.field_1`–`ba.field_6` (preview_kind 'fields' obsolète) avant insertion des nouveaux `al.*` champs.

*`ModuleContentScreen.tsx` :* ajouté à la branche `flex:1` (le layout gère son propre scroll + `KeyboardAvoidingView` en mode entry).

*Tests :* `FieldRenderer.activity_log.test.tsx` — 12 tests (chargement état vide, liste groupée, passage en entry, validation nom manquant, save + logEvent, toggle done depuis entry, pré-remplissage édition, édition sans logEvent, toggle done depuis liste, mode month + navigation, suppression depuis entry, suppression depuis liste).

---

### 12 (complété). `fear_thermometer` — Mesure SUDS avant/après + catalogue de situations + stratégies de coping

**Fonctionnel**
Mesure de la détresse subjective (SUDS, Subjective Units of Distress Scale, Wolpe 1969) sur une échelle brute 0–100 avant et après une situation anxiogène. Chaque saisie est rattachée à une situation déclenchante (choisie dans un catalogue personnel ou en texte libre), enrichie d'une liste de stratégies de coping (Respiration / Ancrage / Mouvement / Exposition / Distraction / Contact, plus texte libre) et de notes optionnelles. Le SUDS après est nullable — le patient peut différer la saisie. Liste des entries, panneau de gestion du catalogue de situations. Conformité MDR 2017/745 : SUDS bruts uniquement, aucun seuil, aucune interprétation. Les couleurs avant (rouge) / après (vert) = convention d'affichage de l'ordre temporel saisi.

**Solution : `preview_kind: 'exposure_tracker'` + `ExposureTrackerLayout`**

Layout auto-suffisant à 3 modes internes : `list → entry`, plus deux tabs au sein du mode `list` (`Saisies` / `Situations`). Aucune navigation externe. Mode `entry` utilise `KeyboardAvoidingView` + 2 `PipPicker` pour SUDS avant/après (variant `numbered`, 0–100 step 10). Le tab `Situations` héberge un panneau de gestion du catalogue (input + liste avec delete). Signal `logEvent('SAVE_FEAR_ENTRY')` côté Supabase à la création seulement (jamais à l'édition).

*`field_types` configurables depuis Supabase :*
- `exposure_tracker_config` — props : `engagement_event_type`, `suds_min` (0), `suds_max` (100), `suds_step` (10), `suds_default_before` (50), `suds_before_color` (#EF4444), `suds_after_color` (#059669)
- `exposure_tracker_strategy` (multiple, sortés par `sort_order`) — text_code = clé i18n du label, le `field.id` sert de clé stockée dans le JSON `strategies` côté SQLite (ex. `et.strategy_breathing`)
- UI labels (sans section) : `exposure_tracker_tab_entries_label`, `exposure_tracker_tab_situations_label`, `exposure_tracker_add_btn`, `exposure_tracker_empty_title`, `exposure_tracker_empty_text`, `exposure_tracker_section_trigger_title`, `exposure_tracker_section_before_title`, `exposure_tracker_section_strategies_title`, `exposure_tracker_section_after_title`, `exposure_tracker_section_notes_title`, `exposure_tracker_situation_mode_catalogue`, `exposure_tracker_situation_mode_free`, `exposure_tracker_situation_free_placeholder`, `exposure_tracker_situation_catalogue_empty`, `exposure_tracker_suds_before_label`, `exposure_tracker_suds_before_hint`, `exposure_tracker_suds_after_label`, `exposure_tracker_suds_after_hint`, `exposure_tracker_suds_skip_null`, `exposure_tracker_suds_skip_later`, `exposure_tracker_strategies_hint`, `exposure_tracker_strategy_custom_placeholder`, `exposure_tracker_notes_placeholder`, `exposure_tracker_save_label`, `exposure_tracker_update_label`, `exposure_tracker_delete_label`, `exposure_tracker_back_label`, `exposure_tracker_situation_missing_title`, `exposure_tracker_situation_missing_msg`, `exposure_tracker_delete_entry_title`, `exposure_tracker_situation_delete_title`, `exposure_tracker_situations_panel_title`, `exposure_tracker_situations_panel_hint`, `exposure_tracker_situation_placeholder`, `exposure_tracker_situation_empty`

*SQLite :* réutilise `fear_entries` et `fear_situations` existants — aucune migration nécessaire. La structure couvrait déjà toutes les valeurs. Le champ `strategies` (JSON) bascule en douceur de `selected: CopingStrategy[]` (legacy : labels FR codés en dur) vers `selected: string[]` (nouvelles entries : field IDs `et.strategy_*`). Le rendu fait `strategyLabelByKey.get(key) ?? key` — les anciennes entries continuent d'afficher leurs labels bruts ; les nouvelles entries voient leurs chips i18n-isées.

*Supabase (schema.sql) :*
- `UPDATE modules SET preview_kind = 'exposure_tracker' WHERE id = 'fear_thermometer'`
- Suppression des anciens `widget_type` props `ft.field_1`–`ft.field_5` (preview_kind 'fields' obsolète) avant insertion des nouveaux `et.*` champs.

*`ModuleContentScreen.tsx` :* ajouté à la branche `flex:1` (le layout gère son propre scroll + `KeyboardAvoidingView` en mode entry).

*Nettoyage :* suppression de `FearThermometerScreen.tsx`, `FearEntryScreen.tsx`, `FearThermometerScreen.test.tsx` ; retrait des entrées `fear_thermometer` de `CUSTOM_ROUTES` (HomeScreen) ; retrait des routes `FearThermometer` et `FearEntry` d'`AppStack`.

*Tests :* `FieldRenderer.exposure_tracker.test.tsx` — 13 tests (chargement état vide, liste, passage en entry, validation situation manquante, save texte libre + logEvent, save situation catalogue, toggle stratégie persistée dans JSON, pré-remplissage édition, édition sans logEvent, suppression depuis liste, suppression depuis entry, ajout situation depuis panneau, suppression situation depuis panneau).

---

### 13 (complété). `decisional_balance` — Grille 2×2 + items pondérés + jauge motivation

**Fonctionnel**
Balance décisionnelle (Janis & Mann 1977 — Motivational Interviewing). 4 quadrants en grille 2×2 : Avantages du changement / Inconvénients du changement / Avantages à rester comme je suis / Inconvénients à rester comme je suis. Chaque quadrant contient un nombre variable d'arguments saisis par le patient, chacun pondéré sur une échelle de 1 à 5 étoiles. Un champ texte « comportement ciblé » en tête. Une jauge horizontale en pied calcule un ratio brut entre les sommes pondérées des « pros_change » (côté changement) et des « pros_status_quo » (côté statu quo). Conformité MDR 2017/745 : ratio arithmétique pur, sans seuil clinique, sans label interprétatif — de même nature que le score total d'un PHQ-9 ou la moyenne d'un mood_tracker.

**Solution : `preview_kind: 'decision_grid'` + `DecisionGridLayout`**

Layout auto-suffisant rendu en grille 2×2 + jauge en pied + champ texte top-level + bouton Sauvegarder fixe. Réutilise le sous-composant `EditableItemsList` (partagé avec `editable_steps` via `layouts/shared/`) pour gérer la liste d'items de chaque quadrant. Le `WeightPicker` (1..N étoiles) est aussi extrait pour réemploi futur.

*Sous-composant partagé `EditableItemsList<TItem extends EditableItem>` (`layouts/shared/`) :*
- Props : `items`, `accentColor`, `weightConfig: { min, max, defaultValue, label } | null`, `addLabel`, `placeholder`, `onAdd(text, weight)`, `onEdit(item, text, weight)`, `onDelete(item)`, `testIdPrefix`
- Quand `weightConfig` est null, comportement identique à l'ancien EditableStepsLayout (texte seul). Quand défini, un `WeightPicker` apparaît dans les formulaires d'ajout/édition + sous chaque item rendu (tap direct = save inline).
- Utilisé par `EditableStepsLayout` (sans poids) et `DecisionGridLayout` (avec poids 1–5 étoiles).

*`field_types` configurables depuis Supabase :*
- `decision_grid_config` — props : `engagement_event_type`, `target_behavior_key` (clé du module_settings, défaut 'target_behavior'), `weight_min` (1), `weight_max` (5), `weight_default` (3), `gauge_fill_color` (#EC4899)
- `column_header` (réutilisé) — un par quadrant, sortés par `sort_order`. Props étendus : `color` (accent), `bg_color` (background du header, nouveau), `icon` (MaterialCommunityIcons, nouveau), `gauge_role` ('change' | 'status_quo' | absent → ignoré dans la jauge, nouveau), `subtitle_code` (clé i18n du sous-titre, nouveau)
- UI labels (sans section) : `decision_grid_target_label`, `decision_grid_target_placeholder`, `decision_grid_save_label`, `decision_grid_saved_message`, `decision_grid_gauge_title`, `decision_grid_gauge_change_label`, `decision_grid_gauge_status_label`, `decision_grid_add_label`, `decision_grid_arg_placeholder`, `decision_grid_weight_label`

*SQLite — extension de `plan_items` + nouvelle table `module_settings` :*
```sql
ALTER TABLE plan_items ADD COLUMN weight INTEGER;  -- nullable, ignoré pour crisis_plan

CREATE TABLE IF NOT EXISTS module_settings (
  module_id  TEXT NOT NULL,
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (module_id, key)
);
```
Migration depuis `decisional_balance` au boot : décompresse les 4 JSON arrays via `json_each` en lignes `plan_items` (une par argument, avec `weight`), copie `target_behavior` dans `module_settings`. La table legacy `decisional_balance` est conservée comme source de migration mais n'est plus écrite.

*Calcul de la jauge (pur, dans `DecisionGridLayout`) :*
```
changeScore     = Σ items.weight pour chaque quadrant avec gauge_role='change'
statusQuoScore  = Σ items.weight pour chaque quadrant avec gauge_role='status_quo'
motivation%     = total === 0 ? 50 : round(changeScore / total × 100)
```
Pour `decisional_balance`, seuls `pros_change` (gauge_role=change) et `pros_status_quo` (gauge_role=status_quo) contribuent. Les `cons_*` n'ont pas de `gauge_role` et sont ignorés dans la jauge — comportement identique à l'écran custom précédent.

*Supabase (schema.sql) :*
- `UPDATE modules SET preview_kind = 'decision_grid' WHERE id = 'decisional_balance'` (était `'grid2x2'`)
- Suppression des champs `db.*` éventuels avant insertion (idempotent)
- 4 `column_header` (un par quadrant) avec leurs props (color, bg_color, icon, subtitle_code, gauge_role pour 2 d'entre eux)

*`ModuleContentScreen.tsx` :* ajouté à la branche `flex:1` (le layout gère son propre scroll + `KeyboardAvoidingView` en mode entry).

*Nettoyage :* suppression de `DecisionalBalanceScreen.tsx` et `DecisionalBalance.test.ts` ; retrait de l'entrée `decisional_balance` de `CUSTOM_ROUTES` (HomeScreen) ; retrait de la route `DecisionalBalance` d'`AppStack`. Suppression des fonctions/types legacy `getDecisionalBalance`, `saveDecisionalBalance`, `BalanceArgument`, `BalanceQuadrant`, `DecisionalBalance`, `BalanceScores`, `computeBalanceScores` de `database.ts` (la table reste comme source de migration).

*Tests :* `FieldRenderer.decision_grid.test.tsx` — 10 tests (chargement items + target_behavior, rendu des 4 quadrants, rendu de la jauge, pré-remplissage target depuis module_settings, ajout d'argument avec poids défaut, validation texte vide, ajustement poids inline via tap étoile, save bouton + logEvent, suppression avec confirmation, agrégation jauge ignore les quadrants sans gauge_role). `FieldRenderer.editable_steps.test.tsx` mis à jour pour les nouveaux testIDs préfixés (`step-{n}-add`, `step-{n}-new-input`, etc.) consécutifs au refacto via `EditableItemsList`.
