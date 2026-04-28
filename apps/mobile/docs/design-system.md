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

## StyleSheet — règles

- Tout style dans `StyleSheet.create({})` — jamais de style inline `style={{}}` ad hoc
- Noms en camelCase courts : `row`, `label`, `chip`, `track`, `badge`
- Objets de style statiques déclarés en dehors du composant (module level)
- Styles dynamiques (props/state) calculés avec `useMemo` ou passés via tableau : `[styles.base, active && styles.active]`

---

## Composants primitifs

### Button (`src/components/Button/`)

| Variante | Fond | Bordure | Texte |
|---|---|---|---|
| `primary` | `colors.primary` | — | `colors.white` |
| `secondary` | `colors.primaryLight` | `colors.primary` (1.5px) | `colors.primary` |
| `ghost` | transparent | — | `colors.primary` |
| `danger` | `#FEE2E2` | `colors.danger` (1px) | `colors.danger` |

Taille de base : `paddingVertical: 12`, `paddingHorizontal: 24`, `borderRadius: 10`, `minHeight: 50`

### Card (`src/components/Card/`)

| Variante | Fond | Bordure | Ombre |
|---|---|---|---|
| `default` | `colors.card` | `colors.border` (1px) | — |
| `outlined` | `colors.card` | `colors.primary` (2px) | — |
| `elevated` | `colors.card` | `colors.border` (1px) | `shadows.md` |
| `active` | `colors.primaryLight` | `colors.primary` (1px) | — |

Base : `borderRadius: 10`, `padding: 16`, `gap: 8`

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

Chemin : `src/components/ModuleRenderer/fields/widgets/<Widget>/<Widget>.tsx`

---

## Teen Mode

Adapte l'interface pour les patients adolescents. Activé par le praticien, jamais par le patient.

### Architecture

| Fichier | Rôle |
|---|---|
| `src/theme/teen.ts` | Couleurs vives par module + textes adulte/ado |
| `src/hooks/useTeen.ts` | Hook `useTeen()` — lit le store auth |
| `src/components/TeenAccent.tsx` | Bande colorée 4px en haut de l'écran |
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
import { TeenAccent } from '../../components/TeenAccent'

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
│   └── ModuleRenderer/
│       ├── FieldRenderer.tsx             # dispatch preview_kind → layout
│       └── fields/
│           ├── index.ts
│           ├── types.ts                  # FieldProps interface
│           ├── renderInlineChildren.tsx
│           ├── FieldRow/                 # header vertical + FieldWidget
│           ├── FieldWidget/              # dispatch widget_type → widget
│           ├── FieldText/
│           ├── FieldListItem/
│           ├── CardDefinition/
│           ├── CardDivider/
│           ├── CardInline/
│           ├── NullField/
│           └── widgets/
│               ├── index.ts
│               ├── TimeWidget/
│               ├── SliderWidget/
│               ├── StarsWidget/
│               ├── BooleanWidget/
│               ├── RadioWidget/
│               ├── DateWidget/
│               ├── TextWidget/
│               ├── CheckboxWidget/
│               ├── TextareaWidget/
│               └── InfoWidget/
```

Chaque dossier de widget contient : `Widget.tsx` + `Widget.test.tsx` + `index.ts`.
