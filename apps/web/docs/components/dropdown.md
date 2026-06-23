# Dropdown

Equivalent de `InputField` pour les éléments `<select>`. Réutilise les classes CSS de `InputField` (`.input-field__input`, `.input-field__label`, etc.) — aucun CSS supplémentaire.

L'`id` est généré automatiquement depuis le `label` (minuscules + tirets) si non fourni.

## Props

| Prop       | Type                                              | Requis | Description                         |
|------------|---------------------------------------------------|--------|-------------------------------------|
| `label`    | `string`                                          | Oui    | Texte du label                      |
| `children` | `ReactNode`                                       | Oui    | Les `<option>` du select            |
| `value`    | `string`                                          | Oui    | Valeur sélectionnée (contrôlé)      |
| `onChange` | `React.ChangeEvent<HTMLSelectElement> => void`    | Oui    | Callback de changement              |
| `error`    | `string`                                          | Non    | Message d'erreur affiché sous le select |
| `id`       | `string`                                          | Non    | Id HTML (auto-généré si absent)     |
| `compact`  | `boolean`                                          | Non    | Variante compacte (`.input-field__input--sm`) : contrôle moins haut, pour les barres de filtres. Défaut `false` |

Toutes les autres props HTML d'un `<select>` sont transmises (`disabled`, `required`, etc.).
Note : on expose `compact` (booléen) plutôt qu'un prop `size`, car `size` est déjà l'attribut HTML natif du `<select>` (nombre de lignes visibles).

## Exemple

```tsx
<Dropdown
  label={t('dashboard.invite_sex_label')}
  value={inviteSex}
  onChange={e => setInviteSex(e.target.value)}
>
  <option value="">{t('dashboard.invite_sex_placeholder')}</option>
  <option value="M">{t('dashboard.invite_sex_m')}</option>
  <option value="F">{t('dashboard.invite_sex_f')}</option>
  <option value="O">{t('dashboard.invite_sex_o')}</option>
</Dropdown>
```
