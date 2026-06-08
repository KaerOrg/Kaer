# Droits patient RGPD — export & effacement

Mise en œuvre des **droits patient** exigés par le RGPD : accès / portabilité
(art. 15 & 20) → **export**, et droit à l'oubli (art. 17) → **effacement complet**.

> Issu du ticket **#27** (`feat/rgpd-droits-patient`). Voir l'épic conformité **#29**
> et le `Kaer_Guide_Conformite.pdf` §2 & §4. Position juridique : le **praticien est
> responsable de traitement**, Kær **sous-traitant**.
>
> **Habilitation (depuis `feat/admin-user-management`)** : côté web, l'export/effacement
> n'est plus sur la fiche patient ni accessible à un praticien quelconque — il vit sur
> une **page admin dédiée** (gestion des utilisateurs), réservée aux praticiens
> **`is_admin`**. Côté mobile, le **patient** continue d'exercer ses droits **sur
> lui-même** (self-service). Un praticien NON-admin n'a plus aucun accès à ces RPC.

---

## 1. ⚠️ Conformité MDR (RÈGLE D'OR)

L'export est un **miroir neutre** des données saisies : valeurs **brutes** uniquement
(`to_jsonb`), **aucun score labellisé, aucune interprétation, aucune couleur de
gravité**. Le serveur restitue, il ne conclut jamais.

---

## 2. Architecture

La RLS n'accorde au praticien qu'un `SELECT` (parfois rien) sur les tables patient —
un `DELETE` direct serait bloqué. On suit donc le pattern de l'audit log (#25) :

| Brique | Fichier | Rôle |
|---|---|---|
| RPC `export_patient_data` | `supabase/schema.sql` | Agrège toutes les tables du patient en un `jsonb`. `SECURITY DEFINER` + garde `fn_is_admin() OR auth.uid() = patient_id`. |
| RPC `erase_patient_data` | `supabase/schema.sql` | Trace l'effacement + supprime le **non-cascadant**. Même garde. |
| Helper `fn_is_admin()` | `supabase/schema.sql` | `true` si l'appelant (`auth.uid()`) est un praticien `is_admin`. Ne consulte que `practitioners` → un patient ne peut jamais l'être. |
| RPC `admin_list_users()` | `supabase/schema.sql` | Liste admin de TOUS les utilisateurs — patients ET médecins (page de gestion), avec discriminant `kind`. Admin-only + audité. |
| Edge Function `delete-patient-account` | `supabase/functions/delete-patient-account/` | `service_role` — supprime le compte `auth.users` (cascade). Re-vérifie admin OU self via le JWT. |
| Service web | `apps/web/src/services/patientDataRightsService.ts` | `exportPatientData` / `erasePatientData`. |
| Service web (liste) | `apps/web/src/services/adminService.ts` | `fetchAllUsers` (RPC `admin_list_users`). |
| UI web | `apps/web/src/pages/AdminUsersPage/` | Page admin « Gestion des utilisateurs » — table + panneau RGPD (`PatientDataRights` réutilisé en détail de ligne). Réservée aux `is_admin`. |
| Service mobile | `apps/mobile/src/services/patientDataRightsService.ts` | `exportMyData` / `eraseMyAccount` (self-service patient). |
| Purge locale | `apps/mobile/src/lib/database.ts` → `purgeAllLocalData()` | Vide toutes les tables SQLite patient. |
| UI mobile | `apps/mobile/src/screens/ProfileScreen.tsx` | Section « Mes données » (self-service). |

### Pourquoi un compte se supprime depuis une Edge Function

Un RPC SQL ne peut pas supprimer une ligne `auth.users`. `patients.id` référence
`auth.users(id) ON DELETE CASCADE`, et toutes les tables enfant cascadent depuis
`patients`. Donc `auth.admin.deleteUser(patientId)` (service_role, depuis l'Edge
Function) purge en cascade `patients` + ~20 tables enfant.

### Ce qui cascade vs ce qui est supprimé explicitement

| Donnée | Effacement |
|---|---|
| `patients` + ~20 tables enfant (`patient_entries`, `patient_modules`, `notification_*`, `crisis_plan_*`, `cssrs_*`, `appointments`, `practitioner_patient_notes`, `practitioner_patients`, …) | **Cascade** via `deleteUser` |
| `invitations` (liées par email, pas de FK `patient_id`) | **Explicite** dans `erase_patient_data` |
| `caseload_entries` (`patient_id ON DELETE SET NULL`) + ses enfants | **Explicite** dans `erase_patient_data` |
| SQLite local de l'appareil patient | `purgeAllLocalData()` (mobile) |

---

## 3. Ordre d'appel (web et mobile)

```
1. RPC erase_patient_data(p_patient_id)
     → garde : appelant admin OU patient lui-même (auth.uid())
     → trace 'erase' dans access_audit_log (AVANT toute suppression)
     → delete invitations (par email) + caseload_entries
2. Edge Function delete-patient-account { patient_id }
     → re-vérifie via le JWT : appelant admin OU patient lui-même
     → auth.admin.deleteUser(patient_id)  → cascade patients + enfants
3. [mobile uniquement] purgeAllLocalData() + signOut()
```

L'ordre est important : le RPC trace l'effacement et purge le non-cascadant **avant**
que la cascade `deleteUser` n'efface le patient et ses relations.

### Robustesse mobile

Si le compte est effacé côté serveur par le praticien, l'appareil du patient peut
encore détenir un cache SQLite. Au prochain `getCurrentSessionPatient`
(`apps/mobile/src/services/authService.ts`) : session présente mais profil absent →
`purgeAllLocalData()` puis `signOut()`.

---

## 4. Sécurité & traçabilité

- **Habilitation vérifiée côté base** (`fn_is_admin() OR auth.uid() = patient_id`)
  ET côté Edge Function (JWT). Un praticien **admin** peut agir sur n'importe quel
  patient ; un **patient** ne peut agir que sur **lui-même** ; un praticien **non-admin**
  n'a aucun accès. Le rôle admin (`practitioners.is_admin`) est **en lecture seule
  côté client** (trigger `trg_guard_is_admin_write` — toute tentative de PATCH le
  modifiant depuis un JWT authentifié est rejetée ; seul le serveur l'attribue).
- **Droits d'exécution** restreints (révocation explicite des default privileges
  Supabase) : `export_patient_data` / `erase_patient_data` / `admin_list_users` /
  `fn_is_admin` → `authenticated` + `service_role`. (`fn_is_admin` n'expose à
  l'appelant que **son propre** rôle.)
- **Audit** : chaque export (`action='export'`) et effacement (`action='erase'`) est
  journalisé dans `access_audit_log` via `log_data_access`. Le journal ne contient
  jamais de contenu clinique (cf. [`audit-log.md`](audit-log.md)).
- **Advisor Supabase** : `authenticated_security_definer_function_executable` (WARN)
  sur `export_patient_data` / `erase_patient_data` / `admin_list_users` est
  **attendu et intentionnel** — ces RPC *doivent* être appelables par les utilisateurs
  authentifiés, la garde (admin OU self) étant interne (`fn_is_admin`). Même profil
  que `log_data_access` (#25).

---

## 5. Format d'export

JSON structuré (une clé par table), téléchargé tel quel :
- **Web** : fichier `kaer-export-<patient_id>.json` (download navigateur).
- **Mobile** : partage du JSON via l'API native `Share` (self-service patient).

Un export PDF lisible est reporté (le JSON couvre l'accès art. 15 et la portabilité
art. 20).

---

## 6. Tests

| Test | Couvre |
|---|---|
| `apps/web/src/services/patientDataRightsService.test.ts` | export OK, RPC refusé, erase ordre RPC→Edge, Edge en échec |
| `apps/web/src/services/adminService.test.ts` | `fetchAllUsers` : liste (patients+médecins) OK, RPC refusé (non-admin), liste vide |
| `apps/web/src/pages/AdminUsersPage/AdminUsersPage.test.tsx` | liste mixte, erreur de chargement, filtre par type, recherche par praticien, retrait après effacement |
| `apps/mobile/src/services/patientDataRightsService.test.ts` | export OK/échec, erase ordre RPC→Edge→purge→signOut, arrêts en cas d'échec |
| `apps/mobile/src/lib/purgeAllLocalData.test.ts` | toutes les tables vidées, table absente ignorée |

---

## 7. Limites connues / suites

- **Rectification (art. 16)** : couverte par l'édition existante (profil patient,
  notes praticien, config modules). Pas de surface dédiée supplémentaire.
- **Information à la collecte (art. 14)** : mention RGPD claire au patient — partie
  non-code de l'épic (CGU / politique de confidentialité, #29).
- **Export PDF** lisible : non implémenté (JSON suffit pour art. 15/20).
- La constante `PATIENT_DATA_TABLES` (mobile) doit être **étendue à chaque nouveau
  module** ajoutant une table SQLite, sous peine de données locales résiduelles.
