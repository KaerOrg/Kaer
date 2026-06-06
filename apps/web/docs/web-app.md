# App web praticien — Documentation

L'interface web est une SPA React+Vite destinée exclusivement aux praticiens.

## Lancer

```bash
npm run web   # depuis la racine → http://localhost:5173
```

## Structure

```
apps/web/src/
├── pages/
│   ├── LoginPage.tsx / .css          # Connexion et inscription praticien
│   ├── DashboardPage.tsx / .css      # Liste des patients, invitations
│   ├── PatientPage.tsx / .css        # Détail patient + gestion modules
│   └── PatientRegisterPage.tsx / .css # Inscription patient (via token)
├── components/
│   ├── Layout.tsx / .css             # Header, dropdown profil
│   ├── Button.tsx                    # Bouton réutilisable
│   └── InputField.tsx                # Champ de formulaire réutilisable
├── store/
│   └── authStore.ts                  # État auth (Zustand)
├── lib/
│   ├── supabase.ts                   # Client Supabase typé
│   └── database.types.ts            # Types TypeScript des tables
├── App.tsx                           # Routes React Router
└── index.css                         # Variables CSS globales
```

## Routing

| Route | Page | Accès |
|-------|------|-------|
| `/` | Redirige vers `/login` ou `/dashboard` | – |
| `/login` | LoginPage | Public |
| `/dashboard` | DashboardPage | Praticien connecté |
| `/patient/:id` | PatientPage | Praticien connecté |
| `/register` | PatientRegisterPage | Public (token requis) |

La protection des routes est gérée dans `App.tsx` via l'état du store auth.

## Pages

### LoginPage
- Double mode: connexion / inscription
- À l'inscription: email + mot de passe + nom + titre professionnel
- Après inscription: affiche un message de confirmation email
- Auth via `authStore.login()` / `authStore.register()`

### DashboardPage
- Liste les patients liés au praticien (`practitioner_patients` + `patients`)
- Affiche le nombre de modules actifs par patient
- Formulaire d'invitation: email + alias optionnel
  - Génère un token UUID, stocké dans `invitations` (expire dans 48h)
  - Lien généré: `http://localhost:5173/register?token=<uuid>`
- Liste les invitations en attente avec date d'expiration

### PatientPage
- Paramètre URL: `/patient/:patientId`
- Affiche email + alias du patient
- **Modules actifs**: liste les `patient_modules` non révoqués
  - Bouton "Révoquer" → DELETE dans `patient_modules`
- **Bibliothèque de modules**: les 7 modules disponibles
  - Bouton "Déverrouiller" → INSERT dans `patient_modules` avec `config: {}`
  - Badge "Actif" si déjà débloqué

### PatientRegisterPage
- Accessible uniquement avec un token valide (`?token=<uuid>`)
- Étape 1: valide le token (non expiré, non déjà utilisé)
- Étape 2: affiche le formulaire (email pré-rempli, 2x mot de passe)
- Étape 3: succès → invite à télécharger l'app mobile
- **Note**: cette page est pour les patients qui s'inscrivent depuis un navigateur. L'app mobile gère aussi l'inscription via deep link.

## Composants réutilisables

### Button
```tsx
<Button variant="primary" size="md" loading={false}>
  Texte
</Button>
```
- `variant`: `primary` | `secondary` | `danger` | `ghost`
- `size`: `sm` | `md` | `lg`
- `loading`: affiche un spinner, désactive le bouton

### InputField
```tsx
<InputField
  label="Email"
  type="email"
  error="Email invalide"
  {...register('email')}
/>
```
- Génère automatiquement l'`id` depuis le label si non fourni
- Affiche le message d'erreur en rouge sous le champ

### Layout
- Header avec logo "Kær"
- Dropdown profil (avatar initiales): éditer le profil, se déconnecter
- Modal d'édition: nom + titre professionnel

## Store auth (`authStore.ts`)

```ts
const { practitioner, loading, error, login, register, logout, updateProfile, loadSession } = useAuthStore()
```

| Action | Description |
|--------|-------------|
| `loadSession()` | Restaure la session depuis Supabase au démarrage |
| `login(email, password)` | Connexion |
| `register(email, password, name, title)` | Inscription praticien |
| `updateProfile(name, title)` | Mise à jour du profil |
| `logout()` | Déconnexion |
| `clearError()` | Efface le message d'erreur |

## Types (`database.types.ts`)

```ts
// Enum des types de modules
type ModuleType = 'sleep_diary' | 'beck_columns' | 'fear_thermometer' | ...

// Praticien (profil Supabase)
interface Practitioner {
  id: string
  email: string
  name: string
  professional_title: string | null
  created_at: string
}

// Résumé patient pour le dashboard
interface PatientSummary {
  id: string
  email: string
  patient_alias: string | null
  module_count: number
}

// Labels français des modules (pour l'UI)
const MODULE_LABELS: Record<ModuleType, string>
const MODULE_DESCRIPTIONS: Record<ModuleType, string>
```

## Variables d'environnement

Fichier `apps/web/.env` à créer:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Ces valeurs sont disponibles dans le tableau de bord Supabase → Settings → API.
    