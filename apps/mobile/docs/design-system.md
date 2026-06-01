# Design System — App mobile patient

> Tokens partagés → `DESIGN_SYSTEM.md` à la racine du monorepo.

## Barrel theme local

`apps/mobile/src/theme/index.ts` re-exporte `@psytool/shared` et ajoute les objets propres à React Native :

```ts
import { colors, spacing, radius, fontSize } from '@psytool/shared'

export const typography = {
  h1:      { fontSize: 28, fontWeight: '700', color: colors.text },
  h2:      { fontSize: 22, fontWeight: '700', color: colors.text },
  h3:      { fontSize: 18, fontWeight: '600', color: colors.text },
  body:    { fontSize: 16, fontWeight: '400', color: colors.text },
  caption: { fontSize: 14, fontWeight: '400', color: colors.textMuted },
}

export const shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
}
```

Import dans les composants : `import { colors, spacing, radius } from '../../theme'`  
(chemin relatif depuis le fichier — jamais `@psytool/shared` directement dans le mobile)

---

## Architecture des composants — `ui/` vs `features/`

`src/components/` est divisé en deux sous-dossiers :

| Dossier | Rôle |
|---|---|
| `components/ui/` | Primitives design system — Accordion, Button, Card, ConfirmDialog, ActionSheet, Divider, EmptyState, InputField, PipPicker, SectionDateList, StatusBadge, Toast |
| `components/features/` | Composants métier — Chart, DisclaimerBanner, InlineText, ModuleRenderer, NotificationRoutinePanel, PsyEduBlockRenderer, TeenAccent |

**Règle de dépendance : `features → ui` uniquement.**

Imports types selon la couche :
```ts
// Design system (ui/) — chemin depuis un écran
import Button from '../components/ui/Button'
import { Card } from '../components/ui/Card'

// Métier (features/) — chemin depuis un écran
import { TeenAccent } from '../components/features/TeenAccent'
import { FieldRenderer } from '../components/features/ModuleRenderer'
```

---

## Quand créer un composant vs utiliser les tokens directement

Un composant se justifie quand il encapsule du **comportement** (états, interactions, animations) ou une **structure réutilisable** (layout, accessibilité, logique conditionnelle).

Un style simple répété → **style inline avec tokens**, pas un composant :

```ts
// ✅ Correct — deux tokens, pas de composant
<Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted }}>Activité</Text>

// ❌ Sur-abstraction
<SectionLabel>Activité</SectionLabel>
```

Règle : si le composant n'a que `children: string` + `style?: ViewStyle` et ne contient aucune logique, c'est un style, pas un composant.

---

## StyleSheet — règles

- Tout style dans `StyleSheet.create({})` — jamais de style inline `style={{}}` ad hoc
- Noms en camelCase courts : `row`, `label`, `chip`, `track`, `badge`
- Objets de style statiques déclarés en dehors du composant (module level)
- Styles dynamiques (props/state) calculés avec `useMemo` ou passés via tableau : `[styles.base, active && styles.active]`

---

## Composants primitifs

### Convention de fichiers

Chaque composant partagé vit dans son propre dossier `ComponentName/` :

```
ComponentName/
  ComponentName.tsx       # composant React (React.memo)
  ComponentName.types.ts  # interface Props exportée
  ComponentName.styles.ts # StyleSheet.create() isolé
  ComponentName.test.tsx  # tests RNTL
  index.ts                # re-export (export { X } from './X'; export type ...)
```

Jamais de composant `.tsx` plat à la racine de `src/components/` — toujours dans un dossier.

---

### Button (`src/components/Button/`)

| Variante | Fond | Bordure | Texte |
|---|---|---|---|
| `primary` | `colors.primary` | — | `colors.white` |
| `secondary` | `colors.primaryLight` | `colors.primary` (1.5px) | `colors.primary` |
| `ghost` | transparent | — | `colors.primary` |
| `danger` | `#FEE2E2` | `colors.danger` (1px) | `colors.danger` |

Taille de base : `paddingVertical: 12`, `paddingHorizontal: 24`, `borderRadius: 10`, `minHeight: 50`

### Divider (`src/components/Divider/`)

Séparateur horizontal — `height: 1, backgroundColor: colors.border`.

Prop `inset?: number` pour retrait horizontal optionnel (ex. dans une liste de réglages avec bords).

### Card (`src/components/Card/`)

| Variante | Fond | Bordure | Ombre |
|---|---|---|---|
| `default` | `colors.card` | `colors.border` (1px) | — |
| `outlined` | `colors.card` | `colors.primary` (2px) | — |
| `elevated` | `colors.card` | `colors.border` (1px) | `shadows.md` |
| `active` | `colors.primaryLight` | `colors.primary` (1px) | — |

Base : `borderRadius: 10`, `padding: 16`, `gap: 8`

---

### PipPicker (`src/components/PipPicker/`)

Sélecteur de valeur numérique à pips. Deux variantes visuelles :

| Variante | Rendu | Usage |
|---|---|---|
| `numbered` (défaut) | boutons carrés bordés avec le chiffre, seul le sélectionné est mis en évidence | `mood_tracker` (1–10), `fear_thermometer` (0–100 par 10) |
| `track` | segments fins formant une barre de progression (fill cumulatif) | `behavioral_activation` (0–10), `beck_columns` (0–100 par 10) |

Props clés : `value: number | null`, `steps: number[]`, `color: string`, `showHeader?: boolean` (défaut `true` — `false` si le parent gère son propre header), `showEndLabels?: boolean`.

---

## Widgets du ModuleRenderer

Visuels en lecture seule — rendu dans `FieldWidget`, identique à la version web mais en React Native.

| Widget | Aperçu visuel | Spec |
|---|---|---|
| `TimeWidget` | Chip `[⏱ 22:00]` avec bordure | `"time"` |
| `SliderWidget` | Track 4px fill/empty + thumb + valeur médiane | `"slider:min:max:unit"` |
| `StarsWidget` | N icônes `star` / `star-outline` Ionicons | `"stars:N"` |
| `BooleanWidget` | Deux pills `[Non] [Oui]`, "Non" actif | `"boolean"` |
| `RadioWidget` | Badge coloré avec icône (`ok`=vert, `partial`=ambre, `miss`=rouge) | `"radio:variant"` |
| `DateWidget` | Chip `[📅 jj/mm/aaaa]` | `"date"` |
| `TextWidget` | `View` vide h=32 avec bordure | `"text"` |
| `CheckboxWidget` | `[□ Non accompli]` opacité 0.7 | `"checkbox"` |
| `TextareaWidget` | `View` vide h=52 avec bordure, opacité 0.5 | `"textarea"` |
| `InfoWidget` | Icône `reorder-four-outline` + texte italique muted | `"info"` |

Chemin : `src/components/features/ModuleRenderer/fields/widgets/<Widget>/<Widget>.tsx`

---

## Layouts du ModuleRenderer

Le moteur de rendu de module est entièrement éclaté en composants à
**responsabilité unique** — un fichier = un composant. Chaque `preview_kind`
est rendu par un **layout** dédié, vivant dans son propre dossier.

### Le moteur — dossier `FieldRenderer/`

`src/components/features/ModuleRenderer/FieldRenderer/`

| Fichier | Responsabilité unique |
|---|---|
| `FieldRenderer.tsx` | Point d'entrée — extrait le `disclaimer_banner`, délègue au dispatcher |
| `LayoutDispatcher.tsx` | Route un `preview_kind` vers son layout |
| `partitionBySection.ts` | Helper pur — répartit les fields par `section_id` (`{ sections, unsectioned }`) |
| `types.ts` | `FieldRendererProps`, `QuestionnaireInteraction` |
| `index.ts` | Re-exports publics (`FieldRenderer`, types) |

> **Règle :** ne jamais ajouter de logique de layout, de groupement de fields
> ou de rendu de widget dans `FieldRenderer.tsx` / `LayoutDispatcher.tsx`.
> Le dispatcher reste une simple table de routage `preview_kind → layout`.

### Convention d'un layout

`src/components/features/ModuleRenderer/layouts/<Nom>/`

| Fichier | Rôle |
|---|---|
| `<Nom>Layout.tsx` | Le composant de layout, et lui seul |
| `styles.ts` | Le `StyleSheet` du layout |
| `index.ts` | Re-export `{ <Nom>Layout }` + son type de props |
| `<SousComposant>.tsx` | Une pièce extraite, si nécessaire (optionnel) |

### Catalogue des layouts

Tout layout est réutilisable : un même layout sert plusieurs modules via leur
`preview_kind`. Pour ajouter un module, on réutilise un layout existant — on
n'en crée un nouveau qu'en dernier recours.

| `preview_kind` | Dossier | Composant | Rôle | Persistance |
|---|---|---|---|---|
| `steps` | `Steps/` | `StepsLayout` | Étapes numérotées (lecture seule) | — |
| `cards` | `Cards/` | `CardsLayout` | Cartes accordéon dépliables (lecture seule) | — |
| `fields` | `Fields/` | `FieldsLayout` | Lignes clé/valeur + note de bas de page (lecture seule) | — |
| `questionnaire` | `Questionnaire/` | `QuestionnaireLayout` | Échelle clinique interactive (Likert / slider à pips) | parent (`ScaleEntryScreen`) |
| `guided_exercise` | `GuidedExercise/` | `GuidedExerciseLayout` | Exercice guidé — 3 modes intro / guided / done | — |
| `patient_scenario` | `PatientScenario/` | `PatientScenarioLayout` | Scénario alternatif par patient (RIM) | Supabase (`patient_modules.config`) |
| `editable_steps` | `EditableSteps/` | `EditableStepsLayout` | Plan éditable par sections (crisis_plan) | SQLite `plan_items` |
| `daily_checkin` | `DailyCheckin/` | `DailyCheckinLayout` | Saisie quotidienne — 1 statut / jour, 2 onglets | SQLite `daily_entries` |
| `column_form` | `ColumnForm/` | `ColumnFormLayout` | Formulaire à colonnes hétérogènes (beck_columns) | SQLite `form_entries` |
| `tree_selector` | `TreeSelector/` | `TreeSelectorLayout` | Sélecteur d'arbre hiérarchique guidé (emotion_wheel) | SQLite `tree_selections` |
| `sleep_journal` | `SleepJournal/` | `SleepJournalLayout` | Agenda du sommeil — 3 modes list / entry / month | SQLite `sleep_diary_entries` |
| `tabbed` | `Tabs/` | `TabsLayout` | Onglets génériques — rend récursivement `FieldRenderer` | — |
| `crisis_urgency` | `CrisisUrgency/` | `CrisisUrgencyLayout` | Mode urgence 1-tap (gros boutons d'appel) | — |
| `activity_log` | `ActivityLog/` | `ActivityLogLayout` | Journal d'activités (Plaisir / Maîtrise) | SQLite `activity_records` |
| `exposure_tracker` | `ExposureTracker/` | `ExposureTrackerLayout` | Thermomètre de la peur (SUDS avant / après) | SQLite `fear_situations` |
| `decision_grid` | `DecisionGrid/` | `DecisionGridLayout` | Balance décisionnelle 2×2 + items pondérés | SQLite `plan_items` |
| `psyedu` | `PsyEdu/` | `PsyEduLayout` | Fiches psychoéducatives | Supabase (`psyedu_topics` / `psyedu_blocks`) |
| `chrono_month` | `ChronoMonth/` | `ChronoMonthLayout` | Grille calendrier chronobiologie | SQLite `chrono_entries` |
| `exposure_hierarchy` | `ExposureHierarchy/` | `ExposureHierarchyLayout` | Hiérarchie d'exposition graduée | SQLite `exposure_hierarchies` |

> `coming_soon` et tout `preview_kind` inconnu rendent `null`.

### Composants réutilisables partagés — `layouts/shared/`

| Composant | Rôle | Réutilisé par |
|---|---|---|
| `EditableItemsList` | Liste d'items CRUD inline (avec poids optionnel) | `editable_steps`, `decision_grid` |
| `WeightPicker` | Sélecteur de poids 1–5 étoiles | `EditableItemsList` |
| `ExerciseSafetySection` | Encart rouge de numéros d'urgence cliquables (`tel:`) | `guided_exercise`, `patient_scenario` |

### Sous-composants de layout

| Composant | Dossier | Rôle |
|---|---|---|
| `ColumnTimeField` | `ColumnForm/` | Champ TimePicker « HH:MM » optionnel, mémoïsé |
| `renderCardBodyFields` | `Cards/` | Rend le corps d'une carte (registry des `field_type` de carte) |
| `ActivityListCard` | `ActivityLog/` | Carte d'une activité dans la liste |
| `EntryListCard` | `ExposureTracker/` | Carte d'une saisie SUDS |

### Ajouter un nouveau layout

1. Créer `layouts/<Nom>/` : `<Nom>Layout.tsx` + `styles.ts` + `index.ts`.
2. Ajouter le cas de routage dans `FieldRenderer/LayoutDispatcher.tsx`.
3. Ajouter le `preview_kind` au type `PreviewKind` (`services/moduleService`).
4. Documenter le layout dans le catalogue ci-dessus **dans le même commit**.

### Conformité MDR 2017/745

Tous les layouts respectent la règle d'or : **affichage de valeurs brutes, zéro
interprétation**. Les couleurs (qualité de sommeil, pastilles de statut) sont
des conventions d'affichage fournies par la base, jamais des verdicts cliniques.

---

## Teen Mode

Adapte l'interface pour les patients adolescents. Activé par le praticien, jamais par le patient.

### Architecture

| Fichier | Rôle |
|---|---|
| `src/theme/teen.ts` | Couleurs vives par module + textes adulte/ado |
| `src/hooks/useTeen.ts` | Hook `useTeen()` — lit le store auth |
| `src/components/features/TeenAccent.tsx` | Bande colorée 4px en haut de l'écran |
| `src/store/authStore.ts` | Champ `teenMode: boolean` chargé au login |

### Couleurs par module (`TEEN_MODULE_COLORS`)

| Modules | Couleur |
|---|---|
| crisis_plan, therapeutic_commitment, distress_tolerance | `#FF4D6D` (rose) |
| medication_side_effects, medication_adherence, psychoeducation | `#8B5CF6` (violet) |
| sleep_diary, diet_weight_psycho, chronobiology_tracker | `#06B6D4` (cyan) |
| mood_tracker, emotion_wheel, behavioral_activation | `#F97316` (orange) |
| beck_columns, cognitive_distortions, grounding, rim | `#10B981` (menthe) |
| fear_thermometer, exposure_hierarchy, breathing_techniques, cognitive_saturation | `#F59E0B` (or) |
| craving_journal, decisional_balance | `#EC4899` (fuchsia) |
| (défaut) | `#6366F1` (indigo) |

### API du hook `useTeen()`

```ts
const { isTeenMode, tt, tg, teenColor } = useTeen()

isTeenMode          // boolean — actif ou non
tt('module', 'key') // texte adapté adulte/ado depuis TEEN_MODULE_TEXTS
tg('key')           // texte global adapté
teenColor('module') // string | undefined — couleur vive si isTeenMode, sinon undefined
```

### Intégration dans un nouvel écran de module

```tsx
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/features/TeenAccent'

export function MonModuleScreen() {
  const { teenColor } = useTeen()
  return (
    <SafeAreaView>
      <TeenAccent color={teenColor('mon_module')} />
      {/* contenu */}
    </SafeAreaView>
  )
}
```

### Mock obligatoire dans les tests

```ts
jest.mock('../../hooks/useTeen', () => ({
  useTeen: () => ({
    isTeenMode: false,
    tt: () => '',
    tg: () => '',
    teenColor: () => undefined,
  }),
}))
```

---

## Structure des fichiers

```
apps/mobile/src/
├── theme/
│   ├── index.ts          # barrel — re-exporte shared + typography + shadows
│   └── teen.ts           # TEEN_MODULE_COLORS + TEEN_MODULE_TEXTS
├── hooks/
│   └── useTeen.ts        # hook teen mode
├── components/
│   ├── TeenAccent.tsx    # bande colorée 4px
│   ├── Button/           # variantes primary/secondary/ghost/danger
│   ├── Card/             # variantes default/outlined/elevated/active
│   └── features/ModuleRenderer/
│       ├── FieldRenderer/               # moteur — un fichier = une responsabilité
│       │   ├── FieldRenderer.tsx        # entrée : extrait disclaimer, délègue
│       │   ├── LayoutDispatcher.tsx     # routage preview_kind → layout
│       │   ├── partitionBySection.ts    # helper pur de groupement par section
│       │   ├── types.ts                 # FieldRendererProps, QuestionnaireInteraction
│       │   └── index.ts
│       ├── layouts/                     # un dossier par layout (preview_kind)
│       │   ├── Steps/ Fields/ Cards/ Questionnaire/ GuidedExercise/
│       │   ├── PatientScenario/ EditableSteps/ DailyCheckin/ ColumnForm/
│       │   ├── TreeSelector/ SleepJournal/ Tabs/ CrisisUrgency/
│       │   ├── ActivityLog/ ExposureTracker/ DecisionGrid/ PsyEdu/
│       │   ├── ChronoMonth/ ExposureHierarchy/
│       │   └── shared/                  # EditableItemsList, WeightPicker, ExerciseSafetySection
│       └── fields/                      # field_type → composant + widgets
│           ├── FieldRow/ FieldWidget/ FieldText/ FieldListItem/
│           ├── CardDefinition/ InlineText/ CrisisUrgencyContactsWidget/
│           └── widgets/                 # TimeWidget, SliderWidget, … (10 widgets)
```

Chaque dossier de layout contient : `<Nom>Layout.tsx` + `styles.ts` + `index.ts`.
Chaque dossier de widget contient : `Widget.tsx` + `Widget.test.tsx` + `index.ts`.
