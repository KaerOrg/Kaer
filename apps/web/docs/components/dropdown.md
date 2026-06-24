# Dropdown

Liste déroulante **unique** du design system : une combobox à autocomplétion,
paramétrable simple ou multiple. Elle remplace l'ancien `<select>` natif **et**
`MultiSelectAutocomplete` (fusionnés, issue #53).

- `mode="single"` (défaut) : une seule valeur, la liste ferme à la sélection. Le champ
  affiche le libellé de la valeur retenue quand il est fermé.
- `mode="multiple"` : plusieurs valeurs, la liste reste ouverte pour enchaîner les
  choix. Le composant **n'affiche pas** les valeurs retenues : le parent rend ses
  propres `Chip onRemove`.

Caractéristiques communes :

- **autocomplétion** (`searchable`, défaut `true`) : filtre à la frappe, insensible
  casse/accents via `lib/search`. `searchable={false}` rend le champ en lecture seule
  (clic pour ouvrir, pas de saisie) — pour les listes courtes et fermées (statut, sexe) ;
- options **groupables** par section (`group` + `groupLabels`) ;
- **navigation clavier** : ↑/↓ (saute les options désactivées), Entrée, Échap ;
  fermeture au clic extérieur ;
- **accessibilité** combobox/listbox : `role`, `aria-expanded`, `aria-selected`,
  `aria-multiselectable`, `aria-autocomplete`.

L'`id` du champ est généré depuis le `label` (minuscules + tirets), ou par `useId()`
si aucun `label` n'est fourni.

## API

Les props sont une **union discriminée** sur `mode` : le mode `single` exige
`value` + `onChange`, le mode `multiple` exige `selectedValues` + `onToggle`.

### Props communes

| Prop          | Type                                   | Défaut | Description                                                        |
|---------------|----------------------------------------|--------|--------------------------------------------------------------------|
| `options`     | `readonly DropdownOption[]`            | —      | `{ value, label, group?, disabled? }`, déjà triées                 |
| `label`       | `string`                               | —      | Libellé visible au-dessus du champ. Sans lui, fournir `ariaLabel`  |
| `ariaLabel`   | `string`                               | —      | Label a11y quand `label` est absent (barre de filtres)             |
| `error`       | `string`                               | —      | Message d'erreur inline sous le champ                              |
| `placeholder` | `string`                               | —      | Placeholder du champ de saisie                                     |
| `emptyText`   | `string`                               | —      | Texte quand aucune option ne correspond à la saisie                |
| `searchable`  | `boolean`                              | `true` | Active le filtre à la frappe ; `false` → champ en lecture seule    |
| `groupLabels` | `Record<string, string>`               | —      | En-têtes de section : `group` id → libellé affiché                 |
| `compact`     | `boolean`                              | `false`| Variante compacte (barres de filtres) : champ moins haut           |
| `disabled`    | `boolean`                              | `false`| Désactive entièrement le champ                                     |
| `id`          | `string`                               | auto   | Id HTML du champ                                                   |

### Mode `single` (défaut)

| Prop       | Type                      | Description                              |
|------------|---------------------------|------------------------------------------|
| `mode`     | `'single'`                | Optionnel (défaut)                       |
| `value`    | `string`                  | Valeur sélectionnée (`''` = aucune)      |
| `onChange` | `(value: string) => void` | Reçoit la **valeur** (pas l'event)       |

### Mode `multiple`

| Prop             | Type                      | Description                          |
|------------------|---------------------------|--------------------------------------|
| `mode`           | `'multiple'`              | Obligatoire                          |
| `selectedValues` | `ReadonlySet<string>`     | Valeurs cochées (affichées avec ✓)   |
| `onToggle`       | `(value: string) => void` | Bascule une option                   |

## Exemples

### Single (formulaire, recherchable par défaut)

```tsx
const sexOptions: DropdownOption[] = [
  { value: 'M', label: t('dashboard.invite_sex_m') },
  { value: 'F', label: t('dashboard.invite_sex_f') },
  { value: 'O', label: t('dashboard.invite_sex_o') },
]

<Dropdown
  label={t('dashboard.invite_sex_label')}
  value={inviteSex}
  onChange={setInviteSex}
  options={sexOptions}
  placeholder={t('dashboard.invite_sex_placeholder')}
  searchable={false}
/>
```

### Multiple (barre de filtres)

```tsx
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
