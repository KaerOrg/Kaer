# Design System — Web praticien

> Tokens partagés → `DESIGN_SYSTEM.md` à la racine du monorepo.

## Injection des tokens CSS

`apps/web/src/theme.ts` expose `injectTheme()`, appelé une fois au démarrage de l'app.  
Elle écrit tous les tokens comme propriétés CSS custom sur `:root` :

```
--color-primary       #2563EB
--color-primary-light #EFF6FF
--color-background    #F8F9FA
--color-card          #FFFFFF
--color-text          #111827
--color-text-muted    #6B7280
--color-border        #E5E7EB
--color-success       #10B981
--color-warning       #F59E0B
--color-danger        #EF4444
--color-stars         #F59E0B

--spacing-xs  4px     --spacing-sm  8px
--spacing-md  16px    --spacing-lg  24px    --spacing-xl  32px

--radius-sm   6px     --radius-md   10px    --radius-lg   16px    --radius-full 999px

--shadow-sm   0 1px 3px rgba(0,0,0,0.08)
--shadow-md   0 4px 12px rgba(0,0,0,0.08)
--shadow-lg   0 8px 24px rgba(0,0,0,0.10)

--font-family -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
--font-size-caption 14px  --font-size-body  16px
--font-size-h3      18px  --font-size-h2    22px  --font-size-h1  28px
```

Dans le CSS : `color: var(--color-primary)` — jamais de valeur hex directe.

---

## Classes de layout du ModuleRenderer

Définies dans `apps/web/src/components/ModulePreviewPanel/ModulePreviewPanel.css`.

| Classe | Description |
|---|---|
| `.preview-panel` | Conteneur principal — fond `#F8F9FA`, bordure haute accent |
| `.preview-steps` | Liste ordonnée verticale (layout `steps`) |
| `.preview-step` | Ligne step : badge numéroté coloré + contenu |
| `.preview-step__num` | Badge rond coloré, 24×24, texte blanc |
| `.preview-fields` | Grille responsive de `FieldRow` (layout `fields`) |
| `.preview-field` | Champ vertical : header (icône + label) + zone contrôle |
| `.preview-field__header` | Ligne flex — icône + label |
| `.preview-field__control` | Zone du widget, indenté sous le label |
| `.preview-field__detail` | Texte de description si pas de widget |
| `.preview-grid2x2` | Grille 2 colonnes (layout `grid2x2`) |
| `.preview-quadrant` | Cellule de quadrant — bordure haute colorée |
| `.preview-cards` | Stack de cartes accordéon (layout `cards`) |
| `.preview-card` | Carte : header cliquable + body dépliable |
| `.preview-card__header` | Flex row : méta + toggle arrow |
| `.preview-card__body` | Contenu déplié, padding horizontal |
| `.preview-panel__info` | Bandeau footer — icône info + texte muted |

---

## Widgets HTML (classes `fw-*`)

Les widgets sont des aperçus en lecture seule du formulaire patient, rendus dans `FieldWidget`.  
Tous les inputs sont `disabled` ou `readOnly`.

| Widget | Classe CSS | Élément HTML | Notes |
|---|---|---|---|
| `TimeWidget` | `.fw-time` | `<input type="time">` | `defaultValue="22:00"` |
| `SliderWidget` | `.fw-slider` | `<input type="range">` + `<span>` | Saisie. Spec `slider:min:max:unit`. Pour **afficher** une valeur (lecture seule) → `ValueBar`, pas ce widget |
| `StarsWidget` | `.fw-stars` | `<span>` × N avec `.fw-star--on`/`.fw-star--off` | Spec `stars:count` |
| `BooleanWidget` | `.fw-boolean` | `<span class="fw-boolean__opt">` × 2 | `.fw-boolean__opt--active` sur "Non" |
| `RadioWidget` | `.fw-radio` + `fw-radio--ok/partial/miss` | `<span>` coloré | ok=vert, partial=ambre, miss=rouge |
| `DateWidget` | `.fw-date` | `<input type="date">` | Placeholder natif du navigateur |
| `TextWidget` | `.fw-text` | `<div>` vide | Hauteur fixe, fond card |
| `CheckboxWidget` | `.fw-checkbox` | `<label><input type="checkbox" disabled>` | Label "Non accompli" |
| `TextareaWidget` | `.fw-textarea` | `<div>` vide | Hauteur 80px |
| `InfoWidget` | `.fw-info` | `<AlignLeft>` + `<span>` | Texte en italique muted |

### Format de la prop `widget_type`

```
"time"                  → TimeWidget
"slider:0:120:min"      → SliderWidget  (min=0, max=120, unit=min)
"stars:5"               → StarsWidget   (count=5)
"boolean"               → BooleanWidget
"radio:ok"              → RadioWidget   (variant: ok | partial | miss)
"date"                  → DateWidget
"text"                  → TextWidget
"checkbox"              → CheckboxWidget
"textarea"              → TextareaWidget
"info"                  → InfoWidget    (texte via detail_code)
```

---

## Architecture des composants — `ui/` vs `features/`

`src/components/` est divisé en deux sous-dossiers :

| Dossier | Rôle |
|---|---|
| `components/ui/` | Primitives design system — Accordion, Button, Card, Chart, EmptyState, InputField, Modal, ScaleMetaBadges, SearchInput, SelectField, Sparkline, StatusBadge, StepBreadcrumb, Tabs, Toast, Toggle, ValueBar |
| `components/features/` | Composants métier — ActivityFeedPanel, AppointmentModal, AvailabilityEditor, CSSRSScreenPanel, Layout, MainNav, ModulePreviewPanel, ModuleRenderer, NotificationRoutineModal, WeekGrid |

**Règle de dépendance : `features → ui` uniquement.** Les composants `ui/` n'importent jamais depuis `features/`.

---

## Structure des fichiers

```
apps/web/src/
├── theme.ts                              # injectTheme() + tokens JS
├── components/
│   ├── ui/                               # primitives design system
│   │   ├── Button/, Card/, Modal/ …
│   │   └── Toggle/, Tabs/, Toast/ …
│   └── features/                         # composants métier
│       ├── Layout/
│       ├── MainNav/
│       ├── ModulePreviewPanel/
│       │   └── ModulePreviewPanel.css    # classes fw-* et preview-*
│       └── ModuleRenderer/
│           ├── FieldRenderer.tsx         # dispatch preview_kind → layout
│           └── fields/
│               ├── index.ts              # barrel
│               ├── types.ts              # FieldProps interface
│               ├── FieldRow/             # field_row → header + FieldWidget
│               ├── FieldWidget/          # dispatch widget_type → widget
│               ├── FieldText/            # variantes typographiques
│               ├── FieldListItem/        # li bullet / numéroté
│               ├── CardDefinition/       # terme + définition
│               ├── CardDivider/          # séparateur <hr>
│               └── widgets/
│                   ├── index.ts
│                   ├── TimeWidget/
│                   ├── SliderWidget/
│                   ├── StarsWidget/
│                   ├── BooleanWidget/
│                   ├── RadioWidget/
│                   ├── DateWidget/
│                   ├── TextWidget/
│                   ├── CheckboxWidget/
│                   ├── TextareaWidget/
│                   └── InfoWidget/
```

Chaque dossier contient : `ComponentName.tsx` + `ComponentName.test.tsx` + `index.ts`.

---

## Primitives d'aperçu module — `Tabs` (compact), `ValueBar`, `Sparkline`

Les layouts du `ModuleRenderer` reproduisent l'écran mobile du patient. Trois
primitives partagées évitent de redéclarer onglets, sliders et mini-courbes dans
chaque layout :

### `Tabs` — variante `compact`

`Tabs` (déjà la barre d'onglets praticien) accepte `variant="compact"` : une barre
dense (13px, soulignement fin) pour les aperçus mobile-mock. À utiliser au lieu de
réécrire des `__tab`/`role="tab"` à la main.

```tsx
<Tabs tabs={tabs} activeTab={active} onChange={setActive} variant="compact" />
```

`variant` : `'horizontal'` (défaut) · `'vertical'` · `'compact'`. `accentColor`
surcharge la couleur de l'onglet actif (défaut `var(--color-primary)`).
Utilisé par `SliderDashboardLayout` et `DailyCheckinLayout`.

### `ValueBar` — barre de valeur statique

`components/ui/ValueBar/`. Affiche une dimension : libellé + valeur + jauge colorée
positionnée dans `[min, max]` + repères d'extrémité. Passif, sans saisie (MDR : affiche,
n'interprète pas).

```tsx
<ValueBar label="Humeur" value={7} min={1} max={10} color="#8B5CF6"
          lowHint="Très basse" highHint="Très élevée" />
```

Props : `label`, `value`, `min?=1`, `max?=10`, `color?=var(--color-primary)`,
`lowHint?`, `highHint?`.

#### `ValueBar` (display) vs `SliderWidget` (input) — ne pas confondre

Les deux ressemblent visuellement à une « barre + valeur », mais jouent des rôles
**opposés**. Ce ne sont pas des doublons : on a délibérément un composant par rôle
(un fichier = une responsabilité).

| | `ValueBar` | `SliderWidget` |
|---|---|---|
| Rôle | **Restitution** — on lit une valeur déjà saisie | **Saisie** — on glisse pour changer la valeur |
| Dossier | `components/ui/ValueBar/` | `components/features/.../widgets/SliderWidget/` |
| Catégorie | Primitive design system (`ui/`) | Widget d'aperçu module (`fw-*`) |
| Élément | `<div>` étiqueté (header dot+label+value, piste, hints) | `<input type="range">` + `<span>` valeur |
| Interaction | Aucune — le `thumb` est purement décoratif | Glissable (`onChange` + state) |
| Markup | Ligne de restitution complète (label + jauge + repères) | Range nu + chiffre |
| Utilisé par | `SliderDashboardLayout` (onglet « Aujourd'hui », une barre/dimension) | `FieldWidget` via `widget_type="slider:min:max:unit"` |

> **Pourquoi pas un seul « slider readonly » ?** Un `<input type="range" disabled>`
> s'annoncerait aux lecteurs d'écran comme un *contrôle désactivé* (faux : c'est une
> donnée en lecture), hériterait du style natif à neutraliser, et n'offrirait pas le
> header étiqueté + les hints de `ValueBar`. Surtout, fusionner les deux rouvrirait
> la porte à « retirer le `disabled` pour gagner un input » — soit transformer un
> affichage passif en saisie, ce qui touche la règle d'or non-DM (MDR 2017/745).
> Règle : **pour saisir → `SliderWidget` ; pour afficher → `ValueBar`.**

### Groupe `ui/Chart/` — primitifs graphiques interactifs

`components/ui/Chart/` regroupe les graphiques qui prennent `(number | null)[]` — la valeur `null` représente une donnée manquante (gap dans la courbe). Primitifs purs, aucune logique métier.

Type partagé (`chartTypes.ts`) :

```ts
type ChartDataPoint = number | null
interface ChartProps { data: ChartDataPoint[]; color: string; maxY?: number }
```

#### `LineChart` — courbe avec gaps

Segments interrompus sur les `null`, marqueurs circulaires sur les points présents.

```tsx
import { LineChart } from '../components/ui/Chart'
<LineChart data={[1, 2, null, 3, 2]} color="#8B5CF6" maxY={3} />
```

#### `BarChart` — barres verticales

Barres colorées proportionnelles à la valeur, gaps (`null`) rendus comme trait grisé.

```tsx
import { BarChart } from '../components/ui/Chart'
<BarChart data={[2, null, 1, 3]} color="#EC4899" maxY={3} />
```

> **Règle : tout graphique de séries temporelles web utilise `LineChart` ou `BarChart` depuis `ui/Chart/`. `Sparkline` reste pour les tendances compactes sans axe.**

---

### `Sparkline` — mini-courbe

`components/ui/Sparkline/`. Petit graphe linéaire SVG sans axe ni légende — une
tendance brute. Passif (MDR).

```tsx
<Sparkline values={[6,7,6,5,7,8]} color="#8B5CF6" min={1} max={10} className="…" />
```

Props : `values` (≥2 points), `color?`, `min?=1`, `max?=10`, `width?=80`,
`height?=24`, `className?`.

---

## Primitives génériques (`components/ui/`)

Briques de base réutilisables, sans logique métier. **Toujours les importer avant
d'écrire du markup** — réimplémenter `Button`/`Card`/`Modal`/`Toggle` à la main est
un anti-pattern bloquant en revue (cf. [`coding-standards.md`](../../../.claude/rules/coding-standards.md) § *Checklist obligatoire*).
Pour étendre un besoin proche : ajouter une prop/variante, ne pas dupliquer.

### `Button`

`components/ui/Button/`. Bouton du design system — étend `ButtonHTMLAttributes` (donc
`onClick`, `disabled`, `type`, etc. natifs).

```tsx
<Button variant="primary" size="md" loading={saving} onClick={onSave}>
  {t('common.save')}
</Button>
```

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'primary'` | Style visuel |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Taille |
| `loading` | `boolean` | `false` | Affiche un spinner et désactive le bouton |
| …natifs | `ButtonHTMLAttributes` | — | `onClick`, `disabled`, `type`, `aria-*`… |

### `Card`

`components/ui/Card/`. Conteneur principal — header structuré optionnel + zone
d'actions + contenu. Base de la plupart des panneaux.

```tsx
<Card
  header={{ title: t('patient.modules'), subtitle: t('patient.modules_sub'), icon: <Boxes />, right: <Toggle … /> }}
  variant="elevated"
>
  {children}
</Card>
```

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `header` | `CardHeader` | — | `{ title, subtitle?, icon?, right? }` |
| `actions` | `ReactNode` | — | Zone d'actions (bas de carte) |
| `variant` | `'default' \| 'outlined' \| 'elevated'` | `'default'` | Style de bordure/ombre |
| `state` | `'active' \| 'disabled'` | — | État visuel |
| `children` | `ReactNode` | — | Contenu |
| `className` | `string` | — | Classe additionnelle |

### `Modal`

`components/ui/Modal/`. Boîte de dialogue accessible (`role="dialog"`, `aria-modal`,
fermeture sur `Échap` + clic sur l'overlay).

```tsx
<Modal title={t('appointment.new')} subtitle={dateLabel} icon={<Calendar />} onClose={close}
       footer={<Button onClick={save}>{t('common.confirm')}</Button>}>
  {formContent}
</Modal>
```

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `title` | `string` | — | Titre (obligatoire) |
| `subtitle` | `string` | — | Sous-titre |
| `icon` | `ReactNode` | — | Icône en tête |
| `onClose` | `() => void` | — | Appelé sur `Échap`, clic overlay, ou croix |
| `footer` | `ReactNode` | — | Pied (actions) |
| `noPadding` | `boolean` | `false` | Supprime le padding du body |
| `maxWidth` | `number` | — | Largeur max en px |
| `children` | `ReactNode` | — | Corps |

### `InputField`

`components/ui/InputField/`. Champ texte étiqueté avec message d'erreur. Étend
`InputHTMLAttributes` (donc `value`/`defaultValue`, `type`, `placeholder`, `onChange`…).

```tsx
<InputField label={t('auth.email')} type="email" error={emailError} defaultValue="" />
```

| Prop | Type | Rôle |
|---|---|---|
| `label` | `string` | Libellé (obligatoire) |
| `error` | `string` | Message d'erreur inline (validation de champ) |
| …natifs | `InputHTMLAttributes` | `type`, `value`, `onChange`, `placeholder`… |

### `SearchInput`

`components/ui/SearchInput/`. Champ de recherche contrôlé (icône loupe + input).

```tsx
<SearchInput value={query} onChange={setQuery} placeholder={t('common.search')} ariaLabel={t('common.search')} />
```

| Prop | Type | Rôle |
|---|---|---|
| `value` | `string` | Valeur contrôlée |
| `onChange` | `(value: string) => void` | Reçoit la nouvelle valeur (pas l'event) |
| `placeholder` | `string` | Placeholder (obligatoire) |
| `ariaLabel` | `string` | Label accessibilité |

### `StatusBadge`

`components/ui/StatusBadge/`. Badge d'état coloré, lecture seule.

```tsx
<StatusBadge variant="success" label={t('appointment.confirmed')} icon={<Check />} />
```

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `variant` | `'info' \| 'success' \| 'warning' \| 'danger' \| 'neutral'` | `'neutral'` | Couleur |
| `label` | `string` | — | Texte (obligatoire) |
| `value` | `string \| number` | — | Valeur additionnelle |
| `icon` | `ReactNode` | — | Icône |
| `className` | `string` | — | Classe additionnelle |

### `Accordion`

`components/ui/Accordion/`. Section repliable (titre cliquable + contenu).

```tsx
<Accordion title={t('crisis.coping')} icon={<HeartPulse />} badge={items.length} defaultOpen>
  {items}
</Accordion>
```

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `title` | `string` | — | Titre (obligatoire) |
| `icon` | `ReactNode` | — | Icône |
| `subtitle` | `string` | — | Sous-titre |
| `badge` | `number` | — | Compteur affiché à droite |
| `defaultOpen` | `boolean` | `false` | Ouvert au montage |
| `children` | `ReactNode` | — | Contenu (obligatoire) |
| `className` | `string` | — | Classe additionnelle |

### `EmptyState`

`components/ui/EmptyState/`. État vide — icône + titre + description + action optionnelle.

```tsx
<EmptyState icon={<Inbox />} title={t('patients.empty')} description={t('patients.empty_sub')}
            action={{ label: t('patients.invite'), onClick: openInvite }} />
```

| Prop | Type | Rôle |
|---|---|---|
| `icon` | `ReactNode` | Icône illustrative |
| `title` | `string` | Titre (obligatoire) |
| `description` | `string` | Texte explicatif |
| `action` | `{ label: string; onClick: () => void }` | Bouton d'action optionnel |
| `className` | `string` | Classe additionnelle |

> `Toggle`, `SelectField`, `StepBreadcrumb`, `Toast` ont une doc dédiée dans
> [`docs/components/`](components/). `Tabs`, `ValueBar`, `Sparkline`, `ScaleMetaBadges`
> sont documentés ci-dessus/ci-dessous.

### `DataTable<T>`

`components/ui/DataTable/`. **Table de données générique** — structure `table`,
en-têtes collants, conteneur scrollable, dépliage par ligne, mise en avant et état
vide. **Zéro connaissance métier** : colonnes, rendu des cellules, panneau de détail
et classe de ligne sont injectés par l'appelant. C'est la brique de la matrice
« Ma file active » (`features/CaseloadTable`), conçue pour être réutilisée par toute
liste tabulaire praticien (dispensaire, suivi, etc.).

```tsx
const columns: DataTableColumn<Row>[] = [
  { id: 'name', header: t('col.name'), cell: row => <NameCell row={row} /> },
  {
    id: 'actions',
    header: t('col.actions'),
    headerClassName: 'my-th--actions',   // largeur/alignement métier
    cellClassName: 'my-cell--actions',
    // ctx donne accès au dépliage de la ligne (chevron cliquable, etc.)
    cell: (row, ctx) => <Summary row={row} expanded={ctx.expanded} onToggle={ctx.toggleExpanded} />,
  },
]

<DataTable
  columns={columns}
  rows={visibleRows}
  getRowId={row => row.id}
  toolbar={<><AddForm /><Filters /></>}          // au-dessus de la table
  renderDetail={row => <RowDetail row={row} />}   // panneau dépliable (optionnel)
  rowClassName={row => (row.important ? 'my-row--flag' : undefined)}
  emptyState={<EmptyState … />}                   // rendu si rows.length === 0
  ariaLabel={t('section.title')}
/>
```

| Prop | Type | Rôle |
|---|---|---|
| `columns` | `DataTableColumn<T>[]` | Définition des colonnes (`id`, `header`, `cell`, `*ClassName`) |
| `rows` | `readonly T[]` | Lignes **déjà filtrées** par l'appelant |
| `getRowId` | `(row: T) => string` | Identité stable (clé React + état de dépliage) |
| `toolbar` | `ReactNode` | Zone libre au-dessus de la table (filtres, capture rapide) |
| `renderDetail` | `(row, ctx) => ReactNode` | Panneau dépliable ; absent ⇒ lignes non dépliables |
| `rowClassName` | `(row) => string \| undefined` | Classe additionnelle de ligne (mise en avant) |
| `emptyState` | `ReactNode` | Affiché à la place de la table quand `rows` est vide |
| `ariaLabel` | `string` | Libellé accessible de la `<table>` |

Sous-composant exporté **`DataTableCell`** — le `<td>` générique (classe de base
`data-table__cell` + `className` métier optionnelle). `DataTable` l'utilise en
interne pour chaque cellule ; il est aussi réutilisable directement par tout layout
tabulaire sur mesure qui ne passe pas par `columns`.

```tsx
<DataTableCell className="cell-name">{row.name}</DataTableCell>
```

**Règles d'usage :**
- Le **filtrage et la distinction des états vides** (aucune donnée vs aucun résultat)
  restent côté appelant : `DataTable` reçoit les lignes à afficher et un seul
  `emptyState`. L'appelant choisit le bon message selon que le jeu non filtré est vide.
- Les **largeurs/alignements de colonnes** passent par `headerClassName`/`cellClassName`
  (classes métier dans le `.css` de la feature) — la base `.data-table__th/__cell`
  vient du design system.
- Le **dépliage** est piloté depuis une cellule via `ctx.toggleExpanded` (le chevron
  vit dans la cellule métier de son choix, pas dans une colonne dédiée imposée).
- Chaque ligne est **mémoïsée** : passer des `columns` (useMemo) et `renderDetail`
  (useCallback) stables pour éviter les re-rendus inutiles à grande échelle.

---

## Composant `ScaleMetaBadges`

Fichier : `components/ui/ScaleMetaBadges/ScaleMetaBadges.tsx`

Affiche la description et les chips méta d'une échelle clinique : badge Auto/Hétéro, chip nosologique, chips d'âge colorés. À utiliser comme enfant du composant `Card`.

```tsx
import { ScaleMetaBadges } from '../components/ui/ScaleMetaBadges/ScaleMetaBadges'

<Card header={{ ... }}>
  <ScaleMetaBadges
    description={scale.description}
    evaluationType={scale.evaluationType}   // 'auto' | 'hetero'
    category={scale.category}               // string — chip nosologique
    targetAges={scale.targetAges}           // TargetAge[] — chips colorés via AGE_BADGE_CONFIG
  />
</Card>
```

### Props

| Prop | Type | Rôle |
|---|---|---|
| `description` | `string` | Texte descriptif affiché au-dessus des chips |
| `evaluationType` | `'auto' \| 'hetero'` | Badge coloré — bleu (auto-évaluation) ou vert (hétéro-évaluation) |
| `category` | `string` | Chip nosologique gris (ex. `'Humeur'`, `'Anxiété'`) |
| `targetAges` | `readonly TargetAge[]` | Chips d'âge colorés — couleurs définies dans `AGE_BADGE_CONFIG` de `data/scales.ts` |

### Labels i18n

| Clé | `fr` | `en` |
|---|---|---|
| `scales.eval_auto` | Auto | Self-report |
| `scales.eval_hetero` | Hétéro | Clinician-rated |

### Classes CSS (dans `ScaleMetaBadges.css`)

| Classe | Rôle |
|---|---|
| `.scale-meta__desc` | Texte descriptif |
| `.scale-meta__chips` | Conteneur flex des chips |
| `.scale-meta__eval-badge` | Badge Auto/Hétéro — base |
| `.scale-meta__eval-badge--auto` | Variante bleue |
| `.scale-meta__eval-badge--hetero` | Variante verte |
| `.scale-meta__category-chip` | Chip nosologique gris |
| `.scale-meta__age-chip` | Chip d'âge — couleur appliquée en inline via `AGE_BADGE_CONFIG` |

---

## Feedback utilisateur — Toasts

Tout feedback d'opération réseau passe par le système de toast. Voir la doc complète : [`docs/components/toast.md`](components/toast.md).

```tsx
import { useToast } from '../contexts/ToastContext'

const toast = useToast()
toast.success('Enregistré')   // auto-dismiss 4 s
toast.error('Erreur réseau')  // persistant
toast.warning('Attention')
toast.info('Info')
```

**Règle :** `useToast` pour les résultats d'opération réseau. État local inline uniquement pour la validation de champ (email invalide, champ vide).

---

## Ajouter un nouveau widget

1. Créer `fields/widgets/MonWidget/MonWidget.tsx` — composant `disabled`/`readOnly`
2. Créer `fields/widgets/MonWidget/MonWidget.test.tsx` — au moins 2 tests
3. Créer `fields/widgets/MonWidget/index.ts` — `export { MonWidget } from './MonWidget'`
4. Ajouter l'export dans `fields/widgets/index.ts`
5. Ajouter le cas dans `FieldWidget.tsx` — `if (widgetType === 'mon_type') return <MonWidget />`
6. Ajouter les classes CSS dans `ModulePreviewPanel.css` — préfixe `.fw-`
7. Insérer les `field_props` correspondants dans `supabase/schema.sql`
