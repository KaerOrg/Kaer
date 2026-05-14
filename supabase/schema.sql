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
  id                  uuid        primary key references auth.users(id) on delete cascade,
  email               text        not null,
  name                text        not null default '',
  professional_title  text,
  language_preference text        not null default 'fr',
  created_at          timestamptz not null default now()
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
-- TABLE : module_categories (Organisation des modules en catégories)
-- ============================================================
-- Données de référence statiques : ordonnancement et groupement des module_type.

create table if not exists public.module_categories (
  id          text  primary key,
  sort_order  int   not null
);

-- Migration idempotente : supprimer colonnes dépréciées (anciennes BDD)
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
