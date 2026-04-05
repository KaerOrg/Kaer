# Base de données — Référence complète

Le fichier `supabase/schema.sql` est la **source de vérité**. Ce document en est la référence lisible.

## Tables

### `practitioners` — Profils praticiens

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | uuid | PK, FK → auth.users | Identifiant Supabase Auth |
| `email` | text | NOT NULL | Email du praticien |
| `name` | text | NOT NULL, default '' | Nom d'affichage |
| `professional_title` | text | nullable | Ex: "IPA en psychiatrie" |
| `created_at` | timestamptz | default now() | Date de création |

Créé automatiquement par le trigger `handle_new_user` lors de l'inscription.

---

### `patients` — Profils patients

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | uuid | PK, FK → auth.users | Identifiant Supabase Auth |
| `email` | text | NOT NULL | Email du patient |
| `created_at` | timestamptz | default now() | Date de création |

Aucune donnée clinique. Créé automatiquement par le trigger lors de l'acceptation d'une invitation.

---

### `practitioner_patients` — Relation praticien ↔ patient

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | uuid | PK | – |
| `practitioner_id` | uuid | FK → practitioners | – |
| `patient_id` | uuid | FK → patients | – |
| `patient_alias` | text | nullable | Surnom/initiales choisis par le praticien |
| `created_at` | timestamptz | default now() | – |

Contrainte d'unicité: `(practitioner_id, patient_id)` — un patient ne peut être lié qu'une fois à un praticien donné.

---

### `invitations` — Liens d'invitation

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | uuid | PK | – |
| `practitioner_id` | uuid | FK → practitioners | Qui a créé l'invitation |
| `patient_email` | text | NOT NULL | Email destinataire |
| `token` | text | NOT NULL, UNIQUE | UUID envoyé dans le lien |
| `expires_at` | timestamptz | NOT NULL | `now() + 48h` à la création |
| `accepted_at` | timestamptz | nullable | NULL = en attente, timestamp = acceptée |
| `created_at` | timestamptz | default now() | – |

**Règle**: un token expiré (`expires_at < now()`) ou déjà accepté (`accepted_at IS NOT NULL`) ne peut pas être utilisé.

---

### `patient_modules` — Modules débloqués

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | uuid | PK | – |
| `patient_id` | uuid | FK → patients | – |
| `practitioner_id` | uuid | FK → practitioners | Qui a débloqué |
| `module_type` | text | NOT NULL | Clé du module (voir liste) |
| `config` | jsonb | default '{}' | Configuration JSON du module |
| `unlocked_at` | timestamptz | default now() | Date de débloquage |
| `revoked_at` | timestamptz | nullable | NULL = actif, timestamp = révoqué |

Contrainte d'unicité: `(patient_id, module_type)` — un module ne peut être débloqué qu'une fois par patient.

**Types de modules disponibles** (`module_type`):
- `sleep_diary` — Agenda du sommeil (MVP)
- `beck_columns` — Colonnes de Beck
- `fear_thermometer` — Thermomètre de la peur
- `emotion_wheel` — Roue des émotions
- `crisis_plan` — Plan de crise
- `rim` — RIM (imagerie mentale)
- `cognitive_saturation` — Saturation cognitive

---

## Trigger: création automatique de profil

```sql
handle_new_user() — s'exécute AFTER INSERT ON auth.users
```

**Si `role = 'practitioner'`** :
- Insère dans `practitioners` avec email, name, professional_title depuis les métadonnées

**Si `role = 'patient'`** :
- Insère dans `patients` avec email
- Récupère l'invitation correspondant à cet email
- Marque l'invitation `accepted_at = now()`
- Crée la relation dans `practitioner_patients`

Les métadonnées sont passées lors de l'inscription via `supabase.auth.signUp({ options: { data: { role, name, ... } } })`.

---

## Index

| Table | Colonne(s) | Usage |
|-------|-----------|-------|
| practitioner_patients | practitioner_id | Charger les patients d'un praticien |
| practitioner_patients | patient_id | Trouver le praticien d'un patient |
| invitations | token | Valider un token d'invitation |
| invitations | practitioner_id | Lister les invitations d'un praticien |
| patient_modules | patient_id | Charger les modules d'un patient |
| patient_modules | practitioner_id | Lister les modules accordés par un praticien |

---

## Row Level Security (RLS)

RLS est activée sur toutes les tables. Les policies sont définies dans `supabase/schema.sql`.

### practitioners
| Policy | Opérations | Condition |
|--------|-----------|-----------|
| practitioners_own | SELECT, UPDATE | `id = auth.uid()` |

### patients
| Policy | Opérations | Condition |
|--------|-----------|-----------|
| patients_own | SELECT, UPDATE | `id = auth.uid()` |

### practitioner_patients
| Policy | Opérations | Condition |
|--------|-----------|-----------|
| ptp_practitioner | SELECT, INSERT, DELETE | `practitioner_id = auth.uid()` |
| ptp_patient | SELECT | `patient_id = auth.uid()` |

### invitations
| Policy | Opérations | Condition |
|--------|-----------|-----------|
| invitations_practitioner | SELECT, INSERT, DELETE | `practitioner_id = auth.uid()` |
| invitations_by_token | SELECT | Lecture publique par token (pour validation) |

### patient_modules
| Policy | Opérations | Condition |
|--------|-----------|-----------|
| modules_practitioner | SELECT, INSERT, DELETE | `practitioner_id = auth.uid()` |
| modules_patient | SELECT | `patient_id = auth.uid()` ET `revoked_at IS NULL` |

---

## Appliquer le schéma

Via le MCP Supabase ou via l'interface Supabase:

```bash
# Dans le SQL Editor de Supabase, coller le contenu de:
supabase/schema.sql
```

Le schéma est **idempotent** (`CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, etc.) — il peut être re-exécuté sans erreur.
