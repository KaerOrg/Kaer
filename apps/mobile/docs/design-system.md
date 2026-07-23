# Design System — App mobile patient

> Tokens partagés → `DESIGN_SYSTEM.md` à la racine du monorepo.

## Barrel theme local

`apps/mobile/src/theme/index.ts` re-exporte `@kaer/shared` et ajoute les objets propres à React Native :

```ts
import { Platform } from 'react-native'
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
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 },  // FAB, éléments flottants
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
}

// Familles de police — serif SYSTÈME (aucun asset bundlé) : Georgia (iOS) / Noto Serif (Android).
export const fonts = {
  serif: Platform.select({ ios: 'Georgia', default: 'serif' }),
}
```

Import dans les composants : `import { colors, spacing, radius, fonts } from '@theme'`
(jamais `@kaer/shared` directement dans le mobile).

**Token `fonts.serif`** : direction éditoriale des titres/libellés de l'accueil patient
(titre « Mes modules », titres de ligne de module, bandeau de crise). À référencer via
`fontFamily: fonts.serif`, jamais un nom de police en dur.

**Token `colors.dangerText` (`#DC2626`)** : rouge foncé réservé au **texte** de crise
(titre du bandeau) — contraste AA sur blanc (≈ 4.9:1). `colors.danger` (`#EF4444`) reste
l'accent/icône. Aucun de ces rouges n'est conditionné par une donnée patient (MDR 2017/745).

**Token `colors.neutralBar` (`#94A3B8`, partagé web ≡ mobile)** : gris imposé des
barres **purement descriptives** (écarts en minutes, plages horaires) — jamais une
teinte de gravité clinique (MDR 2017/745). À utiliser pour toute barre de mesure
neutre plutôt qu'un hex en dur (ex. `SpreadBars` de la Vue mensuelle chrono).

---

## Largeur fluide — zéro scroll horizontal

Aucun écran, aucune vue, aucune carte ne défile horizontalement : le contenu
s'adapte **toujours** à la largeur de l'appareil. Un débordement latéral est un bug
bloquant. Règle complète : [`coding-standards.md`](../../../.claude/rules/coding-standards.md)
§ « Zéro scroll horizontal (mobile) ».

- **Largeur d'écran / de carte = fluide** : `width: '100%'`, `flex: 1`, ou
  `alignSelf: 'stretch'` — jamais une largeur figée en dur (`width: 400`). Une largeur
  fixe ne vaut que pour un élément intrinsèquement petit (icône, pastille, avatar).
- **Rangée `flexDirection: 'row'` avec texte de longueur variable** : donner
  `flex: 1`/`flexShrink: 1` au bloc texte pour qu'il se compresse au lieu de pousser
  ses voisins hors écran (`flexWrap: 'wrap'` s'il doit passer à la ligne).
- **Seul défilement horizontal légitime** : un carrousel / pager explicitement voulu
  (ex. `PhotoCarousel`), borné à son conteneur.

> **Garde-fou mécanique** : `apps/mobile/src/__tests__/noHorizontalScroll.guard.test.ts`
> échoue si une prop `horizontal` (`ScrollView`/`FlatList`/`FlashList`) apparaît hors
> de `HORIZONTAL_ALLOWLIST`. Un nouveau carrousel voulu s'y ajoute avec justification.

---

## Alias d'import

Trois alias de chemin sont configurés pour éviter les imports relatifs profonds
(`../../../../../ui/...`). Ils sont déclarés au même endroit dans la chaîne d'outils :

| Alias | Cible | Exemple |
|---|---|---|
| `@ui/*` | `src/components/ui/*` | `import { Chip } from '@ui/Chip'` |
| `@theme` | `src/theme` (barrel) | `import { colors, spacing } from '@theme'` |
| `@services/*` | `src/services/*` | `import { unlockModule } from '@services/moduleAssignmentService'` |

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
| `components/ui/` | Primitives design system — Button, Card, Chart, Checkbox, Chip, ConfirmDialog, ActionSheet, EmptyState, InputField, PhotoCarousel, ProgressRing, Radio, RatingSelector, Slider, TimePicker, TreeSelector, StatusBadge, Toast |
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
| `danger` | `colors.dangerLight` | `colors.danger` (1px) | `colors.danger` |
| `ghostDanger` | transparent | — | `colors.danger` |

| Taille | paddingV | paddingH | minHeight | label |
|---|---|---|---|---|
| `md` (défaut) | 12 | 24 | 50 | 16 |
| `sm` | 8 | 16 | 36 | 14 |

`ghostDanger` est le pendant discret de `danger` : action destructive sans habillage,
seul le libellé porte la couleur d'alerte (ex. « Annuler » dans une carte de rendez-vous,
où un bouton plein alourdirait la carte). `borderRadius: 10` dans les deux cas. La taille ne porte **que** les dimensions ; la
couleur reste pilotée par `variant`. `sm` sert aux actions inline compactes (ex. le
« pont effets indésirables » de MedicationTracker) sans réécrire un `Pressable` ad hoc.

| Prop | Type | Rôle |
|---|---|---|
| `label` | `string` | Texte du bouton. **Optionnel** : sans libellé, le bouton est « icône seule » (rendu compact, sans le chrome CTA) |
| `sublabel` | `string` | Ligne secondaire optionnelle sous le `label` (bouton à deux lignes, ex. bouton d'appel « numéro + intitulé »). Plus petite, atténuée, dans la couleur du variant |
| `onPress` | `() => void` | Callback (obligatoire) |
| `variant` | `ButtonVariant` | Variante visuelle (défaut `'primary'`) |
| `size` | `ButtonSize` | Taille `'sm'` ou `'md'` (défaut `'md'`) |
| `loading` | `boolean` | Affiche un spinner à la place du label |
| `disabled` | `boolean` | Désactive le bouton |
| `style` | `ViewStyle` | Style additionnel (ex. override `backgroundColor` pour couleur d'accent) |
| `iconLeft` | `ReactNode` | Nœud affiché à gauche du label, ou seul contenu en mode icône seule |
| `iconRight` | `ReactNode` | Nœud affiché à droite du label (ex. chevron « Continuer › »). Ignoré en mode icône seule |
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
| `accentColor` | `string` | Couleur de bordure d'accentuation (2px, tout le tour) |
| `leftAccentColor` | `string` | Filet d'accent vertical (4px) sur le bord gauche, motif « bandeau » (ex. carte de crise en `colors.danger`). Rendu comme bande absolue rognée (`overflow: hidden`) pour garder les coins arrondis sur iOS : incompatible avec l'ombre du variant `elevated` |
| `onPress` | `() => void` | Rend la carte pressable (`Pressable` au lieu de `View`) |
| `accessibilityLabel` | `string` | Label accessibilité quand `onPress` est fourni |

> **Règle : toute liste d'items tappables utilise `Card` avec `onPress`, jamais `Pressable + View` ad hoc.**

---

### IconChip (`src/components/ui/IconChip/`)

Pastille d'icône : carré arrondi (`radius.md`) au fond coloré, icône centrée en `children`
(couleur gérée par l'appelant). Réutilisée par les lignes de module, le bandeau de crise
et les listes de réglages (accueil / profil patient).

| Prop | Type | Rôle |
|---|---|---|
| `color` | `string` | Couleur de fond (token de thème) |
| `children` | `ReactNode` | Icône centrée (ex. `<MaterialCommunityIcons color={colors.white} />`) |
| `size` | `number` | Côté du carré. Défaut `38` |
| `testID` | `string` | — |

```tsx
<IconChip color={colors.primary}>
  <MaterialCommunityIcons name="target" size={20} color={colors.white} />
</IconChip>
```

---

### RatingSelector (`src/components/ui/RatingSelector/`)

Sélecteur de note sur une échelle 1..N — **le contrôle de notation unique du design
system** (remplace l'ancien `PipPicker` et l'ancien `StarRating`). Trois variantes
visuelles pour un même besoin :

| Variante | Rendu | Usage |
|---|---|---|
| `numbered` (défaut) | boutons carrés bordés avec le chiffre, seul le sélectionné est mis en évidence | `mood_tracker` (1–10), `fear_thermometer` (0–100 par 10) |
| `track` | segments fins formant une barre de progression (fill cumulatif) | `behavioral_activation` (0–10), `activity_log` (plaisir/maîtrise) |
| `track` + `continuous` | jauge **continue** proportionnelle (fill + thumb) + valeur formatée, au lieu de N pips | aperçu d'une valeur continue (ex. `slider_dashboard`) |

> Pour une **saisie continue par glissement** (curseur draggable), utiliser
> [`Slider`](#slider-srccomponentsuislider) — `RatingSelector` reste le contrôle à
> **paliers discrets** (pips / icônes).
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

### Slider (`src/components/ui/Slider/`)

Curseur **continu** (glissement ou tap) sur une plage `[min, max]` alignée sur
`step` — le contrôle de saisie proportionnelle du design system. À préférer à
`RatingSelector variant="track"` dès qu'on veut un vrai curseur draggable plutôt
qu'une rangée de paliers. Usage : intensités / niveaux de croyance de `beck_columns`.

> **`value = null` = pas d'ancrage (MDR 2017/745).** Tant que le patient n'a pas
> touché le curseur, la piste est vide et aucun thumb n'est affiché : rien n'est
> pré-sélectionné ni sauvegardé (pas de faux « 50 » d'ancrage). `onChange` n'est émis
> qu'à l'interaction réelle.

Le remplissage et le thumb sont positionnés par **flexbox** (`flex: ratio`), sans
mesure de largeur au rendu ; seule l'interaction lit la largeur mesurée
(`onLayout`). Accessible : `accessibilityRole="adjustable"` + actions
increment / decrement (pas de `step`). Logique pure de mapping isolée et testée
dans `sliderMath.ts`.

| Prop | Type | Rôle |
|---|---|---|
| `value` | `number \| null` | Valeur courante ; `null` = non touché (piste vide, aucun thumb) |
| `min` | `number` | Borne basse |
| `max` | `number` | Borne haute |
| `step?` | `number` | Pas d'alignement (défaut `1` = continu au point près) |
| `color` | `string` | Couleur d'accent (remplissage + thumb) |
| `label?` | `string` | Libellé au-dessus de la piste (sert d'`accessibilityLabel`) |
| `unit?` | `string` | Unité affichée après la valeur (ex. `"%"`) |
| `showEndLabels?` | `boolean` | Affiche les bornes min/max sous la piste |
| `showHeader?` | `boolean` | En-tête interne (libellé + valeur) au-dessus de la piste (défaut `true`). `false` quand le parent rend son propre en-tête et ne veut que la piste (ex. `SliderQuestion` du mood_tracker : icône + valeur en grand). Le `label` reste l'`accessibilityLabel`. |
| `testID?` | `string` | Expose `${testID}-track`, `${testID}-value`, `${testID}-fill` |
| `onChange` | `(value: number) => void` | Émis à chaque interaction, valeur alignée/bornée |

La zone tactile de la piste fait **≥ 44 px** de haut (la barre visible reste fine, centrée dedans).

```tsx
// Intensité émotionnelle 0–100 (config-first : min/max/step/unit lus des field_props)
<Slider label={lbl('intensity')} value={intensity} min={0} max={100} step={1}
  unit="%" color={colors.primary} showEndLabels
  onChange={setIntensity} testID="slider-input-emotion_intensity" />
```

---

### ProgressRing (`src/components/ui/ProgressRing/`)

Jauge **circulaire** remplie au prorata d'une valeur brute (SVG `Circle` +
`strokeDasharray`), avec label central optionnel. L'arc démarre en haut (12 h) et se
remplit dans le sens horaire. Usage : anneau d'efficacité de l'agenda du sommeil
(saisie + bilan mensuel).

> **Une seule couleur d'accent — aucun codage conditionnel (MDR 2017/745).** Le
> primitive ne colore jamais selon un seuil : la valeur est affichée, jamais jugée.
> La couleur est passée par l'appelant et reste constante quelle que soit la valeur.
> À distinguer de [`Slider`](#slider-srccomponentsuislider) (saisie proportionnelle) :
> `ProgressRing` est un **affichage** en lecture seule.

| Prop | Type | Rôle |
|---|---|---|
| `value` | `number` | Valeur remplie, bornée à `[0, max]` au rendu |
| `max?` | `number` | Valeur de remplissage complet (défaut `100`) |
| `size?` | `number` | Diamètre extérieur en px (défaut `96`) |
| `strokeWidth?` | `number` | Épaisseur de l'anneau en px (défaut `10`) |
| `color?` | `string` | Couleur de l'arc rempli (défaut `colors.primary`) |
| `trackColor?` | `string` | Couleur de la piste vide (défaut `colors.border`) |
| `label?` | `string` | Texte central principal (ex. `"91 %"`) |
| `sublabel?` | `string` | Texte central secondaire, plus petit |
| `accessibilityLabel?` | `string` | Libellé accessible de la jauge |
| `testID?` | `string` | Identifiant de test |

```tsx
// Efficacité du sommeil — valeur brute, une seule couleur (jamais de seuil coloré)
<ProgressRing value={efficiency} max={100} size={84}
  label={`${efficiency} %`} color={colors.primary}
  accessibilityLabel={lbl('efficiency_label')} />
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
| `label` | `string` | Libellé. Optionnel : omis quand le label est rendu ailleurs (ex. aperçu de module où `FieldRow` porte déjà le libellé). Absent, aucun espace de label n'est réservé. |
| `error` | `string` | Message d'erreur inline (validation de champ) |
| `containerStyle` | `ViewStyle` | Style du conteneur |
| …natifs | `TextInputProps` | `value`, `onChangeText`, `placeholder`, `editable`, `multiline`… |

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

État vide — illustration + titre + description + action optionnelle + nudge.

| Prop | Type | Rôle |
|---|---|---|
| `icon` | `string \| ReactNode` | Emoji / symbole texte (rendu via `<Text>`), **ou** un nœud d'illustration personnalisé (rendu tel quel — ex. escalier pastel de l'exposition graduée) |
| `title` | `string` | Titre (obligatoire) |
| `description` | `string` | Texte explicatif |
| `action` | `{ label; onPress; variant?; icon?; testID? }` | Bouton d'action optionnel — `variant` (défaut `secondary`), `icon` (nœud à gauche du libellé), `testID` |
| `footer` | `string` | Ligne d'aide (nudge) affichée **sous** l'action |
| `style` | `ViewStyle` | Style additionnel |
| `testID` | `string` | testID du conteneur |

```tsx
// Emoji simple
<EmptyState icon="📋" title="Aucune saisie" description="…" />
// Illustration + CTA primaire à icône + nudge
<EmptyState
  icon={<StairsIllustration />}
  title="Construisez votre échelle"
  description="…"
  action={{ label: 'Créer', onPress, variant: 'primary', icon: <Plus /> }}
  footer="Commencez par une situation facile."
/>
```

> **Règle : tout bloc `View + icon + Text + Text` en état vide doit utiliser `EmptyState`.**
> Une illustration non-emoji passe par `icon={<Node/>}` ; une ligne d'aide sous le CTA par `footer`.

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

### PhotoCarousel (`src/components/ui/PhotoCarousel/`)

Visionneuse photo plein écran : modale (`animationType="fade"`) + `FlatList`
horizontale paginée (swipe), flèches précédent/suivant, bouton de fermeture et
indicateur de page (`n / total`). Rendu via `expo-image` (`contentFit="contain"` :
la photo n'est jamais rognée). Primitive **générique et sans métier** : reçoit les
URIs et les libellés d'accessibilité par props. Animations : opacité (fondu) et
translation (pagination native) uniquement.

| Prop | Type | Rôle |
|---|---|---|
| `visible` | `boolean` | Ouvre / ferme la modale |
| `uris` | `ReadonlyArray<string>` | Photos à afficher (rien n'est rendu si vide) |
| `initialIndex` | `number` | Photo affichée à l'ouverture (défaut `0`) |
| `onClose` | `() => void` | Fermeture (bouton, geste retour Android) |
| `closeLabel` / `prevLabel` / `nextLabel` | `string` | Libellés d'accessibilité (i18n, fournis par le parent) |
| `testID` | `string` | Préfixe des testIDs (`-photo-<i>`, `-prev`, `-next`, `-close`) |

> **Règle : toute galerie / vignette photo ouvrant un plein écran utilise `PhotoCarousel`
> — jamais un `Modal + Image` ad hoc.** Les flèches et l'indicateur n'apparaissent qu'à
> partir de 2 photos.

```tsx
const [viewer, setViewer] = useState<{ open: boolean; index: number }>({ open: false, index: 0 })
// …au tap sur une vignette : setViewer({ open: true, index })
<PhotoCarousel
  visible={viewer.open}
  uris={anchors.map(a => a.uri)}
  initialIndex={viewer.index}
  onClose={() => setViewer(v => ({ ...v, open: false }))}
  closeLabel={t('common.close')}
  prevLabel={t('modules.crisis_plan.carousel_prev')}
  nextLabel={t('modules.crisis_plan.carousel_next')}
  testID="anchors-carousel"
/>
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

// Aperçu en lecture seule (pas de saisie)
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
// Aperçu statique compact (puce date / heure en lecture seule)
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

### `TreeSelector` (`src/components/ui/TreeSelector/`)

Sélecteur **hiérarchique guidé générique** : navigation niveau par niveau dans un
arbre de nœuds (famille → sous-catégorie → … profondeur libre), avec trois étapes
optionnelles enchaînées — intensité brute (1–N), contexte (chips multi-choix), notes
libres — puis un historique des sélections passées. 100 % présentationnel : **aucun
service, aucune persistance, aucune clé i18n de domaine**. Tout entre par props
(arbre + entrées + config + libellés déjà traduits) et ressort par callbacks
(`onSubmit`, `onDelete`). Les identités (ids de nœuds, codes de contexte) sont
opaques — le primitive les renvoie tels quels, le parent les interprète.

La machine d'état du flux vit dans `useTreeSelectorFlow` ; chaque étape est un
composant dédié (`TreeSelectorHistory` / `…Navigation` / `…Intensity` / `…Context`
/ `…Notes`) — un fichier = un composant.

| Prop | Type | Rôle |
|---|---|---|
| `nodes` | `TreeSelectorNode[]` | Arbre prêt à afficher (`label` résolu, `id` opaque, `color`/`icon`/`emoji` optionnels) |
| `entries` | `TreeSelectorEntry[]` | View-models d'historique déjà résolus (libellés, date, badge intensité formatés) |
| `config` | `TreeSelectorConfig` | Drapeaux d'étapes + plage d'intensité + options de contexte |
| `texts` | `TreeSelectorTexts` | Tous les libellés d'interface, déjà traduits |
| `footerText` | `string \| null` | Note de bas de page (sources) — optionnelle |
| `loading` / `saving` | `boolean` | États de chargement / persistance |
| `onSubmit` | `(r: TreeSelectorSubmit) => Promise<void>` | Sélection validée : `{ pathIds, intensity, context, notes }` |
| `onDelete` | `(id: string) => void` | Suppression d'une entrée d'historique |

```tsx
import { TreeSelector } from '@ui/TreeSelector'

<TreeSelector
  nodes={uiNodes}
  entries={uiEntries}
  config={uiConfig}
  texts={texts}
  footerText={footerText}
  loading={loading}
  saving={saving}
  onSubmit={handleSubmit}   // le parent reconstruit le chemin depuis pathIds + persiste
  onDelete={handleDelete}
/>
```

> **Conformité MDR** : aucune couleur ne code une gravité — les teintes/emojis codent
> l'**identité de famille** (transmise par l'appelant). Le primitive affiche la valeur
> brute d'intensité sans label interprétatif.
>
> **Wrapper métier** : le pont vers le moteur de modules (`preview_kind='tree_selector'`)
> est `features/ModuleRenderer/layouts/TreeSelector/TreeSelectorLayout` — il parse la
> config DB-driven, traduit, charge/persiste via `treeSelectionService` et mappe vers
> ces props. Voir `docs/module-engine.md`.

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

Affichage **en lecture seule** rendu dans `FieldWidget` (conformité MDR : affichage
passif). Sur mobile, c'est le champ tel que le **patient** le voit. Seul
`breathing_techniques` utilise encore le layout `fields` (info ×5 + text ×1), donc
`FieldWidget` ne rend plus que deux widgets. Les widgets
`time`/`slider`/`stars`/`boolean`/`radio`/`date`/`checkbox`/`textarea`, devenus
inatteignables après la migration des autres modules vers des layouts dédiés, ont été
supprimés (issue #87).

| Widget | Aperçu visuel | Spec |
|---|---|---|
| `TextWidget` | `ui/InputField` (`editable={false}`) opacité 0.6 | `"text"` |
| `InfoWidget` | Icône `reorder-four-outline` + texte italique muted | `"info"` |

Chemin : `src/components/features/ModuleRenderer/fields/widgets/<Widget>/<Widget>.tsx`

> `LikertWidget` vit dans le même dossier mais **hors** du chemin `fields` : il est
> consommé directement par `QuestionnaireLayout` (échelles cliniques), pas par
> `FieldWidget`.

### Widgets de field interactifs (plan de crise)

Contrairement aux `FieldWidget` ci-dessus (aperçus lecture seule), ces widgets sont
des composants **interactifs** dispatchés par `field_type` dans le layout
`editable_steps` (parité avec le `LayoutDispatcher` web). Chemin :
`src/components/features/ModuleRenderer/fields/<Widget>/<Widget>.tsx`. Toute écriture
passe par `crisisPlanService` (jamais Supabase/SQLite direct), avec `@ui/Button` et
`@ui/InputField` pour les contrôles.

| Widget | `field_type` | Rôle | Persistance |
|---|---|---|---|
| `CrisisAnchorsWidget` | `crisis_anchors_preview` | Photos d'ancrage + phrase + message praticien | FileSystem + SQLite + Supabase |
| `CrisisEmergencyCalls` (shared) | `exercise_safety` | Rangée de boutons d'appel `tel:` colorés (numéro + intitulé). Réutilisé par `SafetyPlanLayout` (tête) et `EditableStepsLayout` (barre) | — (appel) |

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
| `safety_plan` | `SafetyPlan/` | `SafetyPlanLayout` | Vue de consultation « Je suis en crise » (lecture seule + roue crantée → édition) | SQLite `plan_items` |
| `editable_steps` | `EditableSteps/` | `EditableStepsLayout` | Plan éditable par sections (mode édition du plan de crise) | SQLite `plan_items` |
| `daily_checkin` | `DailyCheckin/` | `DailyCheckinLayout` | Saisie quotidienne — 1 statut / jour, 2 onglets | SQLite `daily_entries` |
| `column_form` | `ColumnForm/` | `ColumnFormLayout` | Formulaire à colonnes hétérogènes (beck_columns) | SQLite `form_entries` |
| `tree_selector` | `TreeSelector/` | `TreeSelectorLayout` | Sélecteur d'arbre hiérarchique guidé (emotion_wheel) | SQLite `tree_selections` |
| `sleep_journal` | `SleepJournal/` | `SleepJournalLayout` | Agenda du sommeil — 3 modes list / entry / month | SQLite `sleep_diary_entries` |
| `tabbed` | `Tabs/` | `TabsLayout` | Onglets génériques — rend récursivement `FieldRenderer` | — |
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
| `CallableContact` | Rangée de contact en lecture seule : nom + numéro + bouton d'appel `tel:` (`@ui/Button`). Sans numéro → simple ligne | `safety_plan` (étapes contactables) |
| `EditableContactsList` | Liste CRUD de contacts (nom + numéro) + « Importer depuis mes contacts » (`contactsService`). Construite avec `@ui/Button` + `@ui/InputField` | `editable_steps` (étapes contactables) |

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

## Data-viz `mood_tracker` (Thermomètre de l'humeur)

Composants de la refonte du module `mood_tracker` (épique #162). La **palette de
dimensions** est la source de vérité **partagée web ≡ mobile** :
`packages/shared/src/services/moodPalette.ts` (`MOOD_DIMENSION_COLORS`,
`MOOD_ACCENT`, `ribbonCellOpacity`, `SEASONALITY_*`).

### Palette de dimensions — encodage « magnitude » (MDR 2017/745)

Six dimensions (`mood`, `energy`, `anxiety`, `pleasure`, `sleep`, `food`), trois
nuances chacune. **La couleur n'encode QUE l'identité de la dimension** (une teinte
par symptôme) et, dans le ruban, la **magnitude brute** (opacité proportionnelle à
la valeur). Jamais de rouge/vert « ça va / ça ne va pas », aucun seuil, aucune zone
de gravité. Aucune moyenne « bien-être » globale — on lit 6 symptômes, pas un score.

| Nuance | Rôle | Exemple (Humeur) |
|---|---|---|
| `fill` | Pastel — barres d'empreinte, remplissage des curseurs | `#C4B8ED` |
| `ink` | Soutenue — texte de valeur, thumb du curseur | `#7C6DB6` |
| `mid` | Mi-teinte — courbes de tendance, cellules du ruban | `#9C89D6` |

Accent du module (CTA, onglet actif) : **teal `MOOD_ACCENT` `#4FA5A9`** (remplace
l'ancien orange `#F97316`, banni des aplats). Opacité d'une cellule de ruban :
`ribbonCellOpacity(value, yMax)` = `0.38 + (value/yMax) × 0.62`, `null` si non saisie
(cellule vide à contour clair — jamais une valeur inventée).

### Composants `features/`

| Composant | Rôle |
|---|---|
| `DimensionFingerprint` | Empreinte N barres verticales (valeur au-dessus, libellé court dessous). Remplace la moyenne « X/10 » dans les cartes d'historique. Largeur fluide (`flex: 1` par barre). |
| `SymptomRibbon` | Heatmap dimensions × jours du mois. Cellule = mi-teinte + opacité de magnitude ; jour non saisi = cellule vide. Helper pur `buildRibbonGrid`. |
| `SeasonalityStrip` | Frise pluri-annuelle (≤ 5 ans) des moyennes mensuelles d'une dimension. Comparaison repliée par défaut, dépliée via « Comparer » (`Checkbox`). Helper pur `buildSeasonality`. |
| `MarkerModal` | Modale « Ajouter un repère » typé (traitement / événement de vie / autre via `Chip`), calendrier direct (`DateTimePicker`). |
| `DimensionTrackerView/HistoryCard` | Carte d'historique `score` (legacy) \| `fingerprint` (mood). |
| `DimensionTrackerView/MarkersCard` | Liste des repères typés + filtre par type. |
| `DimensionTrackerView/TrackingTab` | Onglet « Suivi » : sélecteur de mois + ruban + saisonnalité + courbes. |

`DimensionTrackerView` est **config-driven** : `config.tabs` (jeu d'onglets),
`config.historyCardKind` (`'score' | 'fingerprint'`), `config.dimensionFills`,
`config.showSeasonality`. Le module `medication_side_effects` garde ses 3 onglets
(`entry`/`charts`/`month`) sans changement ; `mood_tracker` opte pour `entry`/`tracking`.

Les types de repère et leurs couleurs d'identité vivent dans `src/lib/markerTheme.ts`
(`MARKER_TYPES`, `MARKER_TYPE_COLORS`, `MARKER_TYPE_ICONS`) ; le type `MarkerType`
dans `src/lib/database.ts`. Écriture des repères **toujours** via
`services/timelineMarkerService` (SQLite + synchronisation).

### Accueil patient — « Mes modules »

Composés par `screens/HomeScreen.tsx`. Direction éditoriale sobre (serif, palette de
marque), cartes détachées du fond, bandeau de crise non alarmant (MDR 2017/745).

| Composant | Rôle |
|---|---|
| `features/CrisisBanner` | Bandeau de crise : `Card` à `leftAccentColor={colors.danger}` + `IconChip` danger + titre `colors.dangerText` + sous-titre atténué. Élément FIXE (jamais déclenché par la donnée). |
| `features/ModuleSections` | Modules débloqués groupés par catégorie : un label de section (uppercase atténué) + une `Card variant="elevated"` unique dont les `ModuleRow` sont séparées par un filet `colors.neutral`. En-têtes masqués s'il n'y a qu'un groupe. |
| `features/ModuleSections/ModuleRow` | Ligne de module (SURFACE de liste tappable, `Pressable` justifié car imbriqué dans une `Card`) : `IconChip` primary + titre serif + sous-titre + chevron. Atténuée + non tappable si `available={false}`. |

Ordre d'affichage : helper pur `moduleGrouping.ts` (`groupModulesByCategory`, miroir de
`module_categories.sort_order`). L'accueil ne **conclut** rien : il liste et navigue.

### Agenda patient — « Agenda »

Composé par `screens/AppointmentsScreen.tsx`, même grammaire visuelle que l'accueil
(serif, cartes détachées, accents turquoise). En-tête : titre « Agenda » et bouton `+`
de prise de RDV (`ui/Button variant="secondary"`, icône seule) sur la même ligne.
Utilise `EmptyState`.

| Composant | Rôle |
|---|---|
| `ui/Avatar` | Avatar rond à initiales (dérivées du nom via `initialsFromName`, deux derniers mots). Props : `name`, `size?` (52), `backgroundColor?` (`primaryLight`), `color?` (`primary`). Pas de photo. |
| `features/WeekStrip` | Bande semaine : rangée fluide de jours tappables (`WeekDay[]` = `{ iso, weekday, dayNumber, selected, hasEvent }`). Jour sélectionné = pastille pleine `primaryDark` (blanc sur turquoise foncé, AA ≈ 5.9:1) ; point `primary` sous les jours porteurs d'un RDV. Navigation temporelle pure. |
| `features/NextAppointmentCard` | Carte « Prochain rendez-vous » : `Card variant="elevated"` + `Avatar` + nom serif + rôle atténué + `StatusBadge` (statut réel, jamais une modalité inventée) ; pied filet date/heure (icônes `primary`). |
| `features/AppointmentRegister` | Liste-registre de RDV (`AppointmentRegisterItem[]`) : une `Card` unique, lignes séparées par un filet `colors.neutral`, chaque ligne = bloc date (jour abrégé + numéro serif turquoise) + titre + détail. Ligne `tappable` → feuille d'actions. |

Helpers purs : `lib/agendaData.ts` (`buildAgendaData` → next / upcoming / past / eventDays)
et `lib/agendaFormat.ts` (`dayAbbrev`, `dayNumber`, `formatTime`, `formatLongDate`,
localisés). Tap sur un RDV à venir → `ActionSheet` (reprogrammer / annuler), équivalent
mobile de la modale RDV web. L'écran **affiche** l'état administratif des RDV, il ne
conclut rien (MDR 2017/745).

Tokens de marque ajoutés (`@kaer/shared`) : `primaryDark` (#2C6E72, fond turquoise
portant du texte blanc — contraste AA) et `primaryPale` (#CFE9EA, sous-libellé
décoratif sur `primaryDark`).

### Profil patient — « Profil »

Composé par `screens/ProfileScreen.tsx` : un **hub** (identité + résumé de suivi +
listes-registre) qui navigue vers `SettingsScreen` (roue crantée) et des écrans
« en chantier » (`WorkInProgressScreen`), même grammaire visuelle que l'accueil et
l'agenda.

| Composant | Rôle |
|---|---|
| `features/ProfileIdentityHeader` | En-tête d'identité **compact** : `ui/Avatar` (fond `primary`, initiales blanches) + nom serif + ligne d'ancienneté, et bouton réglages (roue crantée, `ui/Button variant="ghost"`) **sur la même ligne**. Props : `name`, `sinceLabel` (masquée si vide), `onSettingsPress`, `settingsLabel`. Pas de marque KAER (gain de hauteur). |
| `features/ProfileStatsCard` | Résumé de suivi : `ui/Card` à 2 ou 3 colonnes séparées par des filets verticaux `colors.neutral`. Chiffre serif `primaryDark` (AA) + libellé atténué. Props : `stats: ProfileStat[]` (`{ value, label }`). Valeurs **brutes, neutres** — couleur = identité, jamais gravité (MDR 2017/745). |
| `features/RegisterList` | Conteneur **liste-registre générique** : `ui/Card variant="elevated"` unique, coins 16, lignes séparées par un filet `colors.neutral`. Props : `items: RegisterItem[]`. Réutilisable par tout écran (le hub Profil s'en sert pour « Mon suivi » et « Réglages »). |
| `features/RegisterList/RegisterRow` | Une ligne : `ui/IconChip` (couleur de pastille fournie) + libellé + chevron optionnel. `RegisterItem = { key, icon, label, chipColor, onPress, labelColor?, showChevron? }`. SURFACE de liste (`Pressable` justifié, imbriquée dans une `Card`). Ligne danger = `chipColor: dangerLight`, `labelColor: dangerText`, `showChevron: false`. |
| `features/AvatarEditor` | Éditeur d'avatar (photo ronde tappable → `ActionSheet` galerie/appareil photo + badge crayon). Props : `uri`, `uploading`, `onPickSource`. Utilisé par `SettingsScreen`. |

Résumé de suivi : service `profileStatsService.fetchProfileStats` (created_at, modules
actifs, séances honorées) via `hooks/queries/profileQueries` ; helpers purs
`lib/profileStats.ts` (`trackingDays`, `formatSince`). Les fonctions RGPD (consentement,
export/effacement) et l'identité éditable vivent dans `SettingsScreen` (accessible via
la roue crantée) — légalement obligatoires, donc toujours joignables. Le hub **affiche**
des faits bruts, il ne conclut rien (MDR 2017/745).

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
│       │   ├── PatientScenario/ EditableSteps/ SafetyPlan/ DailyCheckin/ ColumnForm/
│       │   ├── TreeSelector/ SleepJournal/ Tabs/
│       │   ├── ActivityLog/ ExposureTracker/ DecisionGrid/ PsyEdu/
│       │   ├── ChronoMonth/ ExposureHierarchy/
│       │   └── shared/                  # EditableItemsList, WeightPicker, ExerciseSafetySection, CrisisEmergencyCalls, CallableContact, EditableContactsList
│       └── fields/                      # field_type → composant + widgets
│           ├── FieldRow/ FieldWidget/ FieldText/ FieldListItem/
│           ├── CardDefinition/ InlineText/ CrisisAnchorsWidget/
│           └── widgets/                 # TextWidget, InfoWidget, LikertWidget
```

Chaque dossier de layout contient : `<Nom>Layout.tsx` + `styles.ts` + `index.ts`.
Chaque dossier de widget contient : `Widget.tsx` + `Widget.test.tsx` + `index.ts`.
