# Flux d'invitation patient — Interface web praticien

## Vue d'ensemble

Le praticien invite un patient depuis son dashboard. Le patient reçoit un lien unique qu'il utilise pour créer son compte.

```
Praticien → Dashboard → "Inviter un patient"
         → Saisit l'email du patient
         → Un token UUID est généré (valide 48h) et stocké en BDD
         → Un lien est affiché : https://<domaine>/register?token=<uuid>
         → Le praticien envoie ce lien manuellement au patient (email, SMS…)

Patient  → Ouvre le lien dans son navigateur
         → Page /register?token=<uuid>
         → Lien vérifié (non expiré, non déjà accepté)
         → Email pré-rempli (non modifiable)
         → Crée son mot de passe
         → Compte créé → trigger SQL lie le patient au praticien automatiquement
```

---

## Fichiers concernés

| Fichier | Rôle |
|---|---|
| `src/pages/DashboardPage.tsx` | Formulaire d'invitation + affichage du lien + liste des invitations en attente |
| `src/pages/PatientRegisterPage.tsx` | Page d'inscription patient (accessible sans authentification) |
| `src/App.tsx` | Route `/register` publique (hors garde d'auth) |

---

## Route publique

`/register?token=<uuid>` est accessible sans être connecté — la route est déclarée **en dehors** du bloc conditionnel praticien dans `App.tsx`.

---

## Validation du token (côté client)

Dans `PatientRegisterPage.tsx`, au chargement :
1. Lecture du token depuis l'URL (`useSearchParams`)
2. Requête Supabase sur `public.invitations` :
   - `token` = valeur de l'URL
   - `accepted_at` doit être `null`
   - `expires_at` doit être dans le futur
3. Si invalide → écran d'erreur
4. Si valide → email pré-rempli, formulaire affiché

---

## Création du compte patient

Le `signUp` Supabase passe deux métadonnées critiques :
```ts
options: {
  data: {
    role: 'patient',
    invitation_token: token,
  },
}
```

Le trigger SQL `handle_new_user` (dans `supabase/schema.sql`) :
1. Lit `role` → insère dans `public.patients`
2. Lit `invitation_token` → marque l'invitation `accepted_at = now()`
3. Crée la relation `practitioner_patients` automatiquement

---

## Invitations en attente (dashboard)

Le dashboard affiche toutes les invitations où :
- `accepted_at IS NULL`
- `expires_at > now()`

La liste est rechargée après chaque nouvelle invitation.

---

## Limitations actuelles (à faire évoluer)

- L'email n'est **pas envoyé automatiquement** — le praticien copie le lien manuellement
- Pas de renvoi d'invitation possible (il faut créer une nouvelle invitation)
- Pas de confirmation d'email pour le patient (désactivée en dev)
