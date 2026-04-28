# Toggle

Interrupteur pill (track + knob). Deux modes selon la présence de `label` :

- **Sans `label`** — rendu purement visuel (`aria-hidden`). Utilisé à l'intérieur d'un bouton déjà interactif (ex. : carte module).
- **Avec `label`** — rendu interactif : `<label>` + checkbox cachée + pill + texte. Entièrement accessible au clavier.

## Props

| Prop       | Type                        | Requis | Description                               |
|------------|-----------------------------|--------|-------------------------------------------|
| `checked`  | `boolean`                   | Oui    | État du toggle                            |
| `onChange` | `(checked: boolean) => void`| Non    | Appelé au changement (mode interactif)    |
| `label`    | `string`                    | Non    | Si fourni, rend le toggle interactif      |
| `disabled` | `boolean`                   | Non    | Désactive le toggle                       |

## Exemples

```tsx
// Visuel uniquement (à l'intérieur d'un <button>)
<Toggle checked={isEnabled} />

// Interactif avec label
<Toggle
  checked={teenMode}
  onChange={setTeenMode}
  label={t('patient.teen_mode_label')}
/>
```
