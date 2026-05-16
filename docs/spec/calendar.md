# Calendar Booking

## Résumé

Système de prise de rendez-vous entre praticien et patient.
- **Praticien (web)** : configure ses plages horaires, visualise la semaine dans une grille pixel, accepte ou refuse les RDV.
- **Patient (mobile)** : consulte le calendrier mois par mois, choisit un créneau disponible, annule un RDV passé.

## Règles métier

- Un praticien définit des **règles récurrentes** (jour de la semaine + horaire + durée de slot).
- Il peut ajouter des **exceptions** ponctuelles (fermeture ou horaire alternatif pour une date précise).
- Le champ `auto_confirm_appointments` sur `practitioners` détermine si un RDV est créé directement en `confirmed` ou en `pending`.
- Un patient ne peut réserver que chez **son propre praticien** (celui lié via `practitioner_patients`).
- L'annulation par le patient passe le statut à `cancelled_by_patient` — le créneau redevient disponible côté praticien.

## Schéma de données

### Nouvelles tables

```sql
availability_rules (
  id uuid PK,
  practitioner_id uuid FK practitioners,
  day_of_week SMALLINT CHECK (0=Lundi … 6=Dimanche),
  start_time TIME, end_time TIME,
  slot_duration_minutes SMALLINT DEFAULT 50,
  created_at timestamptz
)

availability_exceptions (
  id uuid PK,
  practitioner_id uuid FK practitioners,
  exception_date DATE,
  is_closed BOOLEAN,      -- true = fermeture totale
  start_time TIME|NULL,   -- null = utilise la règle récurrente
  end_time TIME|NULL,
  UNIQUE(practitioner_id, exception_date)
)

appointments (
  id uuid PK,
  practitioner_id uuid FK practitioners,
  patient_id uuid FK patients,
  starts_at timestamptz, ends_at timestamptz,
  status TEXT CHECK (pending|confirmed|cancelled_by_patient|cancelled_by_practitioner|completed),
  notes TEXT|NULL,
  created_at timestamptz, updated_at timestamptz
)
```

### Colonne ajoutée

```sql
ALTER TABLE practitioners ADD COLUMN auto_confirm_appointments BOOLEAN DEFAULT true;
```

### Convention day_of_week

`0 = Lundi`, `1 = Mardi`, …, `6 = Dimanche`.  
JS `Date.getDay()` renvoie `0 = Dimanche` → conversion : `jsDay === 0 ? 6 : jsDay - 1`.

## Flux

### Côté praticien (web)

1. `AgendaPage` charge règles + exceptions + RDV de la semaine via `Promise.all`.
2. `WeekGrid` positionne chaque slot et chaque RDV par calcul pixel : `HOUR_HEIGHT_PX = 64`, `top = (minutes - GRID_START_HOUR*60) * 64/60`.
3. Clic sur un slot libre → `AppointmentModal` mode `create` (sélecteur patient + notes).
4. Clic sur un RDV existant → `AppointmentModal` mode `view` (actions confirm / cancel / complete).
5. `AvailabilityEditor` (sidebar) gère les règles récurrentes et le toggle `auto_confirm`.

### Côté patient (mobile)

1. `AppointmentsScreen` liste les RDV à venir et passés via `fetchPatientAppointments`.
2. Bouton "Prendre un RDV" → `BookAppointmentScreen` avec `practitionerId`.
3. `BookAppointmentScreen` : grille mois maison → sélection date → liste de créneaux calculés localement par `computeAvailableSlots`.
4. Tap sur un créneau → `bookAppointment` → bannière de succès.

## Calcul des créneaux (pure function)

`computeAvailableSlots(rules, exceptions, bookedSlots, date): ComputedSlot[]`

- Trouve la règle du `day_of_week`.
- Applique l'exception si elle existe (`is_closed` → `[]`, horaire alternatif → override).
- Génère les slots par incréments de `slot_duration_minutes`.
- Croise avec `bookedSlots` (statuts `pending` + `confirmed` bloquent le créneau).

Identique côté web (`apps/web/src/services/appointmentService.ts`) et mobile (`apps/mobile/src/services/appointmentService.ts`).

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `supabase/schema.sql` | DDL : 3 nouvelles tables, colonne `auto_confirm_appointments`, RLS |
| `apps/web/src/lib/calendar.types.ts` | Types TypeScript partagés côté web |
| `apps/web/src/services/appointmentService.ts` | Service web (CRUD + `computeAvailableSlots`) |
| `apps/web/src/services/appointmentService.test.ts` | 28 tests vitest |
| `apps/web/src/components/WeekGrid/` | Grille semaine pixel (sans librairie externe) |
| `apps/web/src/components/AvailabilityEditor/` | Éditeur de règles + toggle auto-confirm |
| `apps/web/src/components/AppointmentModal/` | Modal création / visualisation RDV |
| `apps/web/src/pages/AgendaPage.tsx` | Page principale praticien |
| `apps/mobile/src/services/appointmentService.ts` | Service mobile (CRUD + `computeAvailableSlots`) |
| `apps/mobile/src/services/appointmentService.test.ts` | 11 tests jest |
| `apps/mobile/src/screens/AppointmentsScreen.tsx` | Liste RDV patient |
| `apps/mobile/src/screens/BookAppointmentScreen.tsx` | Calendrier mois + réservation |

## RLS (Row Level Security)

| Table | Praticien | Patient |
|---|---|---|
| `availability_rules` | ALL (own rows) | SELECT (son praticien) |
| `availability_exceptions` | ALL (own rows) | SELECT (son praticien) |
| `appointments` | ALL (own rows) | SELECT (ses RDV + son praticien) / INSERT (chez son praticien) |

## Conformité MDR 2017/745

Le calendrier est purement organisationnel — aucune logique clinique, aucun seuil, aucune interprétation. Les RDV sont des créneaux horaires neutres.
