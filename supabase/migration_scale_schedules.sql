-- Migration : Programmation des auto-questionnaires (K-6, #236)
-- Idempotent, ré-exécutable. Répercuté dans supabase/schema.sql (source de vérité).
--
-- MDR 2017/745 : le praticien choisit la cadence ; l'app ne suggère jamais de fréquence
-- et ne déclenche jamais de relance à partir d'un score. Carnet de bord, pas d'interprétation.

create table if not exists public.scale_schedules (
  id               uuid        primary key default gen_random_uuid(),
  patient_id       uuid        not null references public.patients(id) on delete cascade,
  practitioner_id  uuid        not null references public.practitioners(id) on delete cascade,
  module_id        text        not null,
  mode             text        not null default 'home'
                     check (mode in ('home', 'in_session')),
  frequency        text        not null
                     check (frequency in ('weekly', 'biweekly', 'monthly', 'quarterly', 'on_demand')),
  day_of_week      smallint    check (day_of_week between 1 and 7),
  time_of_day      text,
  ends_on          date,
  patient_reminder boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (patient_id, module_id)
);

create index if not exists idx_scale_schedules_patient
  on public.scale_schedules(patient_id);
create index if not exists idx_scale_schedules_practitioner
  on public.scale_schedules(practitioner_id);

alter table public.scale_schedules enable row level security;

drop policy if exists "scale_schedules_practitioner_select" on public.scale_schedules;
create policy "scale_schedules_practitioner_select"
  on public.scale_schedules for select
  using (auth.uid() = practitioner_id);

drop policy if exists "scale_schedules_practitioner_insert" on public.scale_schedules;
create policy "scale_schedules_practitioner_insert"
  on public.scale_schedules for insert
  with check (auth.uid() = practitioner_id);

drop policy if exists "scale_schedules_practitioner_update" on public.scale_schedules;
create policy "scale_schedules_practitioner_update"
  on public.scale_schedules for update
  using (auth.uid() = practitioner_id);

drop policy if exists "scale_schedules_practitioner_delete" on public.scale_schedules;
create policy "scale_schedules_practitioner_delete"
  on public.scale_schedules for delete
  using (auth.uid() = practitioner_id);

drop policy if exists "scale_schedules_patient_select" on public.scale_schedules;
create policy "scale_schedules_patient_select"
  on public.scale_schedules for select
  using (auth.uid() = patient_id);
