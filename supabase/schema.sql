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
  first_name       text        not null default '',
  last_name        text        not null default '',
  avatar_url       text,
  created_at       timestamptz not null default now()
);

-- 3. Relation praticien ↔ patient
create table if not exists public.practitioner_patients (
  id               uuid        primary key default gen_random_uuid(),
  practitioner_id  uuid        not null references public.practitioners(id) on delete cascade,
  patient_id       uuid        not null references public.patients(id) on delete cascade,
  patient_alias    text,
  teen_mode        boolean     not null default false,
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
--                  'emotion_wheel' | 'crisis_plan' | 'rim' | 'cognitive_saturation' |
--                  'psychoeducation'
--
--    Pour psychoeducation, le champ config suit le schéma :
--      { "unlocked_cards": [{ "card_id": "...", "is_read": false, "unlocked_at": "..." }] }
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


-- Migration idempotente : ajoute teen_mode si la colonne n'existe pas encore
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'practitioner_patients'
      and column_name  = 'teen_mode'
  ) then
    alter table public.practitioner_patients
      add column teen_mode boolean not null default false;
  end if;
end $$;

-- Migration idempotente : ajoute language_preference sur practitioners
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'practitioners'
      and column_name  = 'language_preference'
  ) then
    alter table public.practitioners
      add column language_preference text not null default 'fr';
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
    insert into public.patients (id, email, first_name, last_name)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'first_name', ''),
      coalesce(new.raw_user_meta_data ->> 'last_name', '')
    )
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

-- Praticien : lecture des profils de ses patients liés
drop policy if exists "patients_read_by_practitioner" on public.patients;
create policy "patients_read_by_practitioner" on public.patients
  for select using (
    exists (
      select 1 from public.practitioner_patients
      where practitioner_patients.patient_id = patients.id
        and practitioner_patients.practitioner_id = auth.uid()
    )
  );

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

-- Patient peut mettre à jour la config de ses propres modules actifs
-- (usage : marquer une carte de psychoéducation comme lue)
drop policy if exists "modules_patient_update" on public.patient_modules;
create policy "modules_patient_update" on public.patient_modules
  for update using (auth.uid() = patient_id and revoked_at is null);


-- 6. Évaluations C-SSRS (Columbia Suicide Severity Rating Scale — « Depuis la dernière visite »)
--    Outil d'hétéro-évaluation : rempli par le praticien pendant la consultation.
--    Données cliniques praticien — JAMAIS accessibles au patient.
--    ⚠️ Requiert un hébergement HDS pour usage commercial (données de santé sensibles).
--
--    Structure du formulaire :
--      ideation_answers  — 5 items binaires (Oui/Non) + champ texte libre « Si oui, décrivez »
--      intensite_ideation — 5 dimensions Likert (Fréquence, Durée, Maîtrise, Dissuasifs, Causes)
--                           NULL si Q1 = Non ET Q2 = Non
--      behavior_answers  — 4 items binaires + champ texte libre
--      nssi              — comportement auto-agressif non suicidaire (0/1)
--      nb_tentatives_*   — compteurs de tentatives
--      comportement_observe — comportement suicidaire observé par le praticien (0/1)
--      suicide_reussi    — (0/1)
--      date_tentative_plus_letale — date ISO
--      letalite_observee — 0–5 (lésions médicales observées)
--      letalite_potentielle — 0–2 (si létalité observée = 0 uniquement)
--      ideation_level    — niveau le plus élevé endorsé (0–5), calculé
--      behavior_count    — comportements endorsés (0–4), calculé
create table if not exists public.cssrs_screen_assessments (
  id                            uuid        primary key default gen_random_uuid(),
  patient_id                    uuid        not null references public.patients(id) on delete cascade,
  practitioner_id               uuid        not null references public.practitioners(id) on delete cascade,

  -- Idéation suicidaire (5 items)
  -- Format : [{"value": 0|1, "description": "..."}]
  ideation_answers              jsonb       not null default '[]',

  -- Intensité de l'idéation (null si Q1 = Non ET Q2 = Non)
  -- Format : {"frequence": 1-5, "duree": 1-5, "maitrise": 0-5, "dissuasifs": 0-5, "causes": 0-5}
  intensite_ideation            jsonb,

  -- Comportements suicidaires (4 items)
  -- Format : [{"value": 0|1, "description": "..."}]
  behavior_answers              jsonb       not null default '[]',

  -- Section complémentaire
  nssi                          smallint,   -- 0 = Non, 1 = Oui
  nb_tentatives_averees         smallint,
  nb_tentatives_interrompues    smallint,
  nb_tentatives_avortees        smallint,
  comportement_observe          smallint,   -- 0 = Non, 1 = Oui
  suicide_reussi                smallint,   -- 0 = Non, 1 = Oui
  date_tentative_plus_letale    date,
  letalite_observee             smallint,   -- 0–5
  letalite_potentielle          smallint,   -- 0–2 (uniquement si létalité observée = 0)

  -- Scores calculés (pour affichage rapide dans l'historique)
  ideation_level                smallint    not null default 0,
  behavior_count                smallint    not null default 0,

  assessed_at                   timestamptz not null default now()
);

create index if not exists idx_cssrs_patient
  on public.cssrs_screen_assessments(patient_id);

create index if not exists idx_cssrs_practitioner
  on public.cssrs_screen_assessments(practitioner_id);

alter table public.cssrs_screen_assessments enable row level security;

-- Praticien : accès total à ses propres évaluations
drop policy if exists "cssrs_practitioner" on public.cssrs_screen_assessments;
create policy "cssrs_practitioner" on public.cssrs_screen_assessments
  for all using (auth.uid() = practitioner_id);

-- Le patient n'a AUCUN accès (données cliniques praticien uniquement)


-- ============================================================
-- STORAGE — Bucket avatars (photos de profil patients)
-- ============================================================

-- Bucket public : les URLs sont lisibles sans authentification
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Chaque patient ne peut écrire que dans son propre dossier : avatars/{user_id}/
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

-- Lecture publique (bucket public, cohérence explicite)
drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public" on storage.objects
  for select using (bucket_id = 'avatars');


-- ============================================================
-- TABLE : patient_engagement_logs (Observance / Engagement)
-- ============================================================

-- Suivi anonymisé de l'activité patient (aucune donnée clinique)
-- event_type : ex. 'READ_CARD', 'FILL_SLEEP_DIARY', 'UPDATE_DECISIONAL_BALANCE'
-- metadata   : données contextuelles optionnelles (ex. { "card_id": "card_sleep_01" })

create table if not exists public.patient_engagement_logs (
  id          uuid        default gen_random_uuid() primary key,
  patient_id  uuid        references auth.users(id) on delete cascade,
  event_type  text        not null,
  metadata    jsonb       default '{}'::jsonb,
  created_at  timestamptz default now()
);

alter table public.patient_engagement_logs enable row level security;

-- Le patient peut insérer ses propres logs
drop policy if exists "Patients can insert their own logs" on public.patient_engagement_logs;
create policy "Patients can insert their own logs"
  on public.patient_engagement_logs for insert
  with check (auth.uid() = patient_id);

-- Le praticien peut voir les logs de ses patients liés
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
-- TABLES : psyedu_topics + psyedu_blocks
-- Contenu psychoéducatif structuré (fiches du module diet_weight_psycho et futurs modules)
-- Aucune donnée clinique — contenu éditorial global accessible à tout utilisateur authentifié
-- ============================================================

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
