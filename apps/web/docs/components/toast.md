# Toast — Système de notifications éphémères

Système centralisé de feedback utilisateur pour toutes les opérations réseau de l'app web praticien.

## Règle fondamentale

| Utiliser `useToast()` | Utiliser un état local inline |
|---|---|
| Résultat d'une opération réseau (save, update, delete) | Validation de champ (email invalide, champ vide) |
| Erreur serveur, timeout, échec Supabase | Erreur qui guide la saisie en temps réel |
| Succès d'une action (invitation envoyée, notes sauvegardées) | Erreur positionnée juste sous un input spécifique |

## Architecture

| Fichier | Rôle |
|---|---|
| `src/components/Toast/Toast.types.ts` | `ToastItem`, `ToastVariant`, `ToastContextValue` |
| `src/contexts/ToastContext.tsx` | Provider, état, auto-dismiss, hook `useToast()` |
| `src/components/Toast/Toast.tsx` | Item individuel (icône + message + bouton ×) |
| `src/components/Toast/ToastContainer.tsx` | Portal `document.body` — z-index 1000 |
| `src/components/Toast/Toast.css` | Styles, animation slide-in, variantes couleur |

Le `ToastProvider` est monté dans `App.tsx` et enrobe toute l'application.

## API

```tsx
import { useToast } from '../contexts/ToastContext'

function MyComponent() {
  const toast = useToast()

  // Succès — auto-dismiss 4s
  toast.success('Profil enregistré')
  toast.success('Module débloqué', 6000)  // durée personnalisée

  // Erreur — persistante, dismiss manuel obligatoire
  toast.error('Erreur lors de la sauvegarde.')

  // Info — auto-dismiss 4s
  toast.info('Traitement en cours…')

  // Avertissement — auto-dismiss 4s
  toast.warning('Invitation déjà envoyée à cet email.')
}
```

## Variantes

| Variante | Couleur | Durée par défaut | Usage |
|---|---|---|---|
| `success` | Vert (`--color-success`) | 4 s | Opération réussie |
| `error` | Rouge (`--color-danger`) | Persistant | Échec réseau, erreur serveur |
| `warning` | Orange (`--color-warning`) | 4 s | Avertissement non bloquant |
| `info` | Bleu (`--color-primary`) | 4 s | Information neutre |

## Accessibilité

- `role="alert"` + `aria-live="assertive"` sur `error` et `warning`
- `role="status"` + `aria-live="polite"` sur `success` et `info`
- Bouton × toujours présent et focusable (keyboard dismiss)
- Animation désactivée si `prefers-reduced-motion`

## Comportement

- **Pile** : max 5 toasts simultanés — les plus anciens poussés vers le bas
- **Position** : coin bas-droit, z-index 1000 (au-dessus des modales)
- **Auto-dismiss** : timer lancé au push, interrompu si l'utilisateur a dismiss manuellement
- **Pas de pause au hover** — la durée est fixe

## Anti-patterns à éviter

```tsx
// ❌ Feedback inline pour une erreur réseau
const [error, setError] = useState<string | null>(null)
const result = await saveNote(...)
if (!result.ok) setError('Erreur de sauvegarde')
return <p className="error">{error}</p>

// ✅ Toast pour une erreur réseau
const toast = useToast()
const result = await saveNote(...)
if (!result.ok) toast.error(t('notes.error_save'))

// ❌ Toast pour une validation de champ
if (!email.trim()) toast.error('Email requis')

// ✅ Validation inline près du champ
if (!email.trim()) setEmailError(t('common.error_required'))
return <InputField error={emailError} />
```

## Pages déjà migrées

| Page / Composant | Opérations en toast |
|---|---|
| `AppointmentModal` | Création RDV, sauvegarde notes, changement statut |
| `ProfilePage` | Mise à jour profil, upload avatar |
| `DashboardPage` | Envoi invitation |
| `PatientPage` | Sauvegarde note (add/edit), note générale, modules psycho/RIM |
