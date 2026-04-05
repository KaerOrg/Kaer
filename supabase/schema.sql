-- ============================================================
-- PSYTOOL — Schéma de base de données PostgreSQL / Supabase
--
-- Instructions :
--   1. Créer un projet Supabase (supabase.com)
--   2. Aller dans Dashboard > SQL Editor
--   3. Coller et exécuter ce fichier en entier
--
-- Ce script est idempotent : peut être relancé sans erreur.
-- ============================================================


-- ============================================================
-- TABLES
-- ============================================================

-- 1. Profils des praticiens (créé automatiquement à l'inscription)
create table if not exists public.practitioners (
  id               uuid        primary key references auth.users(id) on delete cascade,
  email            text        not null,
  name             text        not null default '',
  professional_title text,
  created_at       timestamptz not null default now()
);

-- 2. Profils des patients (créé automatiquement à l'inscription)
create table if not exists public.patients (
  id               uuid        primary key references auth.users(id) on delete cascade,
  email            text        not null,
  created_at       timestamptz not null default now()
);

-- 3. Relation praticien ↔ patient
create table if not exists public.practitioner_patients (
  id               uuid        primary key default gen_random_uuid(),
  practitioner_id  uuid        not null references public.practitioners(id) on delete cascade,
  patient_id       uuid        not null references public.patients(id) on delete cascade,
  patient_alias    text,
  created_at       timestamptz not null default now(),
  unique(practitioner_id, patient_id)
);

-- 4. Invitations envoyées par le praticien
--    Un patient ne peut pas s'inscrire sans invitation.
create table if not exists public.invitations (
  id               uuid        primary key default gen_random_uuid(),
  practitioner_id  uuid        not null references public.practitioners(id) on delete cascade,
  patient_email    text        not null,
  token            text        not null unique,
  expires_at       timestamptz not null,
  accepted_at      timestamptz,
  created_at       timestamptz not null default now()
);

-- 5. Modules thérapeutiques débloqués par le praticien pour un patient
--    module_type : 'sleep_diary' | 'beck_columns' | 'fear_thermometer' |
--                  'emotion_wheel' | 'crisis_plan' | 'rim' | 'cognitive_saturation'
create table if not exists public.patient_modules (
  id               uuid        primary key default gen_random_uuid(),
  patient_id       uuid        not null references public.patients(id) on delete cascade,
  practitioner_id  uuid        not null references public.practitioners(id) on delete cascade,
  module_type      text        not null,
  config           jsonb       not null default '{}',
  unlocked_at      timestamptz not null default now(),
  revoked_at       timestamptz,                        -- null = actif
  unique(patient_id, module_type)
);


-- ============================================================
-- INDEX
-- ============================================================

create index if not exists idx_practitioner_patients_practitioner
  on public.practitioner_patients(practitioner_id);

create index if not exists idx_practitioner_patients_patient
  on public.practitioner_patients(patient_id);

create index if not exists idx_invitations_token
  on public.invitations(token);

create index if not exists idx_invitations_practitioner
  on public.invitations(practitioner_id);

create index if not exists idx_patient_modules_patient
  on public.patient_modules(patient_id);

create index if not exists idx_patient_modules_practitioner
  on public.patient_modules(practitioner_id);


-- ============================================================
-- TRIGGERS — Création automatique de profil après inscription
-- ============================================================

-- Fonction générique appelée après chaque nouvel utilisateur auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text;
  v_invitation public.invitations%rowtype;
begin
  -- Le rôle est transmis dans raw_user_meta_data lors de l'inscription
  v_role := new.raw_user_meta_data ->> 'role';

  if v_role = 'practitioner' then
    insert into public.practitioners (id, email, name, professional_title)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'name', ''),
      new.raw_user_meta_data ->> 'professional_title'
    )
    on conflict (id) do nothing;

  elsif v_role = 'patient' then
    insert into public.patients (id, email)
    values (new.id, new.email)
    on conflict (id) do nothing;

    -- Marquer l'invitation comme acceptée et créer la relation praticien-patient
    update public.invitations
    set accepted_at = now()
    where token = (new.raw_user_meta_data ->> 'invitation_token')
      and accepted_at is null
      and expires_at > now()
    returning * into v_invitation;

    if v_invitation.id is not null then
      insert into public.practitioner_patients (practitioner_id, patient_id)
      values (v_invitation.practitioner_id, new.id)
      on conflict do nothing;
    end if;

  end if;

  return new;
end;
$$;

-- Attacher le trigger à auth.users (une seule fois)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.practitioners       enable row level security;
alter table public.patients            enable row level security;
alter table public.practitioner_patients enable row level security;
alter table public.invitations         enable row level security;
alter table public.patient_modules     enable row level security;

-- Praticien : accès total à son propre profil
drop policy if exists "practitioners_own" on public.practitioners;
create policy "practitioners_own" on public.practitioners
  for all using (auth.uid() = id);

-- Patient : accès total à son propre profil
drop policy if exists "patients_own" on public.patients;
create policy "patients_own" on public.patients
  for all using (auth.uid() = id);

-- Praticien voit et gère les patients qui lui sont liés
drop policy if exists "ptp_practitioner" on public.practitioner_patients;
create policy "ptp_practitioner" on public.practitioner_patients
  for all using (auth.uid() = practitioner_id);

-- Patient voit sa propre relation (pour connaître son praticien)
drop policy if exists "ptp_patient" on public.practitioner_patients;
create policy "ptp_patient" on public.practitioner_patients
  for select using (auth.uid() = patient_id);

-- Praticien gère ses propres invitations
drop policy if exists "invitations_practitioner" on public.invitations;
create policy "invitations_practitioner" on public.invitations
  for all using (auth.uid() = practitioner_id);

-- Tout utilisateur peut lire une invitation par token (pour valider le lien)
drop policy if exists "invitations_by_token" on public.invitations;
create policy "invitations_by_token" on public.invitations
  for select using (true);

-- Praticien gère les modules de ses patients
drop policy if exists "modules_practitioner" on public.patient_modules;
create policy "modules_practitioner" on public.patient_modules
  for all using (auth.uid() = practitioner_id);

-- Patient lit ses propres modules actifs (non révoqués)
drop policy if exists "modules_patient" on public.patient_modules;
create policy "modules_patient" on public.patient_modules
  for select using (auth.uid() = patient_id and revoked_at is null);
