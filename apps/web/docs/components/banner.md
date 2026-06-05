# `Banner` — bandeau d'information

Primitive du design system (`components/ui/Banner/`). Bandeau transversal pour
signaler une information, un rappel ou un avertissement en haut d'un contenu.

**Sans logique métier** : variante sémantique + slots (icône, action, fermeture).
Tout usage métier passe par un composant `features/` qui l'enveloppe (ex.
[`MfaReminderBanner`](../../../../docs/auth-mfa.md)).

## Import

```tsx
import { Banner } from '../components/ui/Banner'
```

## Props

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `variant` | `'info' \| 'success' \| 'warning' \| 'danger'` | `'info'` | Couleur sémantique |
| `icon` | `ReactNode` | — | Icône optionnelle à gauche |
| `children` | `ReactNode` | — | Contenu textuel (obligatoire) |
| `action` | `{ label: string; onClick: () => void }` | — | Bouton-lien d'action optionnel |
| `onDismiss` | `() => void` | — | Si fourni, affiche une croix de fermeture |
| `dismissLabel` | `string` | — | Libellé accessible de la croix (à fournir avec `onDismiss`) |
| `className` | `string` | `''` | Classe additionnelle |

## Exemple

```tsx
<Banner
  variant="warning"
  icon={<ShieldAlert size={18} />}
  action={{ label: t('auth.mfa.banner_action'), onClick: () => navigate('/profil') }}
  onDismiss={handleDismiss}
  dismissLabel={t('auth.mfa.banner_dismiss')}
>
  {t('auth.mfa.banner_text')}
</Banner>
```

## Variantes de couleur

Alignées sur `StatusBadge` (cohérence du design system) :

| Variante | Fond | Texte |
|---|---|---|
| `info` | `--color-primary-light` | `--color-primary` |
| `success` | `--color-success-light` | `--color-success` |
| `warning` | `#FEF3C7` | `#92400E` |
| `danger` | `--color-danger-light` | `--color-danger` |

## Accessibilité

- `role="status"` sur le conteneur.
- Le bouton de fermeture porte `aria-label={dismissLabel}` — toujours fournir
  `dismissLabel` quand `onDismiss` est utilisé.

## Notes

- Pour un bandeau dont la fermeture doit **persister**, gérer l'état côté composant
  métier (ex. `MfaReminderBanner` persiste via `practitioners.mfa_reminder_dismissed`).
- Marge basse quand placé dans le contenu : `.layout__main > .banner { margin-bottom }`.
