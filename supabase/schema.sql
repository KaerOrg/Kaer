-- ============================================================
-- PSYTOOL — Schéma de base de données PostgreSQL / Supabase
--
-- Ce fichier contient UNIQUEMENT la structure (DDL) :
--   tables, colonnes, index, contraintes, fonctions, triggers,
--   Row Level Security, policies, bucket de stockage.
--
-- Pour les données de référence (modules, contenus, props, layouts) :
--   voir `supabase/seed.sql` — à exécuter APRÈS schema.sql.
--
-- Instructions :
--   1. Créer un projet Supabase (supabase.com)
--   2. Aller dans Dashboard > SQL Editor
--   3. Exécuter ce fichier en entier
--   4. Exécuter ensuite `seed.sql` en entier
--
-- Ce script est idempotent : peut être relancé sans erreur,
-- à n'importe quel stade (BDD vierge, partielle ou à jour).
-- ============================================================


-- ============================================================
-- TABLE : professional_titles (Référentiel des professions praticiens)
-- ============================================================
-- Données de référence publiques — accessibles sans authentification.
create table if not exists public.professional_titles (
  code        text    primary key,
  label_fr    text    not null,
  label_en    text    not null,
  sort_order  integer not null default 0
);

alter table public.professional_titles enable row level security;

drop policy if exists "professional_titles_select_all" on public.professional_titles;
create policy "professional_titles_select_all"
  on public.professional_titles for select using (true);

insert into public.professional_titles (code, label_fr, label_en, sort_order) values
  ('ide',                'Infirmier diplômé d''État (IDE)',         'Registered Nurse (RN)',      1),
  ('ipa',                'Infirmier en pratique avancée (IPA)',     'Advanced Practice Nurse',    2),
  ('psychiatrist',       'Psychiatre',                              'Psychiatrist',               3),
  ('child_psychiatrist', 'Pédopsychiatre',                          'Child Psychiatrist',         4),
  ('addictologist',      'Addictologue',                            'Addictologist',              5),
  ('gp',                 'Médecin généraliste',                     'General Practitioner',       6),
  ('psychologist',       'Psychologue',                             'Psychologist',               7)
on conflict (code) do nothing;


-- ============================================================
-- TABLES — Domaine utilisateurs / patients / praticiens
-- ============================================================

-- 1. Profils des praticiens (créé automatiquement à l'inscription)
create table if not exists public.practitioners (
  id                      uuid        primary key references auth.users(id) on delete cascade,
  email                   text        not null,
  name                    text        not null default '',
  professional_title      text,
  language_preference     text        not null default 'fr',
  address                 text,
  phone                   text,
  avatar_url              text,
  mfa_reminder_dismissed  boolean     not null default false,
  created_at              timestamptz not null default now()
);

-- 2. Profils des patients (créé automatiquement à l'inscription)
create table if not exists public.patients (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text        not null,
  first_name  text        not null default '',
  last_name   text        not null default '',
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- 3. Relation praticien ↔ patient
create table if not exists public.practitioner_patients (
  id                  uuid        primary key default gen_random_uuid(),
  practitioner_id     uuid        not null references public.practitioners(id) on delete cascade,
  patient_id          uuid        not null references public.patients(id) on delete cascade,
  patient_alias       text,
  patient_first_name  text,
  patient_last_name   text,
  patient_birth_date  date,
  patient_sex         text,
  teen_mode           boolean     not null default false,
  general_note        text,
  created_at          timestamptz not null default now(),
  unique(practitioner_id, patient_id)
);

-- 4. Invitations envoyées par le praticien
--    Un patient ne peut pas s'inscrire sans invitation.
create table if not exists public.invitations (
  id                    uuid        primary key default gen_random_uuid(),
  practitioner_id       uuid        not null references public.practitioners(id) on delete cascade,
  patient_email         text        not null,
  patient_first_name    text,
  patient_last_name     text,
  patient_birth_date    date,
  patient_sex           text,
  teen_mode             boolean     not null default false,
  pre_selected_modules  text[]      not null default '{}',
  token                 text        not null unique,
  expires_at            timestamptz not null,
  accepted_at           timestamptz,
  created_at            timestamptz not null default now()
);

-- 5. Modules thérapeutiques débloqués par le praticien pour un patient
create table if not exists public.patient_modules (
  id               uuid        primary key default gen_random_uuid(),
  patient_id       uuid        not null references public.patients(id) on delete cascade,
  practitioner_id  uuid        not null references public.practitioners(id) on delete cascade,
  module_type      text        not null,
  config           jsonb       not null default '{}',
  unlocked_at      timestamptz not null default now(),
  revoked_at       timestamptz,
  unique(patient_id, module_type)
);


-- ============================================================
-- MIGRATIONS IDEMPOTENTES — colonnes ajoutées sur tables existantes
-- (no-op sur BDD vierge, applique le delta sur ancienne BDD)
-- ============================================================

-- practitioner_patients.general_note
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'practitioner_patients' and column_name = 'general_note'
  ) then
    alter table public.practitioner_patients add column general_note text;
  end if;
end $$;

-- practitioner_patients.teen_mode
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'practitioner_patients' and column_name = 'teen_mode'
  ) then
    alter table public.practitioner_patients add column teen_mode boolean not null default false;
  end if;
end $$;

-- practitioners.language_preference
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'practitioners' and column_name = 'language_preference'
  ) then
    alter table public.practitioners add column language_preference text not null default 'fr';
  end if;
end $$;

-- practitioners.mfa_reminder_dismissed (rappel d'activation MFA masqué par le praticien)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'practitioners' and column_name = 'mfa_reminder_dismissed'
  ) then
    alter table public.practitioners add column mfa_reminder_dismissed boolean not null default false;
  end if;
end $$;

-- practitioners.address
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'practitioners' and column_name = 'address'
  ) then
    alter table public.practitioners add column address text;
  end if;
end $$;

-- practitioners.phone
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'practitioners' and column_name = 'phone'
  ) then
    alter table public.practitioners add column phone text;
  end if;
end $$;

-- practitioners.avatar_url
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'practitioners' and column_name = 'avatar_url'
  ) then
    alter table public.practitioners add column avatar_url text;
  end if;
end $$;

-- invitations : démographie patient + teen_mode
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'invitations' and column_name = 'patient_first_name'
  ) then
    alter table public.invitations
      add column patient_first_name text,
      add column patient_last_name  text,
      add column patient_birth_date date,
      add column patient_sex        text,
      add column teen_mode          boolean not null default false;
  end if;
end $$;

-- practitioner_patients : démographie patient
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'practitioner_patients' and column_name = 'patient_first_name'
  ) then
    alter table public.practitioner_patients
      add column patient_first_name text,
      add column patient_last_name  text,
      add column patient_birth_date date,
      add column patient_sex        text;
  end if;
end $$;

-- invitations.pre_selected_modules
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'invitations' and column_name = 'pre_selected_modules'
  ) then
    alter table public.invitations add column pre_selected_modules text[] not null default '{}';
  end if;
end $$;


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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role       text;
  v_invitation public.invitations%rowtype;
  v_module     text;
begin
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
    insert into public.patients (id, email, first_name, last_name)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'first_name', ''),
      coalesce(new.raw_user_meta_data ->> 'last_name', '')
    )
    on conflict (id) do nothing;

    update public.invitations
    set accepted_at = now()
    where token = (new.raw_user_meta_data ->> 'invitation_token')
      and accepted_at is null
      and expires_at > now()
    returning * into v_invitation;

    if v_invitation.id is not null then
      insert into public.practitioner_patients (
        practitioner_id, patient_id,
        patient_first_name, patient_last_name, patient_birth_date, patient_sex, teen_mode
      )
      values (
        v_invitation.practitioner_id, new.id,
        v_invitation.patient_first_name, v_invitation.patient_last_name,
        v_invitation.patient_birth_date, v_invitation.patient_sex,
        v_invitation.teen_mode
      )
      on conflict do nothing;

      if cardinality(v_invitation.pre_selected_modules) > 0 then
        foreach v_module in array v_invitation.pre_selected_modules
        loop
          insert into public.patient_modules (patient_id, practitioner_id, module_type, config)
          values (new.id, v_invitation.practitioner_id, v_module, '{}')
          on conflict (patient_id, module_type) do nothing;
        end loop;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- ROW LEVEL SECURITY — tables principales
-- ============================================================

alter table public.practitioners         enable row level security;
alter table public.patients              enable row level security;
alter table public.practitioner_patients enable row level security;
alter table public.invitations           enable row level security;
alter table public.patient_modules       enable row level security;

drop policy if exists "practitioners_own" on public.practitioners;
create policy "practitioners_own" on public.practitioners
  for all using (auth.uid() = id);

drop policy if exists "patients_own" on public.patients;
create policy "patients_own" on public.patients
  for all using (auth.uid() = id);

drop policy if exists "patients_read_by_practitioner" on public.patients;
create policy "patients_read_by_practitioner" on public.patients
  for select using (
    exists (
      select 1 from public.practitioner_patients
      where practitioner_patients.patient_id = patients.id
        and practitioner_patients.practitioner_id = auth.uid()
    )
  );

drop policy if exists "ptp_practitioner" on public.practitioner_patients;
create policy "ptp_practitioner" on public.practitioner_patients
  for all using (auth.uid() = practitioner_id);

drop policy if exists "ptp_patient" on public.practitioner_patients;
create policy "ptp_patient" on public.practitioner_patients
  for select using (auth.uid() = patient_id);

drop policy if exists "invitations_practitioner" on public.invitations;
create policy "invitations_practitioner" on public.invitations
  for all using (auth.uid() = practitioner_id);

drop policy if exists "invitations_by_token" on public.invitations;
create policy "invitations_by_token" on public.invitations
  for select using (true);

drop policy if exists "modules_practitioner" on public.patient_modules;
create policy "modules_practitioner" on public.patient_modules
  for all using (auth.uid() = practitioner_id);

drop policy if exists "modules_patient" on public.patient_modules;
create policy "modules_patient" on public.patient_modules
  for select using (auth.uid() = patient_id and revoked_at is null);

drop policy if exists "modules_patient_update" on public.patient_modules;
create policy "modules_patient_update" on public.patient_modules
  for update using (auth.uid() = patient_id and revoked_at is null);


-- ============================================================
-- TABLE : cssrs_screen_assessments (C-SSRS — hétéro-évaluation praticien)
-- ============================================================
-- Données cliniques praticien — JAMAIS accessibles au patient.
-- ⚠️ Requiert un hébergement HDS pour usage commercial.
create table if not exists public.cssrs_screen_assessments (
  id                            uuid        primary key default gen_random_uuid(),
  patient_id                    uuid        not null references public.patients(id) on delete cascade,
  practitioner_id               uuid        not null references public.practitioners(id) on delete cascade,
  ideation_answers              jsonb       not null default '[]',
  intensite_ideation            jsonb,
  behavior_answers              jsonb       not null default '[]',
  nssi                          smallint,
  nb_tentatives_averees         smallint,
  nb_tentatives_interrompues    smallint,
  nb_tentatives_avortees        smallint,
  comportement_observe          smallint,
  suicide_reussi                smallint,
  date_tentative_plus_letale    date,
  letalite_observee             smallint,
  letalite_potentielle          smallint,
  ideation_level                smallint    not null default 0,
  behavior_count                smallint    not null default 0,
  assessed_at                   timestamptz not null default now()
);

create index if not exists idx_cssrs_patient
  on public.cssrs_screen_assessments(patient_id);

create index if not exists idx_cssrs_practitioner
  on public.cssrs_screen_assessments(practitioner_id);

alter table public.cssrs_screen_assessments enable row level security;

drop policy if exists "cssrs_practitioner" on public.cssrs_screen_assessments;
create policy "cssrs_practitioner" on public.cssrs_screen_assessments
  for all using (auth.uid() = practitioner_id);


-- ============================================================
-- STORAGE — Bucket avatars (photos de profil patients)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public" on storage.objects
  for select using (bucket_id = 'avatars');


-- ============================================================
-- TABLE : patient_engagement_logs (Observance / Engagement)
-- ============================================================
-- Suivi anonymisé de l'activité patient (aucune donnée clinique).
create table if not exists public.patient_engagement_logs (
  id          uuid        default gen_random_uuid() primary key,
  patient_id  uuid        references auth.users(id) on delete cascade,
  event_type  text        not null,
  metadata    jsonb       default '{}'::jsonb,
  created_at  timestamptz default now()
);

alter table public.patient_engagement_logs enable row level security;

drop policy if exists "Patients can insert their own logs" on public.patient_engagement_logs;
create policy "Patients can insert their own logs"
  on public.patient_engagement_logs for insert
  with check (auth.uid() = patient_id);

drop policy if exists "Practitioners can view logs of their patients" on public.patient_engagement_logs;
create policy "Practitioners can view logs of their patients"
  on public.patient_engagement_logs for select
  using (
    exists (
      select 1 from public.practitioner_patients
      where practitioner_id = auth.uid()
        and patient_id = public.patient_engagement_logs.patient_id
    )
  );


-- ============================================================
-- TABLES : crisis_plan_configs + crisis_plan_coping_cards
-- ============================================================
-- Config praticien pour le plan de crise (VHB-EF).
-- Remplace le JSON dans patient_modules.config.crisisPlan.

create table if not exists public.crisis_plan_configs (
  patient_id        uuid primary key references public.patients(id) on delete cascade,
  practitioner_message text not null default '',
  commitment_phrase text not null default '',
  updated_at        timestamptz not null default now()
);

create table if not exists public.crisis_plan_coping_cards (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  thought    text not null default '',
  response   text not null default '',
  sort_order integer not null default 0
);

alter table public.crisis_plan_configs enable row level security;
alter table public.crisis_plan_coping_cards enable row level security;

drop policy if exists "patient_read_own_crisis_config" on public.crisis_plan_configs;
create policy "patient_read_own_crisis_config"
  on public.crisis_plan_configs for select
  using (auth.uid() = patient_id);

drop policy if exists "practitioner_rw_crisis_config" on public.crisis_plan_configs;
create policy "practitioner_rw_crisis_config"
  on public.crisis_plan_configs for all
  using (auth.uid() in (
    select pp.practitioner_id from public.practitioner_patients pp
    where pp.patient_id = crisis_plan_configs.patient_id
  ));

drop policy if exists "patient_read_own_coping_cards" on public.crisis_plan_coping_cards;
create policy "patient_read_own_coping_cards"
  on public.crisis_plan_coping_cards for select
  using (auth.uid() = patient_id);

drop policy if exists "practitioner_rw_coping_cards" on public.crisis_plan_coping_cards;
create policy "practitioner_rw_coping_cards"
  on public.crisis_plan_coping_cards for all
  using (auth.uid() in (
    select pp.practitioner_id from public.practitioner_patients pp
    where pp.patient_id = crisis_plan_coping_cards.patient_id
  ));


-- ============================================================
-- TABLE : practitioner_patient_notes (Notes privées praticien)
-- ============================================================
-- Notes libres liées à un patient, visibles uniquement du praticien.
-- Aucune donnée clinique structurée — texte libre.
create table if not exists public.practitioner_patient_notes (
  id              uuid        primary key default gen_random_uuid(),
  practitioner_id uuid        not null references public.practitioners(id) on delete cascade,
  patient_id      uuid        not null references public.patients(id)      on delete cascade,
  content         text        not null,
  tags            text[]      not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Migration idempotente : ajouter tags sur BDD existante
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'practitioner_patient_notes' and column_name = 'tags'
  ) then
    alter table public.practitioner_patient_notes add column tags text[] not null default '{}';
  end if;
end $$;

create index if not exists idx_ppnotes_practitioner_patient
  on public.practitioner_patient_notes(practitioner_id, patient_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ppnotes_updated_at on public.practitioner_patient_notes;
create trigger ppnotes_updated_at
  before update on public.practitioner_patient_notes
  for each row execute procedure public.set_updated_at();

alter table public.practitioner_patient_notes enable row level security;

drop policy if exists "ppnotes_select" on public.practitioner_patient_notes;
create policy "ppnotes_select" on public.practitioner_patient_notes
  for select using (auth.uid() = practitioner_id);

drop policy if exists "ppnotes_insert" on public.practitioner_patient_notes;
create policy "ppnotes_insert" on public.practitioner_patient_notes
  for insert with check (auth.uid() = practitioner_id);

drop policy if exists "ppnotes_update" on public.practitioner_patient_notes;
create policy "ppnotes_update" on public.practitioner_patient_notes
  for update using (auth.uid() = practitioner_id);

drop policy if exists "ppnotes_delete" on public.practitioner_patient_notes;
create policy "ppnotes_delete" on public.practitioner_patient_notes
  for delete using (auth.uid() = practitioner_id);


-- ============================================================
-- TABLE : module_categories (Organisation des modules en catégories)
-- ============================================================
-- Données de référence statiques : ordonnancement et groupement des module_type.

create table if not exists public.module_categories (
  id          text  primary key,
  sort_order  int   not null,
  icon        text  not null default ''
);

-- Migration idempotente : supprimer colonnes dépréciées / ajouter nouvelles (anciennes BDD)
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='module_categories' and column_name='label_key') then
    alter table public.module_categories drop column label_key;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='module_categories' and column_name='subtitle_key') then
    alter table public.module_categories drop column subtitle_key;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='module_categories' and column_name='modules') then
    alter table public.module_categories drop column modules;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='module_categories' and column_name='icon') then
    alter table public.module_categories add column icon text not null default '';
  end if;
end $$;

alter table public.module_categories enable row level security;

drop policy if exists "module_categories_read" on public.module_categories;
create policy "module_categories_read" on public.module_categories
  for select to authenticated using (true);


-- ============================================================
-- TABLE : modules (Référentiel des modules thérapeutiques)
-- ============================================================
-- Une ligne par module. preview_kind pilote le moteur de rendu côté client.
-- is_invite_excluded : exclu de la pré-sélection à l'invitation.

create table if not exists public.modules (
  id                 text    primary key,
  category_id        text    not null references public.module_categories(id),
  preview_kind       text    not null default 'coming_soon',
  sort_order         int     not null default 0,
  is_invite_excluded boolean not null default false,
  icon               text    not null default '',
  mobile_icon        text    not null default '',
  color              text    not null default '#6366F1'
);

-- Migration idempotente : ajouter icon/mobile_icon/color (anciennes BDD)
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'modules' and column_name = 'icon') then
    alter table public.modules add column icon        text not null default '';
    alter table public.modules add column mobile_icon text not null default '';
    alter table public.modules add column color       text not null default '#6366F1';
  end if;
end $$;

alter table public.modules enable row level security;

drop policy if exists "modules_read" on public.modules;
create policy "modules_read" on public.modules
  for select to authenticated using (true);

-- FK patient_modules.module_type → modules.id
-- Ajoutée après la création de modules (modules est définie après patient_modules).
-- Indispensable pour que PostgREST détecte la relation et que le join
-- `module:modules(...)` fonctionne côté app mobile.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'patient_modules_module_type_fkey'
      and conrelid = 'public.patient_modules'::regclass
  ) then
    alter table public.patient_modules
      add constraint patient_modules_module_type_fkey
      foreign key (module_type) references public.modules(id);
  end if;
end $$;


-- ============================================================
-- TABLE : module_content_fields (Champs de contenu — 1 ligne = 1 champ)
-- ============================================================
-- field_type → composant React (22 types).
-- parent_field_id : pour les spans inline et les arbres (tree_node, column children).
-- text_code : clé i18n — NULL pour card_divider et coming_soon.

create table if not exists public.module_content_fields (
  id              text primary key,
  module_id       text not null references public.modules(id) on delete cascade,
  section_id      text,
  parent_field_id text references public.module_content_fields(id) on delete cascade,
  field_type      text not null,
  text_code       text,
  sort_order      int  not null default 0
);

alter table public.module_content_fields enable row level security;

drop policy if exists "module_content_fields_read" on public.module_content_fields;
create policy "module_content_fields_read" on public.module_content_fields
  for select to authenticated using (true);

create index if not exists idx_mcf_module   on public.module_content_fields(module_id);
create index if not exists idx_mcf_parent   on public.module_content_fields(parent_field_id);
create index if not exists idx_mcf_section  on public.module_content_fields(module_id, section_id);


-- ============================================================
-- TABLE : field_props (Propriétés des composants React)
-- ============================================================
-- PK composite (field_id, prop_key) : un seul prop_value par prop par champ.

create table if not exists public.field_props (
  field_id   text not null references public.module_content_fields(id) on delete cascade,
  prop_key   text not null,
  prop_value text not null,
  primary key (field_id, prop_key)
);

alter table public.field_props enable row level security;

drop policy if exists "field_props_read" on public.field_props;
create policy "field_props_read" on public.field_props
  for select to authenticated using (true);


-- ============================================================
-- TABLE : practitioner_module_settings (Catalogue de modules)
-- ============================================================
-- Si aucune ligne pour un praticien → tous les modules disponibles.

create table if not exists public.practitioner_module_settings (
  practitioner_id  uuid        primary key references public.practitioners(id) on delete cascade,
  enabled_modules  text[]      not null default '{}',
  updated_at       timestamptz not null default now()
);

alter table public.practitioner_module_settings enable row level security;

drop policy if exists "module_settings_own" on public.practitioner_module_settings;
create policy "module_settings_own" on public.practitioner_module_settings
  for all using (auth.uid() = practitioner_id);


-- ============================================================
-- TABLES : psyedu_topics + psyedu_blocks
-- ============================================================
-- Contenu psychoéducatif structuré (fiches des modules psyedu / mixtes).
-- Aucune donnée clinique — contenu éditorial global accessible à tout utilisateur authentifié.
-- Rendu via le layout `preview_kind = 'psyedu'` du ModuleRenderer.

create table if not exists public.psyedu_topics (
  id           uuid        primary key default gen_random_uuid(),
  module_key   text        not null,
  topic_key    text        not null,
  icon_name    text        not null,
  sort_order   int         not null default 0,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now(),

  unique (module_key, topic_key)
);

create table if not exists public.psyedu_blocks (
  id           uuid        primary key default gen_random_uuid(),
  topic_id     uuid        not null references public.psyedu_topics(id) on delete cascade,
  section_key  text        not null,
  block_type   text        not null,
  text_code    text,
  items_codes  text[],
  href         text,
  sort_order   int         not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists idx_psyedu_topics_module_key
  on public.psyedu_topics(module_key);

create index if not exists idx_psyedu_blocks_topic_id
  on public.psyedu_blocks(topic_id);

create index if not exists idx_psyedu_blocks_topic_section
  on public.psyedu_blocks(topic_id, section_key, sort_order);

alter table public.psyedu_topics enable row level security;
alter table public.psyedu_blocks  enable row level security;

-- Tout utilisateur authentifié peut lire les fiches actives
drop policy if exists "psyedu_topics_authenticated_select" on public.psyedu_topics;
create policy "psyedu_topics_authenticated_select" on public.psyedu_topics
  for select to authenticated
  using (is_active = true);

drop policy if exists "psyedu_blocks_authenticated_select" on public.psyedu_blocks;
create policy "psyedu_blocks_authenticated_select" on public.psyedu_blocks
  for select to authenticated
  using (
    exists (
      select 1 from public.psyedu_topics t
      where t.id = topic_id and t.is_active = true
    )
  );


-- ============================================================
-- TABLE : patient_push_tokens (Tokens Expo Push par device patient)
-- ============================================================
-- Un patient peut avoir plusieurs tokens (plusieurs devices).
-- L'Edge Function send-notifications utilise le service_role pour lire.

create table if not exists public.patient_push_tokens (
  id               uuid        primary key default gen_random_uuid(),
  patient_id       uuid        not null references public.patients(id) on delete cascade,
  expo_push_token  text        not null,
  platform         text        not null check (platform in ('ios', 'android')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (expo_push_token)
);

create index if not exists idx_push_tokens_patient
  on public.patient_push_tokens(patient_id);

alter table public.patient_push_tokens enable row level security;

-- Le patient ne voit et ne modifie que ses propres tokens
drop policy if exists "push_tokens_patient_select" on public.patient_push_tokens;
create policy "push_tokens_patient_select"
  on public.patient_push_tokens for select
  using (auth.uid() = patient_id);

drop policy if exists "push_tokens_patient_insert" on public.patient_push_tokens;
create policy "push_tokens_patient_insert"
  on public.patient_push_tokens for insert
  with check (auth.uid() = patient_id);

drop policy if exists "push_tokens_patient_update" on public.patient_push_tokens;
create policy "push_tokens_patient_update"
  on public.patient_push_tokens for update
  using (auth.uid() = patient_id);

drop policy if exists "push_tokens_patient_delete" on public.patient_push_tokens;
create policy "push_tokens_patient_delete"
  on public.patient_push_tokens for delete
  using (auth.uid() = patient_id);


-- ============================================================
-- TABLE : notification_routines (Calendriers de rappel par module patient)
-- ============================================================
-- Créées par le praticien, ajustables par le patient (heure + pause).
-- days_of_week : tableau ISO (1=lundi … 7=dimanche).
-- time_of_day : heure fixée par le praticien ("HH:MM").
-- patient_time_override : décalage optionnel du patient ("HH:MM").
-- practitioner_note : texte libre affiché dans le corps de la notification.

create table if not exists public.notification_routines (
  id                    uuid        primary key default gen_random_uuid(),
  patient_module_id     uuid        not null references public.patient_modules(id) on delete cascade,
  practitioner_id       uuid        not null references public.practitioners(id) on delete cascade,
  patient_id            uuid        not null references public.patients(id) on delete cascade,
  days_of_week          smallint[]  not null,
  time_of_day           text        not null,
  patient_time_override text,
  practitioner_note     text,
  is_active             boolean     not null default true,
  patient_paused        boolean     not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_notification_routines_patient
  on public.notification_routines(patient_id);

create index if not exists idx_notification_routines_practitioner
  on public.notification_routines(practitioner_id);

create index if not exists idx_notification_routines_module
  on public.notification_routines(patient_module_id);

alter table public.notification_routines enable row level security;

-- Praticien : CRUD complet sur ses propres routines
drop policy if exists "notif_routines_practitioner_select" on public.notification_routines;
create policy "notif_routines_practitioner_select"
  on public.notification_routines for select
  using (auth.uid() = practitioner_id);

drop policy if exists "notif_routines_practitioner_insert" on public.notification_routines;
create policy "notif_routines_practitioner_insert"
  on public.notification_routines for insert
  with check (auth.uid() = practitioner_id);

drop policy if exists "notif_routines_practitioner_update" on public.notification_routines;
create policy "notif_routines_practitioner_update"
  on public.notification_routines for update
  using (auth.uid() = practitioner_id);

drop policy if exists "notif_routines_practitioner_delete" on public.notification_routines;
create policy "notif_routines_practitioner_delete"
  on public.notification_routines for delete
  using (auth.uid() = practitioner_id);

-- Patient : lecture + mise à jour de ses seules colonnes (patient_paused, patient_time_override)
drop policy if exists "notif_routines_patient_select" on public.notification_routines;
create policy "notif_routines_patient_select"
  on public.notification_routines for select
  using (auth.uid() = patient_id);

drop policy if exists "notif_routines_patient_update" on public.notification_routines;
create policy "notif_routines_patient_update"
  on public.notification_routines for update
  using (auth.uid() = patient_id)
  with check (
    auth.uid() = patient_id
    -- Seules les colonnes patient sont modifiables côté patient :
    -- is_active, days_of_week, time_of_day, practitioner_id ne sont pas vérifiées ici
    -- car RLS s'applique à la ligne entière — l'application n'envoie que ces deux colonnes.
  );


-- ============================================================
-- TABLE : notification_logs (Historique des envois — audit)
-- ============================================================
-- Remplie uniquement par l'Edge Function (service_role).
-- Aucun accès client direct.

create table if not exists public.notification_logs (
  id          uuid        primary key default gen_random_uuid(),
  routine_id  uuid        references public.notification_routines(id) on delete set null,
  patient_id  uuid        references public.patients(id) on delete cascade,
  sent_at     timestamptz not null default now(),
  status      text        not null default 'sent'
);

create index if not exists idx_notification_logs_routine
  on public.notification_logs(routine_id);

create index if not exists idx_notification_logs_patient
  on public.notification_logs(patient_id, sent_at desc);

alter table public.notification_logs enable row level security;
-- Aucune policy client — lecture/écriture réservée au service_role (Edge Function).


-- ============================================================
-- pg_cron : déclenchement de l'Edge Function send-notifications
-- ============================================================
-- Prérequis : activer l'extension pg_cron dans Supabase Dashboard
--   > Database > Extensions > pg_cron (enable)
-- Remplacer <PROJECT_REF> par la référence du projet Supabase.
-- À exécuter une seule fois manuellement dans le SQL Editor.
--
-- select cron.schedule(
--   'send-notifications-cron',
--   '* * * * *',
--   $$
--     select net.http_post(
--       url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-notifications',
--       headers := '{"Content-Type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
--       body := '{}'::jsonb
--     ) as request_id;
--   $$


-- ============================================================
-- AGENDA / SYSTÈME DE RENDEZ-VOUS
-- ============================================================

-- Migration idempotente : auto_confirm_appointments sur practitioners
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'practitioners' and column_name = 'auto_confirm_appointments'
  ) then
    alter table public.practitioners add column auto_confirm_appointments boolean not null default true;
  end if;
end $$;

-- TABLE : availability_rules
-- Plages hebdomadaires récurrentes du praticien.
-- day_of_week : 0=Lundi … 6=Dimanche.
-- slot_duration_minutes : durée d'un rendez-vous pour cette plage.
-- buffer_minutes : temps de battement entre deux RDV consécutifs (ex. 10 min pour se préparer).
create table if not exists public.availability_rules (
  id                    uuid        primary key default gen_random_uuid(),
  practitioner_id       uuid        not null references public.practitioners(id) on delete cascade,
  day_of_week           smallint    not null check (day_of_week between 0 and 6),
  start_time            time        not null,
  end_time              time        not null,
  slot_duration_minutes smallint    not null default 50 check (slot_duration_minutes between 5 and 480),
  buffer_minutes        smallint    not null default 0 check (buffer_minutes between 0 and 120),
  created_at            timestamptz not null default now(),
  constraint chk_availability_times check (end_time > start_time)
);

alter table public.availability_rules
  add column if not exists buffer_minutes smallint not null default 0
    check (buffer_minutes between 0 and 120);

create index if not exists idx_availability_rules_practitioner
  on public.availability_rules(practitioner_id);

alter table public.availability_rules enable row level security;

drop policy if exists "availability_rules_practitioner_all" on public.availability_rules;
create policy "availability_rules_practitioner_all" on public.availability_rules
  for all using (auth.uid() = practitioner_id)
  with check (auth.uid() = practitioner_id);

-- Patients liés au praticien peuvent lire ses règles (pour calculer les créneaux disponibles)
drop policy if exists "availability_rules_patient_select" on public.availability_rules;
create policy "availability_rules_patient_select" on public.availability_rules
  for select using (
    practitioner_id in (
      select practitioner_id from public.practitioner_patients
      where patient_id = auth.uid()
    )
  );


-- TABLE : availability_exceptions
-- Exceptions ponctuelles (congés, jours fermés, horaires différents).
-- is_closed = true → fermé ce jour (start_time/end_time ignorés).
-- is_closed = false + start_time/end_time → override de l'horaire ce jour.
create table if not exists public.availability_exceptions (
  id               uuid        primary key default gen_random_uuid(),
  practitioner_id  uuid        not null references public.practitioners(id) on delete cascade,
  exception_date   date        not null,
  is_closed        boolean     not null default true,
  start_time       time,
  end_time         time,
  created_at       timestamptz not null default now(),
  unique (practitioner_id, exception_date)
);

create index if not exists idx_availability_exceptions_practitioner_date
  on public.availability_exceptions(practitioner_id, exception_date);

alter table public.availability_exceptions enable row level security;

drop policy if exists "availability_exceptions_practitioner_all" on public.availability_exceptions;
create policy "availability_exceptions_practitioner_all" on public.availability_exceptions
  for all using (auth.uid() = practitioner_id)
  with check (auth.uid() = practitioner_id);

drop policy if exists "availability_exceptions_patient_select" on public.availability_exceptions;
create policy "availability_exceptions_patient_select" on public.availability_exceptions
  for select using (
    practitioner_id in (
      select practitioner_id from public.practitioner_patients
      where patient_id = auth.uid()
    )
  );


-- TABLE : appointments
-- Rendez-vous réservés entre praticien et patient.
-- status : pending (en attente de confirmation) → confirmed / cancelled_by_* / completed
create table if not exists public.appointments (
  id               uuid        primary key default gen_random_uuid(),
  practitioner_id  uuid        not null references public.practitioners(id) on delete cascade,
  patient_id       uuid        not null references public.patients(id) on delete cascade,
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  status           text        not null default 'pending'
                               check (status in (
                                 'pending',
                                 'confirmed',
                                 'cancelled_by_patient',
                                 'cancelled_by_practitioner',
                                 'completed'
                               )),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint chk_appointment_times check (ends_at > starts_at)
);

-- FK composite : permet à PostgREST de joindre appointments → practitioner_patients
-- et garantit qu'un RDV ne peut exister que pour un patient lié au praticien.
do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'fk_appt_practitioner_patient'
      and table_name = 'appointments'
  ) then
    alter table public.appointments
      add constraint fk_appt_practitioner_patient
      foreign key (practitioner_id, patient_id)
      references public.practitioner_patients (practitioner_id, patient_id);
  end if;
end $$;

create index if not exists idx_appointments_practitioner_time
  on public.appointments(practitioner_id, starts_at);

create index if not exists idx_appointments_patient
  on public.appointments(patient_id, starts_at);

alter table public.appointments enable row level security;

-- Praticien : CRUD sur ses propres rendez-vous
drop policy if exists "appointments_practitioner_all" on public.appointments;
create policy "appointments_practitioner_all" on public.appointments
  for all using (auth.uid() = practitioner_id)
  with check (auth.uid() = practitioner_id);

-- Patient : lecture de ses propres rendez-vous + créneaux occupés du praticien (pour la réservation)
drop policy if exists "appointments_patient_select" on public.appointments;
create policy "appointments_patient_select" on public.appointments
  for select using (
    auth.uid() = patient_id
    or practitioner_id in (
      select practitioner_id from public.practitioner_patients
      where patient_id = auth.uid()
    )
  );

-- Patient : création d'un rendez-vous (status = pending ou confirmed selon auto_confirm)
drop policy if exists "appointments_patient_insert" on public.appointments;
create policy "appointments_patient_insert" on public.appointments
  for insert with check (
    auth.uid() = patient_id
    and practitioner_id in (
      select practitioner_id from public.practitioner_patients
      where patient_id = auth.uid()
    )
  );

-- Patient : annulation de ses propres rendez-vous
drop policy if exists "appointments_patient_cancel" on public.appointments;
create policy "appointments_patient_cancel" on public.appointments
  for update using (auth.uid() = patient_id)
  with check (
    auth.uid() = patient_id
    and status in ('cancelled_by_patient')
  );
-- );

-- ============================================================
-- TABLE : module_sources (Sources et recommandations par module)
-- ============================================================
-- Une ligne par source bibliographique ou recommandation officielle.
-- source_type : rct | cohort_study | meta_analysis | systematic_review | guideline | expert_opinion
-- evidence_grade : A | B | C (selon HAS/GRADE — NULL si non applicable)

create table if not exists public.module_sources (
  id             uuid        primary key default gen_random_uuid(),
  module_id      text        not null references public.modules(id) on delete cascade,
  label          text        not null,
  source_type    text        not null check (source_type in ('rct', 'cohort_study', 'meta_analysis', 'systematic_review', 'guideline', 'expert_opinion')),
  url            text,
  evidence_grade text        check (evidence_grade in ('A', 'B', 'C')),
  description    text,
  sort_order     int         not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists idx_module_sources_module_id
  on public.module_sources(module_id, sort_order);

alter table public.module_sources enable row level security;

drop policy if exists "module_sources_authenticated_select" on public.module_sources;
create policy "module_sources_authenticated_select" on public.module_sources
  for select to authenticated
  using (true);


-- ============================================================
-- TABLE : patient_entries (Données d'exercices patient — sync cloud)
-- ============================================================
-- Table générique recevant toutes les données d'exercices des patients.
-- Chaque ligne correspond à une entrée d'un module : questionnaire, journal,
-- formulaire, sélection, item de plan, etc.
--
-- Architecture outbox : le mobile écrit d'abord dans sync_outbox (SQLite),
-- puis RemoteSyncService draine vers cette table via upsert idempotent.
--
-- Consentement requis (MDR 2017/745) : le patient doit opt-in explicitement
-- avant que toute donnée ne soit envoyée. Aucune logique interprétative côté
-- serveur — le champ payload est opaque, affiché brut au praticien.
--
-- Accès :
--   • Patient  → CRUD sur ses propres lignes
--   • Praticien → SELECT uniquement sur les patients liés via practitioner_patients

create table if not exists public.patient_entries (
  id                uuid        primary key default gen_random_uuid(),
  patient_id        uuid        not null references public.patients(id) on delete cascade,
  local_id          text        not null,
  module_id         text        not null,
  entry_kind        text        not null check (entry_kind in (
    'scale_entry',
    'sleep_diary_entry',
    'form_entry',
    'daily_entry',
    'tree_selection',
    'plan_item',
    'activity_record',
    'fear_entry',
    'fear_situation',
    'exposure_hierarchy',
    'breathing_session',
    'cognitive_saturation_session',
    'crisis_anchor',
    'em_ruler',
    'em_balance_item',
    'em_value',
    'module_setting'
  )),
  payload           jsonb       not null default '{}'::jsonb,
  client_created_at timestamptz not null,
  synced_at         timestamptz not null default now(),
  constraint patient_entries_patient_local_uniq unique (patient_id, local_id)
);

-- Index pour la lecture praticien par module/type (dashboard, graphiques)
create index if not exists idx_patient_entries_patient_module
  on public.patient_entries(patient_id, module_id, entry_kind);

-- Index pour trier les entrées d'un patient par date
create index if not exists idx_patient_entries_patient_date
  on public.patient_entries(patient_id, client_created_at desc);

alter table public.patient_entries enable row level security;

-- Patient : lecture de ses propres entrées
drop policy if exists "patient_entries_patient_select" on public.patient_entries;
create policy "patient_entries_patient_select"
  on public.patient_entries for select
  using (auth.uid() = patient_id);

-- Patient : insertion de ses propres entrées
drop policy if exists "patient_entries_patient_insert" on public.patient_entries;
create policy "patient_entries_patient_insert"
  on public.patient_entries for insert
  with check (auth.uid() = patient_id);

-- Patient : mise à jour de ses propres entrées (upsert retombe ici)
drop policy if exists "patient_entries_patient_update" on public.patient_entries;
create policy "patient_entries_patient_update"
  on public.patient_entries for update
  using (auth.uid() = patient_id)
  with check (auth.uid() = patient_id);

-- Patient : suppression de ses propres entrées
drop policy if exists "patient_entries_patient_delete" on public.patient_entries;
create policy "patient_entries_patient_delete"
  on public.patient_entries for delete
  using (auth.uid() = patient_id);

-- Praticien : lecture seule sur les entrées de ses patients liés
drop policy if exists "patient_entries_practitioner_select" on public.patient_entries;
create policy "patient_entries_practitioner_select"
  on public.patient_entries for select
  using (
    exists (
      select 1 from public.practitioner_patients
      where practitioner_id = auth.uid()
        and patient_id = public.patient_entries.patient_id
    )
  );


-- ============================================================
-- TABLE : support_requests (Demandes de support praticien)
-- ============================================================
-- Formulaire BORNÉ : le praticien choisit un motif dans une liste fermée
-- (aucune saisie libre → zéro PII / contenu clinique). Écrite EXCLUSIVEMENT par
-- l'Edge Function `send-support-request` (service_role), qui dérive l'identité du
-- praticien depuis son JWT (valable même en aal1, avant le challenge MFA) et notifie
-- le support par email (Resend). Aucune policy client (lecture support via dashboard).

create table if not exists public.support_requests (
  id              uuid        primary key default gen_random_uuid(),
  practitioner_id uuid        references public.practitioners(id) on delete set null,
  email           text,
  reason          text        not null check (reason in
                    ('mfa_lost', 'password_forgotten', 'account_locked', 'other')),
  -- Description libre — uniquement pour le motif fourre-tout `other` (les autres
  -- motifs sont auto-suffisants). Limitée à 500 caractères côté client.
  description     text,
  status          text        not null default 'open',
  -- Hash SHA-256 de l'IP appelante (jamais l'IP en clair) — sert au rate-limit
  -- de l'endpoint public (demandes non authentifiées depuis l'écran de login).
  ip_hash         text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_support_requests_status
  on public.support_requests(status, created_at desc);

-- Rate-limit : compter les demandes récentes par IP.
create index if not exists idx_support_requests_ip_recent
  on public.support_requests(ip_hash, created_at desc);

alter table public.support_requests enable row level security;
-- Aucune policy client : insertion par l'Edge Function (service_role), lecture support/DPO.
