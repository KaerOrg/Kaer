# StepBreadcrumb

Indicateur d'avancement pour les formulaires multi-étapes. Affiche les étapes en ligne avec leur numéro, un ✓ pour les étapes terminées, et une flèche entre chaque étape.

- **Étape passée** (`stepNumber < currentStep`) — couleur succès + ✓
- **Étape active** (`stepNumber === currentStep`) — couleur primaire + numéro en surbrillance
- **Étape future** (`stepNumber > currentStep`) — couleur grisée + numéro

## Props

| Prop          | Type       | Requis | Description                                      |
|---------------|------------|--------|--------------------------------------------------|
| `steps`       | `string[]` | Oui    | Labels des étapes dans l'ordre                   |
| `currentStep` | `number`   | Oui    | Numéro de l'étape active (commence à **1**)      |

## Exemple

```tsx
<StepBreadcrumb
  steps={[t('dashboard.invite_step_info'), t('dashboard.invite_step_modules')]}
  currentStep={inviteStep}
/>
```
