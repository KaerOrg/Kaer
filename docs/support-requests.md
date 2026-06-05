# Demandes de support praticien — `support_requests`

Permet à un praticien de **contacter le support depuis l'app**, via un **formulaire
borné** (motif choisi dans une liste fermée, **aucune saisie libre**). Chaque demande
est **enregistrée en base** et **notifiée au support par email** (Resend).

> Introduit avec le flow MFA (#26) pour le cas « perte d'accès à l'authentificateur »,
> mais réutilisable pour tout motif de support.

## Pourquoi un formulaire borné (sans saisie libre)

- **Conformité MDR / RGPD** : aucun texte libre → aucune donnée clinique ni PII ne
  transite vers le support par ce canal.
- **Anti-abus** : liste fermée de motifs, validée côté serveur.

Motifs (liste fermée, synchronisée entre `supportService.SUPPORT_REASONS`, le `CHECK`
SQL et l'Edge Function) :

| Code | Sens |
|---|---|
| `mfa_lost` | Perte d'accès à l'application d'authentification (2FA) |
| `login_issue` | Problème de connexion |
| `account_issue` | Problème lié au compte |
| `other` | Autre demande |

## Circuit

```
Praticien (web)                Edge Function send-support-request          Supabase / Resend
─────────────                  ──────────────────────────────────         ─────────────────
SupportRequestModal            1. valide le motif (liste fermée)
  └ submitSupportRequest(reason) ─────────────────────────────▶
                               2. getUser(JWT)  ← identité (valable aal1)
                               3. insert support_requests (service_role) ─▶ table
                               4. email récap au support (Resend) ────────▶ email
                               ◀──── { success: true }
```

- L'**identité** du praticien est dérivée du **JWT** côté serveur (jamais envoyée par
  le client). Fonctionne même en **aal1** (avant le challenge MFA) → couvre le cas
  « perte de code » sur l'écran de vérification.
- La notification email est **best-effort** : la demande est déjà enregistrée même si
  l'email échoue.

## Schéma

`public.support_requests` — `id`, `practitioner_id` (FK, `on delete set null`),
`email`, `reason` (CHECK liste fermée), `status` (défaut `open`), `created_at`.
RLS activée, **aucune policy client** : écriture par l'Edge Function (`service_role`),
lecture support/DPO (dashboard Supabase).

## Points d'entrée (UI)

| Endroit | Composant | Comportement |
|---|---|---|
| Challenge MFA (perte de code) | `MfaChallengeForm` → `SupportRequestModal` | motif pré-réglé `mfa_lost` |
| Profil praticien | `ProfilePage` → `SupportRequestModal` | motif libre dans la liste fermée |

## Configuration (Edge Function `send-support-request`)

| Variable | Rôle |
|---|---|
| `SUPPORT_EMAIL` | Destinataire des notifications (fallback `DEV_EMAIL`) |
| `RESEND_API_KEY` | Clé Resend (déjà utilisée par `send-invitation`) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Injectées par Supabase |

## Fichiers

| Fichier | Rôle |
|---|---|
| `supabase/functions/send-support-request/index.ts` | Edge Function (insert + email) |
| `supabase/schema.sql` (section *support_requests*) | table + RLS |
| `apps/web/src/services/supportService.ts` | `submitSupportRequest`, `SUPPORT_REASONS` |
| `apps/web/src/components/features/SupportRequestModal/` | formulaire borné |
