# Authentification forte praticien — MFA (TOTP)

Second facteur d'authentification pour les praticiens, exigé par le guide de
conformité Kær §4 (« Authentification forte (MFA) pour les praticiens ») et
attendu dans les questionnaires sécurité B2B.

> Ticket **#26** (`feat/mfa-praticien`). Épic conformité **#29**.

---

## 1. Choix : TOTP via Supabase Auth natif

| Méthode | Retenu | Raison |
|---|:---:|---|
| **TOTP** (app authenticator) | ✅ | Natif Supabase (`supabase.auth.mfa.*`), zéro coût, zéro tiers, hors-ligne, standard |
| SMS | ❌ | Coût, prestataire, SIM-swapping, donnée téléphone supplémentaire |
| Email OTP | ❌ | Pas un vrai 2ᵉ facteur (même canal qu'un reset mot de passe) |
| WebAuthn / passkeys | ⏳ | Excellent, envisagé en v2 |

**Aucun changement de schéma** : les facteurs MFA sont stockés par Supabase dans le
schéma `auth`. Pas de table ni de migration.

## 2. Politique v1

- **Opt-in** : chaque praticien active le MFA depuis son profil. Le code n'est
  demandé au login qu'aux praticiens qui l'ont activé. (L'obligation généralisée
  pourra être imposée plus tard.)
- **Récupération en cas de perte** : pas de codes de secours en v1. Le support
  désenrôle le facteur via `service_role` (voir §6).

## 3. Le point délicat : les niveaux d'assurance (AAL)

Après `signInWithPassword`, Supabase crée une session **même sans le code TOTP**,
au niveau `aal1`. Un compte avec facteur TOTP vérifié a `nextLevel = 'aal2'`. Tant
que le code n'est pas saisi, le praticien **ne doit pas** être considéré connecté.

`authService` encapsule cette règle via `getMfaChallenge()` :
- **`loginWithPassword`** → si un challenge est requis, renvoie
  `{ status: 'mfa_required', factorId }` au lieu de `{ status: 'success' }`.
- **`fetchSessionPractitioner`** (au reload) → renvoie `null` si la session est en
  `aal1` alors qu'`aal2` est requis, pour ne pas laisser passer une demi-session.

## 4. Flux

**Activation (profil)** — `MfaSettingsCard` → `MfaEnrollModal`. L'installation est
présentée en **3 étapes numérotées explicites** (pour un praticien non technique) :
1. Installer une application d'authentification (Google/Microsoft Authenticator, Authy…).
2. Scanner le QR code (ou saisir la clé manuellement si le scan échoue).
3. Saisir le code à 6 chiffres → `verifyMfaCode(factorId, code)` (challenge + verify)
   → facteur `verified`.

Si la modale est fermée sans confirmer → le facteur non vérifié est désenrôlé
(`unenrollMfa`) pour éviter un enrôlement orphelin.

**Connexion (login)** — `LoginPage` → `MfaChallengeForm` :
1. `login(email, password)` → store passe en `mfaRequired = true`.
2. `LoginPage` affiche `MfaChallengeForm` (saisie 6 chiffres).
3. `verifyMfa(code)` → `completeMfaLogin` (challenge + verify → session `aal2`) →
   chargement du praticien.
4. « Annuler » → `cancelMfa()` (déconnecte la demi-session `aal1`).
5. **« Vous n'avez plus accès à votre application ? »** → ouvre le formulaire de
   support (motif pré-réglé `mfa_lost`). Voir [`support-requests.md`](support-requests.md).

**Désactivation (profil)** — confirmation via `Modal` → `unenrollMfa(factorId)`.

**Bandeau de rappel (nudge)** — `MfaReminderBanner` (utilise la primitive
`Banner`) : affiché dans le `Layout` aux praticiens **sans MFA**, avec un lien vers
l'écran d'activation (profil). Sa fermeture est **persistée** côté serveur
(`practitioners.mfa_reminder_dismissed`) → ne réapparaît plus, même sur un autre
appareil. C'est l'intermédiaire entre l'opt-in actuel et le MFA obligatoire (ticket
#33).

## 5. Architecture / fichiers

| Fichier | Rôle |
|---|---|
| `apps/web/src/services/authService.ts` | `enrollMfaTotp`, `verifyMfaCode`, `getMfaStatus`, `unenrollMfa`, `completeMfaLogin`, `getMfaChallenge` (privé), `dismissMfaReminder` + `loginWithPassword`/`fetchSessionPractitioner` AAL-aware |
| `apps/web/src/store/authStore.ts` | état `mfaRequired`/`mfaFactorId` + actions `verifyMfa`/`cancelMfa`/`dismissMfaReminder` |
| `apps/web/src/pages/LoginPage/MfaChallengeForm.tsx` | saisie du code au login + lien support (perte de code) |
| `apps/web/src/components/features/MfaSettingsCard/` | carte réglage profil + `MfaEnrollModal` (QR, 3 étapes) |
| `apps/web/src/components/features/MfaReminderBanner/` | bandeau de rappel (enveloppe la primitive `Banner`) |
| `apps/web/src/components/ui/Banner/` | primitive design system du bandeau ([doc](../apps/web/docs/components/banner.md)) |
| `supabase/schema.sql` | colonne `practitioners.mfa_reminder_dismissed` |
| `apps/web/src/i18n/locales/{fr,en}/common.json` | clés `auth.mfa.*` |

Contact support (perte de code) : voir [`support-requests.md`](support-requests.md).

- **`LoginResult`** est une union discriminée : `success` / `mfa_required` / `error`.
- Aucun appel `supabase.auth.*` hors `authService.ts` (règle coding-standards).
- UI : réutilise `Modal`, `Card`, `Button`, `InputField`, `StatusBadge`, `useToast`.

## 6. Procédure de récupération (support)

Un praticien ayant perdu son authentificateur est verrouillé. Pour le débloquer,
un administrateur supprime son facteur via `service_role` (SQL Editor / API admin) :

```sql
-- Identifier le facteur du praticien (auth.mfa_factors)
select id, friendly_name, status, created_at
from auth.mfa_factors
where user_id = '<UUID_DU_PRATICIEN>';

-- Le supprimer (le praticien pourra se reconnecter au mot de passe seul, puis ré-enrôler)
delete from auth.mfa_factors where id = '<FACTOR_ID>';
```

> ⚠️ À faire uniquement après vérification d'identité du praticien hors-ligne.

## 7. Tests

`apps/web/src/services/authService.test.ts` — enrôlement (OK/erreur), `verifyMfaCode`
(challenge+verify, code invalide), `getMfaStatus`, `unenrollMfa`, `loginWithPassword`
→ `mfa_required`, `fetchSessionPractitioner` AAL-aware, `completeMfaLogin`.
`apps/web/src/store/authStore.test.ts` — login/loadSession AAL-aware.

## 8. Évolutions possibles

- MFA **obligatoire** (forcer l'enrôlement avant accès au dashboard).
- **Codes de secours** (table dédiée, hachés) pour l'auto-récupération.
- **WebAuthn / passkeys**.
