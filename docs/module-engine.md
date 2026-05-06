# Moteur de définition de module — PsyTool

Ce document décrit le circuit complet : base de données → service → moteur de rendu → composants React/React Native.

---

## Vue d'ensemble

```
supabase/schema.sql
  ├── modules            (1 ligne par module, pilote le layout)
  ├── module_content_fields  (1 ligne par champ de contenu)
  └── field_props        (props React attachées à chaque champ)
          ↓
apps/web/src/lib/moduleService.ts  (fetchModuleFields)
apps/mobile/src/lib/moduleService.ts  (même API)
          ↓
ContentField[]  (arbre typé, props hydratées)
          ↓
FieldRenderer  (dispatch preview_kind → layout)
  ├── StepsLayout
  ├── FieldsLayout
  ├── Grid2x2Layout
  └── CardsLayout
          ↓
FieldRow → FieldWidget → TimeWidget / SliderWidget / ...
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
| `fields` | Grille de champs avec widget | `sleep_diary`, `medication_adherence` |
| `grid2x2` | Matrice 2×2 | `decisional_balance` |
| `cards` | Accordéon de cartes dépliables | `psychoeducation` |
| `questionnaire` | Questionnaire clinique interactif (ScaleEntryScreen) | `phq9`, `gad7`, `bsl23`, `snap_iv`, `asrs6`, `asrs18`, `mood_tracker` |
| `guided_exercise` | Exercice guidé pas-à-pas (timer, multi-étapes) | `cognitive_saturation` |
| `patient_scenario` | Scénario RIM patient (lecture scénario + sons + urgence) | `rim` |
| `editable_steps` | Étapes éditables par le patient (Plan de crise) | `crisis_plan` |
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

**`field_type`** — les 22 valeurs reconnues :

| `field_type` | Composant React | Contexte |
|---|---|---|
| `field_row` | `FieldRow` | Champ de saisie dans layout `fields` |
| `step_title` | `FieldText` | Titre d'une étape dans layout `steps` |
| `step_hint` | `FieldText` | Sous-titre d'une étape |
| `quadrant_title` | `FieldText` | Titre d'un quadrant dans `grid2x2` |
| `quadrant_subtitle` | `FieldText` | Sous-titre d'un quadrant |
| `card_title` | `FieldText` | Titre d'une carte accordéon |
| `card_summary` | `FieldText` | Résumé affiché dans le header fermé |
| `card_heading_2` | `FieldText` | `<h2>` / texte gras grand |
| `card_heading_3` | `FieldText` | `<h3>` |
| `card_heading_4` | `FieldText` | `<h4>` |
| `card_paragraph` | `FieldText` | Paragraphe courant |
| `card_paragraph_bold` | `FieldText` | Paragraphe gras |
| `card_italic_note` | `FieldText` | Note en italique |
| `card_callout` | `FieldText` | Encart coloré (bordure gauche) |
| `card_list_item` | `FieldListItem` | Puce `•` groupée en `<ul>` |
| `card_numbered_item` | `FieldListItem` | Item numéroté groupé en `<ol>` |
| `card_definition` | `CardDefinition` | Terme + définition |
| `card_divider` | `CardDivider` | Séparateur horizontal |
| `footer_note` | `FieldText` | Note de bas de panel (filtrée, affichée séparément) |
| `module_label` | `NullField` | Silencieux — filtré avant rendu |
| `module_description` | `NullField` | Silencieux — filtré avant rendu |
| `coming_soon` | `NullField` | Silencieux |
| `scale_instruction` | `Text` inline | Bloc intro dans layout `questionnaire` |
| `scale_option` | `LikertWidget` (option) | Choix de réponse Likert — prop `value` obligatoire |
| `scale_legend_item` | Légende numérique | BSL-23 — valeur + libellé affiché sous instructions — prop `value` obligatoire |
| `scale_warning` | Bandeau jaune | SNAP-IV — avertissement hétéro-évaluation |
| `scale_section` | En-tête de section | SNAP-IV (Inattention / HI / TOD), ASRS-18 (Partie A / B) |
| `scale_question` | Question + `LikertWidget` | Chaque item du questionnaire — indexé dans l'ordre `sort_order` |
| `scale_slider_question` | Question + pips numériques | Sélecteur pip 1–N — props `min`, `max`, `color`, `icon`, `low_hint_code`, `high_hint_code` — ex. `mood_tracker` |
| `scale_number_input` | Champ numérique libre | Saisie numérique clavier — prop `subscale_key` |
| `scale_text_input` | Champ texte libre | Notes libres — prop `placeholder_code`, `subscale_key` |
| `exercise_title` | Titre de l'exercice | Layout `guided_exercise` — écran intro |
| `exercise_intro` | Paragraphe intro | Layout `guided_exercise` — plusieurs lignes possibles |
| `exercise_start_btn` | Label bouton démarrer | Layout `guided_exercise` — texte du bouton Démarrer |
| `exercise_next_btn` | Label bouton suivant | Layout `guided_exercise` — texte du bouton Suivant |
| `exercise_finish_btn` | Label bouton terminer | Layout `guided_exercise` |
| `exercise_stop_btn` | Label bouton annuler | Layout `guided_exercise` |
| `exercise_done_text` | Texte écran fin | Layout `guided_exercise` |
| `exercise_safety_title` | Titre section urgence | Layouts `guided_exercise`, `patient_scenario` |
| `exercise_safety` | Entrée urgence cliquable | Layouts `guided_exercise`, `patient_scenario` — props `phone`, `icon` |
| `rim_disclaimer` | Disclaimer RIM | Layout `patient_scenario` |
| `rim_step` | Étape protocole RIM | Layout `patient_scenario` — prop `step_number` |
| `ambient_sound` | Bouton son d'ambiance | Layout `patient_scenario` — props `key`, `icon`, `available` |

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
| `widget_type` | `"slider:0:120:min"` | `FieldRow` → `FieldWidget` |
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
| `key` | `"pluie"` | `ambient_sound` — identifiant du fichier audio |
| `available` | `"false"` | `ambient_sound` — `"false"` → badge "Bientôt" |

**Format `widget_type` :**

```
"time"              → TimeWidget
"slider:0:120:min"  → SliderWidget  (min, max, unité)
"stars:5"           → StarsWidget   (nombre d'étoiles)
"boolean"           → BooleanWidget
"radio:ok"          → RadioWidget   (variante: ok | partial | miss)
"date"              → DateWidget
"text"              → TextWidget
"checkbox"          → CheckboxWidget
"textarea"          → TextareaWidget
"info"              → InfoWidget    (texte via detail_code)
```

---

## 2. Service — `fetchModuleFields`

Fichiers :
- `apps/web/src/lib/moduleService.ts`
- `apps/mobile/src/lib/moduleService.ts`

Les deux fichiers sont **identiques** — même interface `ContentField`, même algorithme en 3 passes. Ils ne sont pas mutualisés dans `packages/shared/` car chacun importe son propre client Supabase (`./supabase`). À terme, extraire vers `packages/shared/` si un client partagé est introduit.

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

Fichiers :
- Web : `apps/web/src/components/ModuleRenderer/FieldRenderer.tsx`
- Mobile : `apps/mobile/src/components/ModuleRenderer/FieldRenderer.tsx`

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
'grid2x2'         → Grid2x2Layout       (groups par section_id, quadrant_title/quadrant_subtitle)
'questionnaire'   → QuestionnaireLayout (mobile uniquement — ScaleEntryScreen pilote les réponses)
'guided_exercise' → GuidedExerciseLayout (mobile uniquement — machine d'état intro/guided/done)
'patient_scenario'→ PatientScenarioLayout (mobile uniquement — scénario RIM + sons + urgence)
'editable_steps'  → EditableStepsLayout (mobile uniquement — étapes éditables, Crisis Plan)
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
  card_heading_2:      FieldText,
  card_heading_3:      FieldText,
  card_heading_4:      FieldText,
  card_italic_note:    FieldText,
  card_list_item:      FieldListItem,
  card_numbered_item:  FieldListItem,
  card_paragraph:      FieldText,
  card_paragraph_bold: FieldText,
  coming_soon:         NullField,
  module_description:  NullField,
  module_label:        NullField,
}
// card_inline_bold et card_inline_text ne sont PAS dans ce registre —
// rendus via renderInlineChildren() sur les champs enfants.
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

Dispatcher pur — aucun état, aucun style propre. Prend `widgetType: string` et retourne le composant widget correspondant.

### Widgets (`fields/widgets/`)

Composants de prévisualisation **en lecture seule** — ils montrent au praticien à quoi ressemblera le formulaire patient sans être interactifs. Chaque widget est dans son propre dossier `WidgetName/` avec son test et son `index.ts`.

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

> Règle : ne jamais livrer un module mobile sans son pendant web. Un module invisible dans l'armoire praticien ne peut pas être débloqué.
