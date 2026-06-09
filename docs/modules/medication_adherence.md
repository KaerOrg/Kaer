# Module Observance Médicamenteuse (`medication_adherence`)

## Objectif clinique

Permettre au patient de déclarer quotidiennement s'il a pris son traitement, à deux
niveaux : un **check global du jour** (rapide) et un **détail optionnel par molécule**.
Il peut renseigner la **liste de ses médicaments** (traitement de fond + si besoin), un
**motif de non-prise**, consulter un **calendrier mensuel** de son suivi et une **série
de jours renseignés**. Ces données brutes alimentent le dialogue thérapeutique en
consultation.

**Base de preuves :** l'auto-monitoring de l'observance est recommandé comme outil
d'alliance thérapeutique (NICE CG178, grade B). La granularité par médicament et la
distinction du motif de non-prise (intentionnel vs non-intentionnel) sont les leviers
identifiés dans la littérature mHealth (Kassianos 2017 ; Steinkamp 2019). La
restitution visuelle (calendrier) soutient l'auto-conscience et la relation
patient-praticien (Hamlin 2023).

---

## Conformité MDR 2017/745

Carnet de bord numérique — **pas un dispositif médical**. Le code affiche, jamais il ne conclut.

| Règle | Application |
|---|---|
| Aucun taux d'observance | Ni pourcentage, ni « observance cible », ni seuil |
| Aucune alerte conditionnelle aux données | Le rappel est un horaire fixe (`notification_routines`), jamais déclenché par un statut |
| Aucune tendance interprétée | Le calendrier = pastilles **neutres** par jour (couleur du statut déclaré), jamais de flèche / dégradation |
| Série = « jours renseignés » | Valorise l'acte de tenir le carnet, **pas** la prise ; un oubli renseigné ne casse pas la série |
| Motifs = faits déclarés bruts | Aucune interprétation du motif par le code |

---

## Fonctionnement (patient) — 3 onglets

### Aujourd'hui
- **Check global** : 3 statuts (Pris / Partiellement / Non pris) — pastilles neutres pilotées par la base.
- **Motif** (chips) affiché dès que le statut n'est pas « Pris » : Oubli · Effet indésirable · Je me sentais mieux · Plus de stock · Autre. Le motif « Effet indésirable » propose un **pont** vers le module `medication_side_effects`.
- **Détail par molécule** (repliable, optionnel) : pour chaque médicament de la liste, un statut compact.
- **Notes** libres.

### Calendrier
- Calendrier mensuel passif : une pastille par jour renseigné, colorée par le statut déclaré.
- **Série de jours renseignés** (flamme) — gamification légère MDR-safe.

### Mes médicaments
- Liste co-éditée **patient ↔ praticien** (le praticien l'édite aussi depuis l'app web).
- Chaque molécule : nom + posologie + type (**traitement de fond** / **si besoin**).

---

## Architecture technique

### Stockage

| Donnée | Emplacement |
|---|---|
| Statut global du jour | SQLite `daily_entries` (UPSERT par `(module_id, date)`) — colonne `reason` ajoutée |
| Détail par molécule | SQLite `medication_intakes` (UPSERT par `(module_id, date, medication_id)`) |
| Liste des médicaments | `patient_modules.config.medications` (jsonb) — co-éditée patient/praticien, en ligne |

Les écritures patient (`daily_entries`, `medication_intakes`) passent par les services
+ `syncUpsert`/`syncDelete` (outbox → `patient_entries`). EntryKinds : `daily_entry`,
`medication_intake`.

### Rendu — `preview_kind = 'medication_tracker'`

| Côté | Fichier |
|---|---|
| Mobile (patient) | `apps/mobile/.../layouts/MedicationTracker/` (orchestrateur + `TodayTab`, `CalendarTab`, `MedicationsTab`, `StreakBadge`, `MedicationEditorModal`, `streakUtils`) |
| Web (aperçu praticien) | `apps/web/.../layouts/MedicationTrackerLayout/` — aperçu **interactif** à 3 volets (`PreviewTodayPanel`, `PreviewCalendarPanel`, `PreviewMedsPanel`) reproduisant fidèlement l'écran patient, onglets cliquables. Passif (aucune saisie). |
| Web (éditeur liste) | `apps/web/.../PatientPage/tabs/MedicationAdherenceCard.tsx` + `MedicationAddForm.tsx` + hook `useMedicationListEditor` |
| Calendrier réutilisé | `ui/Chart/TimeRangeCharts/MonthCalendar` (prop générique `dayMarkers`) |

### Services

| Service | Rôle |
|---|---|
| `apps/mobile/.../services/medicationIntakeService.ts` | CRUD détail par molécule + sync |
| `apps/mobile/.../services/medicationListService.ts` | Lecture/écriture liste molécules (config) |
| `apps/web/.../services/moduleAssignmentService.ts` | `fetchMedications` / `updateMedications` (praticien) |

### Config DB-driven

`module_content_fields` : `medication_tracker_config` (libellés) + `daily_status_option`
(statuts) + `medication_reason_option` (motifs ; `links_module` = `medication_side_effects`
pour le pont). Détail des props : `supabase/seed.sql` (bloc medication_adherence).

### Rappel

Horaire fixe via `notification_routines` (programmé par le praticien depuis la carte de
l'armoire, ajustable/suspendable par le patient). **Jamais** conditionnel aux données.

---

## Lancer les tests

```bash
cd apps/mobile && npx jest MedicationTrackerLayout streakUtils medicationIntakeService medicationListService
cd apps/web    && npx vitest run useMedicationListEditor moduleAssignmentService
```
