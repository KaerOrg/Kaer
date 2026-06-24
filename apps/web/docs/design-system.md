# Design System — Web praticien

> Tokens partagés → `DESIGN_SYSTEM.md` à la racine du monorepo.

## Injection des tokens CSS

`apps/web/src/theme.ts` expose `injectTheme()`, appelé une fois au démarrage de l'app.  
Elle écrit tous les tokens comme propriétés CSS custom sur `:root` :

```
--color-primary       #6dbfc3
--color-primary-light #EFF6FF
--color-background    #F8F9FA
--color-card          #FFFFFF
--color-text          #111827
--color-text-muted    #6B7280
--color-border        #E5E7EB
--color-success       #10B981   --color-success-light #ECFDF5
--color-warning       #F59E0B   --color-warning-light #FFFBEB
--color-stars         #F59E0B   /* icônes étoiles (RatingSelector variant icon) */
--color-danger        #EF4444   --color-danger-light  #FEE2E2
--color-overlay       rgba(15, 23, 42, 0.45)   /* voile Modal / ActionSheet */

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
| `SliderWidget` | `.fw-slider` | `<input type="range">` + `<span>` | Saisie. Spec `slider:min:max:unit`. Pour **afficher** une valeur (lecture seule) → `RatingSelector variant="bar"`, pas ce widget |
| `StarsWidget` | (aucune — délègue) | `RatingSelector variant="icon"` (lecture seule) | Spec `stars:count`. Adaptateur fin → primitive, moitié des étoiles remplies |
| `BooleanWidget` | (aucune — délègue) | `Radio variant="pills"` (lecture seule) | Pilules `[Non] [Oui]`, "Non" actif. Adaptateur fin → primitive, zéro style pill ad hoc |
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
| `components/ui/` | Primitives design system — ActionSheet, Banner, Button, Card, Chart, Chip, ConfirmDialog, DataTable, Drawer, EmptyState, InputField, Modal, Radio, RatingSelector, SearchInput, Dropdown, SegmentedControl, SpeechToTextButton, StatusBadge, StepBreadcrumb, Tabs, TimePicker, Toast, Tooltip, Toggle |
| `components/features/` | Composants métier — ActivityFeedPanel, AppointmentModal, AvailabilityEditor, CaseloadTable, CSSRSScreenPanel, Layout, MainNav, MfaReminderBanner, MfaSettingsCard, ModulePreviewPanel, ModuleRenderer, ModuleSources, NotificationRoutineModal, PatientDataRights, ScaleMetaBadges, SupportRequestModal, WeekGrid |

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

## Primitives d'aperçu module — `Tabs` (compact), `RatingSelector`

Les layouts du `ModuleRenderer` reproduisent l'écran mobile du patient. Deux
primitives partagées évitent de redéclarer onglets et sliders dans
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
`iconOnly` n'affiche que l'`icon` de chaque onglet ; le `label` devient alors le nom
accessible (`aria-label`) et l'infobulle (`title`) — chaque onglet doit fournir un `icon`.
Utilisé par `SliderDashboardLayout`, `DailyCheckinLayout`, et le détail de la file
active (`RowDetail` : onglets verticaux icône seule).

### `RatingSelector` — sélecteur de note (pendant web 1-1 du mobile)

`components/ui/RatingSelector/`. Pendant web exact du `RatingSelector` mobile : un
même besoin (une note sur une échelle), quatre habillages via `variant`. Absorbe
l'ancien `ValueBar` (devenu la variante `bar`). Présentationnel — aucune
interprétation (MDR : affiche, ne conclut pas).

| `variant` | Rendu | Échelle | Usage |
|---|---|---|---|
| `numbered` (défaut) | pastilles carrées chiffrées, seule la sélectionnée colorée | `steps[]` discret | SUDS (`ExposureTrackerLayout`) |
| `track` | segments fins remplis jusqu'à la valeur | `steps[]` discret | `ActivityLogLayout`, `ColumnFormLayout` |
| `icon` | rangée d'icônes (`star`/`sun`) remplies jusqu'à la valeur | `steps[]` discret | `SleepJournalLayout` (saisie + historique) |
| `bar` | jauge continue (fill + thumb) | `[min, max]` continu | `SliderDashboardLayout`, récap exposition |

```tsx
// Discret, interactif (onChange ⇒ boutons radio ; absent ⇒ lecture seule)
<RatingSelector variant="track" label="Plaisir" value={7} steps={[1,2,3,4,5,6,7,8,9,10]}
                valueSuffix="/10" onChange={setValue} />

// Icônes (étoiles / soleils), en lecture seule dans un historique
<RatingSelector variant="icon" icon="star" iconSize={12} label="Qualité"
                value={4} steps={[1,2,3,4,5]} showHeader={false} />

// Jauge continue (ex-ValueBar) — repères low/mid/high
<RatingSelector variant="bar" label="Humeur" value={7} min={1} max={10}
                color="var(--color-primary)" lowHint="Très basse" highHint="Très élevée" />

// Jauge continue compacte, label + jauge + valeur sur une ligne
<RatingSelector variant="bar" layout="inline" label="Pic" value={60} min={0} max={100} />
```

Props communes : `label` (requis, sert d'`aria-label`), `sublabel?`, `color?=var(--color-primary)`,
`showHeader?=true`, `lowHint?`, `highHint?`, `valueSuffix?` (ex. `'%'`, `'/10'`), `className?`.
Variantes discrètes : `steps: number[]`, `value: number | null`, `icon?='star'|'sun'`,
`iconSize?=28`, `onChange?(v)` (absent ⇒ lecture seule), `testIdPrefix?`.
Variante `bar` : `value`, `min?=1`, `max?=10`, `midHint?`, `layout?='stacked'|'inline'`.

#### `RatingSelector` (sélection/restitution) vs `SliderWidget` (input glissant)

`RatingSelector variant="bar"` **affiche** une valeur (jauge non glissable) ;
`SliderWidget` est un `<input type="range">` **glissant**. Ce ne sont pas des doublons.

| | `RatingSelector` | `SliderWidget` |
|---|---|---|
| Rôle | sélection discrète OU restitution d'une valeur | saisie continue par glissement |
| Dossier | `components/ui/RatingSelector/` | `components/features/.../widgets/SliderWidget/` |
| Catégorie | Primitive design system (`ui/`) | Widget d'aperçu module (`fw-*`) |
| Élément | pastilles / segments / icônes / jauge `<div>` | `<input type="range">` + `<span>` valeur |
| Utilisé par | aperçus mobile-mock du `ModuleRenderer` | `FieldWidget` via `widget_type="slider:min:max:unit"` |

> **Pourquoi un `RatingSelector` web ?** Règle de parité 1-1 : chaque widget mobile a
> son pendant web. Le mobile a un unique `RatingSelector` (4 variantes) ; le web le
> reproduit à l'identique plutôt que de redessiner `mt-slider`/`cf-slider`/`al-pip`/
> `ej-suds` à la main dans chaque layout. Pour une **saisie glissante** continue côté
> field widget → `SliderWidget` ; pour **afficher ou sélectionner** une note → `RatingSelector`.

### `TimePicker` — saisie d'une heure (pendant web 1-1 du mobile)

`components/ui/TimePicker/`. Pendant web du `TimePicker` mobile : enrobe un
`<input type="time">` natif (le navigateur fournit le picker) avec libellé, icône,
indice et croix d'effacement optionnelle. `forwardRef` vers l'`<input>`.

Supporte les **deux modes** :
- **contrôlé** (`value` + `onChange`, parité mobile) ;
- **non contrôlé** (`defaultValue` + `ref` lu au submit) — conforme à la règle
  « input lu au submit → `useRef` ». C'est le mode des formulaires praticien.

```tsx
// Contrôlé
<TimePicker label="Coucher" value={bedtime} onChange={setBedtime} clearable clearLabel="Effacer" />
// Non contrôlé (lu au submit via ref)
<TimePicker ref={startRef} defaultValue="09:00" step={300} />
// Aperçu lecture seule (widget de preview)
<TimePicker defaultValue="22:00" disabled />
```

Props : `label?`, `value?`, `defaultValue?`, `onChange?(next)`, `icon?` (défaut horloge),
`clearable?`, `clearLabel?`, `accent?=var(--color-primary)`, `hint?`, `step?`, `disabled?`,
`id?`, `className?`, `data-testid?`.
Branché sur : `TimeWidget` (preview module), `NotificationRoutineModal`, `AvailabilityEditor`.

### `Radio` — choix exclusif (pendant web 1-1 du mobile)

`components/ui/Radio/`. Sélecteur mono-sélection, trois habillages via `variant` :
`list` (rond + label + sous-label), `pills` (pilules en ligne), ou `cards` (grille de
cartes : pastille `badge` + label + sous-label, pour les **échelles à libellés riches**).
Boutons `role="radio"` dans un `role="radiogroup"`. `onChange` absent → rendu non
interactif (options en `<span>`, sans `role`), pour un aperçu / affichage en lecture
seule — jamais un composant « display-only » parallèle.

```tsx
<Radio variant="list" options={[{ value: 'a', label: 'Oui' }, { value: 'b', label: 'Non' }]}
       value={answer} onChange={setAnswer} />

// Variante cards : échelle de Likert (valeur en tête + label + détail)
<Radio variant="cards" color="var(--color-danger)" value={String(level)} onChange={v => set(Number(v))}
       options={[{ value: '0', label: '0', sublabel: 'Aucune lésion', badge: '0' }, /* … */]} />

// Aperçu en lecture seule (sans onChange) — ex. BooleanWidget
<Radio variant="pills" value="non"
       options={[{ value: 'non', label: 'Non' }, { value: 'oui', label: 'Oui' }]} />
```

Props : `options: {value, label, sublabel?, badge?}[]`, `value: string | null`, `onChange?(value)`
(absent → lecture seule), `variant?='list'|'pills'|'cards'`, `color?=var(--color-primary)`,
`className?`, `data-testid?`.
Branché sur : `CSSRSScreenPanel` (`LikertScale` = `Radio variant="cards"`, accent danger pour la létalité) ; `BooleanWidget` (aperçu pills lecture seule).

> **`Radio` vs `SegmentedControl`** : pour un choix exclusif **compact en barre segmentée**
> → `SegmentedControl` (couvre déjà la variante « pills » dense). Pour une **liste verticale**
> avec sous-libellés, ou des pilules d'option simples → `Radio`.

### `ConfirmDialog` — confirmation modale (pendant web 1-1 du mobile)

`components/ui/ConfirmDialog/`. Compose `ui/Modal` + deux `ui/Button`. **Remplace
`window.confirm`** : cohérent avec le design system, stylable, testable. Variante danger
pour les actions destructives.

```tsx
<ConfirmDialog open={pendingId !== null} title="Supprimer ?" message="Action irréversible."
               confirmLabel="Supprimer" cancelLabel="Annuler" destructive
               onConfirm={doDelete} onCancel={() => setPendingId(null)} />
```

Props : `open`, `title`, `message?`, `confirmLabel?='OK'`, `cancelLabel`, `destructive?`,
`onConfirm(): void | Promise<void>`, `onCancel()`. Branché sur : `CSSRSScreenPanel`
(suppression d'une évaluation).

### `ActionSheet` — feuille d'actions (pendant web 1-1 du mobile)

`components/ui/ActionSheet/`. Liste de choix en bas d'écran sur fond assombri + bouton
d'annulation ; sélectionner une option ferme la feuille puis exécute son action. Existe
pour la **parité 1-1** avec le mobile et les contextes responsive étroits ; sur desktop,
préférer un menu / popover quand c'est plus adapté.

```tsx
<ActionSheet open={sheetOpen} title="Actions" cancelLabel="Annuler" onClose={() => setSheetOpen(false)}
             options={[{ label: 'Modifier', onClick: edit }, { label: 'Supprimer', onClick: del, destructive: true }]} />
```

Props : `open`, `title?`, `options: {label, onClick, destructive?}[]`, `cancelLabel`, `onClose()`.

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

> **Règle : tout graphique de séries temporelles web utilise `LineChart` ou `BarChart` depuis `ui/Chart/`.**

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

{/* Icône + label */}
<Button variant="primary" icon={<Plus size={16} />} onClick={onAdd}>
  {t('patient.add_module_button')}
</Button>

{/* Icône-seule : pas de children → carré. aria-label OBLIGATOIRE. */}
<Button variant="outline" size="xs" icon={<Bell size={14} />} aria-label={t('notifications.configure_button')} onClick={onNotif} />

{/* Bouton bascule (toggle) : variante outline + aria-pressed pour l'état actif */}
<Button variant="outline" size="xs" aria-pressed={open} icon={open ? <EyeOff size={14} /> : <Eye size={14} />} onClick={toggle}>
  {t('patient.preview_button')}
</Button>
```

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost' \| 'outline'` | `'primary'` | Style visuel. `outline` = transparent bordé, accent primaire au survol ; supporte l'état bascule via `aria-pressed` |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Taille. `xs` = compact (boutons d'action inline d'une carte / d'un tableau) |
| `category` | `'neutral' \| 'danger' \| 'success'` | `'neutral'` | Accent sémantique appliqué **au survol et à l'état `aria-pressed`** (sur `ghost`/`outline`). `danger` → rouge (supprimer), `success` → vert (valider). Au repos le bouton reste neutre |
| `loading` | `boolean` | `false` | Affiche un spinner (à la place de `icon`) et désactive le bouton |
| `fullWidth` | `boolean` | `false` | Occupe toute la largeur disponible (`width: 100%`, classe `btn--full`) — CTA pleine largeur (formulaires, layouts de preview) |
| `icon` | `ReactNode` | — | Icône optionnelle. **Avec** `children` → icône à gauche du label. **Sans** `children` → bouton icône-seule (carré `btn--icon-only`) → fournir `aria-label` |
| …natifs | `ButtonHTMLAttributes` | — | `onClick`, `disabled`, `type`, `aria-pressed`, `aria-label`… |

> **Bouton-icône d'action** (supprimer, valider, basculer dans un tableau / une
> liste) : `<Button variant="ghost" size="xs" icon={…} category="danger" aria-label={…} />`.
> Ne **pas** écrire un `<button>` ad hoc avec son propre CSS rouge-au-survol — c'est
> exactement ce que `category` couvre.

> **Bouton icône-seule** : ne pas écrire un `<button>` ad hoc pour une icône cliquable
> — passer `icon` sans `children`. L'exclusivité (icône-seule vs icône+label) est
> dérivée de la présence de `children`, pas d'une prop booléenne.
> **Bouton bascule** : `variant="outline"` + `aria-pressed={actif}` ; l'état actif
> (fond `--color-primary-light`) est porté par le sélecteur `.btn--outline[aria-pressed='true']`.

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

### `Drawer`

`components/ui/Drawer/`. Panneau latéral coulissant ancré à droite, pleine hauteur
(`role="dialog"`, `aria-modal`, fermeture sur `Échap`, clic overlay ou croix). Même
grammaire que `Modal` (titre, sous-titre, icône, footer) mais pour afficher le détail
d'un élément sans quitter la vue d'ensemble (ex. détail d'un dossier dans la file active).
**Redimensionnable par défaut** : poignée sur le bord gauche (glisser à la souris) ou
flèches gauche/droite au clavier quand la poignée a le focus, bornée par `minWidth`/`maxWidth`.
**Animé** à l'ouverture (glissement depuis la droite) et à la fermeture (glissement de
sortie + fondu de l'overlay, puis démontage sur `animationend`) ; respecte
`prefers-reduced-motion` (fermeture immédiate, sans animation).

```tsx
<Drawer title={entry.display_name} icon={<FolderOpen />} onClose={close}>
  {detailContent}
</Drawer>
```

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `title` | `string` | — | Titre (obligatoire) |
| `subtitle` | `string` | — | Sous-titre |
| `icon` | `ReactNode` | — | Icône en tête |
| `onClose` | `() => void` | — | Appelé sur `Échap`, clic overlay, ou croix |
| `titleAccessory` | `ReactNode` | — | Élément juste après le titre (ex. bouton favoris collé au nom) |
| `headerActions` | `ReactNode` | — | Slot d'actions dans l'en-tête, avant la croix |
| `footer` | `ReactNode` | — | Pied (actions) |
| `noPadding` | `boolean` | `false` | Supprime le padding du body |
| `width` | `number` | `460` | Largeur initiale en px |
| `minWidth` | `number` | `360` | Largeur min au redimensionnement |
| `maxWidth` | `number` | `900` | Largeur max au redimensionnement (bornée au viewport) |
| `resizable` | `boolean` | `true` | Affiche la poignée de redimensionnement |
| `storageKey` | `string` | — | Clé `localStorage` : mémorise et restaure la largeur redimensionnée |
| `topOffset` | `number` | — | Décale le haut de l'overlay (px) pour laisser un header fixe cliquable au-dessus |
| `children` | `ReactNode` | — | Corps |

### `InputField`

`components/ui/InputField/`. Champ texte étiqueté avec message d'erreur. Rend un
`<input>` par défaut, ou un `<textarea>` si `multiline`. Union discriminée : sans
`multiline` il étend `InputHTMLAttributes` ; avec `multiline` il étend
`TextareaHTMLAttributes` (donc `rows`, `maxLength`, `resize`…).

`label` est **optionnel** : sans lui, aucun `<label>` n'est rendu — fournir alors
un `aria-label` (champ compact, recherche) ou un `<label htmlFor={id}>` externe
associé via la prop `id`. La `ref` est transmise au `<input>`/`<textarea>`
sous-jacent (React 19, ref-as-prop) pour les usages non contrôlés (`defaultValue` +
lecture impérative). Un `className` passé est **fusionné** avec les classes de base
(modificateur additif), il ne les écrase pas.

```tsx
<InputField label={t('auth.email')} type="email" error={emailError} defaultValue="" />

<InputField
  multiline
  label={t('patient.psycho_suggest_label')}
  rows={4}
  maxLength={1000}
  value={text}
  onChange={e => setText(e.target.value)}
/>

// Sans label : aria-label + ref non contrôlée
<InputField multiline ref={noteRef} aria-label={t('notes.placeholder')} rows={3} />
```

| Prop | Type | Rôle |
|---|---|---|
| `label` | `string?` | Libellé visible. Optionnel : sans lui, aucun `<label>` — fournir `aria-label` |
| `error` | `string` | Message d'erreur inline (validation de champ) |
| `multiline` | `boolean` | `true` → rend un `<textarea>` (redimensionnable vertical, min-height 80px) au lieu d'un `<input>` |
| `ref` | `Ref<HTMLInputElement>` \| `Ref<HTMLTextAreaElement>` | Transmise au contrôle sous-jacent (selon `multiline`) — usages non contrôlés |
| `className` | `string` | Classe additionnelle fusionnée avec `input-field__input` (modificateur) |
| …natifs | `InputHTMLAttributes` \| `TextareaHTMLAttributes` | Selon `multiline` : `type`/`value`/`onChange`/`placeholder`… ou `rows`/`maxLength`… |

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

### `Dropdown`

`components/ui/Dropdown/`. **Liste déroulante unique** du design system : une combobox
à autocomplétion paramétrable `mode="single"` (une valeur, ferme à la sélection) ou
`mode="multiple"` (plusieurs valeurs, liste ouverte — le parent rend ses `Chip onRemove`).
Filtre à la frappe (`searchable`, défaut `true`, insensible casse/accents via
`lib/search`), options groupables par section, navigation clavier (↑/↓, Entrée, Échap),
fermeture au clic extérieur, a11y combobox/listbox. Remplace l'ancien `<select>` natif
**et** `MultiSelectAutocomplete` (issue #53).

```tsx
// Single (formulaire)
<Dropdown
  label={t('dashboard.invite_sex_label')}
  value={inviteSex}
  onChange={setInviteSex}
  options={sexOptions}
  placeholder={t('dashboard.invite_sex_placeholder')}
  searchable={false}
/>

// Multiple (barre de filtres)
<Dropdown
  mode="multiple"
  options={[{ value: 'anxiety', label: 'Anxiété', group: 'indication' }]}
  selectedValues={selected}
  onToggle={handleToggle}
  groupLabels={{ indication: 'Indication' }}
  ariaLabel={label}
  placeholder={t('modules.filter_select')}
  emptyText={t('modules.filter_no_match')}
/>
```

Props (union discriminée sur `mode`) : `single` → `value` + `onChange(value)` ;
`multiple` → `selectedValues` + `onToggle(value)`. Communes : `options`, `label`,
`ariaLabel`, `error`, `placeholder`, `emptyText`, `searchable`, `groupLabels`,
`compact`, `clearable` + `clearLabel` (bouton « × » en single), `disabled`, `id`.
Doc dédiée : [`docs/components/dropdown.md`](components/dropdown.md).

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

### `Chip`

`components/ui/Chip/`. Puce / token en pilule. Quatre usages dans une seule primitive :
affichage (icône + label coloré par `tone`), supprimable (`onRemove` → bouton ×, pour
les tags éditables), sélectionnable (`selectable` → bouton-bascule, pour les filtres), et
action (`onClick` sans `selectable` ni `onRemove` → bouton d'action, ex. « +N » qui ouvre
un panneau ; garde l'habillage du `tone`, sans `aria-pressed`).
Pour un indicateur d'état sémantique avec valeur, préférer `StatusBadge`.

```tsx
<Chip tone="info" icon={<Smartphone size={11} />} label={t('modules.phq9.label')} />
<Chip tone="info" iconOnly icon={<Brain size={14} />} label={t('modules.phq9.label')} />
<Chip selectable selected={value.onlyImportant} onClick={toggle} label={t('...')} />
<Chip tone="info" label={`+${extra}`} onClick={openDrawer} title={t('...')} />
<Chip size="sm" tone="info" label={t('tags.anxiety.label')} />
```

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `label` | `string` | — | Texte (obligatoire) |
| `tone` | `'neutral' \| 'info' \| 'warning'` | `'neutral'` | Couleur (ignoré si `selectable`) |
| `size` | `'sm' \| 'md'` | `'md'` | `sm` = compacte (cartes denses, ex. `ModuleTagChips`) |
| `icon` | `ReactNode` | — | Icône en tête |
| `iconOnly` | `boolean` | `false` | Icône seule : `label` non affiché, sert d'`aria-label` + tooltip (`icon` obligatoire) |
| `selectable` | `boolean` | `false` | Rend un bouton-bascule (`aria-pressed`) |
| `selected` | `boolean` | `false` | État sélectionné (avec `selectable`) |
| `onClick` | `() => void` | — | Bascule si `selectable` ; sinon (hors `onRemove`) puce d'action (bouton, sans `aria-pressed`) |
| `onRemove` | `() => void` | — | Affiche un bouton × de suppression |
| `removeLabel` | `string` | — | Label a11y du × (requis avec `onRemove`) |
| `title` | `string` | — | Tooltip **natif** (~1 s, non configurable). Pour une infobulle rapide sur une puce `iconOnly`, l'envelopper dans `Tooltip` et neutraliser le natif avec `title=""` |
| `className` | `string` | — | Classe additionnelle |

### `Tooltip`

`components/ui/Tooltip/`. Infobulle légère rendue en **portail** (`document.body`) :
elle échappe ainsi au `overflow: auto` des conteneurs scrollables (ex. la matrice
« Ma file active ») qui couperaient un tooltip CSS classique. Apparaît après un court
délai (~120 ms) au survol **ou au focus** du déclencheur, là où l'attribut `title`
natif attend ~1 s sans réglage possible. L'accessibilité reste portée par le
déclencheur lui-même (`aria-label`) : ce composant n'est qu'une aide visuelle rapide.

Cas d'usage de référence : les puces icône seule des modules (`ModuleChips` en colonne
dense). On enveloppe le `Chip iconOnly` et on neutralise son `title` natif (`title=""`)
pour éviter le doublon lent.

```tsx
<Tooltip label={t('modules.phq9.label')}>
  <Chip tone="info" iconOnly icon={<Brain size={16} />} label={t('modules.phq9.label')} title="" />
</Tooltip>
```

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `label` | `string` | — | Texte de l'infobulle (obligatoire) |
| `children` | `ReactNode` | — | Déclencheur survolé / focalisé |

### `SegmentedControl<T>`

`components/ui/SegmentedControl/`. Interrupteur de sélection : un groupe de segments
dont **un seul** est actif (sélecteur de plage temporelle, filtre exclusif, choix unique
parmi N options visibles). Générique sur le type de valeur `T extends string` — la valeur
émise par `onChange` est typée. Accessibilité native : `role="radiogroup"` + segments
`role="radio"` / `aria-checked`. Chaque segment est mémoïsé (callback figé) — zéro
re-rendu inutile.

> **Ne pas confondre avec `Tabs`** : `Tabs` change de **panneau de contenu** (onglets,
> avec icônes/badges). `SegmentedControl` change une **valeur** (un filtre, une période)
> sans notion de panneau. Pour un interrupteur on/off binaire → `Toggle`.

Deux variantes visuelles :

| Variante | Aspect | Usage de référence |
|---|---|---|
| `track` (défaut) | Piste segmentée (conteneur unique, segments à l'intérieur) | Sélecteur 3m/6m/1an de `PatientEvolutionTab` |
| `pills` | Pastilles indépendantes côte à côte | Sélecteur 7J/1M/3M/1A de `SliderDashboardLayout` |

```tsx
const options = useMemo<readonly SegmentOption<TimeRange>[]>(
  () => RANGES.map(r => ({ value: r, label: t(`evolution.range_${r}`) })),
  [t],
)
<SegmentedControl options={options} value={range} onChange={setRange} ariaLabel={t('evolution.title')} />

// Variante pastilles + accent dynamique (couleur du segment actif pilotée par le module)
<SegmentedControl variant="pills" options={options} value={range} onChange={setRange} accentColor={accent} />
```

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `options` | `readonly SegmentOption<T>[]` | — | Liste `{ value, label }` (obligatoire). Mémoïser si dérivée de `t()`. |
| `value` | `T` | — | Valeur sélectionnée (obligatoire) |
| `onChange` | `(value: T) => void` | — | Appelé avec la valeur du segment cliqué |
| `variant` | `'track' \| 'pills'` | `'track'` | Aspect visuel |
| `accentColor` | `string` | `var(--color-primary)` (CSS) | Couleur du segment actif (valeur dynamique) |
| `ariaLabel` | `string` | — | Libellé accessible du groupe |
| `className` | `string` | — | Classe additionnelle |

> **Conformité MDR** : `accentColor` est une couleur de **contexte** (accent du module),
> jamais l'expression d'une valeur clinique. Ne jamais piloter cette couleur par un score
> ou un seuil — ce serait du codage couleur interprétatif interdit.

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

### `Banner`

`components/ui/Banner/`. Bandeau d'information transversal — variante sémantique,
icône, action et fermeture optionnelles. **Sans logique métier** : pour un usage
métier (ex. rappel MFA), l'envelopper dans un composant `features/`.

```tsx
<Banner variant="warning" icon={<ShieldAlert size={18} />}
        action={{ label: t('auth.mfa.banner_action'), onClick: goActivate }}
        onDismiss={dismiss} dismissLabel={t('auth.mfa.banner_dismiss')}>
  {t('auth.mfa.banner_text')}
</Banner>
```

| Prop | Type | Rôle |
|---|---|---|
| `variant` | `'info' \| 'success' \| 'warning' \| 'danger'` | Couleur sémantique (défaut `info`) |
| `icon` | `ReactNode` | Icône optionnelle à gauche |
| `children` | `ReactNode` | Contenu textuel |
| `action` | `{ label: string; onClick: () => void }` | Bouton-lien d'action optionnel |
| `onDismiss` | `() => void` | Si fourni, affiche une croix de fermeture |
| `dismissLabel` | `string` | Libellé accessible de la croix (avec `onDismiss`) |

Doc dédiée : [`docs/components/banner.md`](components/banner.md).

> `Toggle`, `Dropdown`, `StepBreadcrumb`, `Toast`, `Banner` ont une doc dédiée dans
> [`docs/components/`](components/). `Tabs`, `RatingSelector`, `ScaleMetaBadges`
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
  filters={<Filters />}                           // contrôles de filtrage, intégrés à la table
  actionBar={<Button>Ajouter</Button>}            // boutons primaires (sous les filtres, alignés à gauche)
  renderDetail={row => <RowDetail row={row} />}   // panneau dépliable (optionnel)
  rowClassName={row => (row.important ? 'my-row--flag' : undefined)}
  emptyState={<EmptyState … />}                   // rendu si rows.length === 0
  ariaLabel={t('section.title')}
/>
```

| Prop | Type | Rôle |
|---|---|---|
| `columns` | `DataTableColumn<T>[]` | Définition des colonnes (`id`, `header`, `cell`, `*ClassName`, `sortable`) |
| `rows` | `readonly T[]` | Lignes **déjà filtrées/triées/paginées** par l'appelant — la table ne réordonne ni ne tronque jamais |
| `getRowId` | `(row: T) => string` | Identité stable (clé React + état de dépliage) |
| `filters` | `ReactNode` | Contrôles de filtrage (recherche, segments, dropdowns…), partie intégrante de la table |
| `actionBar` | `ReactNode` | Barre d'actions de la table (boutons primaires, ex. « Ajouter »). Rendue **sous** les filtres, alignée à gauche |
| `renderDetail` | `(row, ctx) => ReactNode` | Panneau dépliable ; absent ⇒ lignes non dépliables |
| `rowClassName` | `(row) => string \| undefined` | Classe additionnelle de ligne (mise en avant) |
| `emptyState` | `ReactNode` | Affiché à la place de la table quand `rows` est vide |
| `ariaLabel` | `string` | Libellé accessible de la `<table>` |
| `sort` | `DataTableSort` | Tri actif `{ column, direction }` (`column` = `DataTableColumn.id`). Pilote l'indicateur + `aria-sort` |
| `onSortChange` | `(column: string) => void` | Clic sur un en-tête `sortable`. À l'appelant de basculer le sens et de re-trier (souvent un **refetch serveur**) |
| `pagination` | `DataTablePaginationState` | Pagination **contrôlée** (cf. ci-dessous). Absente ⇒ aucune barre |
| `className` | `string` | Classe posée sur le conteneur `.data-table-wrap` — permet de **scoper un habillage propre** (couleurs d'en-tête, dégradé de lignes) sans toucher au style générique. Ex. `CaseloadTable` passe `caseload-data-table` et stylise `.caseload-data-table .data-table__th` (en-tête teal). |

**Tri (`sortable`)** — une colonne `{ …, sortable: true }` rend un bouton de tri dans son
en-tête (reset visuel, indicateur chevron, `aria-sort`). La table **n'ordonne jamais**
`rows` : elle émet `onSortChange(column)` et reflète le tri porté par `sort`. Le tri réel
(mémoire ou serveur) appartient à l'appelant.

**Pagination contrôlée (`pagination`)** — barre « intervalle + précédent/suivant », elle
aussi server-friendly : la table ne tronque pas `rows`, elle délègue via `onPageChange`.

| `DataTablePaginationState` | Type | Rôle |
|---|---|---|
| `page` | `number` | Index de page, **base 0** |
| `pageSize` | `number` | Taille de page (borne le nombre de pages avec `total`) |
| `total` | `number` | Total du jeu **filtré** (≠ `rows.length`, qui est la page courante) |
| `onPageChange` | `(page: number) => void` | Changement de page (souvent un refetch) |
| `labels` | `DataTablePaginationLabels` | i18n résolu par l'appelant : `previous`, `next` (aria), `range(from, to, total)` |

> **Tri/pagination = contrôlés, jamais autonomes.** `DataTable` ne possède aucun état de
> tri ni de page : il reflète ce qu'on lui passe et émet des événements. Cela permet une
> pagination/tri **côté serveur** (ex. `AdminUsersTable` → RPC `admin_list_users`) sans
> dupliquer de logique. Pour du tri/pagination purement client, l'appelant gère l'état
> localement et trie/tronque `rows` avant de les passer.

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

Fichier : `components/features/ScaleMetaBadges/ScaleMetaBadges.tsx`

> **Composant métier (`features/`), pas un primitive.** Il connaît le domaine des
> échelles cliniques (import `scaleService`, clés i18n `scales.*`) — il n'a donc pas
> sa place dans `ui/`. Documenté ici pour mémoire, mais ce n'est pas une brique du
> design system.

Affiche la description et les chips méta d'une échelle clinique : badge Auto/Hétéro, chip nosologique, chips d'âge colorés. À utiliser comme enfant du composant `Card`.

```tsx
import { ScaleMetaBadges } from '../components/features/ScaleMetaBadges/ScaleMetaBadges'

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

## Composants `ModuleFilterBar` et `ModuleTagChips`

> **Composants métier (`features/`).** Ils connaissent la taxonomie des modules
> (`ModuleTaxonomy` du `moduleCatalogService`, clés i18n `tags.*` /
> `tag_dimensions.*`) — pas des primitives `ui/`. Tous deux **présentationnels** :
> l'état des filtres est possédé par la page via le hook
> [`useTagFilters`](../src/hooks/useTagFilters.ts) ; la logique de filtrage pure
> est dans [`lib/moduleFilter.ts`](../src/lib/moduleFilter.ts).
> Spec fonctionnelle : [`docs/spec/module-taxonomy.md`](../../../docs/spec/module-taxonomy.md).

### `ModuleFilterBar`

Fichier : `components/features/ModuleFilterBar/ModuleFilterBar.tsx`

Panneau de filtres à facettes de l'armoire thérapeutique. Structure :
1. une recherche par mot-clé optionnelle (`search`, rendue en tête du panneau) ;
2. **une combobox d'autocomplétion par dimension** (indication, public, approche),
   via `Dropdown mode="multiple"` — un axe sans tag est omis ;
3. une zone de synthèse : les tags retenus en `Chip onRemove`, **regroupés sous le
   titre de leur critère** (le libellé de la dimension est rappelé) ;
4. un pied : compteur « N sur M modules » + bouton de réinitialisation (visible
   seulement si un filtre est actif).

Utilisée par `ModuleCatalogPage` (armoire de config), `PatientModulesTab` (vue
active + modale d'ajout) et `PsychoLibraryPicker`.

```tsx
const { taxonomy, activeFilters, toggleTag, resetFilters } = useTagFilters()
const search = useMemo(
  () => ({ value: query, onChange: setQuery, placeholder: t('modules.search_placeholder') }),
  [query, t],
)

<ModuleFilterBar
  taxonomy={taxonomy}
  activeFilters={activeFilters}
  onToggleTag={toggleTag}
  onReset={resetFilters}
  resultCount={visibleCount}
  totalCount={totalCount}
  search={search}
/>
```

| Prop | Type | Rôle |
|---|---|---|
| `taxonomy` | `ModuleTaxonomy` | Axes + tags chargés en base (`fetchModuleTaxonomy`) |
| `activeFilters` | `ActiveTagFilters` | Sélection courante (`Map<dimension, Set<tag>>`) |
| `onToggleTag` | `(dimensionId, tagId) => void` | Coche/décoche un tag |
| `onReset` | `() => void` | Vide toute la sélection |
| `resultCount` | `number` | Modules visibles après filtrage |
| `totalCount` | `number` | Total de modules avant filtrage |
| `search` | `ModuleFilterSearch` (opt.) | `{ value, onChange, placeholder }` — recherche en tête du panneau ; omise = pas de recherche |

`DimensionFilter` (fichier voisin) est la combobox d'un seul axe, mémoïsée
(`React.memo` + `onToggle` figé lié à sa dimension) — zéro handler recréé par axe
au re-rendu du panneau.

### `ModuleTagChips`

Fichier : `components/features/ModuleTagChips/ModuleTagChips.tsx`

Puces de tags d'un module sur sa carte : une ligne par dimension (indication en
`tone="info"`, public en `tone="neutral"`), via `Chip size="sm"`. L'approche n'est
pas affichée sur les cartes (réservée aux filtres — `CARD_DIMENSIONS` dans
`lib/moduleFilter.ts`). Rend `null` si le module ne porte aucun tag. À utiliser
comme enfant de `Card`.

```tsx
<Card header={{ ... }}>
  <ModuleTagChips tagIds={taxonomy.tagsByModule.get(mod.id)} taxonomy={taxonomy} />
</Card>
```

| Prop | Type | Rôle |
|---|---|---|
| `tagIds` | `ReadonlySet<string> \| undefined` | Tags portés par le module (`taxonomy.tagsByModule`) |
| `taxonomy` | `Pick<ModuleTaxonomy, 'tagsByDimension'>` | Ordre et regroupement des tags par dimension |

---

## Composant `ChronoRhythmogram`

Fichier : `components/features/ChronoRhythmogram/ChronoRhythmogram.tsx`

> **Composant métier (`features/`).** Graphe Recharts du « rythmogramme »
> chronobiologique : l'heure de chaque repère (lever, repas, activité, lumière,
> coucher) tracée jour par jour sur UN mois. Axe Y = heures d'horloge (inversé,
> matin en haut) ; axe X = jours du mois avec traits verticaux aux débuts de
> semaine (repères) ; une courbe colorée par repère ; tooltip = horaires précis ;
> légende = libellé + écart-type brut. Conforme MDR : horaires bruts, aucune
> interprétation ni seuil.

Réutilisé par le panneau Données / onglet Évolution (via `ChronoRhythmogramPanel`,
données patient réelles) **et** l'aperçu praticien (`layouts/ChronoMonthLayout`,
données d'exemple) → cohérence web ≡ mobile (le mobile rend le même modèle en SVG).
Les données viennent du helper partagé `buildRhythmogram` (`@kaer/shared`) ; la
config couleurs/libellés et le mapping `buildRhythmogramAnchors` vivent dans
`lib/chronoAnchors.ts`.

| Prop | Type | Rôle |
|---|---|---|
| `data` | `Record<string, number \| null>[]` | Une ligne par jour (`buildRhythmogram().data`) |
| `anchors` | `RhythmogramAnchor[]` | Repères à tracer (couleur, libellé, `sdMinutes`, `count`) — via `buildRhythmogramAnchors` |
| `yDomain` | `[number, number]` | Bornes Y en minutes (`buildRhythmogram().yDomain`) |
| `weekStarts` | `number[]` | Jours (1-based) lundis → traits verticaux repères |
| `year` / `month` | `number` | Mois affiché (month 1-12) — formatage des dates du tooltip |
| `locale` | `string` | Locale i18n pour le formatage des dates |
| `xAxisLabel` / `yAxisLabel` | `string?` | Titres d'axes déjà traduits (« Jour du mois » / « Heure ») — fournis par l'appelant pour garder le composant générique |

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
