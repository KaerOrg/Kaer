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
| `SliderWidget` | `.fw-slider` | `<input type="range">` + `<span>` | Spec `slider:min:max:unit` |
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
| `components/ui/` | Primitives design system — Accordion, Button, Card, EmptyState, InputField, Modal, SearchInput, SelectField, StatusBadge, StepBreadcrumb, Tabs, Toast, Toggle |
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
