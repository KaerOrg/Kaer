# Design System — App mobile patient

> Tokens partagés → `DESIGN_SYSTEM.md` à la racine du monorepo.

## Barrel theme local

`apps/mobile/src/theme/index.ts` re-exporte `@kaer/shared` et ajoute les objets propres à React Native :

```ts
import { colors, spacing, radius, fontSize } from '@kaer/shared'

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

Import dans les composants : `import { colors, spacing, radius } from '@theme'`
(jamais `@kaer/shared` directement dans le mobile).

---

## Alias d'import

Deux alias de chemin sont configurés pour éviter les imports relatifs profonds
(`../../../../../ui/...`). Ils sont déclarés au même endroit dans la chaîne d'outils :

| Alias | Cible | Exemple |
|---|---|---|
| `@ui/*` | `src/components/ui/*` | `import { Chip } from '@ui/Chip'` |
| `@theme` | `src/theme` (barrel) | `import { colors, spacing } from '@theme'` |

Trois points de configuration doivent rester synchronisés :

- **`tsconfig.json`** → `compilerOptions.paths` (résolution TypeScript). Pas de `baseUrl`
  (déprécié TS 7.0) : les chemins sont relatifs au dossier du `tsconfig`, préfixés `./`.
- **Metro** lit nativement `compilerOptions.paths` (Expo SDK 54) — aucun plugin Babel requis.
- **`package.json` → `jest.moduleNameMapper`** (résolution des tests).

Ajouter un nouvel alias = mettre à jour ces trois endroits dans le même commit.

---

## Architecture des composants — `ui/` vs `features/`

`src/components/` est divisé en deux sous-dossiers :

| Dossier | Rôle |
|---|---|
| `components/ui/` | Primitives design system — Button, Card, Chart, Checkbox, Chip, ConfirmDialog, ActionSheet, EmptyState, InputField, Radio, RatingSelector, TimePicker, StatusBadge, Toast |
| `components/features/` | Composants métier — DimensionTrackerView, DisclaimerBanner, InlineText, ModuleRenderer, NotificationRoutinePanel, PsyEduBlockRenderer, TeenAccent, TodaySchedule |

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

| Taille | paddingV | paddingH | minHeight | label |
|---|---|---|---|---|
| `md` (défaut) | 12 | 24 | 50 | 16 |
| `sm` | 8 | 16 | 36 | 14 |

`borderRadius: 10` dans les deux cas. La taille ne porte **que** les dimensions ; la
couleur reste pilotée par `variant`. `sm` sert aux actions inline compactes (ex. le
« pont effets indésirables » de MedicationTracker) sans réécrire un `Pressable` ad hoc.

| Prop | Type | Rôle |
|---|---|---|
| `label` | `string` | Texte du bouton. **Optionnel** : sans libellé, le bouton est « icône seule » (rendu compact, sans le chrome CTA) |
| `onPress` | `() => void` | Callback (obligatoire) |
| `variant` | `ButtonVariant` | Variante visuelle (défaut `'primary'`) |
| `size` | `ButtonSize` | Taille `'sm'` ou `'md'` (défaut `'md'`) |
| `loading` | `boolean` | Affiche un spinner à la place du label |
| `disabled` | `boolean` | Désactive le bouton |
| `style` | `ViewStyle` | Style additionnel (ex. override `backgroundColor` pour couleur d'accent) |
| `iconLeft` | `ReactNode` | Nœud affiché à gauche du label, ou seul contenu en mode icône seule |
| `accessibilityLabel` | `string` | Libellé d'accessibilité — **obligatoire en mode icône seule** (pas de texte visible) |

**Bouton icône seule** (retour, navigation, action à icône) : ne pas écrire un
`Pressable + MaterialCommunityIcons` ad hoc — utiliser `Button` sans `label`, avec
`variant="ghost"`, `iconLeft` et `accessibilityLabel`. Le mode icône seule annule le
padding/hauteur CTA et ajoute un `hitSlop`.

```tsx
<Button
  variant="ghost"
  onPress={onBack}
  accessibilityLabel={t('common.back')}
  iconLeft={<MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />}
/>
```

### Card (`src/components/Card/`)

| Variante | Fond | Bordure | Ombre |
|---|---|---|---|
| `default` | `colors.card` | `colors.border` (1px) | — |
| `outlined` | `colors.card` | `colors.primary` (2px) | — |
| `elevated` | `colors.card` | `colors.border` (1px) | `shadows.md` |
| `active` | `colors.primaryLight` | `colors.primary` (1px) | — |

Base : `borderRadius: 10`, `padding: 16`, `gap: 8`

| Prop | Type | Rôle |
|---|---|---|
| `header` | `{ title, subtitle?, icon? }` | En-tête optionnel |
| `actions` | `ReactNode` | Zone d'actions (coins droits — ex. icônes crayon/poubelle) |
| `children` | `ReactNode` | Contenu principal |
| `variant` | `'default' \| 'outlined' \| 'elevated' \| 'active'` | Style visuel (défaut `'default'`) |
| `accentColor` | `string` | Couleur de bordure d'accentuation |
| `onPress` | `() => void` | Rend la carte pressable (`Pressable` au lieu de `View`) |
| `accessibilityLabel` | `string` | Label accessibilité quand `onPress` est fourni |

> **Règle : toute liste d'items tappables utilise `Card` avec `onPress`, jamais `Pressable + View` ad hoc.**

---

### RatingSelector (`src/components/ui/RatingSelector/`)

Sélecteur de note sur une échelle 1..N — **le contrôle de notation unique du design
system** (remplace l'ancien `PipPicker` et l'ancien `StarRating`). Trois variantes
visuelles pour un même besoin :

| Variante | Rendu | Usage |
|---|---|---|
| `numbered` (défaut) | boutons carrés bordés avec le chiffre, seul le sélectionné est mis en évidence | `mood_tracker` (1–10), `fear_thermometer` (0–100 par 10) |
| `track` | segments fins formant une barre de progression (fill cumulatif) | `behavioral_activation` (0–10), `beck_columns`, `activity_log` (plaisir/maîtrise) |
| `track` + `continuous` | jauge **continue** proportionnelle (fill + thumb) + valeur formatée, au lieu de N pips | aperçu d'un champ `slider:min:max` (`SliderWidget`) |
| `icon` | rangée d'icônes remplies jusqu'à la valeur (`star` ou `weather-sunny`) | `sleep_diary` (qualité de nuit, ressenti au réveil) |

> **Affichage = un mode, pas un composant à part.** Pour un rendu en lecture seule,
> passer `readonly` (toutes variantes) ou `continuous` (jauge) — on ne crée jamais de
> primitive « display-only » parallèle (ex. pas de `ValueBar`).

| Prop | Type | Rôle |
|---|---|---|
| `value` | `number \| null` | Valeur sélectionnée (`null` = aucune) |
| `steps` | `number[]` | Valeurs disponibles ; en `continuous`, `[min, max]` |
| `color` | `string` | Couleur d'accent (pip/track/icône/jauge remplis) |
| `label?` | `string` | Libellé + base d'accessibilityLabel (défaut `''`) |
| `sublabel?` | `string` | Sous-libellé optionnel |
| `readonly?` | `boolean` | Lecture seule : pips/icônes non interactifs (`View`, pas `Pressable`) |
| `continuous?` | `boolean` | Variante `track` : jauge proportionnelle au ratio `(value-min)/(max-min)` |
| `unit?` | `string` | Unité affichée après la valeur en `continuous` (ex. `"min"`) |
| `variant?` | `'numbered' \| 'track' \| 'icon'` | Habillage (défaut `numbered`) |
| `icon?` | `'star' \| 'weather-sunny'` | Icône de la variante `icon` (défaut `star`) |
| `iconSize?` | `number` | Taille des icônes (défaut 36) |
| `showHeader?` | `boolean` | `false` si le parent gère son propre header (défaut `true`) |
| `showEndLabels?` | `boolean` | Affiche min/max sous le track |
| `testIdPrefix?` | `string` | Chaque pip expose `${testIdPrefix}-${valeur}` |
| `onPress?` | `(value: number) => void` | Sélection (inutile en `readonly`/`continuous`) |

```tsx
// Notation par étoiles (agenda du sommeil)
<RatingSelector variant="icon" icon="star" steps={[1,2,3,4,5]} value={quality}
  color={colors.stars} label={lbl('quality_label')} showHeader={false}
  testIdPrefix="quality-star" onPress={setQuality} />

// Jauge continue en lecture seule (aperçu d'un champ slider 0–120 min)
<RatingSelector variant="track" continuous steps={[0, 120]} value={60}
  unit="min" color={colors.primary} showHeader={false} />
```

---

### TimePicker (`src/components/ui/TimePicker/`)

Saisie d'une heure « HH:MM » — **le picker horaire unique du design system**. Bouton à
icône + `DateTimePicker` natif (spinner iOS avec bouton de confirmation, picker natif
Android). Possède son propre état d'ouverture. Valeur échangée en `string` `'HH:MM'`
(`''` = non renseignée).

| Prop | Type | Rôle |
|---|---|---|
| `value` | `string` | Heure `'HH:MM'` (`''` = vide) |
| `onChange` | `(next: string) => void` | Émis avec la nouvelle heure (ou `''` à l'effacement) |
| `label?` | `string` | Libellé au-dessus du bouton |
| `icon?` | nom MCI | Icône du bouton (défaut `clock-outline`) |
| `placeholder?` | `string` | Texte quand `value` est vide |
| `confirmLabel` | `string` | Libellé de confirmation iOS |
| `hint?` | `string` | Indice à droite de la valeur |
| `clearable?` | `boolean` | Affiche une croix d'effacement si une valeur est posée |
| `clearLabel?` | `string` | accessibilityLabel de la croix |
| `accent?` | `string` | Couleur icône/valeur quand renseigné (défaut `colors.primary`) |
| `defaultHour?` / `defaultMinute?` | `number` | Heure initiale du picker quand vide (défaut 9:00) |
| `testID?` | `string` | Base : expose `${testID}`, `-button`, `-clear`, `-confirm` |

Utilisé par `sleep_diary` (4 horaires CSD) et `column_form` (via l'adaptateur
`ColumnTimeField`, qui mappe les `field_props` `key`/`optional`).

```tsx
<TimePicker value={bedtime} onChange={setBedtime} label={lbl('bedtime_label')}
  icon="clock-outline" confirmLabel={t('common.ok')} testID="bedtime" />
```

---

### InputField (`src/components/ui/InputField/`)

Champ texte étiqueté avec message d'erreur. Étend `TextInputProps` (donc `value`,
`onChangeText`, `placeholder`, `keyboardType`, `secureTextEntry`…).

| Prop | Type | Rôle |
|---|---|---|
| `label` | `string` | Libellé (obligatoire) |
| `error` | `string` | Message d'erreur inline (validation de champ) |
| `containerStyle` | `ViewStyle` | Style du conteneur |
| …natifs | `TextInputProps` | `value`, `onChangeText`, `placeholder`… |

### StatusBadge (`src/components/ui/StatusBadge/`)

Badge d'état coloré, lecture seule. Pendant mobile du `StatusBadge` web.

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `variant` | `'info' \| 'success' \| 'warning' \| 'danger' \| 'neutral'` | `'neutral'` | Couleur |
| `label` | `string` | — | Texte (obligatoire) |
| `value` | `string \| number` | — | Valeur additionnelle |
| `icon` | `string` | — | Nom d'icône `lucide-react-native` |
| `style` | `ViewStyle` | — | Style additionnel |

### EmptyState (`src/components/ui/EmptyState/`)

État vide — icône + titre + description + action optionnelle.

| Prop | Type | Rôle |
|---|---|---|
| `icon` | `string` | Emoji ou symbole texte rendu via `<Text>` (ex. `"📋"`, `"📅"`) |
| `title` | `string` | Titre (obligatoire) |
| `description` | `string` | Texte explicatif |
| `action` | `{ label: string; onPress: () => void }` | Bouton d'action optionnel |
| `style` | `ViewStyle` | Style additionnel |

> **Règle : tout bloc `View + icon + Text + Text` en état vide doit utiliser `EmptyState`.**

### ScreenLoader (`src/components/ui/ScreenLoader/`)

État de chargement plein écran : un `ActivityIndicator` centré. Remplace le bloc
`<View style={center}><ActivityIndicator size="large" /></View>` dupliqué dans les
écrans de module (ScaleHistory, ScaleEntry, ModuleContent, MedicationSideEffectsEntry…).

| Prop | Type | Rôle |
|---|---|---|
| `color` | `string` | Couleur du spinner (défaut `colors.primary`) |
| `style` | `ViewStyle` | Style additionnel du conteneur centré (ex. padding) |
| `testID` | `string` | testID du conteneur |

> **Règle : tout écran qui rend un `ActivityIndicator` centré pendant un chargement
> utilise `ScreenLoader` — jamais un `View + ActivityIndicator` ad hoc.**

```tsx
if (loading) return <ScreenLoader />
```

### SegmentedControl (`src/components/ui/SegmentedControl/`)

Interrupteur à choix exclusif : un groupe de segments dont **un seul** est actif.
Couvre les sélecteurs de plage temporelle (`7J/1M/3M/6M/1A`), filtres exclusifs et
tout choix unique parmi N options côte à côte. Pendant mobile du `SegmentedControl`
web. Générique sur `T extends string` ; segments mémoïsés (`SegmentButton`).

> **À distinguer de `Radio`** : `Radio` est une **saisie de formulaire** (sémantique
> radio, une réponse à une question) ; `SegmentedControl` **bascule une vue ou un
> filtre** (sémantique tablist). Un sélecteur de plage de graphe = `SegmentedControl`,
> pas `Radio`.

| Prop | Type | Rôle |
|---|---|---|
| `options` | `readonly SegmentOption<T>[]` | `{ value, label }` dans l'ordre d'affichage |
| `value` | `T` | Valeur active |
| `onChange` | `(value: T) => void` | Sélection d'un segment |
| `variant` | `'track' \| 'pills'` | `track` (piste teintée, segments adjacents, défaut) / `pills` (pastilles bordées) |
| `accentColor` | `string` | Fond du segment actif (défaut `colors.primary` — ex. couleur d'accent ado) |
| `accessibilityLabel` | `string` | Libellé accessible du groupe |
| `style` | `ViewStyle` | Style du conteneur (ex. `alignSelf`, marges) |
| `testID` | `string` | testID du conteneur |

```tsx
const RANGE_OPTIONS: readonly SegmentOption<TimeRange>[] = [
  { value: '7J', label: '7J' }, { value: '1M', label: '1M' }, { value: '1A', label: '1A' },
]
<SegmentedControl options={RANGE_OPTIONS} value={range} onChange={setRange}
  accentColor={activeColor} style={styles.rangeRow} accessibilityLabel={t('…')} />
```

---

### Groupe `ui/Chart/` — primitifs graphiques

`src/components/ui/Chart/` regroupe les composants de visualisation purs. Aucun ne connaît le domaine — les données arrivent normalisées via props.

Types partagés (`chartTypes.ts`) :

```ts
interface DataPoint { value: number; hasValue: boolean }
interface XLabel    { index: number; label: string }
```

#### `LineChart`

Courbe SVG temporelle — segments interrompus sur les gaps (`hasValue: false`), marqueurs circulaires sur les points présents, étiquettes d'axe X optionnelles.

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `points` | `DataPoint[]` | — | Série temporelle (obligatoire) |
| `color` | `string` | — | Couleur courbe + marqueurs |
| `xLabels` | `XLabel[]` | — | Étiquettes axe X (sous-ensemble de points) |
| `maxY` | `number` | `3` | Valeur max de l'axe Y |

#### `BarChart`

Barres verticales — valeurs affichées au-dessus, étiquettes de date en-dessous. Points absents (`hasValue: false`) rendus comme trait grisé minimal.

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `points` | `DataPoint[]` | — | Série temporelle (obligatoire) |
| `color` | `string` | — | Couleur des barres |
| `xLabels` | `XLabel[]` | — | Étiquettes axe X |
| `maxBarHeight` | `number` | `48` | Hauteur max en pixels |
| `maxY` | `number` | `3` | Valeur max pour normaliser la hauteur |

> **Règle : tout graphique temporel mobile utilise `LineChart` ou `BarChart` depuis `ui/Chart/`. Les charts spécifiques à un domaine (`DesensitizationChart`, `SudsSparkline`) restent dans `features/Chart/`.**

#### `MonthCalendar` (`ui/Chart/TimeRangeCharts/`)

Vue calendaire mensuelle passive — une pastille neutre par jour renseigné. Deux modes
d'alimentation exclusifs : `entries` + `dimensionKeys` (moyenne de sous-scores) **ou**
`dayMarkers` (couleur/libellé fournis explicitement par le module). Initiales des jours
dérivées de la locale via `Intl` (jamais figées en français). Aucune tendance, aucune
flèche, aucun taux (conforme MDR 2017/745).

| Prop | Type | Rôle |
|---|---|---|
| `dayMarkers` | `ReadonlyMap<string, DayMarker>` | Pastille par date `YYYY-MM-DD` (`{ color, label? }`) — mode marqueurs explicites |
| `entries` / `dimensionKeys` | `ChartEntry[]` / `string[]` | Mode dérivé : moyenne des sous-scores par jour |
| `accentColor` | `string` | Couleur d'accent (jour courant, navigation) |
| `locale` | `string` | Locale BCP-47 — libellé du mois + initiales des jours |
| `daysLabel` | `string` | Libellé du compteur « jours renseignés » |
| `legendLabel` | `string` | Titre de la légende (optionnel) |
| `legendItems` | `ReadonlyArray<{ color; label }>` | Légende explicite : une entrée par statut (optionnel) |

---

### `Radio` (`src/components/ui/Radio/`)

Sélecteur à **choix exclusif** (radio). Trois habillages via `variant` : `list` (radio classique, rangées rond + label, défaut), `pills` (pilules en ligne, fond coloré sur l'option active) ou `grid` (colonnes de largeur égale, label centré multiligne, fond coloré sur l'option active, pour l'échelle Likert d'un questionnaire clinique). Couleur d'accent configurable. `readonly` rend le même visuel sans interaction (options en `View`, pas en `Pressable`) : pour un aperçu / affichage en lecture seule, jamais un composant « display-only » parallèle. Réutilisable pour tout choix mono-sélection : type fond/PRN, filtre de période, mode, aperçu de champ, échelle Likert, etc.

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `options` | `RadioOption[]` | — | Options `{ value, label, sublabel? }` dans l'ordre d'affichage (obligatoire). `sublabel` n'est rendu qu'en variant `list` |
| `value` | `string \| null` | — | Identifiant de l'option sélectionnée (`null` = aucune) (obligatoire) |
| `onChange` | `(v: string) => void` | — | Callback de sélection. Optionnel : inutile (et ignoré) en `readonly` |
| `variant` | `'list' \| 'pills' \| 'grid'` | `'list'` | Habillage : radio classique, pilules, ou colonnes Likert (largeurs égales, label centré multiligne) |
| `readonly` | `boolean` | `false` | Lecture seule : même rendu, aucune interaction (options en `View`) |
| `color` | `string` | `colors.primary` | Couleur d'accentuation de l'option active |
| `testID` | `string` | — | testID du conteneur |

```tsx
// Radio classique (rond + label + sous-label)
<Radio
  options={[
    { value: 'maintenance', label: 'Traitement de fond', sublabel: 'Pris en continu' },
    { value: 'prn', label: 'Si besoin' },
  ]}
  value={kind}
  onChange={v => setKind(v === 'prn' ? 'prn' : 'maintenance')}
/>

// Habillage pilules (filtre de période)
<Radio
  options={ranges.map(r => ({ value: r, label: rangeLabels[r] }))}
  value={timeRange}
  onChange={onRangeChange}
  variant="pills"
  color={accentColor}
/>

// Aperçu en lecture seule (preview, pas de saisie) — ex. BooleanWidget
<Radio
  variant="pills"
  options={[{ value: 'non', label: 'Non' }, { value: 'oui', label: 'Oui' }]}
  value="non"
  readonly
/>

// Colonnes Likert (échelle clinique, ex. LikertWidget dans QuestionnaireLayout)
<Radio
  variant="grid"
  options={[
    { value: '0', label: 'Jamais' },
    { value: '1', label: 'Parfois' },
    { value: '2', label: 'Souvent' },
    { value: '3', label: 'Toujours' },
  ]}
  value={selected}
  onChange={onSelect}
  color={accentColor}
/>
```

> **Règle : tout sélecteur à choix exclusif passe par `Radio`, jamais `Pressable + styles.btn` ad hoc ni un composant radio parallèle. L'habillage pilules est le `variant="pills"`, les colonnes Likert le `variant="grid"`. Un aperçu / affichage en lecture seule reste un `Radio readonly`, jamais un composant « display-only » dupliquant l'habillage. `LikertWidget` (`QuestionnaireLayout`) est un simple adaptateur numérique au-dessus de `variant="grid"` : `ui/Radio` opérant sur des `string`, la conversion nombre↔chaîne se fait à sa frontière.**

---

### `Checkbox` (`src/components/ui/Checkbox/`)

Case à cocher **générique** (contrôle binaire détaché de tout métier). Interactive quand `onChange` est fourni (`Pressable`), statique non interactive sinon (`View`) — ce qui couvre les aperçus en lecture seule. Accessibilité `checkbox` (`accessibilityState.checked`). Icônes `square-outline` (décoché) / `checkbox` (coché) via Ionicons, couleur d'accent configurable.

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `checked` | `boolean` | — | État coché (obligatoire) |
| `onChange` | `(checked: boolean) => void` | — | Callback de bascule (reçoit le nouvel état). Absent → rendu statique non interactif |
| `label` | `string` | — | Libellé optionnel à droite de la case |
| `disabled` | `boolean` | `false` | Désactive l'interaction et grise l'habillage |
| `color` | `string` | `colors.primary` | Couleur de la case cochée |
| `testID` | `string` | — | testID du conteneur |

```tsx
// Interactive
<Checkbox checked={accepted} onChange={setAccepted} label="J'accepte les conditions" />

// Aperçu statique (lecture seule, sans onChange)
<Checkbox checked={false} label="Non accompli" />
```

> **Règle : toute case à cocher passe par `Checkbox`, jamais une icône `square-outline` + `Text` assemblés à la main.**

---

### `Chip` (`src/components/ui/Chip/`)

Puce / token **générique** (pilule compacte contournée, icône + label, détachée de tout métier). Une seule primitive couvre la puce statique d'aperçu (`muted`), la puce sélectionnable (`selected` + `onPress`, pour les filtres / motifs de choix) et le badge léger contour. Interactive quand `onPress` est fourni (`Pressable`, `accessibilityRole="button"` + `accessibilityState.selected`), statique sinon (`View`). Tokens uniquement, zéro hex en dur.

Pour un indicateur d'état sémantique **rempli** (fond coloré, label + valeur), préférer `StatusBadge`.

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `label` | `string` | — | Texte de la puce (obligatoire) |
| `icon` | `ReactNode` | — | Nœud icône rendu tel quel (toute famille : Ionicons, MaterialCommunityIcons…). L'appelant gère taille et couleur |
| `selected` | `boolean` | `false` | Habille la puce avec `color` (bordure + texte + fond teinté) |
| `color` | `string` | `colors.primary` | Couleur d'accent à l'état `selected` |
| `size` | `'sm' \| 'md'` | `'md'` | `sm` pour les aperçus compacts (valeur 12 px) |
| `muted` | `boolean` | `false` | Opacité réduite — aperçus inertes, valeurs placeholder |
| `onPress` | `() => void` | — | Rend la puce interactive. Absent → rendu statique |
| `testID` | `string` | — | testID du conteneur |

```tsx
// Aperçu statique compact (DateWidget / TimeWidget)
<Chip
  label="jj/mm/aaaa"
  size="sm"
  muted
  icon={<Ionicons name="calendar-outline" size={12} color={colors.textMuted} />}
/>

// Puce sélectionnable (motif MedicationTracker — icône MaterialCommunityIcons)
<Chip
  label={opt.label}
  selected={isSelected}
  onPress={() => toggle(opt.id)}
  icon={<MaterialCommunityIcons name={opt.icon} size={15} color={isSelected ? colors.primary : colors.textMuted} />}
/>
```

> **Règle : toute puce (chip statique, sélectionnable, badge contour) passe par `Chip`, jamais un `View` + `Text` + `styles.chip` assemblés à la main.**

---

### ActionSheet / ConfirmDialog / Toast — feedback sans `Alert.alert`

> **Règle d'or : zéro `Alert.alert`, zéro alerte OS.** Tout feedback ou confirmation
> passe par ces trois primitives, déclenchées **via leur contexte** (jamais montées à
> la main). Voir la règle complète en mémoire projet *« Zero Alert.alert »*.

Ces composants sont **présentationnels** (`src/components/ui/{ActionSheet,ConfirmDialog,Toast}/index.tsx`)
et montés une seule fois par leur provider racine. On ne les instancie jamais
directement — on appelle le hook du contexte correspondant :

| Besoin | Hook | Appel |
|---|---|---|
| Confirmation destructive (supprimer, révoquer) | `useConfirmDialog()` | `showConfirm({ title, message?, confirmLabel?, destructive?, onConfirm })` |
| Choix parmi N options | `useActionSheet()` | `showActionSheet({ title?, options: { label, onPress, destructive? }[] })` |
| Feedback passif (succès, erreur, info) | `useToast()` | `showToast(message, variant?)` — `variant`: `'success'`(défaut)`\|'error'\|'info'` |

```tsx
const { showConfirm } = useConfirmDialog()
showConfirm({
  title: t('appointment.cancel_title'),
  message: t('appointment.cancel_msg'),
  destructive: true,
  confirmLabel: t('common.confirm'),
  onConfirm: () => cancelAppointment(id),
})
```

Le `cancelLabel` d'`ActionSheet`/`ConfirmDialog` est injecté par le provider (i18n) —
ne pas le passer depuis l'écran. `Toast` s'auto-masque après un délai géré par le provider.

| Composant | Props présentationnelles (gérées par le provider) |
|---|---|
| `ConfirmDialog` | `visible`, `onCancel`, `cancelLabel` + `ConfirmDialogConfig` |
| `ActionSheet` | `visible`, `onClose` + `ActionSheetConfig` (`title?`, `options`, `cancelLabel`) |
| `Toast` | `message`, `variant`, `visible` |

---

## Widgets du ModuleRenderer

Visuels en lecture seule — rendu dans `FieldWidget`, identique à la version web mais en React Native.

| Widget | Aperçu visuel | Spec |
|---|---|---|
| `TimeWidget` | `ui/Chip` (`size="sm"`, `muted`) — `[⏱ 22:00]` | `"time"` |
| `SliderWidget` | Track 4px fill/empty + thumb + valeur médiane | `"slider:min:max:unit"` |
| `StarsWidget` | `ui/RatingSelector` (`variant="icon"`, `readonly`) — moitié des étoiles remplies | `"stars:N"` |
| `BooleanWidget` | `ui/Radio` (`variant="pills"`, `readonly`) — pills `[Non] [Oui]`, "Non" actif | `"boolean"` |
| `RadioWidget` | Pastille de statut via `ui/StatusBadge` (`ok`→`success`, `partial`→`warning`, `miss`→`danger`) | `"radio:variant"` |
| `DateWidget` | `ui/Chip` (`size="sm"`, `muted`) — `[📅 jj/mm/aaaa]` | `"date"` |
| `TextWidget` | `View` vide h=32 avec bordure | `"text"` |
| `CheckboxWidget` | `ui/Checkbox` statique (`checked={false}`, label `Non accompli`) opacité 0.7 | `"checkbox"` |
| `TextareaWidget` | `View` vide h=52 avec bordure, opacité 0.5 | `"textarea"` |
| `InfoWidget` | Icône `reorder-four-outline` + texte italique muted | `"info"` |

Chemin : `src/components/features/ModuleRenderer/fields/widgets/<Widget>/<Widget>.tsx`

### Widgets de field interactifs (plan de crise)

Contrairement aux `FieldWidget` ci-dessus (aperçus lecture seule), ces widgets sont
des composants **interactifs** dispatchés par `field_type` dans le layout
`editable_steps` (parité avec le `LayoutDispatcher` web). Chemin :
`src/components/features/ModuleRenderer/fields/<Widget>/<Widget>.tsx`. Toute écriture
passe par `crisisPlanService` (jamais Supabase/SQLite direct), avec `@ui/Button` et
`@ui/InputField` pour les contrôles.

| Widget | `field_type` | Rôle | Persistance |
|---|---|---|---|
| `CrisisUrgencyEntry` | `crisis_urgency_entry` | Bandeau rouge en tête → navigue vers l'écran `CrisisUrgency` | — (navigation) |
| `CrisisAnchorsWidget` | `crisis_anchors_preview` | Photos d'ancrage + phrase + message praticien | FileSystem + SQLite + Supabase |
| `CrisisCopingCardsWidget` | `crisis_coping_cards_preview` | Cartes de coping praticien (lecture seule) | Supabase |
| `CrisisCommitmentWidget` | `crisis_commitment_preview` | Signature de l'engagement (nom + date) | SQLite |
| `CrisisUrgencyContactsWidget` | `crisis_urgency_contacts` | Contacts de confiance (step4/step5), rendu dans `crisis_urgency` | SQLite |

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
| `exposure_tracker` | `ExposureTracker/` | `ExposureTrackerLayout` | Exposition graduée (échelle → expositions → courbe) | SQLite `fear_situations` / `fear_entries` |
| `decision_grid` | `DecisionGrid/` | `DecisionGridLayout` | Balance décisionnelle 2×2 + items pondérés | SQLite `plan_items` |
| `psyedu` | `PsyEdu/` | `PsyEduLayout` | Fiches psychoéducatives | Supabase (`psyedu_topics` / `psyedu_blocks`) |
| `chrono_month` | `ChronoMonth/` | `ChronoMonthLayout` | Grille calendrier chronobiologie | SQLite `chrono_entries` |

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
| `ColumnTimeField` | `ColumnForm/` | Adaptateur des `field_props` (`key`/`optional`) vers le primitive `ui/TimePicker` |
| `renderCardBodyFields` | `Cards/` | Rend le corps d'une carte (registry des `field_type` de carte) |
| `ActivityListCard` | `ActivityLog/` | Carte d'une activité dans la liste |
| `EntryListCard` | `ExposureTracker/` | Carte d'une saisie SUDS |
| `SleepCalendar` | `SleepJournal/` | Grille calendrier mensuelle (encodage neutre MDR : nuit renseignée vs non, badge cauchemar) |
| `MinutesField` | `SleepJournal/` | Saisie numérique bornée d'une durée en minutes + appoint « = XhYY » |

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
