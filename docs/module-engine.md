# Moteur de définition de module — Kær

Ce document décrit le circuit complet : base de données → service → moteur de rendu → composants React/React Native.

---

## Vue d'ensemble

```
supabase/schema.sql
  ├── modules            (1 ligne par module, pilote le layout)
  ├── module_content_fields  (1 ligne par champ de contenu)
  └── field_props        (props React attachées à chaque champ)
          ↓
packages/shared/src/services/moduleFields.ts  (fetchModuleFields, partagé)
  → apps/web/src/services/moduleService.ts   (wrapper, injecte le client web)
  → apps/mobile/src/services/moduleService.ts (wrapper, injecte le client mobile)
          ↓
ContentField[]  (arbre typé, props hydratées)
          ↓
FieldRenderer  (dispatch preview_kind → layout)
  ├── StepsLayout
  ├── FieldsLayout
  ├── Grid2x2Layout
  └── CardsLayout
          ↓
FieldRow → FieldWidget → TextWidget / InfoWidget
```

---

## 1. Base de données

### `modules`

Une ligne par module thérapeutique. La colonne clé est `preview_kind` — elle détermine quel layout React va s'afficher.

```sql
create table public.modules (
  id                 text primary key,
  category_id        text not null references module_categories(id),
  preview_kind       text not null default 'coming_soon',
  sort_order         int  not null default 0,
  is_invite_excluded boolean not null default false
);
```

Valeurs de `preview_kind` et leur layout :

| `preview_kind` | Layout React | Modules exemples |
|---|---|---|
| `steps` | Liste ordonnée verticale de sections | `crisis_plan`, `beck_columns` |
| `fields` | Grille de champs avec widget | `sleep_diary` |
| `medication_tracker` | Suivi d'observance — 3 onglets (Aujourd'hui : check global + détail par molécule + motif + notes ; Calendrier : mois passif + série « jours renseignés » ; Mes médicaments : liste fond/PRN co-éditée). Pastilles neutres, aucun taux ni alerte (MDR). Aperçu web `MedicationTrackerLayout` ; écran mobile `MedicationTracker/` ; éditeur liste praticien `MedicationAdherenceCard` | `medication_adherence` |
| `cards` | Accordéon de cartes dépliables | `psychoeducation` |
| `questionnaire` | Questionnaire clinique interactif (ScaleEntryScreen) | `phq9`, `gad7`, `bsl23`, `snap_iv`, `asrs6`, `asrs18` |
| `slider_dashboard` | Tableau de bord multi-dimensions — 3 onglets (Saisie / Évolution / Vue d'ensemble), courbes par dimension + composite, sélecteur 7J/1M/3M/1A, repères temporels, heatmap calendrier. Nommé par motif, réutilisable : `moduleId` dérivé des fields, accent lu en config (`accent_color`). Aperçu web `SliderDashboardLayout` ; écran patient mobile `DimensionTrackerView` | `mood_tracker`, `medication_side_effects` |
| `guided_exercise` | Exercice guidé pas-à-pas (timer, multi-étapes) | `cognitive_saturation` |
| `crisis_companion` | Compagnon de crise « urge surfing » : machine à états accueil+catégories (un écran) → activité + délai → minuteur décompté → fin neutre. Aucune persistance. Nommé par motif, `moduleId` dérivé pour le chrome. Aperçu web = storyboard lecture seule | `distress_tolerance` (onglet « Agir en crise ») |
| `patient_scenario` | Scénario RIM patient (lecture scénario + sons + urgence) | `rim` |
| `editable_steps` | Étapes éditables par le patient (Plan de crise) | `crisis_plan` |
| `crisis_urgency` | Vue urgence 1-tap : boutons d'appel + contacts patient (mobile uniquement — passé directement à `FieldRenderer`, pas en base) | `crisis_plan` (écran `CrisisUrgencyScreen`) |
| `stage_wheel` | Sélecteur de stade en sélection exclusive (modèle transthéorique de Prochaska, 6 stades par défaut) + historique. Mobile : éditeur SQLite (`em_rulers.stage`, via `motivationalBalanceService`). Web : aperçu structurel statique. Nommé par motif, `moduleId` dérivé (`modules.<id>.stage_*`), `stageCount` configurable. MDR : auto-positionnement déclaratif, aucune progression imposée | `motivational_balance` (onglet « Stade ») |
| `dual_ruler` | Deux échelles 0-10 (importance / confiance via `RatingSelector`) + justifications + engagement + historique. Mobile : éditeur SQLite (`em_rulers`). Web : aperçu structurel statique. Nommé par motif, `moduleId` dérivé (`modules.<id>.rulers_*`). MDR : valeurs brutes, aucun seuil | `motivational_balance` (onglet « Thermomètres ») |
| `weighted_balance` | Sélection de valeurs (chips, max configurable) + balance Pour/Contre dont chaque raison porte un poids 1-N (`RatingSelector` track, monochrome). Mobile : éditeur SQLite (`em_values` + `em_balance_items`). Web : aperçu structurel statique. Liste de valeurs lue d'un field `weighted_balance_config` (clés indexées `value_1..`, `max_values`) ; libellés dérivés du `moduleId`. MDR : pondération subjective, aucune couleur de gravité | `motivational_balance` (onglet « Balance ») |
| `breathing_pacer` | Liste des techniques de respiration (config lue des fields `breathing_technique` + `breathing_phase`) + historique des sessions, chaque carte ouvrant un lecteur d'exercice animé (machine multi-phases inspiration/rétention/expiration, cercle + barre de phases) dans une modale. Mobile : `BreathingPacerLayout` interactif (sessions SQLite via `breathingService`). Web : aperçu praticien = `field_row` descriptifs (rendu comme `fields`). Nommé par motif, `moduleId` dérivé. MDR : exercice guidé neutre, aucune conclusion | `breathing_techniques` |
| `coming_soon` | Rien affiché | Tout module non encore implémenté |

#### `questionnaire` — circuit spécifique mobile

Pour les modules `questionnaire`, le rendu interactif côté patient suit un circuit différent :

```
Supabase module_content_fields
  ↓
fetchModuleFields(scale_id)  →  ContentField[]
  ↓
ScaleEntryScreen  (apps/mobile/src/screens/modules/ScaleEntryScreen.tsx)
  ├── FieldRenderer preview_kind='questionnaire'
  │     ↓
  │   QuestionnaireLayout
  │     ├── scale_instruction     → bloc intro
  │     ├── scale_legend_item     → légende numérique (BSL-23) — prop value
  │     ├── scale_warning         → bandeau jaune hétéro-évaluation (SNAP-IV)
  │     ├── scale_section         → en-tête de section (SNAP-IV, ASRS-18)
  │     ├── scale_question        → question + LikertWidget (Likert discret)
  │     ├── scale_slider_question → question + pips numériques (1–10 ou autre range)
  │     ├── scale_number_input    → champ numérique libre (clavier)
  │     ├── scale_text_input      → champ texte libre (notes)
  │     └── footer_note           → note MDR bas de page
  │
  └── saveScaleEntry(entry: ScaleEntry)  →  SQLite scale_entries

ScaleHistoryScreen  (apps/mobile/src/screens/modules/ScaleHistoryScreen.tsx)
  ├── getAllScaleEntries(scale_id)  →  ScaleEntry[]
  └── Affiche score total + chips sous-échelles (SNAP-IV, ASRS-18)
```

Le **scoring** est centralisé dans `apps/mobile/src/lib/scaleScoring.ts` :
```ts
SCALE_SCORING[scale_id].computeScore(answers)          // total
SCALE_SCORING[scale_id].computeSubscaleScores(answers) // sous-échelles (optionnel)
```

Les **données** (entrées patient) sont stockées dans la table SQLite générique `scale_entries` — une seule table pour toutes les échelles, discriminée par `scale_id`.

### `module_content_fields`

Un enregistrement par champ de contenu (titre, paragraphe, champ de saisie, étape…).

```sql
create table public.module_content_fields (
  id              text primary key,
  module_id       text not null references modules(id) on delete cascade,
  section_id      text,           -- groupe les champs en sections (étapes, quadrants, cartes)
  parent_field_id text references module_content_fields(id) on delete cascade,
  field_type      text not null,  -- détermine le composant React rendu
  text_code       text,           -- clé i18n (NULL pour card_divider, coming_soon)
  sort_order      int  not null default 0
);
```

**Conventions d'identifiants** : `{module}.{type}_{n}` — ex. `sleep.field_1`, `crisis.step_1_title`.

**`field_type` — inventaire complet**

> **Règle absolue avant tout nouveau `field_type` :** consulter cette table. Si un type existant couvre le besoin avec une nouvelle `field_prop`, l'étendre — ne pas créer un nouveau type. Tout nouveau `field_type` génère une divergence web/mobile permanente à maintenir. Justifier par écrit dans la doc du module si la création est inévitable.
>
> **Correspondances fréquentes à vérifier en priorité :**
> - Bannière / alerte / disclaimer → `disclaimer_banner` (props : `color`, `icon`, `text_code`, `tone`)
> - Bouton action / urgence / téléphone → `exercise_safety` (props : `phone`, `bgColor`, `label_code`)
> - Note de bas d'écran → `footer_note`
> - Onglet → `tab` (layout `tabbed`)

**Génériques (tout layout)**

| `field_type` | Rendu | Props clés | Contexte |
|---|---|---|---|
| `module_label` | Silencieux | — | Filtré avant rendu |
| `module_description` | Silencieux | — | Filtré avant rendu |
| `coming_soon` | Silencieux | — | Module non implémenté |
| `footer_note` | Note texte bas de panel | — | Filtré, affiché séparément après le contenu |
| `disclaimer_banner` | Bandeau d'avertissement | `color`, `icon`, `module_key`, `text_code`, `tone` | Bandeau haut d'écran configurable. `text_code` override la clé i18n par défaut (`modules.<key>.disclaimer`). `tone` : `"info"` (défaut) ou `"danger"` (fond rouge). Utilisé pour MDR, précautions cliniques, urgences |
| `tab` | Onglet du layout `tabbed` | `tab_key`, `preview_kind` | Définit un onglet et son sous-layout |
| `weighted_balance_config` | Config du layout `weighted_balance` | `value_1..N`, `max_values` | Liste indexée des valeurs sélectionnables (lue par `collectIndexed`) + maximum de valeurs cochables |

**Layout `fields`**

| `field_type` | Rendu | Props clés |
|---|---|---|
| `field_row` | `FieldRow` — ligne de saisie | `widget_type`, `icon`, `detail_code`, etc. |

**Layout `steps` / `editable_steps`**

| `field_type` | Rendu | Props clés |
|---|---|---|
| `step_title` | Titre d'étape | `color`, `bgColor`, `icon`, `step_number` |
| `step_hint` | Sous-titre / question guide | `color`, `step_number` |

**Layout `editable_steps` — champs suffixes** (sans `section_id`, rendus après les étapes, triés par `sort_order`)

| `field_type` | Rendu | Props clés | Contexte |
|---|---|---|---|
| `footer_note` | Note texte bas de panel | — | Note légale ou précaution post-étapes |
| `exercise_safety` | Bouton d'appel urgence | `phone`, `bgColor`, `label_code` | Bouton coloré non-cliquable (aperçu web), actif sur mobile |
| `crisis_urgency_entry` | Bandeau d'accès mode urgence | `text_code`, `tone` | **Mobile** : bandeau rouge en tête qui navigue vers l'écran `CrisisUrgency`. **Web** : aperçu statique (rendu via `DisclaimerBanner`, le praticien n'a pas de mode urgence) |
| `crisis_anchors_preview` | Widget "Mes raisons de tenir" | — | **Mobile** : interactif (photos FileSystem, phrase SQLite, message praticien). **Web** : aperçu statique. Message praticien depuis Supabase `crisis_plan_configs` |
| `crisis_coping_cards_preview` | Widget "Cartes de coping" | — | Cartes praticien (Supabase `crisis_plan_coping_cards`), lecture seule sur les deux plateformes |
| `crisis_commitment_preview` | Widget "Engagement thérapeutique" | — | **Mobile** : signature nom/date (SQLite). **Web** : aperçu de la phrase d'engagement (`crisis_plan_configs.commitment_phrase`) |
| `crisis_urgency_contacts` | Widget contacts urgence | — | Lit step4/step5 depuis SQLite (`getUrgencyItems`). Rendu uniquement dans le layout `crisis_urgency` (mobile). Pas de props — données 100% locales |

**Layout `cards`**

| `field_type` | Rendu | Props clés |
|---|---|---|
| `card_title` | Titre accordéon | — |
| `card_summary` | Résumé header fermé | — |
| `card_heading` | `<h2>`/`<h3>`/`<h4>` | `level` (`'2'`/`'3'`/`'4'`, défaut `'2'`) |
| `card_inline` | Segment inline dans un `<p>` | `bold='true'` (défaut: plain) |
| `card_paragraph` | Paragraphe | `bold='true'` / `italic='true'` |
| `card_callout` | Encart (bordure gauche colorée) | `color` |
| `card_list_item` | Puce `•` | — |
| `card_numbered_item` | Item numéroté | — |
| `card_definition` | Terme + définition | — |
| `card_divider` | Séparateur horizontal | — |

**Layout `questionnaire`**

| `field_type` | Rendu | Props clés |
|---|---|---|
| `scale_instruction` | Bloc intro | — |
| `scale_option` | Choix Likert | `value` (obligatoire) |
| `scale_legend_item` | Légende numérique (BSL-23) | `value` (obligatoire) |
| `scale_warning` | Bandeau jaune avertissement | — |
| `scale_section` | En-tête de section | — |
| `scale_question` | Question + LikertWidget | — |
| `scale_slider_question` | Question + pips numériques | `min`, `max`, `color`, `icon`, `low_hint_code`, `high_hint_code` |
| `scale_number_input` | Champ numérique libre | `subscale_key` |
| `scale_text_input` | Champ texte libre | `placeholder_code`, `subscale_key` |

**Layout `guided_exercise`**

| `field_type` | Rendu | Props clés |
|---|---|---|
| `exercise_title` | Titre exercice | — |
| `exercise_intro` | Paragraphe intro | — |
| `exercise_start_btn` | Label bouton Démarrer | — |
| `exercise_next_btn` | Label bouton Suivant | — |
| `exercise_finish_btn` | Label bouton Terminer | — |
| `exercise_stop_btn` | Label bouton Annuler | — |
| `exercise_done_text` | Texte écran fin | — |
| `exercise_safety_title` | Titre section urgence | — |
| `exercise_safety` | **Bouton d'appel urgence** | `phone`, `bgColor`, `label_code` — utilisable dans tout layout nécessitant un bouton d'action coloré |

**Layout `crisis_companion` (compagnon de crise — urge surfing)**

Réutilise `exercise_intro` (accueil) et `exercise_config` (prop `durations`, ex. `"5,15"`).
Deux field_types propres :

| `field_type` | Rendu | Props clés |
|---|---|---|
| `crisis_category` | En-tête d'une catégorie DBT (1 par `section_id`) | `icon` (lucide), `color` |
| `crisis_activity` | Une activité d'apaisement, rattachée à une catégorie (`section_id`) | — |

**Layout `patient_scenario` (RIM)**

| `field_type` | Rendu | Props clés |
|---|---|---|
| `rim_disclaimer` | Disclaimer RIM | — |
| `rim_step` | Étape protocole | `step_number` |
| `ambient_sound` | Bouton son d'ambiance | `key`, `icon`, `available` |

**Layout `column_form`**

| `field_type` | Rendu | Props clés |
|---|---|---|
| `column_form_config` | Config du formulaire | `columns`, labels (`new_btn_label`, `save_label`, `empty_*`, `validation_*`), `required_key_1..n`, capture en deux temps : `quick_btn_label`, `quick_key_1..n`, `complete_key_1..n`, `to_complete_label` |
| `column_header` | En-tête de colonne | `color`, `optional_group` (colonne masquée côté patient tant que le groupe ne figure pas dans `patient_modules.config.enabled_groups` — lecture `readEnabledGroups` de `@kaer/shared`. Capacité moteur dormante : aucun seed ni UI ne l'utilise actuellement, beck_columns y a renoncé en 2026-07 au profit de colonnes standard) |
| `column_text_field` | Champ texte dans colonne | `placeholder_code`, `column_index`, `suggestion_1..n` (codes i18n rendus en chips : ajoutent/retirent leur mot dans le champ, texte libre roi) |
| `column_time_field` | Champ heure dans colonne | `column_index` |
| `column_slider_field` | Slider dans colonne | `min`, `max`, `column_index` |

> **Capture en deux temps** (`quick_key_*`) : un bouton secondaire en mode liste
> ouvre le formulaire réduit aux seuls champs dont la clé est une `quick_key` ;
> la fiche sauvegardée ne porte que ces valeurs (aucun défaut de slider). Tant que
> toutes les `complete_key_*` ne sont pas renseignées, la fiche affiche une puce
> « à compléter » (`to_complete_label`, statut **dérivé** jamais stocké) qui ouvre
> l'édition complète. Utilisé par `beck_columns`.

**Layout `daily_checkin`**

| `field_type` | Rendu | Props clés |
|---|---|---|
| `daily_checkin_config` | Config checklist | — |
| `daily_status_option` | Option de statut | `value`, `color`, `icon` |

**Layout `medication_tracker`**

| `field_type` | Rendu | Props clés |
|---|---|---|
| `medication_tracker_config` | Libellés des 3 onglets + sections (streak, calendrier, liste molécules, pont effets) | clés i18n par libellé |
| `daily_status_option` | Statut de prise (réutilisé) | `value`, `color`, `bg_color`, `icon` |
| `medication_reason_option` | Motif de non-prise (chip) | `value`, `icon`, `links_module` (pont vers un autre module) |

**Layout `sleep_journal`**

| `field_type` | Rendu | Props clés |
|---|---|---|
| `sleep_journal_config` | Config agenda sommeil | `fields` (liste des champs activés) |

**Layout `tree_selector`**

| `field_type` | Rendu | Props clés |
|---|---|---|
| `tree_selector_config` | Config sélecteur arborescent | étapes optionnelles + libellés (voir ci-dessous) |
| `tree_node` | Nœud de l'arbre | `parent_field_id` (hiérarchie), `color`, `emoji`, `icon` |

Props de `tree_selector_config` (toutes optionnelles, valeurs = clés i18n sauf flags) :
`enable_intensity`/`enable_notes`/`enable_context`/`enable_early_validate` (`'0'`/`'1'`),
`intensity_min`/`intensity_max`, libellés (`intro`, `new_btn`, `step_{1,2,3}_title`/
`_hint`, `intensity_title`/`_hint`, `context_title`/`_hint`, `notes_title`/`_hint`/
`_placeholder`, `continue_btn`, `validate_here_btn` (profondeur libre), `save_btn`,
`history_label`, `empty_title`/`empty_text`), et options de contexte indexées
`context_opt_N` (clé i18n) + `context_icon_N` (nom MaterialCommunityIcons), lues via
`collectIndexed`. `enable_early_validate` autorise la validation à n'importe quel
niveau de l'arbre ; `enable_context` ajoute une étape de chips multi-choix neutres,
persistée dans `tree_selections.context_json`. Réf. module : `emotion_wheel`.

> **Architecture (séparation métier / présentation).** Le layout
> `features/ModuleRenderer/layouts/TreeSelector/TreeSelectorLayout` est un **wrapper
> métier mince** : il parse la config ci-dessus (`useTreeSelectorConfig`),
> charge/persiste/supprime via `treeSelectionService` (`useTreeSelectorData`),
> traduit tous les libellés et mappe l'arbre + l'historique vers les props du
> primitive **générique et réutilisable** `@ui/TreeSelector`. Toute l'interaction
> (navigation, étapes, saisie) vit dans le primitive `ui/`, sans aucune connaissance
> du moteur de modules. Le layout reconstruit le chemin de persistance (avec
> `text_code`) depuis les `pathIds` opaques renvoyés par `onSubmit`. Détail du
> primitive : `apps/mobile/docs/design-system.md` § `TreeSelector`.

**Config `breathing_techniques`** (config-first, issue #69 — lus par
`breathingService.techniquesFromFields()` puis rendus par le layout `breathing_pacer`
du renderer générique, issue #19 ; le preview praticien web reste en `field_row`)

| `field_type` | Rendu | Props clés |
|---|---|---|
| `breathing_technique` | Une technique de respiration (parent) | `technique_key`, `color`, `recommended_duration_min` |
| `breathing_phase` | Une phase d'un cycle (field enfant, ordonné par `sort_order`) | `phase_type` (`inhale`/`hold_in`/`exhale`/`hold_out`), `phase_seconds` |

**Props `questionnaire` :**

| `prop_key` | Utilisé par | Description |
|---|---|---|
| `value` | `scale_option`, `scale_legend_item` | Valeur numérique entière (stockée en texte) |

**Inline children — `card_inline`**

`card_inline` est le seul `field_type` pour les spans inline. Bold et italic sont des **props**, pas des types distincts. Ces champs ne passent **pas** par le `FIELD_REGISTRY` — rendus par `renderInlineChildren()`, appelée par `FieldText` et `FieldListItem` quand `field.children.length > 0`.

| `prop_key` | `prop_value` | Rendu web | Rendu mobile |
|---|---|---|---|
| `bold` | `'true'` | `<strong>` | `fontWeight: '700'` |
| `italic` | `'true'` | `<em>` | `fontStyle: 'italic'` |
| *(aucune)* | – | `<span>` | `<Text>` plain |

### `field_props`

Props attachées à un champ — clé/valeur texte, PK composite `(field_id, prop_key)`.

```sql
create table public.field_props (
  field_id   text not null references module_content_fields(id) on delete cascade,
  prop_key   text not null,
  prop_value text not null,
  primary key (field_id, prop_key)
);
```

**Props standard reconnues par les composants :**

| `prop_key` | Valeur exemple | Utilisé par |
|---|---|---|
| `widget_type` | `"text"` ou `"info"` (kind seul) | `FieldRow` → `FieldWidget` |
| `icon` | `"moon"` | `FieldRow`, `scale_slider_question`, `exercise_safety`, `ambient_sound` |
| `detail_code` | `"sleep.field_1.detail"` | `FieldRow` — texte descriptif sous le label |
| `color` | `"#4F46E5"` | `StepsLayout` (badge), `Grid2x2Layout` (bordure), `scale_slider_question` (accent) |
| `step_number` | `"1"` | `StepsLayout`, `rim_step` — numéro affiché dans le badge |
| `value` | `"0"` | `scale_option`, `scale_legend_item` — valeur numérique entière |
| `min` | `"1"` | `scale_slider_question` — valeur minimale des pips |
| `max` | `"10"` | `scale_slider_question` — valeur maximale des pips |
| `low_hint_code` | `"modules.mood_tracker.low"` | `scale_slider_question` — clé i18n libellé bas |
| `high_hint_code` | `"modules.mood_tracker.high"` | `scale_slider_question` — clé i18n libellé haut |
| `subscale_key` | `"mood"` | `scale_slider_question`, `scale_number_input`, `scale_text_input` — clé dans `subscale_scores` JSON |
| `placeholder_code` | `"modules.mood.notes_placeholder"` | `scale_text_input`, `scale_number_input` |
| `phone` | `"3114"` | `exercise_safety` — numéro composé au tap |
| `text_code` | `"modules.crisis_plan.urgency_title"` | `disclaimer_banner` — clé i18n alternative (override la clé `modules.<module_key>.disclaimer` par défaut) |
| `tone` | `"danger"` | `disclaimer_banner` — `"info"` (bleu, défaut) ou `"danger"` (rouge) |
| `key` | `"pluie"` | `ambient_sound` — identifiant du fichier audio |
| `available` | `"false"` | `ambient_sound` — `"false"` → badge "Bientôt" |

**`widget_type` = le *kind* seul. Deux kinds sont rendus par `FieldWidget` :**

```
"text"   → TextWidget   (champ texte non éditable, lecture seule)
"info"   → InfoWidget   (icône + texte via detail_code)
```

`FieldRow` passe l'intégralité de `field.props` à `FieldWidget`, qui lit le kind
(`widget_type`) et rend le widget. Le layout `fields` n'est plus utilisé que par
`breathing_techniques` (info ×5 + text ×1), seul module encore en
`preview_kind='fields'`. Les widgets `slider`/`stars`/`radio`/`boolean`/`date`/
`checkbox`/`textarea`/`time`, devenus inatteignables après la migration des autres
modules vers des layouts dédiés, ont été supprimés (web + mobile) avec leurs seeds
`widget_type` morts — issue #87.

---

### Convention `field_props` : prop_value atomique

> **Règle absolue.** `field_props` a une PK `(field_id, prop_key)` : **une entrée =
> une valeur atomique**. Une `prop_value` ne ré-encode JAMAIS une structure dans une
> string (CSV, JSON, `kind:param:param`) que le code devrait re-parser. La structure
> cachée dans du texte est non requêtable, non validable en base, et contraire à
> `config-first`.

**Arbre de décision :**

| Besoin | ❌ Packé (interdit) | ✅ Atomique |
|---|---|---|
| Attributs nommés distincts | `widget_type='slider:0:120:min'` | `widget_type='slider'` + `slider_min='0'` + `slider_max='120'` + `slider_unit='min'` |
| Idem (étoiles, radio) | `'stars:5'`, `'radio:ok'` | `widget_type='stars'`+`stars_count='5'` ; `widget_type='radio'`+`radio_variant='ok'` |
| Liste de valeurs | `durations='5,15'` | `duration_1='5'`, `duration_2='15'` |
| Liste (clés requises) | `required_keys_any='a,b'` | `required_key_1='a'`, `required_key_2='b'` |
| Liste (JSON) | `target_ages='["adulte","senior"]'` | `target_age_1='adulte'`, `target_age_2='senior'` |

**Lecture des listes côté code** : helper partagé `collectIndexed(props, base)`
(`@kaer/shared`) : collecte `base_1`, `base_2`, … triés par index numérique. Web et
mobile l'utilisent à l'identique (parité stricte) ; plus aucun `split(',')`/`JSON.parse`.

**Allowlist : valeurs atomiques contenant `:`/`,`/`-` LÉGITIMEMENT** (ce ne sont pas
des packings, ne pas les éclater) : `reference_url` (une URL), `reference_label` (une
citation), `validated_age_range` (libellé « 8 - 18 ans »), clés i18n (`modules.x.y`),
couleurs hex (`#F59E0B`), booléens/nombres simples.

**Garde-fou** : `apps/web/src/test/fieldPropsAtomic.guard.test.ts` scanne tous les
seeds et échoue si une `prop_value` packée réapparaît (clé legacy, `widget_type` avec
`:`, tableau JSON). Migration des bases existantes :
`supabase/migration_atomic_field_props.sql` (idempotente).

---

## 2. Service — `fetchModuleFields`

Fichier source unique :
- `packages/shared/src/services/moduleFields.ts` — fonction `fetchModuleFields(client, moduleId)` partagée web + mobile.

Wrappers locaux (une ligne, injectent leur propre client Supabase) :
- `apps/web/src/services/moduleService.ts`
- `apps/mobile/src/services/moduleService.ts`

Le service partagé prend le `SupabaseClient` en paramètre — `packages/shared/` n'a aucun couplage avec un client concret. Tests dans `packages/shared/src/services/moduleFields.test.ts` (`npm run test:shared`).

```ts
export interface ContentField {
  id: string
  module_id: string
  section_id: string | null
  parent_field_id: string | null
  field_type: string
  text_code: string | null
  sort_order: number
  props: Record<string, string>   // toutes les field_props du champ, indexées par prop_key
  children: ContentField[]        // champs enfants (inline spans)
}

export interface ModuleFieldsResult {
  preview_kind: string
  fields: ContentField[]          // champs de premier niveau uniquement (racine de l'arbre)
}
```

**Algorithme en 3 passes :**

```
1. Promise.all([
     modules.select('preview_kind').eq('id', moduleId),
     module_content_fields.select(...).eq('module_id', moduleId).order('sort_order')
   ])

2. field_props.select('field_id, prop_key, prop_value').in('field_id', fieldIds)
   → Map<field_id, Record<prop_key, prop_value>>

3. Reconstruction de l'arbre :
   - fieldMap = Map<id, ContentField>  (chaque champ initialisé avec props hydratées)
   - Pour chaque champ : si parent_field_id → push dans parent.children
                         sinon → push dans topLevel[]
   → Retourne { preview_kind, fields: topLevel }
```

RLS Supabase garantit que seuls les utilisateurs authentifiés accèdent aux tables — aucune vérification client supplémentaire nécessaire.

---

## 3. Moteur de rendu — `FieldRenderer`

Le moteur est un **dossier** `FieldRenderer/` (un fichier = une responsabilité),
pas un fichier monolithique :

- Web : `apps/web/src/components/features/ModuleRenderer/FieldRenderer/`
- Mobile : `apps/mobile/src/components/features/ModuleRenderer/FieldRenderer/`

Chaque dossier contient : `FieldRenderer.tsx` (point d'entrée — extrait le
`disclaimer_banner`, délègue), `LayoutDispatcher.tsx` (routage `preview_kind`
→ layout), `partitionBySection.ts` (helper pur de groupement), `types.ts`,
`index.ts`. Les layouts vivent chacun dans leur dossier `../layouts/<Nom>/`
(`<Nom>Layout.tsx` + `styles.ts` + `index.ts`).

> **Catalogue complet des layouts mobile** (preview_kind → dossier → composant →
> persistance) : [`apps/mobile/docs/design-system.md`](../apps/mobile/docs/design-system.md)
> § *Layouts du ModuleRenderer*. Côté web :
> [`apps/web/docs/components/module-renderer.md`](../apps/web/docs/components/module-renderer.md).

> **Diagnostics / non-match (issue #90)** : l'observabilité n'est PAS dans les composants
> de rendu. Un non-match est une propriété pure de `(config) × (capacités)`, calculée par
> `collectRenderMismatches(preview_kind, fields)` (`@kaer/shared`) appelée **une fois** à
> la frontière des données (`moduleService.fetchModuleFields`), puis transmise à
> `renderDiagnosticsService` → Edge Function `report-render-mismatch` (journal
> `render_mismatch_log` + email). Le runtime couvre `preview_kind` (`PREVIEW_KINDS`) et
> `widget_type` (`RENDERABLE_WIDGET_TYPES`) ; les niveaux contextuels passent par la garde
> CI `previewKindCoverage.test.ts`. Circuit complet : [`render-diagnostics.md`](render-diagnostics.md).

**Props :**

```ts
// Web
interface FieldRendererProps {
  preview_kind: string
  fields: ContentField[]
  expandedCard: string | null     // état accordéon géré par le parent (ModulePreviewPanel)
  onToggleCard: (id: string) => void
}

// Mobile
interface FieldRendererProps {
  preview_kind: string
  fields: ContentField[]
  // état accordéon géré en interne (useState dans CardsLayout)
}
```

**Dispatch `preview_kind` → layout :**

```
'coming_soon' ou fields vides → null (rien rendu)

'steps'           → StepsLayout         (groups par section_id, champ step_title requis)
'cards'           → CardsLayout         (groups par section_id, accordéon card_title/card_summary)
'fields'          → FieldsLayout        (filtre field_type === 'field_row', FieldRow par champ)
'questionnaire'   → QuestionnaireLayout (mobile uniquement — ScaleEntryScreen pilote les réponses)
'slider_dashboard'→ SliderDashboardLayout (aperçu web générique ; écran patient mobile = DimensionTrackerView)
'guided_exercise' → GuidedExerciseLayout (mobile uniquement — machine d'état intro/guided/done)
'crisis_companion'→ CrisisCompanionLayout (mobile = machine d'état + minuteur ; web = storyboard lecture seule)
'patient_scenario'→ PatientScenarioLayout (mobile uniquement — scénario RIM + sons + urgence)
'editable_steps'  → EditableStepsLayout (mobile uniquement — étapes éditables, Crisis Plan)
'stage_wheel'     → StageWheelLayout (mobile = éditeur SQLite em_rulers.stage ; web = aperçu structurel)
'dual_ruler'      → DualRulerLayout (mobile = éditeur SQLite em_rulers ; web = aperçu structurel)
'weighted_balance'→ WeightedBalanceLayout (mobile = éditeur SQLite em_values+em_balance_items ; web = aperçu structurel)
'breathing_pacer' → BreathingPacerLayout (mobile = cartes techniques + exercice animé en modale, sessions SQLite ; web = aperçu field_row via FieldsLayout)
```

**Filtrage initial commun aux 4 layouts :**

```ts
const visibleFields = fields.filter(
  f => f.field_type !== 'module_label' && f.field_type !== 'module_description'
)
const footer = visibleFields.find(f => f.field_type === 'footer_note')
const contentFields = visibleFields.filter(f => f.field_type !== 'footer_note')
```

---

## 4. Layouts internes

> Liste illustrative du pattern. Le **catalogue exhaustif** des layouts mobile
> (19 layouts, dossier, composant, persistance) est tenu à jour dans
> [`apps/mobile/docs/design-system.md`](../apps/mobile/docs/design-system.md)
> § *Layouts du ModuleRenderer*.

### `StepsLayout`

- Reçoit `sections: Map<section_id, ContentField[]>`
- Cherche `step_title` et `step_hint` dans chaque section
- Lit `props['color']` et `props['step_number']` depuis le champ title
- Rend un badge coloré rond + `FieldText` titre + `FieldText` hint

### `FieldsLayout`

- Reçoit directement `fields: ContentField[]` (déjà filtrés sur `field_type === 'field_row'`)
- Rend `<FieldRow>` pour chaque champ
- Affiche le footer séparé avec icône info

### `Grid2x2Layout`

- Reçoit `sections: Map<section_id, ContentField[]>`
- 4 sections = 4 quadrants dans une grille 2 colonnes
- Bordure haute colorée via `props['color']`

### `CardsLayout`

- Reçoit `sections: Map<section_id, ContentField[]>`
- `card_title` → header de carte ; `card_summary` → sous-header
- Corps : tous les autres champs passent dans `renderCardBodyFields`
- `renderCardBodyFields` groupe les `card_list_item` consécutifs en `<ul>` / `<View>` et `card_numbered_item` en `<ol>`

---

## 5. Registre de champs — `FIELD_REGISTRY`

Lookup statique `field_type → ComponentType<FieldProps>`, partagé entre web et mobile :

```ts
const FIELD_REGISTRY: Record<string, ComponentType<FieldProps>> = {
  card_callout:        FieldText,
  card_definition:     CardDefinition,
  card_divider:        CardDivider,
  card_heading:        FieldText,
  card_list_item:      FieldListItem,
  card_numbered_item:  FieldListItem,
  card_paragraph:      FieldText,
  coming_soon:         NullField,
  module_description:  NullField,
  module_label:        NullField,
}
// card_inline n'est PAS dans ce registre —
// rendu via renderInlineChildren() sur les champs enfants.
```

---

## 6. Composants feuilles

### `FieldText`

Composant polymorphe — lit `field.field_type` et renvoie la variante typographique correspondante.  
Web : HTML sémantique (`<h2>`, `<p>`, `<blockquote>…`).  
Mobile : `<Text>` avec style calculé depuis une `CONFIG` statique.

### `FieldRow`

Utilisé uniquement dans `FieldsLayout`. Lit trois props :

```
field.props['icon']        → nom de l'icône (Lucide web / Ionicons mobile)
field.props['widget_type'] → délégué à FieldWidget
field.props['detail_code'] → clé i18n du texte descriptif (fallback si pas de widget)
```

Layout vertical :
```
┌─────────────────────────┐
│ [icône]  Label du champ │  ← header (flexDirection row)
│          [Widget]        │  ← control (indent 32px mobile / 28px web)
└─────────────────────────┘
```

### `FieldWidget`

Dispatcher pur — aucun état, aucun style propre. Prend `props: Record<string, string>`
(les `field_props` du champ), lit le kind (`widget_type`) et rend le widget
correspondant (`text` → `TextWidget`, `info` → `InfoWidget`).

### Widgets (`fields/widgets/`)

Composants d'affichage **en lecture seule** (conformité MDR : affichage passif) — côté web, l'aperçu praticien ; côté mobile, le champ tel que le patient le voit. Deux widgets subsistent : `TextWidget` et `InfoWidget` (mobile garde en plus `LikertWidget`, consommé par `QuestionnaireLayout`, hors chemin `fields`). Chaque widget est dans son propre dossier `WidgetName/` avec son test et son `index.ts`.

---

## 7. Ajouter un nouveau module — checklist

**Principe** : tout module passe d'abord par la base de données. Le rendu web et mobile se fait automatiquement via `FieldRenderer`. Ne créer un écran dédié que si le module nécessite une interaction complexe impossible à exprimer en champs (timer, animation, flux multi-écrans).

### Étape 1 — Base de données (obligatoire)

1. Insérer la ligne dans `modules` : `id`, `category_id`, `preview_kind`, `sort_order`, `is_invite_excluded`
2. Insérer les `module_content_fields` : `field_type`, `section_id`, `text_code`, `sort_order`
3. Insérer les `field_props` : `widget_type`, `icon`, `detail_code`, `color`, `step_number` selon les besoins
4. Appliquer via MCP Supabase (`apply_migration`)
5. Vérifier que `fetchModuleFields(moduleId)` retourne l'arbre attendu

### Étape 2 — Web praticien (obligatoire)

6. Ajouter `ModuleType` dans `apps/web/src/lib/database.types.ts` (`MODULE_LABELS`, `MODULE_DESCRIPTIONS`)
7. Vérifier que le module apparaît dans la bonne catégorie de `PatientPage.tsx` (armoire thérapeutique)
8. Ajouter les clés i18n dans tous les fichiers `locales/*/common.json`

### Étape 3 — Mobile patient (obligatoire)

9. Ajouter l'entrée dans `MODULE_CONFIG` de `HomeScreen.tsx`
10. Ajouter les mêmes clés i18n

### Étape 4 — Écran dédié (uniquement si interaction complexe)

Seulement si le module ne peut pas être rendu par `FieldRenderer` (timer, animation Reanimated, flux multi-étapes interactif) :

11. Créer l'écran dans `src/screens/modules/`
12. Câbler la navigation dans `AppStack.tsx`

### Étape 5 — Tests (obligatoire)

13. Tests du module web si nouvel écran praticien
14. Tests du module mobile — mocker `useTeen` :
    ```ts
    jest.mock('../../hooks/useTeen', () => ({
      useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
    }))
    ```

---

## Schéma `ClinicalScale` — Échelles et questionnaires d'évaluation

### Architecture — `module_content_fields` avec `field_type: 'scale_meta'`

> **Migration terminée.** `apps/web/src/data/scales.ts` (tableau statique `CLINICAL_SCALES`) a été supprimé. Les métadonnées des échelles vivent désormais en base dans `module_content_fields` + `field_props`, alimentés par `supabase/seed/scale_meta_seed.sql`. Le service `scaleService.ts` expose `fetchScaleMeta()`.

### Pourquoi `module_content_fields` (ancien libellé conservé pour contexte)

Les métadonnées des échelles cliniques **appartiennent à `module_content_fields`**, pas à un fichier TypeScript statique ni à des colonnes supplémentaires sur `modules`.

**Pourquoi `module_content_fields` et non pas des colonnes sur `modules` :**

`module_content_fields` sert **deux usages simultanés** :
1. **Mobile patient** — le `FieldRenderer` lit les champs pour construire les écrans de saisie (`ScaleEntryScreen`)
2. **Web praticien** — le `ModuleRenderer` lit les mêmes champs pour générer l'aperçu dans `ModulePreviewPanel`

Les métadonnées d'une échelle (description clinique, population cible, type d'évaluation) font partie de ce contenu de module — elles ont leur place naturelle dans `module_content_fields`, avec un `field_type` dédié : `'scale_meta'`.

Ajouter une échelle devient alors un **INSERT en base uniquement**, sans redéploiement frontend.

### Schéma `field_type: 'scale_meta'`

Un champ `scale_meta` correspond à **un enregistrement dans `module_content_fields`** :

| Colonne | Valeur |
|---|---|
| `module_id` | UUID du module (ex. `phq9`) |
| `field_type` | `'scale_meta'` |
| `text_code` | Clé i18n de la **description clinique** (ex. `modules.phq9.description`) |
| `sort_order` | `0` — affiché en premier dans la carte |

Les attributs structurés sont stockés dans **`field_props`** (une ligne par attribut) :

| `prop_key` | `prop_value` (type text) | Rôle |
|---|---|---|
| `evaluation_type` | `'auto'` ou `'hetero'` | Badge Auto / Hétéro dans `ScaleMetaBadges` |
| `target_age_1`, `target_age_2`, … | `'ado'`, `'adulte'` (clés indexées atomiques) | Chips de population colorés via `AGE_BADGE_CONFIG` ; lus par `collectIndexed(props, 'target_age')` |
| `validated_age_range` | `'≥ 18 ans'` | Plage d'âge validée en texte libre |
| `no_toggle` | `'true'` ou `'false'` | Si `'true'` : remplace le toggle par un bouton d'action custom (ex. C-SSRS) |
| `reference_label` | `'Kroenke et al., 2001'` | Label de la référence bibliographique |
| `reference_url` | URL vers la publication | Lien vers la source |

La clé i18n `modules.<id>.full_title` porte le titre complet de l'échelle (ex. `"Patient Health Questionnaire-9"`). La clé `modules.<id>.label` (déjà utilisée par le moteur générique) porte le nom court.

### Comportement `no_toggle`

```
no_toggle = 'false' (défaut) → toggle standard unlock/revoke → crée/supprime un patient_module en base
no_toggle = 'true'           → bouton d'action custom → ouvre un panel dédié (ex. C-SSRS)
```

### Ajouter une nouvelle échelle

1. `INSERT` dans `module_content_fields` : `field_type = 'scale_meta'`, `text_code = 'modules.<id>.description'`
2. `INSERT` dans `field_props` : `evaluation_type`, `target_age_1`/`target_age_2`/… (une ligne par âge, jamais de tableau JSON packé), `validated_age_range`, `no_toggle`, `reference_label`, `reference_url`
3. Ajouter les clés i18n `modules.<id>.label`, `modules.<id>.full_title`, `modules.<id>.description` dans `fr/common.json` et `en/common.json`
4. Ajouter la config scoring dans `SCALE_SCORING` (`apps/mobile/src/lib/scaleScoring.ts`)
5. Ajouter les clés `modules.<id>.*` (questions, options) dans `fr/teen.json` et `en/teen.json`
6. Ajouter l'entrée dans `GENERIC_SCALE_TYPES` et `MODULE_CONFIG` dans `HomeScreen.tsx`

> Si l'échelle a une logique conditionnelle (branches, scores intermédiaires) : `no_toggle: true` + écran dédié côté mobile plutôt que `ScaleEntryScreen` générique.

> Règle : ne jamais livrer un module mobile sans son pendant web. Un module invisible dans l'armoire praticien ne peut pas être débloqué.
