# Flux d'invitation patient

## Vue d'ensemble

Un patient **ne peut pas s'inscrire seul**. Il doit être invité par son praticien.

```
Praticien (web)              Email                  Patient (mobile)
      │                        │                          │
      │ 1. Saisit l'email       │                          │
      │    + alias optionnel    │                          │
      │                        │                          │
      │ 2. Token UUID généré   │                          │
      │    (expire dans 48h)    │                          │
      │    Stocké en BDD        │                          │
      │                        │                          │
      │ 3. Lien généré ─────────►                          │
      │    /register?token=xxx  │                          │
      │                        │ 4. Patient ouvre le lien │
      │                        │    (navigateur ou app)   │
      │                        │                          │
      │                        │ 5. Formulaire inscription│
      │                        │    email pré-rempli      │
      │                        │    mot de passe créé     │
      │                        │                          │
      │                        │ 6. Compte créé           │
      │                        │    Token marqué accepté  │
      │                        │    Relation créée en BDD │
      │                        │                          │
      │ 7. Patient apparaît     │                          │
      │    dans le dashboard   │                          │
```

## Étapes détaillées

### Étape 1 — Le praticien envoie l'invitation (DashboardPage)

Le praticien saisit l'email du patient et optionnellement un alias (initiales, surnom).

Code: `apps/web/src/pages/DashboardPage.tsx` → fonction `handleInvite()`

```ts
// Génère un token UUID
const token = crypto.randomUUID()

// Insère dans la table invitations
await supabase.from('invitations').insert({
  practitioner_id: practitioner.id,
  patient_email: email,
  token,
  expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
})
```

Le lien généré: `http://localhost:5173/register?token=<uuid>`

### Étape 2 — Le patient ouvre le lien

Deux cas possibles:

**Via navigateur** → `PatientRegisterPage` (`apps/web/src/pages/PatientRegisterPage.tsx`)
- Lit `?token=` depuis l'URL
- Valide: token existe, non expiré, non déjà accepté
- Affiche le formulaire avec email pré-rempli

**Via deep link mobile** → `psytool://invite?token=<uuid>`
- Ouvre directement l'app si installée
- Navigue vers `RegisterScreen` avec token et email pré-remplis
- Configuré dans `apps/mobile/src/navigation/index.tsx`

### Étape 3 — Le patient s'inscrit

Validations:
- Mots de passe identiques
- Minimum 8 caractères

Code: `apps/mobile/src/store/authStore.ts` → `register(email, password, token)`

```ts
// 1. Valide le token
const { data: invitation } = await supabase
  .from('invitations')
  .select('*')
  .eq('token', token)
  .is('accepted_at', null)
  .gt('expires_at', new Date().toISOString())
  .single()

// 2. Crée le compte Supabase Auth
await supabase.auth.signUp({
  email, password,
  options: { data: { role: 'patient' } }
})
```

### Étape 4 — Le trigger Supabase complète l'inscription

Le trigger `handle_new_user` s'exécute automatiquement:

1. Crée le profil dans `patients`
2. Trouve l'invitation correspondant à l'email
3. Marque l'invitation `accepted_at = now()`
4. Crée la relation dans `practitioner_patients`

Code: `supabase/schema.sql` → fonction `handle_new_user()`

### Étape 5 — Le praticien voit le patient

Le patient apparaît dans le dashboard du praticien (liste `practitioner_patients`). Le praticien peut maintenant déverrouiller des modules.

## Cas d'erreur

| Situation | Message affiché | Comportement |
|-----------|----------------|--------------|
| Token inexistant | "Lien invalide" | Bloque l'inscription |
| Token expiré (> 48h) | "Lien expiré" | Bloque, praticien doit renvoyer |
| Token déjà utilisé | "Compte déjà créé" | Redirige vers login |
| Email déjà inscrit | Erreur Supabase | Message générique |

## Sécurité

- Le token est un UUID v4 (128 bits d'entropie) — non devinable
- La policy RLS `invitations_by_token` permet la lecture publique uniquement par token exact
- Le token est invalidé dès l'utilisation (`accepted_at` renseigné)
- Expiration 48h limitée pour réduire la fenêtre d'attaque
