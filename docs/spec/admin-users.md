# Gestion des utilisateurs — page admin

Page web réservée aux praticiens **admin** pour exercer les droits RGPD (export
art. 15/20, effacement art. 17) sur **n'importe quel** patient. Sortie de la fiche
patient (`PatientPage`) où elle était accessible à tout praticien — désormais
centralisée, gardée, et auditée.

> Branche `feat/admin-user-management`. Prolonge la conformité RGPD #27
> ([`rgpd-droits-patient.md`](../rgpd-droits-patient.md)).

---

## Résumé

- **Rôle admin** : nouvelle colonne `practitioners.is_admin` (défaut `false`). Les
  admins sont attribués **par seed** (`supabase/seed.sql`, par email) — aujourd'hui
  Guillaume Zarb et Olivier Teil. Aucune UI d'attribution (volontaire).
- **Page** `/admin/users` : table de TOUS les utilisateurs — **patients ET médecins**,
  chacun avec un **badge de type** (« Patient » / « Médecin », + « Admin » pour un
  médecin admin). Trois filtres composables : recherche nom/email, type (segmenté),
  et **par praticien** (liste → patients rattachés à ce médecin). Chaque ligne
  dépliable expose : pour un patient le bloc `PatientDataRights` (export / effacement) ;
  pour un médecin un panneau lecture seule (rôle). Aucune action RGPD sur un médecin.
- **Un patient ne peut jamais être admin** : `is_admin` vit sur `practitioners` ;
  un patient n'y a pas de ligne.

---

## Règle d'or — sécurité verrouillée des deux côtés

> **Le front cache, la base refuse.** Une garde de route React n'est que du confort
> UX ; la barrière réelle est en base.

| Couche | Mécanisme |
|---|---|
| **Base — source de vérité** | `fn_is_admin()` (`SECURITY DEFINER`, `stable`) lit `is_admin` via `auth.uid()`. Jamais un flag client. |
| **Base — barrière** | RPC `export_patient_data` / `erase_patient_data` gardés `fn_is_admin() OR auth.uid() = patient_id` ; `admin_list_users()` gardé `fn_is_admin()` ; edge function `delete-patient-account` re-vérifie admin OU self via le JWT. |
| **Base — anti-escalade** | trigger `trg_guard_is_admin_write` : toute tentative de modifier `is_admin` depuis un appel authentifié (`auth.uid()` non-null) est rejetée. Seul le serveur (seed / service_role) l'attribue. |
| **Front — UX** | route `/admin/users` montée seulement si `practitioner.is_admin` (App.tsx) ; lien de nav conditionnel (MainNav). Un non-admin tombe sur le catch-all → `/`. |

---

## Schéma de données

```sql
-- practitioners
is_admin boolean not null default false   -- lecture seule côté client (trigger)

-- fn_is_admin() : appelant admin ? (ne consulte que practitioners)
-- admin_list_users() : returns table(user_id, kind ('patient'|'practitioner'),
--                       email, display_name, created_at, practitioner_names[], is_admin)
--   patients : practitioner_names = médecins liés, is_admin = false
--   médecins : practitioner_names = {}, is_admin = rôle
-- trg_guard_is_admin_write : before update on practitioners
```

`admin_list_users()` trace chaque appel (`log_data_access('read', 'patients', …)`).

---

## Flux

```
Admin → /admin/users
  AdminUsersPage.load() → adminService.fetchAllUsers() → RPC admin_list_users()
    (base : fn_is_admin() sinon exception → ok:false → toast)
  Table (DataTable) : badge type + filtres (recherche nom/email, type segmenté,
                      par praticien → patients rattachés), client-side
  Ligne dépliée → AdminUserDetail :
    patient → PatientDataRights(patientId, displayName, onErased)
      Export  → exportPatientData → RPC export_patient_data (téléchargement JSON)
      Effacer → confirmation (re-saisie du nom) → erasePatientData
                → RPC erase_patient_data + Edge delete-patient-account
                → onErased → retrait de la ligne (sans recharger la table)
    médecin → panneau lecture seule (rôle ; aucune action RGPD)
```

---

## Composants & fichiers

| Fichier | Rôle |
|---|---|
| `apps/web/src/pages/AdminUsersPage/AdminUsersPage.tsx` | Orchestration (fetch, état, `onErased`). |
| `…/AdminUsersTable.tsx` | Câble `DataTable` : badge type, 3 filtres, `renderDetail`. |
| `…/AdminUserDetail.tsx` | Panneau dépliable, branché sur `kind` (mémoïsé) : patient → `PatientDataRights` ; médecin → `Card` lecture seule. |
| `apps/web/src/services/adminService.ts` | `fetchAllUsers()` + types `AdminUser` / `AdminUserKind`. |
| `apps/web/src/components/features/MainNav/MainNav.tsx` | Lien admin conditionnel. |

Aucun nouveau primitive de design system : réutilise `DataTable`, `SearchInput`,
`SegmentedControl`, `SelectField`, `StatusBadge`, `EmptyState`, `Card`, `Button`,
`Modal`, `InputField`.

---

## Cas limites

- **Non-admin qui force l'URL `/admin/users`** → route non montée → redirigé vers `/`.
- **Non-admin qui forge l'appel RPC** → `fn_is_admin()` faux → exception → `ok:false`.
- **Patient (self-service mobile)** → `auth.uid() = patient_id` → export/erase OK ;
  inchangé par cette feature.
- **Tentative de PATCH `is_admin=true`** → rejet du trigger.
- **Ligne médecin** → pas de droits RGPD patient (panneau lecture seule). Même si
  l'UI était contournée, les RPC `export/erase` échoueraient (un médecin n'est pas
  un patient et l'appelant admin agit, mais la cible n'a pas de données patient).
- **Filtre par praticien actif** → seuls les patients rattachés au médecin choisi
  s'affichent ; les lignes médecins sont masquées.
- **Effacement réussi** → ligne retirée localement, pas de rechargement complet.
