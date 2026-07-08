-- ============================================================
-- KÆR — Schéma de base de données PostgreSQL / Supabase
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
-- TABLE : app_config_meta (Version de la config — ETag applicatif)
-- ============================================================
-- Jeton de version unique de toute la config quasi-statique
-- (module_content_fields, field_props, psyedu_*, échelles, référentiels).
-- Le web praticien lit ce jeton pour savoir si sa config cachée (React Query)
-- est encore valide : tant que `config_version` ne change pas, aucune query de
-- config ne refetche ; un re-seed de contenu bump le jeton (voir seed.sql), ce
-- qui invalide le cache SANS redéploiement front — c'est ce qui préserve
-- config-first (« ajouter une échelle = INSERT en base, zéro redéploiement »).
-- Table singleton : une seule ligne, garantie par la contrainte booléenne.
create table if not exists public.app_config_meta (
  singleton      boolean     primary key default true,
  config_version text        not null default now()::text,
  updated_at     timestamptz not null default now(),
  constraint app_config_meta_singleton_chk check (singleton)
);

-- Toujours garantir la présence de l'unique ligne (idempotent).
insert into public.app_config_meta (singleton) values (true)
on conflict (singleton) do nothing;

alter table public.app_config_meta enable row level security;

-- Lecture : tout praticien authentifié. Le jeton ne révèle rien de sensible
-- (une simple string de version) mais reste réservé aux comptes connectés.
drop policy if exists "app_config_meta_select_authenticated" on public.app_config_meta;
create policy "app_config_meta_select_authenticated"
  on public.app_config_meta for select
  using (auth.uid() is not null);

-- AUCUNE policy d'écriture : le bump du jeton se fait uniquement via le seed /
-- service_role (qui bypasse la RLS). Le client ne peut jamais modifier la version.


-- ============================================================
-- FONCTION : gen_public_ref (identifiant public opaque)
-- ============================================================
-- Génère un token court URL-safe (ex. « p_8Kf3aQ ») servant d'identifiant
-- public dans les URLs praticien, à la place de la PK réelle. Ce token est
-- de la défense en profondeur (il masque la PK dans l'historique/les logs) —
-- ce n'est PAS un contrôle d'accès : la RLS reste la seule barrière.
-- 62^8 combinaisons → collision négligeable, garantie par l'index unique.
create or replace function public.gen_public_ref()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  result   text := '';
  i        int;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, 1 + floor(random() * 62)::int, 1);
  end loop;
  return 'p_' || result;
end;
$$;


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
  -- Rôle admin (gestion des utilisateurs, droits RGPD). Réservé aux praticiens —
  -- un patient n'a pas de ligne ici, donc ne peut JAMAIS être admin. La barrière
  -- d'accès reste la fonction fn_is_admin() (lue via auth.uid()), jamais le client.
  is_admin                boolean     not null default false,
  created_at              timestamptz not null default now()
);

-- 2. Profils des patients (créé automatiquement à l'inscription)
create table if not exists public.patients (
  id            uuid        primary key references auth.users(id) on delete cascade,
  email         text        not null,
  first_name    text        not null default '',
  last_name     text        not null default '',
  avatar_url    text,
  -- Consentement de partage des saisies vers le praticien (opt-out, contrôlé par le patient).
  -- Pilote la sync mobile (RemoteSyncService) ET la RLS de lecture praticien sur patient_entries.
  share_consent boolean     not null default true,
  created_at    timestamptz not null default now()
);

-- Idempotent : ajoute la colonne sur une base patients déjà existante.
alter table public.patients
  add column if not exists share_consent boolean not null default true;

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
  -- Identifiant public opaque exposé dans l'URL praticien à la place de patient_id.
  public_ref          text        not null unique default public.gen_public_ref(),
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

-- practitioners.is_admin (rôle admin — gestion des utilisateurs / droits RGPD)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'practitioners' and column_name = 'is_admin'
  ) then
    alter table public.practitioners add column is_admin boolean not null default false;
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

-- practitioner_patients.public_ref (identifiant public opaque dans l'URL)
-- Ajout + backfill des lignes existantes + contrainte not null/unique en une passe.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'practitioner_patients' and column_name = 'public_ref'
  ) then
    alter table public.practitioner_patients add column public_ref text;
    update public.practitioner_patients set public_ref = public.gen_public_ref() where public_ref is null;
    alter table public.practitioner_patients
      alter column public_ref set not null,
      alter column public_ref set default public.gen_public_ref();
    create unique index if not exists practitioner_patients_public_ref_key
      on public.practitioner_patients(public_ref);
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

-- is_admin EN LECTURE SEULE côté client. La policy ci-dessus autorise un praticien
-- à mettre à jour SA ligne (profil) — sans garde, il pourrait forger un PATCH REST
-- posant is_admin = true (escalade de privilège). Ce trigger rejette toute tentative
-- de modifier is_admin depuis un appel authentifié : auth.uid() est non-null pour le
-- client web, null pour le service_role / les migrations / le seed. Seul le serveur
-- (re)attribue donc le rôle admin. Les updates qui ne touchent pas is_admin passent.
create or replace function public.fn_guard_is_admin_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin and auth.uid() is not null then
    raise exception 'is_admin est en lecture seule (modifiable uniquement côté serveur)';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_is_admin_write on public.practitioners;
create trigger trg_guard_is_admin_write
  before update on public.practitioners
  for each row execute function public.fn_guard_is_admin_write();

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
-- TABLE : notification_events (Événements de notification)
-- ============================================================
-- Concept distinct des saisies cliniques : journal des actions du patient sur
-- ses rappels (ex. mise en pause). Alimente le flux d'activité praticien
-- (ActivityFeedPanel). Pas de donnée clinique.
create table if not exists public.notification_events (
  id          uuid        primary key default gen_random_uuid(),
  patient_id  uuid        not null references public.patients(id) on delete cascade,
  event_type  text        not null,
  metadata    jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notification_events_patient_date
  on public.notification_events(patient_id, created_at desc);

alter table public.notification_events enable row level security;

drop policy if exists "notification_events_patient_insert" on public.notification_events;
create policy "notification_events_patient_insert"
  on public.notification_events for insert
  with check (auth.uid() = patient_id);

drop policy if exists "notification_events_patient_select" on public.notification_events;
create policy "notification_events_patient_select"
  on public.notification_events for select
  using (auth.uid() = patient_id);

drop policy if exists "notification_events_practitioner_select" on public.notification_events;
create policy "notification_events_practitioner_select"
  on public.notification_events for select
  using (
    exists (
      select 1 from public.practitioner_patients pp
      where pp.practitioner_id = auth.uid()
        and pp.patient_id = public.notification_events.patient_id
    )
  );


-- ============================================================
-- TABLE : crisis_plan_configs
-- ============================================================
-- Config praticien pour le plan de crise (message affiché au patient).
-- Remplace le JSON dans patient_modules.config.crisisPlan.

create table if not exists public.crisis_plan_configs (
  patient_id        uuid primary key references public.patients(id) on delete cascade,
  practitioner_message text not null default '',
  updated_at        timestamptz not null default now()
);

-- Nettoyage idempotent des vestiges « cartes SOS » / « engagement » (retirés #114) :
-- la table de coping cards et la colonne d'engagement sont supprimées si présentes.
drop table if exists public.crisis_plan_coping_cards cascade;
alter table public.crisis_plan_configs drop column if exists commitment_phrase;

alter table public.crisis_plan_configs enable row level security;

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


-- ============================================================
-- TABLE : practitioner_patient_notes (Notes privées praticien)
-- ============================================================
-- Notes libres liées à un patient, visibles uniquement du praticien.
-- Aucune donnée clinique structurée — texte libre.
-- appointment_id (nullable) : rattachement OPTIONNEL à un rendez-vous.
--   null  = note libre ; renseigné = note liée à ce RDV.
--   La contrainte FK (on delete set null) est ajoutée après la table appointments,
--   définie plus bas dans ce fichier.
create table if not exists public.practitioner_patient_notes (
  id              uuid        primary key default gen_random_uuid(),
  practitioner_id uuid        not null references public.practitioners(id) on delete cascade,
  patient_id      uuid        not null references public.patients(id)      on delete cascade,
  appointment_id  uuid,
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

-- Migration idempotente : ajouter appointment_id sur BDD existante
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'practitioner_patient_notes' and column_name = 'appointment_id'
  ) then
    alter table public.practitioner_patient_notes add column appointment_id uuid;
  end if;
end $$;

create index if not exists idx_ppnotes_practitioner_patient
  on public.practitioner_patient_notes(practitioner_id, patient_id);

-- Index sur le RDV lié : accélère le filtre des notes par RDV et la mise à NULL
-- déclenchée par `on delete set null` à la suppression d'un rendez-vous.
create index if not exists idx_ppnotes_appointment
  on public.practitioner_patient_notes(appointment_id)
  where appointment_id is not null;

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
-- TABLE : tag_dimensions (Axes de filtrage transverse des modules)
-- ============================================================
-- Données de référence statiques : les axes croisables de l'armoire
-- thérapeutique (indication, population, approche). Libellés via i18n
-- (tag_dimensions.<id>.label) — zéro texte en base. Cf. docs/spec/module-taxonomy.md.

create table if not exists public.tag_dimensions (
  id          text primary key,            -- 'indication' | 'population' | 'approach'
  sort_order  int  not null default 0
);

alter table public.tag_dimensions enable row level security;

drop policy if exists "tag_dimensions_read" on public.tag_dimensions;
create policy "tag_dimensions_read" on public.tag_dimensions
  for select to authenticated using (true);


-- ============================================================
-- TABLE : tags (Valeurs de filtrage — 1 ligne = 1 tag)
-- ============================================================
-- Une ligne par valeur taggable (anxiety, teen, cbt…). Libellés via i18n
-- (tags.<id>.label). Ajouter un tag = un INSERT, zéro redéploiement.

create table if not exists public.tags (
  id            text primary key,          -- 'anxiety', 'teen', 'cbt'
  dimension_id  text not null references public.tag_dimensions(id),
  sort_order    int  not null default 0
);

alter table public.tags enable row level security;

drop policy if exists "tags_read" on public.tags;
create policy "tags_read" on public.tags
  for select to authenticated using (true);

create index if not exists idx_tags_dimension on public.tags(dimension_id);


-- ============================================================
-- TABLE : module_tags (Liaison N↔N module ↔ tag)
-- ============================================================
-- Un module porte plusieurs tags ; un tag s'applique à plusieurs modules.
-- MDR : métadonnée d'outil uniquement — aucune liaison vers une donnée patient.

create table if not exists public.module_tags (
  module_id  text not null references public.modules(id) on delete cascade,
  tag_id     text not null references public.tags(id)    on delete cascade,
  primary key (module_id, tag_id)
);

alter table public.module_tags enable row level security;

drop policy if exists "module_tags_read" on public.module_tags;
create policy "module_tags_read" on public.module_tags
  for select to authenticated using (true);

create index if not exists idx_module_tags_tag on public.module_tags(tag_id);


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
--
-- CONVENTION — prop_value ATOMIQUE (une entrée = une valeur).
--   Une `prop_value` ne ré-encode JAMAIS une structure dans une string :
--     - attribut nommé distinct → prop frère dédié
--       (ex. widget_type='slider' + slider_min/slider_max/slider_unit ;
--        widget_type='stars' + stars_count ; widget_type='radio' + radio_variant)
--     - liste → clés indexées atomiques `base_1`, `base_2`, …
--       (ex. duration_1/duration_2 ; required_key_1/required_key_2 ;
--        target_age_1/target_age_2). Lecture côté code : collectIndexed().
--   Interdit : packer en CSV/JSON/`kind:param:param` (ex. 'slider:0:120:min',
--   '5,15', '["adulte","senior"]').
--   Allowlist (valeurs atomiques contenant `:`/`,`/`-` légitimement, NON packées) :
--   reference_url, reference_label, validated_age_range, clés i18n, couleurs hex.
--   Cf. docs/module-engine.md § « Convention field_props : prop_value atomique ».

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
-- REFONTE PSYCHOÉDUCATION — thèmes + découplage fiche ↔ module
-- ============================================================
-- Une fiche (psyedu_topics) n'est plus possédée par un module : elle appartient
-- à un thème (psyedu_themes), porte des tags (psyedu_topic_tags) et peut être
-- réutilisée par N modules via module_topics. Source unique de vérité par fiche.
-- Les tables tag_dimensions / tags / module_tags sont définies plus haut
-- (taxonomie des modules — branche feat/improve-module-organization).

-- Thèmes de la bibliothèque (libellé via i18n : psyedu.theme.<id>)
create table if not exists public.psyedu_themes (
  id          text primary key,          -- 'treatment', 'lifestyle', …
  icon_name   text not null,
  sort_order  int  not null default 0
);
alter table public.psyedu_themes enable row level security;
drop policy if exists "psyedu_themes_read" on public.psyedu_themes;
create policy "psyedu_themes_read" on public.psyedu_themes
  for select to authenticated using (true);

-- Évolution des fiches : rattachement à un thème + date de dernière révision
-- (couche « preuve »). module_key conservé (nullable) le temps de la transition.
alter table public.psyedu_topics add column if not exists theme_id    text references public.psyedu_themes(id);
alter table public.psyedu_topics add column if not exists reviewed_at date;
alter table public.psyedu_topics alter column module_key drop not null;
create index if not exists idx_psyedu_topics_theme on public.psyedu_topics(theme_id);

-- Lien N:N module ↔ fiche (réutilisation ordonnée d'une fiche par un module)
create table if not exists public.module_topics (
  module_id   text not null references public.modules(id)       on delete cascade,
  topic_id    uuid not null references public.psyedu_topics(id) on delete cascade,
  sort_order  int  not null default 0,
  primary key (module_id, topic_id)
);
alter table public.module_topics enable row level security;
drop policy if exists "module_topics_read" on public.module_topics;
create policy "module_topics_read" on public.module_topics
  for select to authenticated using (true);
create index if not exists idx_module_topics_topic on public.module_topics(topic_id);

-- Tags d'une fiche (réutilise la taxonomie tags ci-dessus)
create table if not exists public.psyedu_topic_tags (
  topic_id  uuid not null references public.psyedu_topics(id) on delete cascade,
  tag_id    text not null references public.tags(id)          on delete cascade,
  primary key (topic_id, tag_id)
);
alter table public.psyedu_topic_tags enable row level security;
drop policy if exists "psyedu_topic_tags_read" on public.psyedu_topic_tags;
create policy "psyedu_topic_tags_read" on public.psyedu_topic_tags
  for select to authenticated using (true);
create index if not exists idx_psyedu_topic_tags_tag on public.psyedu_topic_tags(tag_id);


-- ============================================================
-- TABLE : patient_push_tokens (Tokens push par device patient)
-- ============================================================
-- Un patient peut avoir plusieurs tokens (plusieurs devices).
-- token_type = 'fcm'  → token FCM natif (Android builds locaux)
-- token_type = 'expo' → token Expo Push Service (legacy / iOS)
-- L'Edge Function send-notifications utilise le service_role pour lire.

create table if not exists public.patient_push_tokens (
  id               uuid        primary key default gen_random_uuid(),
  patient_id       uuid        not null references public.patients(id) on delete cascade,
  expo_push_token  text        not null,
  token_type       text        not null default 'expo' check (token_type in ('expo', 'fcm')),
  platform         text        not null check (platform in ('ios', 'android')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (expo_push_token)
);

-- Idempotent : ajouter token_type si la table existait déjà sans cette colonne
alter table public.patient_push_tokens
  add column if not exists token_type text not null default 'expo'
    check (token_type in ('expo', 'fcm'));

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

-- FK note → rendez-vous : rattachement optionnel d'une note praticien à un RDV.
-- `on delete set null` : supprimer un RDV ne supprime pas la note, elle redevient
-- libre. Ajoutée ici car appointments est définie après practitioner_patient_notes.
do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'fk_ppnote_appointment'
      and table_name = 'practitioner_patient_notes'
  ) then
    alter table public.practitioner_patient_notes
      add constraint fk_ppnote_appointment
      foreign key (appointment_id)
      references public.appointments(id) on delete set null;
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
-- FILE ACTIVE — Tour de contrôle praticien
-- ============================================================
-- Outil d'organisation PRIVÉ du praticien (jamais visible du patient).
-- Purement administratif : échéances, priorités, tâches saisies à la main.
-- Aucune donnée clinique structurée — texte libre uniquement (cf. practitioner_patient_notes).
--
-- Conformité MDR 2017/745 : le code affiche, il n'interprète jamais.
-- `priority` est TOUJOURS saisi manuellement, jamais dérivé d'une donnée clinique
-- (score, symptôme). Le niveau d'alerte est calculé côté client à partir des dates
-- saisies par le praticien — rien n'est stocké, rien n'est conclu.

-- Un dossier de file active. patient_id relie OPTIONNELLEMENT une fiche patient de
-- l'app ; un dossier peut exister sans (patient non-utilisateur de l'app).
-- Le dossier porte le CONTEXTE (qui, statut, priorité, soins, attente de tiers).
-- Les TÂCHES à faire vivent dans caseload_actions (un dossier → plusieurs actions).
create table if not exists public.caseload_entries (
  id               uuid        primary key default gen_random_uuid(),
  practitioner_id  uuid        not null references public.practitioners(id) on delete cascade,
  patient_id       uuid        references public.patients(id) on delete set null,
  display_name     text        not null,
  status           text        not null default 'active' check (status in ('active', 'paused', 'archived')),
  is_important     boolean     not null default false,
  wake_date        date,
  invited_email    text,
  care_pathways    text[]      not null default '{}',
  last_reviewed_at date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  archived_at      timestamptz
);

-- Migration idempotente : retirer les colonnes promues vers caseload_actions
-- (BDD ayant connu la première version mono-action de la file active).
alter table public.caseload_entries drop column if exists next_action;
alter table public.caseload_entries drop column if exists due_date;
alter table public.caseload_entries drop column if exists recurrence_days;
-- Priorité 3 niveaux remplacée par un drapeau « Important ».
alter table public.caseload_entries add column if not exists is_important boolean not null default false;
alter table public.caseload_entries drop column if exists priority;
-- « En attente de retour » devient multiple (table caseload_waits).
alter table public.caseload_entries drop column if exists waiting_on;
alter table public.caseload_entries drop column if exists relance_date;
-- Suivi des dossiers libres issus d'une invitation en attente (conversion auto).
alter table public.caseload_entries add column if not exists invited_email text;

create index if not exists idx_caseload_entries_practitioner
  on public.caseload_entries(practitioner_id, status);
create index if not exists idx_caseload_entries_invited_email
  on public.caseload_entries(practitioner_id, invited_email)
  where invited_email is not null;

drop trigger if exists caseload_entries_updated_at on public.caseload_entries;
create trigger caseload_entries_updated_at
  before update on public.caseload_entries
  for each row execute procedure public.set_updated_at();

alter table public.caseload_entries enable row level security;

drop policy if exists "caseload_entries_own" on public.caseload_entries;
create policy "caseload_entries_own" on public.caseload_entries
  for all
  using (auth.uid() = practitioner_id)
  with check (auth.uid() = practitioner_id);

-- Journal daté des notes administratives d'un dossier (append-only côté usage).
create table if not exists public.caseload_notes (
  id               uuid        primary key default gen_random_uuid(),
  entry_id         uuid        not null references public.caseload_entries(id) on delete cascade,
  practitioner_id  uuid        not null references public.practitioners(id) on delete cascade,
  body             text        not null,
  is_pinned        boolean     not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists idx_caseload_notes_entry
  on public.caseload_notes(entry_id, created_at desc);

alter table public.caseload_notes enable row level security;

drop policy if exists "caseload_notes_own" on public.caseload_notes;
create policy "caseload_notes_own" on public.caseload_notes
  for all
  using (auth.uid() = practitioner_id)
  with check (auth.uid() = practitioner_id);

-- « En attente de retour » : ce qu'on attend de l'extérieur (résultat de bilan,
-- retour d'un professionnel, réponse de l'ASE…), plusieurs par dossier, chacune
-- avec une date de relance optionnelle (boomerang vers « Aujourd'hui »).
create table if not exists public.caseload_waits (
  id               uuid        primary key default gen_random_uuid(),
  entry_id         uuid        not null references public.caseload_entries(id) on delete cascade,
  practitioner_id  uuid        not null references public.practitioners(id) on delete cascade,
  label            text        not null,
  relance_date     date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_caseload_waits_entry
  on public.caseload_waits(entry_id);

drop trigger if exists caseload_waits_updated_at on public.caseload_waits;
create trigger caseload_waits_updated_at
  before update on public.caseload_waits
  for each row execute procedure public.set_updated_at();

alter table public.caseload_waits enable row level security;

drop policy if exists "caseload_waits_own" on public.caseload_waits;
create policy "caseload_waits_own" on public.caseload_waits
  for all
  using (auth.uid() = practitioner_id)
  with check (auth.uid() = practitioner_id);

-- Tâches à faire d'un dossier. Chaque action a sa propre échéance et sa coche
-- « fait ». L'alerte d'un dossier = celle de son action ouverte la plus urgente.
create table if not exists public.caseload_actions (
  id               uuid        primary key default gen_random_uuid(),
  entry_id         uuid        not null references public.caseload_entries(id) on delete cascade,
  practitioner_id  uuid        not null references public.practitioners(id) on delete cascade,
  label            text        not null,
  due_date         date,
  due_time         time,
  is_urgent        boolean     not null default false,
  is_done          boolean     not null default false,
  done_at          timestamptz,
  recurrence_days  int         check (recurrence_days is null or recurrence_days > 0),
  sort_order       int         not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Migration idempotente : heure optionnelle + urgence manuelle ajoutées après coup.
alter table public.caseload_actions add column if not exists due_time time;
alter table public.caseload_actions add column if not exists is_urgent boolean not null default false;

create index if not exists idx_caseload_actions_entry
  on public.caseload_actions(entry_id, is_done, due_date);

drop trigger if exists caseload_actions_updated_at on public.caseload_actions;
create trigger caseload_actions_updated_at
  before update on public.caseload_actions
  for each row execute procedure public.set_updated_at();

alter table public.caseload_actions enable row level security;

drop policy if exists "caseload_actions_own" on public.caseload_actions;
create policy "caseload_actions_own" on public.caseload_actions
  for all
  using (auth.uid() = practitioner_id)
  with check (auth.uid() = practitioner_id);

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

-- Praticien : lecture seule sur les entrées de ses patients liés,
-- UNIQUEMENT si le patient a activé le partage (share_consent = true).
drop policy if exists "patient_entries_practitioner_select" on public.patient_entries;
create policy "patient_entries_practitioner_select"
  on public.patient_entries for select
  using (
    exists (
      select 1 from public.practitioner_patients pp
      where pp.practitioner_id = auth.uid()
        and pp.patient_id = public.patient_entries.patient_id
    )
    and exists (
      select 1 from public.patients pat
      where pat.id = public.patient_entries.patient_id
        and pat.share_consent = true
    )
  );

-- Realtime (issue #103) : le web praticien s'abonne aux changements de
-- patient_entries pour rafraîchir instantanément quand un patient saisit sur
-- mobile. Postgres Changes RESPECTE la RLS ci-dessus : un praticien ne reçoit que
-- les entrées de ses patients consentants (aucun élargissement d'accès).
--   - replica identity full : sans elle, les événements DELETE/UPDATE ne portent
--     pas l'ancien patient_id → impossible de router l'événement vers le bon canal.
--   - ajout à la publication supabase_realtime, gardé idempotent (ré-exécutable).
alter table public.patient_entries replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'patient_entries'
     )
  then
    alter publication supabase_realtime add table public.patient_entries;
  end if;
end $$;


-- ============================================================
-- TABLE : access_audit_log (Journal d'audit des accès — RGPD/HDS)
-- ============================================================
-- Trace QUI (actor_id = auth.uid()) a fait QUOI (action) sur QUELLE donnée
-- (target_table / target_id / patient_id), QUAND (occurred_at).
--
-- ⚠️ Conformité MDR (RÈGLE D'OR) : ce journal ne stocke JAMAIS le contenu des
-- lignes — aucune valeur clinique, aucun score, aucune note, aucune interprétation.
-- Uniquement des métadonnées TECHNIQUES (acteur, action, table, id, patient, horodatage).
--
-- Accès : service_role uniquement (même modèle que notification_logs). AUCUNE policy
-- client. Les seules écritures proviennent des fonctions SECURITY DEFINER de ce
-- fichier (fn_audit_write via triggers, log_data_access via RPC), qui s'exécutent
-- avec les droits du propriétaire et contournent donc la RLS.
-- La consultation se fait via le dashboard Supabase (service_role) ou un futur écran DPO.

create table if not exists public.access_audit_log (
  id           uuid        primary key default gen_random_uuid(),
  occurred_at  timestamptz not null default now(),
  actor_id     uuid,                       -- auth.uid() de l'acteur ; null si service_role / système
  actor_role   text        not null default 'unknown',
  action       text        not null check (action in
                 ('insert', 'update', 'delete', 'read', 'export', 'erase', 'purge')),
  target_table text        not null,
  target_id    uuid,                       -- id de la ligne ; null pour une lecture de liste / opération de masse
  patient_id   uuid,                       -- patient concerné (filtrage) ; null si non rattachable
  metadata     jsonb       not null default '{}'::jsonb
);

create index if not exists idx_access_audit_patient
  on public.access_audit_log(patient_id, occurred_at desc);
create index if not exists idx_access_audit_actor
  on public.access_audit_log(actor_id, occurred_at desc);
create index if not exists idx_access_audit_table
  on public.access_audit_log(target_table, occurred_at desc);

alter table public.access_audit_log enable row level security;
-- Aucune policy client : lecture/écriture réservées au service_role et aux fonctions
-- SECURITY DEFINER ci-dessous.


-- Rôle de l'acteur courant, dérivé de auth.uid().
-- Un appel sans utilisateur authentifié (service_role / cron / trigger système) → 'service'.
create or replace function public.fn_current_actor_role()
returns text
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return 'service';
  end if;
  if exists (select 1 from public.practitioners where id = v_uid) then
    return 'practitioner';
  end if;
  if exists (select 1 from public.patients where id = v_uid) then
    return 'patient';
  end if;
  return 'authenticated';
end;
$$;


-- Trigger générique d'audit des ÉCRITURES (insert / update / delete).
-- Attaché aux tables sensibles plus bas. N'enregistre QUE des métadonnées techniques
-- (jamais to_jsonb(new) en base : on n'extrait que l'id et le patient_id).
create or replace function public.fn_audit_write()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_rec     jsonb;
  v_target  uuid;
  v_patient uuid;
begin
  if (tg_op = 'DELETE') then
    v_rec := to_jsonb(old);
  else
    v_rec := to_jsonb(new);
  end if;

  v_target  := nullif(v_rec ->> 'id', '')::uuid;
  v_patient := nullif(v_rec ->> 'patient_id', '')::uuid;
  -- La table patients n'a pas de colonne patient_id : son id EST le patient.
  if v_patient is null and tg_table_name = 'patients' then
    v_patient := v_target;
  end if;

  insert into public.access_audit_log
    (actor_id, actor_role, action, target_table, target_id, patient_id)
  values
    (auth.uid(), public.fn_current_actor_role(), lower(tg_op),
     tg_table_name, v_target, v_patient);

  if (tg_op = 'DELETE') then
    return old;
  end if;
  return new;
end;
$$;


-- Attache fn_audit_write à chaque table sensible (idempotent + défensif).
-- La garde `to_regclass` permet au MÊME schéma de fonctionner quel que soit l'état
-- de la base : sur `main` les tables caseload_*/notification_events n'existent pas
-- encore (branche tableau de bord) → elles sont ignorées ; sur une base où elles
-- existent → elles sont couvertes automatiquement.
-- ⚠️ Pour auditer une nouvelle table de données patient : ajouter son nom à v_sensitive.
do $$
declare
  v_table     text;
  v_sensitive text[] := array[
    'patients',
    'practitioner_patients',
    'invitations',
    'patient_modules',
    'cssrs_screen_assessments',
    'crisis_plan_configs',
    'practitioner_patient_notes',
    'patient_push_tokens',
    'notification_routines',
    'appointments',
    'patient_entries',
    -- branche tableau de bord (présentes sur la base live, pas encore sur main) :
    'notification_events',
    'caseload_entries',
    'caseload_notes',
    'caseload_waits',
    'caseload_actions'
  ];
begin
  foreach v_table in array v_sensitive loop
    if to_regclass('public.' || v_table) is null then
      continue;  -- table absente de cette base → on saute
    end if;
    execute format('drop trigger if exists audit_write on public.%I', v_table);
    execute format(
      'create trigger audit_write after insert or update or delete on public.%I '
      'for each row execute procedure public.fn_audit_write()', v_table);
  end loop;
end $$;


-- RPC applicatif : journalise un accès NON observable par trigger
-- (lecture, export, effacement, purge). L'acteur est dérivé de auth.uid() ICI —
-- le client ne peut donc pas le forger. Les écritures passent par fn_audit_write.
create or replace function public.log_data_access(
  p_action       text,
  p_target_table text,
  p_target_id    uuid  default null,
  p_patient_id   uuid  default null,
  p_metadata     jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if p_action not in ('read', 'export', 'erase', 'purge') then
    raise exception 'log_data_access: action non autorisée %', p_action;
  end if;

  insert into public.access_audit_log
    (actor_id, actor_role, action, target_table, target_id, patient_id, metadata)
  values
    (auth.uid(), public.fn_current_actor_role(), p_action,
     p_target_table, p_target_id, p_patient_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

-- Durcissement des droits (les default privileges Supabase accordent EXECUTE à
-- anon/authenticated sur toute fonction de public → révocation explicite requise).
-- fn_audit_write : appelée uniquement par les triggers (s'exécute en tant qu'owner).
-- fn_current_actor_role : helper interne aux fonctions SECURITY DEFINER.
-- Aucune des deux ne doit être appelable via l'API REST.
revoke all on function public.fn_audit_write() from public, anon, authenticated;
revoke all on function public.fn_current_actor_role() from public, anon, authenticated;

-- log_data_access : RPC réservé aux utilisateurs authentifiés (web) + service_role (Edge Functions / purge #28).
revoke all on function public.log_data_access(text, text, uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.log_data_access(text, text, uuid, uuid, jsonb) to authenticated, service_role;


-- ============================================================
-- DROITS PATIENT RGPD (#27) — export & effacement
-- ============================================================
-- Deux RPC SECURITY DEFINER. La RLS n'accorde au praticien qu'un SELECT (parfois
-- rien) sur les tables patient — un export/delete direct serait bloqué. Ces fonctions
-- s'exécutent en tant qu'owner MAIS re-vérifient l'habilitation via auth.uid() :
--   • un praticien ADMIN (fn_is_admin) → n'importe quel patient (page de gestion
--     des utilisateurs côté web) ;
--   • le PATIENT lui-même (auth.uid() = patient_id) → self-service RGPD mobile.
-- Le praticien NON-admin n'a plus accès (capacité retirée de la fiche patient).
-- Le compte auth.users (login) n'est PAS supprimé ici (un RPC SQL ne le peut pas) →
-- c'est l'Edge Function `delete-patient-account` (service_role) qui le fait, et sa
-- cascade ON DELETE purge alors patients + ~20 tables enfant.
--
-- ⚠️ MDR (RÈGLE D'OR) : export_patient_data renvoie les valeurs BRUTES (to_jsonb),
-- jamais un score labellisé ni une interprétation. C'est un miroir neutre des saisies.

-- Helper interne : l'appelant connecté est-il un praticien admin ?
-- SOURCE DE VÉRITÉ du rôle admin — lue côté serveur via auth.uid(), JAMAIS depuis
-- un payload client. Ne consulte que `practitioners` : un patient n'y a pas de
-- ligne, donc fn_is_admin() est toujours false pour lui (un patient ne peut jamais
-- être admin). C'est la barrière réelle de toute opération admin ; les gardes front
-- (route, UI) ne sont que du confort et ne protègent rien seuls.
create or replace function public.fn_is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.practitioners p
    where p.id = auth.uid() and p.is_admin
  );
$$;

-- Droit d'accès / portabilité (RGPD art. 15 & 20) : agrège TOUTES les données du
-- patient en un seul jsonb (une clé par table), valeurs brutes uniquement.
create or replace function public.export_patient_data(p_patient_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_email  text;
  v_result jsonb;
begin
  -- Habilités : un praticien ADMIN (gestion des utilisateurs, n'importe quel patient)
  -- OU le PATIENT lui-même (self-service RGPD mobile, art. 15/20 sur ses données).
  -- Le praticien NON-admin n'a plus ce droit (capacité retirée de la fiche patient).
  if not (public.fn_is_admin() or auth.uid() = p_patient_id) then
    raise exception 'export_patient_data: accès refusé';
  end if;

  select email into v_email from public.patients where id = p_patient_id;

  v_result := jsonb_build_object(
    'exported_at', now(),
    'patient_id',  p_patient_id,
    'patient',
      (select to_jsonb(p) from public.patients p where p.id = p_patient_id),
    'practitioner_patients',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.practitioner_patients t where t.patient_id = p_patient_id),
    'patient_modules',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.patient_modules t where t.patient_id = p_patient_id),
    'patient_entries',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.patient_entries t where t.patient_id = p_patient_id),
    'notification_events',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.notification_events t where t.patient_id = p_patient_id),
    'notification_routines',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.notification_routines t where t.patient_id = p_patient_id),
    'notification_logs',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.notification_logs t where t.patient_id = p_patient_id),
    'patient_push_tokens',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.patient_push_tokens t where t.patient_id = p_patient_id),
    'cssrs_screen_assessments',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.cssrs_screen_assessments t where t.patient_id = p_patient_id),
    'crisis_plan_configs',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.crisis_plan_configs t where t.patient_id = p_patient_id),
    'practitioner_patient_notes',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.practitioner_patient_notes t where t.patient_id = p_patient_id),
    'appointments',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.appointments t where t.patient_id = p_patient_id),
    'caseload_entries',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.caseload_entries t where t.patient_id = p_patient_id),
    'caseload_notes',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.caseload_notes t
        where t.entry_id in (select id from public.caseload_entries where patient_id = p_patient_id)),
    'caseload_waits',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.caseload_waits t
        where t.entry_id in (select id from public.caseload_entries where patient_id = p_patient_id)),
    'caseload_actions',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.caseload_actions t
        where t.entry_id in (select id from public.caseload_entries where patient_id = p_patient_id)),
    'invitations',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.invitations t where v_email is not null and lower(t.patient_email) = lower(v_email))
  );

  perform public.log_data_access('export', 'patients', p_patient_id, p_patient_id,
    jsonb_build_object('scope', 'full'));

  return v_result;
end;
$$;

-- Droit à l'oubli (RGPD art. 17) : supprime UNIQUEMENT ce qui ne cascade pas depuis
-- patients (invitations liées par email + caseload_entries en ON DELETE SET NULL).
-- Le reste part via la suppression du compte auth.users (Edge Function), qui cascade
-- patients → toutes les tables enfant. Trace l'effacement AVANT toute suppression.
create or replace function public.erase_patient_data(p_patient_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_email       text;
  v_invitations int := 0;
  v_caseload    int := 0;
begin
  -- Habilités : un praticien ADMIN (gestion des utilisateurs) OU le PATIENT lui-même
  -- (droit à l'oubli self-service mobile, art. 17). Praticien non-admin exclu.
  if not (public.fn_is_admin() or auth.uid() = p_patient_id) then
    raise exception 'erase_patient_data: accès refusé';
  end if;

  select email into v_email from public.patients where id = p_patient_id;

  perform public.log_data_access('erase', 'patients', p_patient_id, p_patient_id,
    jsonb_build_object('scope', 'full'));

  if v_email is not null then
    delete from public.invitations where lower(patient_email) = lower(v_email);
    get diagnostics v_invitations = row_count;
  end if;

  delete from public.caseload_entries where patient_id = p_patient_id;
  get diagnostics v_caseload = row_count;

  return jsonb_build_object(
    'ok', true,
    'invitations_deleted', v_invitations,
    'caseload_entries_deleted', v_caseload
  );
end;
$$;

-- Liste admin de TOUS les utilisateurs — patients ET médecins (praticiens) — pour la
-- page de gestion des utilisateurs. Admin-only via fn_is_admin() : un non-admin (ou un
-- appel réseau forgé) → exception. Chaque ligne porte un discriminant `kind`
-- ('patient' | 'practitioner') pour différencier les deux populations côté UI.
-- `practitioner_names` = médecins liés (patients) / vide (médecins) ; `is_admin` =
-- rôle (médecins) / false (patients). Consultation tracée (action 'read', target_id null).
-- Ancienne signature sans argument — supprimée avant recréation de la version paginée.
drop function if exists public.admin_list_users();

create or replace function public.admin_list_users(
  p_kind         text default null,   -- 'patient' | 'practitioner' | null (tous)
  p_practitioner text default null,   -- nom d'un médecin → patients rattachés
  p_search       text default null,   -- recherche ILIKE sur nom + email
  p_sort         text default 'created_at',
  p_dir          text default 'desc',
  p_limit        int  default 150,
  p_offset       int  default 0
)
returns table (
  user_id            uuid,
  kind               text,
  email              text,
  display_name       text,
  created_at         timestamptz,
  practitioner_names text[],
  is_admin           boolean,
  -- Total du jeu FILTRÉ (avant limit/offset) — alimente la pagination côté front.
  total_count        bigint
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_sort_col text;
  v_dir      text;
begin
  if not public.fn_is_admin() then
    raise exception 'admin_list_users: accès refusé';
  end if;

  perform public.log_data_access('read', 'patients', null, null,
    jsonb_build_object('scope', 'admin_all_users'));

  -- Tri whitelisté : on ne réinjecte JAMAIS la valeur client brute dans l'ORDER BY.
  -- 'practitioners' trie sur le 1er médecin (tableau agrégé trié alphabétiquement).
  v_sort_col := case p_sort
    when 'display_name'  then 'display_name'
    when 'email'         then 'email'
    when 'kind'          then 'kind'
    when 'practitioners' then 'sort_practitioner'
    else 'created_at'
  end;
  v_dir := case when lower(coalesce(p_dir, '')) = 'asc' then 'asc' else 'desc' end;

  -- Tri dynamique (%I/%s whitelistés) ; filtres passés en paramètres ($1..$3).
  return query execute format($q$
    with base as (
      -- Patients : nom = prénom+nom sinon email ; médecins liés agrégés (triés).
      select
        p.id as user_id, 'patient'::text as kind, p.email,
        coalesce(nullif(trim(concat_ws(' ', nullif(p.first_name, ''), nullif(p.last_name, ''))), ''), p.email) as display_name,
        p.created_at,
        coalesce(
          array_agg(distinct pr.name order by pr.name) filter (where pr.name is not null and pr.name <> ''),
          '{}'::text[]
        ) as practitioner_names,
        false as is_admin
      from public.patients p
      left join public.practitioner_patients pp on pp.patient_id = p.id
      left join public.practitioners pr on pr.id = pp.practitioner_id
      group by p.id, p.email, p.first_name, p.last_name, p.created_at
      union all
      -- Médecins : nom = name sinon email ; is_admin porte le rôle.
      select
        pr.id, 'practitioner'::text, pr.email,
        coalesce(nullif(trim(pr.name), ''), pr.email),
        pr.created_at, '{}'::text[], pr.is_admin
      from public.practitioners pr
    ),
    filtered as (
      select b.*, lower(b.practitioner_names[1]) as sort_practitioner
      from base b
      where ($1 is null or b.kind = $1)
        and ($2 is null or $2 = any(b.practitioner_names))
        and ($3 is null or b.display_name ilike '%%' || $3 || '%%' or b.email ilike '%%' || $3 || '%%')
    )
    select
      user_id, kind, email, display_name, created_at, practitioner_names, is_admin,
      count(*) over() as total_count
    from filtered
    order by %I %s nulls last, display_name asc, user_id asc
    limit %L offset %L
  $q$, v_sort_col, v_dir, p_limit, p_offset)
  using p_kind, p_practitioner, p_search;
end;
$$;

-- Noms des médecins (pour le filtre « par praticien » de la table admin) — admin-only.
-- Distinct des noms non vides, c.-à-d. exactement les valeurs comparables au tableau
-- `practitioner_names` renvoyé par admin_list_users.
create or replace function public.admin_list_practitioner_names()
returns table (name text)
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.fn_is_admin() then
    raise exception 'admin_list_practitioner_names: accès refusé';
  end if;

  return query
    select distinct pr.name
    from public.practitioners pr
    where pr.name is not null and pr.name <> ''
    order by pr.name;
end;
$$;

-- Droits : fn_is_admin est un helper INTERNE (appelé par les RPC SECURITY DEFINER,
-- en tant qu'owner) — aucun rôle client, pas d'exposition REST inutile. Le front
-- n'en a pas besoin : il lit `practitioner.is_admin` (déjà chargé en session).
-- export/erase/admin_list_* réservés aux authentifiés (re-gardés en interne) + service_role.
revoke all on function public.fn_is_admin()             from public, anon, authenticated;
revoke all on function public.export_patient_data(uuid) from public, anon;
revoke all on function public.erase_patient_data(uuid)  from public, anon;
revoke all on function public.admin_list_users(text, text, text, text, text, int, int) from public, anon;
revoke all on function public.admin_list_practitioner_names()                          from public, anon;
grant execute on function public.export_patient_data(uuid) to authenticated, service_role;
grant execute on function public.erase_patient_data(uuid)  to authenticated, service_role;
grant execute on function public.admin_list_users(text, text, text, text, text, int, int) to authenticated, service_role;
grant execute on function public.admin_list_practitioner_names()                          to authenticated, service_role;


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


-- ============================================================
-- TABLE : theme_suggestions (Suggestions de fiches psychoéducation)
-- ============================================================
-- Le praticien suggère un thème de fiche manquant dans la bibliothèque. Écrite
-- EXCLUSIVEMENT par l'Edge Function `send-theme-suggestion` (service_role), qui
-- dérive l'identité depuis le JWT et notifie l'équipe éditoriale par email (Resend).
-- Logistique éditoriale : zéro donnée patient, zéro interprétation (hors périmètre MDR).
-- Aucune policy client (lecture équipe via dashboard).

create table if not exists public.theme_suggestions (
  id              uuid        primary key default gen_random_uuid(),
  practitioner_id uuid        references public.practitioners(id) on delete set null,
  suggestion      text        not null,
  status          text        not null default 'new' check (status in ('new', 'reviewed', 'done', 'declined')),
  -- Hash SHA-256 de l'IP appelante (jamais en clair) — rate-limit de l'endpoint.
  ip_hash         text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_theme_suggestions_status
  on public.theme_suggestions(status, created_at desc);
create index if not exists idx_theme_suggestions_ip_recent
  on public.theme_suggestions(ip_hash, created_at desc);

alter table public.theme_suggestions enable row level security;
-- Aucune policy client : insertion par l'Edge Function (service_role), lecture équipe.


-- ============================================================
-- TABLE : render_mismatch_log (Observabilité du moteur de rendu — issue #90)
-- ============================================================
-- Journal des NON-MATCH du moteur de rendu : une config (preview_kind / field_type /
-- widget_type / text_code) que web ou mobile ne sait pas afficher. Écrite EXCLUSIVEMENT
-- par l'Edge Function `report-render-mismatch` (service_role), qui déduplique par
-- `signature`, applique un cooldown + un coupe-circuit global, et notifie l'équipe par
-- email (Resend) à la 1ʳᵉ occurrence d'une signature.
--
-- ⚠️ MDR / RGPD : télémétrie TECHNIQUE uniquement. AUCUNE donnée patient (pas de payload
-- de saisie, pas d'identifiant patient) — uniquement de la config structurelle. Hors
-- périmètre « donnée de santé ».
--
-- Déduplication : `signature` = platform + module_id + preview_kind + field_type +
-- widget_type + reason (calculée côté edge function). 1ʳᵉ occurrence → insert + email ;
-- occurrences suivantes → increment `occurrence_count` + MAJ `last_seen_at`, email
-- seulement si le cooldown depuis `email_sent_at` est dépassé.

create table if not exists public.render_mismatch_log (
  id               uuid        primary key default gen_random_uuid(),
  -- 1ʳᵉ observation de la signature (immuable) et dernière observation (incrémentée).
  occurred_at      timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  platform         text        not null check (platform in ('web', 'mobile')),
  app_version      text,
  level            text        not null check (level in
                     ('preview_kind', 'field_type', 'widget_type', 'missing_text_code')),
  module_id        text,
  preview_kind     text,
  field_id         text,
  field_type       text,
  widget_type      text,
  reason           text,
  -- Clé de déduplication — une ligne par problème distinct. UNIQUE → upsert côté edge.
  signature        text        not null unique,
  occurrence_count int         not null default 1,
  -- Horodatage du dernier email envoyé pour cette signature (pilote le cooldown).
  email_sent_at    timestamptz
);

create index if not exists idx_render_mismatch_log_occurred
  on public.render_mismatch_log(occurred_at desc);

alter table public.render_mismatch_log enable row level security;

-- Insertion / mise à jour : Edge Function (service_role, bypass RLS) uniquement.
-- Lecture : praticiens ADMIN seulement (télémétrie d'exploitation, pas de donnée métier).
drop policy if exists render_mismatch_log_admin_select on public.render_mismatch_log;
create policy render_mismatch_log_admin_select on public.render_mismatch_log
  for select to authenticated using (public.fn_is_admin());


-- ============================================================
-- TABLE : app_error_log (Alerte email sur erreur applicative — issue #96)
-- ============================================================
-- Généralisation de render_mismatch_log (#90) à deux catégories d'erreur :
-- `crash` (exception de rendu / promise rejection non gérée) et
-- `failed_operation` (échec réseau ou serveur). Écrite EXCLUSIVEMENT par l'Edge
-- Function `report-app-error` (service_role), qui déduplique par `signature`,
-- applique un cooldown + un coupe-circuit global (état anti-flood INDÉPENDANT
-- de celui du render-mismatch), et notifie l'équipe par email (Resend) à la
-- 1ʳᵉ occurrence d'une signature.
--
-- ⚠️ MDR / RGPD : télémétrie TECHNIQUE uniquement. AUCUNE donnée patient (pas de
-- payload de saisie, pas d'identifiant patient) — uniquement message, route,
-- plateforme, version, kind et une trace d'appel tronquée. Hors périmètre
-- « donnée de santé ».
--
-- Déduplication : `signature` = platform + kind + route + message (calculée
-- côté edge function). La trace d'appel (`stack`) est volontairement EXCLUE de
-- la signature : elle varie d'une occurrence à l'autre sans changer la nature
-- du problème, et l'inclure exploserait le nombre de signatures distinctes.

create table if not exists public.app_error_log (
  id               uuid        primary key default gen_random_uuid(),
  -- 1ʳᵉ observation de la signature (immuable) et dernière observation (incrémentée).
  occurred_at      timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  platform         text        not null check (platform in ('web', 'mobile')),
  app_version      text,
  kind             text        not null check (kind in ('crash', 'failed_operation')),
  message          text        not null,
  route            text,
  -- Trace d'appel tronquée (2000 caractères max, appliqué côté edge function).
  stack            text,
  reason           text,
  -- Clé de déduplication — une ligne par problème distinct. UNIQUE → upsert côté edge.
  signature        text        not null unique,
  occurrence_count int         not null default 1,
  -- Horodatage du dernier email envoyé pour cette signature (pilote le cooldown).
  email_sent_at    timestamptz
);

create index if not exists idx_app_error_log_occurred
  on public.app_error_log(occurred_at desc);

alter table public.app_error_log enable row level security;

-- Insertion / mise à jour : Edge Function (service_role, bypass RLS) uniquement.
-- Lecture : praticiens ADMIN seulement (télémétrie d'exploitation, pas de donnée métier).
drop policy if exists app_error_log_admin_select on public.app_error_log;
create policy app_error_log_admin_select on public.app_error_log
  for select to authenticated using (public.fn_is_admin());


-- ============================================================
-- TABLE : retention_config (Politique de conservation RGPD — art. 5.1.e)
-- ============================================================
-- Une ligne par table soumise à une durée de conservation limitée.
-- La purge est appliquée quotidiennement par l'Edge Function `purge-retention`
-- (service_role), déclenchée via pg_cron.
--
-- Champs :
--   table_name          — nom de la table publique cible
--   date_column         — colonne horodatage pour le calcul d'ancienneté
--   retention_days      — durée de conservation en jours (modifiable sans redéploiement)
--   gate_on_inactivity  — si true, on ne purge une ligne QUE si le patient est inactif
--                         (protège l'historique d'un patient encore suivi)
--   inactivity_days     — fenêtre d'inactivité en jours (utilisée si gate_on_inactivity)
--   is_enabled          — désactiver une règle sans la supprimer
--   description         — justification métier / base légale
--   updated_at          — horodatage de la dernière modification
--
-- ⚠️ MDR (RÈGLE D'OR) : condition de purge = dates uniquement
-- (ancienneté de la donnée + inactivité du patient). Aucune valeur clinique
-- n'entre dans le critère de sélection.
--
-- Patient « inactif » = ne s'est pas connecté ET n'a aucun rendez-vous depuis
-- `inactivity_days` jours. Un patient encore actif conserve TOUT son historique,
-- quel que soit l'âge des données. Voir fn_inactive_patient_ids ci-dessous.
--
-- Accès : service_role uniquement. Aucune policy client.

create table if not exists public.retention_config (
  table_name          text        primary key,
  date_column         text        not null default 'created_at',
  retention_days      int         not null check (retention_days >= 1),
  gate_on_inactivity  boolean     not null default false,
  inactivity_days     int         not null default 365 check (inactivity_days >= 1),
  is_enabled          boolean     not null default true,
  description         text,
  updated_at          timestamptz not null default now()
);

-- Idempotent : ajoute les colonnes de gating sur une base où retention_config existe déjà.
alter table public.retention_config
  add column if not exists gate_on_inactivity boolean not null default false;
alter table public.retention_config
  add column if not exists inactivity_days int not null default 365;

alter table public.retention_config enable row level security;
-- Aucune policy client : lecture/écriture réservées au service_role (Edge Function purge-retention).


-- ============================================================
-- fn_inactive_patient_ids : patients éligibles à la purge de leurs données
-- ============================================================
-- Un patient est « inactif » s'il remplit LES DEUX conditions :
--   1. dernière connexion (auth.users.last_sign_in_at) absente ou antérieure à la coupure
--   2. aucun rendez-vous dont starts_at est postérieur ou égal à la coupure
-- → un patient encore suivi (connexion récente OU rendez-vous récent/à venir) n'est
--   JAMAIS retourné : son historique est intégralement conservé.
--
-- SECURITY DEFINER : accède à auth.users (réservé au propriétaire). Le service_role
-- l'appelle via purge_retention_table. Révoquée pour anon/authenticated.
create or replace function public.fn_inactive_patient_ids(p_cutoff timestamptz)
returns setof uuid
language sql
stable
security definer set search_path = public
as $$
  select p.id
  from public.patients p
  where not exists (
          select 1 from auth.users u
          where u.id = p.id
            and u.last_sign_in_at is not null
            and u.last_sign_in_at >= p_cutoff
        )
    and not exists (
          select 1 from public.appointments a
          where a.patient_id = p.id
            and a.starts_at >= p_cutoff
        );
$$;


-- ============================================================
-- purge_retention_table : applique UNE règle de conservation
-- ============================================================
-- Supprime de `p_table` les lignes dont `p_date_column` dépasse la durée de
-- conservation. Si `p_gate_inactivity`, restreint aux patients inactifs.
-- Retourne le nombre de lignes supprimées.
--
-- ⚠️ MDR : critère 100 % temporel. Identifiants (table, colonne) issus de
-- retention_config (table service_role only) → injectés via format(%I), jamais
-- de saisie utilisateur. Valeurs passées en paramètres liés (USING).
--
-- SECURITY DEFINER : exécute la suppression de masse en contournant la RLS
-- (seul moyen de purger des données patient). Réservée au service_role.
create or replace function public.purge_retention_table(
  p_table            text,
  p_date_column      text,
  p_retention_days   int,
  p_gate_inactivity  boolean,
  p_inactivity_days  int
)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_retention_cutoff  timestamptz := now() - make_interval(days => p_retention_days);
  v_inactivity_cutoff timestamptz := now() - make_interval(days => p_inactivity_days);
  v_deleted           integer;
begin
  if p_gate_inactivity then
    -- NB : `fn_inactive_patient_ids` retourne `setof uuid` ; sa colonne porte le nom
    -- de la fonction, pas `id`. On la consomme donc en SRF de liste de sélection
    -- (`select public.fn_…(…)`), forme du test à blanc Option A (cf.
    -- docs/retention-conservation.md) — un `select id from …` lèverait
    -- « column "id" does not exist » à l'exécution.
    execute format(
      'delete from public.%I t where t.%I < $1 '
      'and t.patient_id in (select public.fn_inactive_patient_ids($2))',
      p_table, p_date_column
    ) using v_retention_cutoff, v_inactivity_cutoff;
  else
    execute format(
      'delete from public.%I t where t.%I < $1',
      p_table, p_date_column
    ) using v_retention_cutoff;
  end if;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- Durcissement des droits : ces fonctions ne doivent jamais être appelables via l'API REST
-- par un client. Seul le service_role (Edge Function purge-retention) y a accès.
revoke all on function public.fn_inactive_patient_ids(timestamptz) from public, anon, authenticated;
revoke all on function public.purge_retention_table(text, text, int, boolean, int) from public, anon, authenticated;
grant execute on function public.purge_retention_table(text, text, int, boolean, int) to service_role;


-- ============================================================
-- pg_cron : déclenchement de l'Edge Function purge-retention
-- ============================================================
-- Prérequis : extension pg_cron activée dans le Dashboard Supabase
--   > Database > Extensions > pg_cron (enable)
-- Remplacer <PROJECT_REF> et <SERVICE_ROLE_KEY> par les valeurs du projet.
-- À exécuter une seule fois manuellement dans le SQL Editor.
--
-- select cron.schedule(
--   'purge-retention-cron',
--   '0 2 * * *',
--   $$
--     select net.http_post(
--       url := 'https://<PROJECT_REF>.supabase.co/functions/v1/purge-retention',
--       headers := '{"Content-Type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
--       body := '{}'::jsonb
--     ) as request_id;
--   $$
-- );
