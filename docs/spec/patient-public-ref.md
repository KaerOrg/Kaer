# Identifiant public opaque dans l'URL patient (`public_ref`)

## Résumé

L'URL de la fiche patient web exposait jusqu'ici la **PK réelle** du patient :
`/patient/de000001-0000-4000-8000-000000000001`. Cette PK est désormais remplacée
par un **identifiant public opaque** stocké, court et URL-safe :

```
/patient/p_8Kf3aQ
```

Le token vit dans la colonne `practitioner_patients.public_ref`. La page le résout
**une seule fois** vers le `patient_id` réel ; toute la couche service continue
ensuite de travailler avec la vraie PK, inchangée.

## Pourquoi — et ce que ça n'est PAS

C'est de la **défense en profondeur** : le token masque la PK dans l'historique du
navigateur, les logs serveur, le header `Referer` et les captures d'écran partagées.
Enjeu de **confidentialité incidente** pertinent pour de la donnée de santé
(RGPD Art. 9).

> **Ce n'est pas un contrôle d'accès.** La seule barrière reste la **RLS**. La policy
> `ptp_practitioner` (`auth.uid() = practitioner_id`) fait que la résolution
> `public_ref → patient_id` ne renvoie une ligne que si le praticien connecté possède
> cette relation. Connaître un token ne donne aucun accès aux données.

## Règles métier

- **Stable** : le token est généré une fois (default SQL) et ne change jamais
  tout seul. Bookmark, refresh (F5) et partage d'URL entre appareils fonctionnent.
- **Révocable** : régénérer `public_ref` (UPDATE) invalide l'ancien lien sans
  toucher à la PK ni aux données. Action explicite, jamais automatique.
- **Scopé par relation** : le token vit sur `practitioner_patients`. Un même patient
  suivi par deux praticiens a **deux tokens distincts** — cohérent avec une URL déjà
  scopée par praticien via la RLS.
- **Format** : `p_` + 8 caractères base62 (`[0-9a-zA-Z]`), généré par
  `public.gen_public_ref()`. Espace de tirage 62⁸ ≈ 2,18·10¹⁴ → collision
  négligeable, garantie par l'index `unique`.

## Schéma de données

`supabase/schema.sql` (source de vérité) :

```sql
-- Fonction génératrice (définie avant les tables qui l'utilisent en default)
create or replace function public.gen_public_ref() returns text ...

-- Colonne sur la relation praticien ↔ patient
alter table public.practitioner_patients
  add column public_ref text not null unique default public.gen_public_ref();
```

Migration appliquée (idempotente) : ajout colonne → backfill des lignes existantes
via `gen_public_ref()` → `set not null` + `set default` → index unique.

## Flux

```
URL /patient/p_8Kf3aQ
   │
   ▼  PatientPage : useParams() → ref = "p_8Kf3aQ"
resolvePatientRef(ref)                         (services/patientRefService.ts)
   │  select patient_id from practitioner_patients where public_ref = ref
   │  (RLS ptp_practitioner scope auto sur auth.uid())
   ▼
patient_id réel  →  setId()  →  tout le downstream inchangé
   (fetchPatientHeader, fetchPatientModules, fetchNotes, RDV, onglets…)
```

**Construction des liens (sens inverse, patient_id → token)** : les listes qui
génèrent les liens portent `public_ref` :
- `fetchPatientsWithModules` → `PatientSummary.public_ref` → `DashboardPage`
- `fetchAppointmentsForPatient/Week` → `AppointmentWithPatient.patient_public_ref`
  → `AppointmentModal` → `AgendaPage`

## Cas limites

| Cas | Comportement |
|---|---|
| Token absent dans l'URL | Redirection `/` (dashboard) |
| Token inexistant | `resolvePatientRef` → `null` → redirection `/` |
| Token d'un **autre** praticien | RLS → aucune ligne → `null` → redirection `/` (indiscernable d'un token inexistant) |
| Ancien bookmark sur l'URL UUID | Ne résout plus (`null`) → redirection `/`. Acceptable (outil interne) |

## Fichiers

| Fichier | Rôle |
|---|---|
| `supabase/schema.sql` | Fonction `gen_public_ref()` + colonne `public_ref` + migration idempotente |
| `apps/web/src/services/patientRefService.ts` | `resolvePatientRef(ref): Promise<string \| null>` |
| `apps/web/src/services/patientService.ts` | Expose `public_ref` dans `PatientSummary` |
| `apps/web/src/services/appointmentService.ts` | Expose `patient_public_ref` sur les RDV |
| `apps/web/src/pages/PatientPage/PatientPage.tsx` | Résolution `ref → id` au montage |
| `apps/web/src/App.tsx` | Route `/patient/:ref` |
