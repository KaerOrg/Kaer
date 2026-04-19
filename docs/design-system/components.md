# Design System — Composants

Composants partagés entre `apps/web` et `apps/mobile`. Les tokens (couleurs, spacing, radius) viennent de `packages/shared/src/theme.ts`.

Chaque composant est compartimenté dans son propre dossier : `tsx · styles/css · types · test · index`.

---

## Button

Bouton d'action principal. 4 variantes, état loading intégré.

### Props

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'primary'` | Apparence |
| `size` *(web)* | `'sm' \| 'md' \| 'lg'` | `'md'` | Taille |
| `loading` | `boolean` | `false` | Affiche un spinner, désactive le bouton |
| `disabled` | `boolean` | `false` | Désactive le bouton |
| `label` *(mobile)* | `string` | *requis* | Texte du bouton |
| `onPress` *(mobile)* | `() => void` | *requis* | Callback |
| `children` *(web)* | `ReactNode` | *requis* | Contenu |

### Usage

```tsx
// Web
<Button variant="primary" size="md" loading={isSubmitting}>Enregistrer</Button>
<Button variant="danger" onClick={handleDelete}>Supprimer</Button>

// Mobile
<Button label="Enregistrer" onPress={handleSave} variant="primary" loading={isSubmitting} />
```

---

## InputField

Champ de saisie avec label, gestion du focus et affichage d'erreur.

### Props

| Prop | Type | Description |
|---|---|---|
| `label` | `string` | Label affiché au-dessus du champ |
| `error` | `string` | Message d'erreur affiché en rouge |
| `containerStyle` *(mobile)* | `ViewStyle` | Style du conteneur |
| `...rest` | `InputHTMLAttributes` / `TextInputProps` | Toutes les props natives |

### Usage

```tsx
// Web
<InputField label="Email" type="email" error={errors.email} onChange={handleChange} />

// Mobile
<InputField label="Email" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" />
```

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
