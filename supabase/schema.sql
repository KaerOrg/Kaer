-- ============================================================
-- PSYTOOL — Schéma de base de données
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Profils des praticiens
create table if not exists public.practitioners (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text not null,
  professional_title text,
  created_at timestamptz default now() not null
);

-- 2. Profils des patients
create table if not exists public.patients (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  created_at timestamptz default now() not null
);

-- 3. Relation praticien ↔ patient
create table if not exists public.practitioner_patients (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid references public.practitioners(id) on delete cascade not null,
  patient_id uuid references public.patients(id) on delete cascade not null,
  patient_alias text,
  created_at timestamptz default now() not null,
  unique(practitioner_id, patient_id)
);

-- 4. Invitations (lien envoyé au patient)
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid references public.practitioners(id) on delete cascade not null,
  patient_email text not null,
  token text unique not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz default now() not null
);

-- 5. Modules débloqués par patient
create table if not exists public.patient_modules (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade not null,
  practitioner_id uuid references public.practitioners(id) on delete cascade not null,
  module_type text not null,
  config jsonb default '{}' not null,
  unlocked_at timestamptz default now() not null,
  unique(patient_id, module_type)
);

-- ============================================================
-- SÉCURITÉ : Row Level Security (RLS)
-- Chaque utilisateur ne voit que ses propres données
-- ============================================================

alter table public.practitioners enable row level security;
alter table public.patients enable row level security;
alter table public.practitioner_patients enable row level security;
alter table public.invitations enable row level security;
alter table public.patient_modules enable row level security;

-- Praticiens : lecture/écriture de son propre profil
create policy "practitioners_own" on public.practitioners
  for all using (auth.uid() = id);

-- Patients : lecture/écriture de son propre profil
create policy "patients_own" on public.patients
  for all using (auth.uid() = id);

-- Praticien voit ses relations patients
create policy "practitioner_patients_practitioner" on public.practitioner_patients
  for all using (auth.uid() = practitioner_id);

-- Patient voit ses propres relations
create policy "practitioner_patients_patient" on public.practitioner_patients
  for select using (auth.uid() = patient_id);

-- Invitations : praticien voit/crée les siennes
create policy "invitations_practitioner" on public.invitations
  for all using (auth.uid() = practitioner_id);

-- Invitation : accessible au patient via token (lors de l'inscription)
create policy "invitations_by_token" on public.invitations
  for select using (true);

-- Modules : praticien gère les modules de ses patients
create policy "patient_modules_practitioner" on public.patient_modules
  for all using (auth.uid() = practitioner_id);

-- Modules : patient lit ses propres modules
create policy "patient_modules_patient" on public.patient_modules
  for select using (auth.uid() = patient_id);
