# Demandes de support praticien — `support_requests`

Permet à un praticien **bloqué hors de son compte** de **contacter le support depuis
l'app**, via un **formulaire borné** (motif dans une liste fermée ; saisie libre
réservée au seul cas `other`). Chaque demande est **enregistrée en base** et
**notifiée au support par email** (Resend).

> Introduit avec le flow MFA (#26) pour le cas « perte d'accès à l'authentificateur »,
> étendu aux autres problèmes d'accès (mot de passe, compte bloqué).

## Principe : borné au maximum, saisie libre uniquement en dernier recours

Le formulaire ne sert qu'aux **problèmes d'accès au compte**. Règle de design :

- **Motifs auto-suffisants** → le motif + l'email = contexte actionnable, **aucune
  saisie libre** (anti-abus, pas de PII inutile).
- **Motif fourre-tout `other`** → le motif seul ne dit rien d'actionnable, donc une
  **description libre devient obligatoire** (≤ 500 caractères). C'est le seul champ
  texte, réservé à ce cas.

> Compromis assumé : un motif vague sans contexte est inexploitable par le support ;
> on borne donc au maximum et on n'ouvre la saisie libre que pour `other`.

Motifs (liste fermée, synchronisée entre `supportService.SUPPORT_REASONS`, le `CHECK`
SQL et l'Edge Function) :

| Code | Sens | Description libre |
|---|---|---|
| `mfa_lost` | Perte d'accès à l'application d'authentification (2FA) | non |
| `password_forgotten` | Mot de passe oublié | non |
| `account_locked` | Compte bloqué | non |
| `other` | Autre demande | **oui (obligatoire)** |

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
- **Cas déconnecté** (écran de login, mot de passe oublié / compte bloqué) : aucun JWT.
  Le praticien fournit un **email de contact** (champ borné, validé). L'Edge Function
  est **publique** (`verify_jwt = false`) ; le client poste `{ reason, email }`.
- **Anti-abus** : l'endpoint public est protégé par un **rate-limit par IP** —
  `sha256(IP)` stocké dans `support_requests.ip_hash` (jamais l'IP en clair), max
  **5 demandes / heure / IP** (sinon `429`).
- La notification email est **best-effort** : la demande est déjà enregistrée même si
  l'email échoue.

## Points d'entrée (UI)

| Endroit | Connecté ? | Email demandé ? |
|---|---|---|
| Écran de login (`LoginPage`) | Non | **Oui** (`requireEmail`) |
| Challenge MFA (`MfaChallengeForm`, motif `mfa_lost`) | aal1 (JWT) | Non |


> Pas d'entrée dans le profil : les motifs (accès bloqué, perte 2FA, connexion) n'ont
> de sens que pour un praticien **qui ne peut pas accéder** à son compte. Un canal de
> support « général » pour praticien connecté relèverait d'une autre feature (aide/FAQ).

## Schéma

`public.support_requests` — `id`, `practitioner_id` (FK, `on delete set null`),
`email`, `reason` (CHECK liste fermée), `description` (libre, motif `other` uniquement),
`status` (défaut `open`), `ip_hash` (rate-limit), `created_at`.
RLS activée, **aucune policy client** : écriture par l'Edge Function (`service_role`),
lecture support/DPO (dashboard Supabase).

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
