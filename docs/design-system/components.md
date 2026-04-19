# Design System — Composants

Composants partagés entre `apps/web` et `apps/mobile`. Les tokens (couleurs, spacing, radius) viennent de `packages/shared/src/theme.ts`.

---

## Card

Conteneur structuré avec header optionnel, corps et actions.

### Props

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `header` | `CardHeader` | — | Titre, sous-titre et icône optionnelle |
| `children` | `ReactNode` | — | Corps de la card |
| `actions` | `ReactNode` | — | Zone boutons (bas de card) |
| `variant` | `'default' \| 'outlined' \| 'elevated'` | `'default'` | Apparence |
| `state` | `'active' \| 'disabled'` | — | État visuel |
| `className` *(web)* / `style` *(mobile)* | `string` / `ViewStyle` | — | Surcharge de styles |

### Usage

```tsx
// Web
import { Card } from '@/components/Card'

<Card
  header={{ title: 'Module', subtitle: 'TCC', icon: '🧠' }}
  variant="elevated"
  actions={<Button size="sm">Ouvrir</Button>}
>
  <p>Description du module</p>
</Card>

// Mobile
import { Card } from '../components/Card'

<Card
  header={{ title: 'Module', subtitle: 'TCC' }}
  variant="elevated"
>
  <Text>Description du module</Text>
</Card>
```

---

## EmptyState

Écran vide avec icône, titre, description et action optionnelle.

### Props

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `title` | `string` | *requis* | Message principal |
| `description` | `string` | — | Texte secondaire |
| `icon` | `ReactNode` *(web)* / `string` *(mobile)* | — | Emoji ou icône |
| `action` | `EmptyStateAction` | — | Bouton CTA |

### Usage

```tsx
<EmptyState
  icon="📭"
  title="Aucun patient"
  description="Invitez votre premier patient pour commencer."
  action={{ label: 'Inviter', onClick: openModal }}
/>
```

---

## Accordion

Section dépliable avec header cliquable, badge de comptage et sous-titre.

### Props

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `title` | `string` | *requis* | Libellé du header |
| `subtitle` | `string` | — | Texte secondaire dans le header |
| `badge` | `number` | — | Compteur affiché en pill |
| `defaultOpen` | `boolean` | `false` | État initial |
| `children` | `ReactNode` | *requis* | Contenu déplié |

### Usage

```tsx
<Accordion title="Régulation émotionnelle" badge={3} subtitle="3 modules">
  <ModuleList modules={emotionModules} />
</Accordion>
```

---

## StatusBadge

Pill de statut colorée. Affichage passif uniquement — pas d'interprétation clinique.

### Variantes

| Variante | Couleurs | Usage |
|---|---|---|
| `neutral` | Gris | État neutre / inconnu |
| `info` | Bleu | Information |
| `success` | Vert | Complété / actif |
| `warning` | Ambre | Attention requise |
| `danger` | Rouge | Erreur / urgent |

### Props

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `label` | `string` | *requis* | Libellé |
| `variant` | `StatusBadgeVariant` | `'neutral'` | Couleur |
| `value` | `string \| number` | — | Valeur affichée en gras |
| `icon` | `ReactNode` / `string` | — | Icône préfixe |

### Usage

```tsx
<StatusBadge variant="success" label="Actif" />
<StatusBadge variant="warning" label="Score" value={7} icon="⚠️" />
```

---

## SectionDateList *(mobile uniquement)*

Wrapper autour de `SectionList` qui affiche des listes groupées par date avec un header de section stylisé.

### Props

Étend `SectionListProps` de React Native. Props supplémentaires :

| Prop | Type | Description |
|---|---|---|
| `sections` | `DateSection<T>[]` | Sections `{ title: string, data: T[] }` |

### Utilitaire `groupByDate`

```ts
import { groupByDate } from '../components/SectionDateList'

const sections = groupByDate(entries) // entries doit avoir un champ created_at
```

### Usage

```tsx
<SectionDateList
  sections={groupByDate(sleepEntries)}
  renderItem={({ item }) => <SleepEntryRow entry={item} />}
  keyExtractor={item => item.id}
/>
```
