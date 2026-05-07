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

-- Migration idempotente : ajoute les infos patient sur invitations
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'invitations'
      and column_name  = 'patient_first_name'
  ) then
    alter table public.invitations
      add column patient_first_name text,
      add column patient_last_name  text,
      add column patient_birth_date date,
      add column patient_sex        text,
      add column teen_mode          boolean not null default false;
  end if;
end $$;

-- Migration idempotente : ajoute les infos patient sur practitioner_patients
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'practitioner_patients'
      and column_name  = 'patient_first_name'
  ) then
    alter table public.practitioner_patients
      add column patient_first_name text,
      add column patient_last_name  text,
      add column patient_birth_date date,
      add column patient_sex        text;
  end if;
end $$;

-- Migration idempotente : ajoute pre_selected_modules sur invitations
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'invitations'
      and column_name  = 'pre_selected_modules'
  ) then
    alter table public.invitations
      add column pre_selected_modules text[] not null default '{}';
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

    -- Marquer l'invitation comme acceptée et créer la relation praticien-patient
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

      -- Créer les modules pré-sélectionnés lors de l'invitation
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
-- TABLE : module_categories (Organisation des modules en catégories)
-- ============================================================

-- Données de référence statiques : ordonnancement et groupement des module_type.
-- Lecture seule pour les praticiens authentifiés ; pas d'écriture côté app.

create table if not exists public.module_categories (
  id           text  primary key,
  label_key    text  not null,
  subtitle_key text  not null,
  sort_order   int   not null,
  modules      text[] not null default '{}'
);

alter table public.module_categories enable row level security;

drop policy if exists "module_categories_read" on public.module_categories;
create policy "module_categories_read" on public.module_categories
  for select to authenticated using (true);

-- Seed idempotent — ne remplace pas les modifications faites depuis la BDD
insert into public.module_categories (id, label_key, subtitle_key, sort_order, modules) values
  ('safety',     'patient.cat_safety_label',     'patient.cat_safety_subtitle',     1, array['crisis_plan','therapeutic_commitment','distress_tolerance']),
  ('iatrogenic', 'patient.cat_iatrogenic_label', 'patient.cat_iatrogenic_subtitle', 2, array['medication_side_effects','medication_adherence','psychoeducation']),
  ('lifestyle',  'patient.cat_lifestyle_label',  'patient.cat_lifestyle_subtitle',  3, array['sleep_diary','diet_weight_psycho','chronobiology_tracker']),
  ('emotion',    'patient.cat_emotion_label',    'patient.cat_emotion_subtitle',    4, array['mood_tracker','emotion_wheel','behavioral_activation']),
  ('cognitive',  'patient.cat_cognitive_label',  'patient.cat_cognitive_subtitle',  5, array['beck_columns','cognitive_distortions','grounding','rim']),
  ('anxiety',    'patient.cat_anxiety_label',    'patient.cat_anxiety_subtitle',    6, array['fear_thermometer','exposure_hierarchy','breathing_techniques','cognitive_saturation']),
  ('addiction',  'patient.cat_addiction_label',  'patient.cat_addiction_subtitle',  7, array['craving_journal','decisional_balance'])
on conflict (id) do nothing;


-- ============================================================
-- MIGRATION : module_categories — supprimer colonnes dépréciées
-- ============================================================

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


-- ============================================================
-- TABLE : modules (Référentiel des modules thérapeutiques)
-- ============================================================

-- Une ligne par module. preview_kind pilote le moteur de rendu côté client.
-- is_invite_excluded : exclu de la pré-sélection à l'invitation (config spéciale requise).

create table if not exists public.modules (
  id                 text    primary key,
  category_id        text    not null references public.module_categories(id),
  preview_kind       text    not null default 'coming_soon',
  sort_order         int     not null default 0,
  is_invite_excluded boolean not null default false
);

alter table public.modules enable row level security;

drop policy if exists "modules_read" on public.modules;
create policy "modules_read" on public.modules
  for select to authenticated using (true);

insert into public.modules (id, category_id, preview_kind, sort_order, is_invite_excluded) values
  ('crisis_plan',             'safety',      'steps',       1,  false),
  ('therapeutic_commitment',  'safety',      'coming_soon', 2,  false),
  ('distress_tolerance',      'safety',      'coming_soon', 3,  false),
  ('medication_side_effects', 'iatrogenic',  'fields',      4,  false),
  ('medication_adherence',    'iatrogenic',  'fields',      5,  false),
  ('psychoeducation',         'iatrogenic',  'cards',       6,  true),
  ('sleep_diary',             'lifestyle',   'fields',      7,  false),
  ('diet_weight_psycho',      'lifestyle',   'coming_soon', 8,  false),
  ('chronobiology_tracker',   'lifestyle',   'coming_soon', 9,  false),
  ('mood_tracker',            'emotion',     'fields',      10, false),
  ('emotion_wheel',           'emotion',     'coming_soon', 11, false),
  ('behavioral_activation',   'emotion',     'fields',      12, false),
  ('beck_columns',            'cognitive',   'steps',       13, false),
  ('cognitive_distortions',   'cognitive',   'coming_soon', 14, false),
  ('grounding',               'cognitive',   'coming_soon', 15, false),
  ('rim',                     'cognitive',   'coming_soon', 16, true),
  ('fear_thermometer',        'anxiety',     'fields',      17, false),
  ('exposure_hierarchy',      'anxiety',     'coming_soon', 18, false),
  ('breathing_techniques',    'anxiety',     'fields',      19, false),
  ('cognitive_saturation',    'anxiety',     'coming_soon', 20, false),
  ('craving_journal',         'addiction',   'coming_soon', 21, false),
  ('decisional_balance',      'addiction',   'grid2x2',     22, false)
on conflict (id) do nothing;


-- ============================================================
-- MIGRATION : ajouter icon, mobile_icon, color sur modules
-- ============================================================

do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'modules' and column_name = 'icon') then
    alter table public.modules add column icon        text not null default '';
    alter table public.modules add column mobile_icon text not null default '';
    alter table public.modules add column color       text not null default '#6366F1';
  end if;
end $$;

update public.modules set
  icon = case id
    when 'crisis_plan'             then 'shield'
    when 'therapeutic_commitment'  then 'handshake'
    when 'distress_tolerance'      then 'zap'
    when 'medication_side_effects' then 'pill'
    when 'medication_adherence'    then 'clipboard-list'
    when 'psychoeducation'         then 'book-open'
    when 'sleep_diary'             then 'moon'
    when 'diet_weight_psycho'      then 'apple'
    when 'chronobiology_tracker'   then 'clock'
    when 'mood_tracker'            then 'smile'
    when 'emotion_wheel'           then 'target'
    when 'behavioral_activation'   then 'activity'
    when 'beck_columns'            then 'brain'
    when 'cognitive_distortions'   then 'search'
    when 'grounding'               then 'leaf'
    when 'rim'                     then 'waves'
    when 'fear_thermometer'        then 'thermometer'
    when 'exposure_hierarchy'      then 'trending-up'
    when 'breathing_techniques'    then 'wind'
    when 'cognitive_saturation'    then 'refresh-cw'
    when 'craving_journal'         then 'bookmark'
    when 'decisional_balance'      then 'scale'
    else ''
  end,
  mobile_icon = case id
    when 'crisis_plan'             then 'lifebuoy'
    when 'therapeutic_commitment'  then 'handshake-outline'
    when 'distress_tolerance'      then 'shield-half-full'
    when 'medication_side_effects' then 'pill'
    when 'medication_adherence'    then 'calendar-check-outline'
    when 'psychoeducation'         then 'book-open-page-variant'
    when 'sleep_diary'             then 'weather-night'
    when 'diet_weight_psycho'      then 'food-apple-outline'
    when 'chronobiology_tracker'   then 'clock-outline'
    when 'mood_tracker'            then 'emoticon-outline'
    when 'emotion_wheel'           then 'palette'
    when 'behavioral_activation'   then 'run-fast'
    when 'beck_columns'            then 'brain'
    when 'cognitive_distortions'   then 'head-cog-outline'
    when 'grounding'               then 'hand-heart-outline'
    when 'rim'                     then 'waves'
    when 'fear_thermometer'        then 'thermometer'
    when 'exposure_hierarchy'      then 'stairs-up'
    when 'breathing_techniques'    then 'lungs'
    when 'cognitive_saturation'    then 'chat-processing-outline'
    when 'craving_journal'         then 'lightning-bolt-outline'
    when 'decisional_balance'      then 'scale-balance'
    else ''
  end,
  color = case id
    when 'crisis_plan'             then '#FF4D6D'
    when 'therapeutic_commitment'  then '#FF4D6D'
    when 'distress_tolerance'      then '#FF4D6D'
    when 'medication_side_effects' then '#8B5CF6'
    when 'medication_adherence'    then '#8B5CF6'
    when 'psychoeducation'         then '#8B5CF6'
    when 'sleep_diary'             then '#06B6D4'
    when 'diet_weight_psycho'      then '#06B6D4'
    when 'chronobiology_tracker'   then '#06B6D4'
    when 'mood_tracker'            then '#F97316'
    when 'emotion_wheel'           then '#F97316'
    when 'behavioral_activation'   then '#F97316'
    when 'beck_columns'            then '#10B981'
    when 'cognitive_distortions'   then '#10B981'
    when 'grounding'               then '#10B981'
    when 'rim'                     then '#10B981'
    when 'fear_thermometer'        then '#F59E0B'
    when 'exposure_hierarchy'      then '#F59E0B'
    when 'breathing_techniques'    then '#F59E0B'
    when 'cognitive_saturation'    then '#F59E0B'
    when 'craving_journal'         then '#EC4899'
    when 'decisional_balance'      then '#EC4899'
    else '#6366F1'
  end
where icon = '';


-- ============================================================
-- TABLE : module_content_fields (Champs de contenu — 1 ligne = 1 champ)
-- ============================================================

-- field_type → composant React (22 types)
-- parent_field_id : pour les spans inline — field_type toujours 'card_inline', rendu piloté par les props 'bold'='true' ou 'italic'='true'
-- text_code : clé i18n — NULL pour card_divider et coming_soon

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
-- Pilote les variantes visuelles/comportementales des composants React.

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

-- Paramètres de la bibliothèque de modules du praticien.
-- enabled_modules : liste des module_type activés pour ce praticien.
-- Si aucune ligne n'existe pour un praticien → tous les modules sont disponibles.

create table if not exists public.practitioner_module_settings (
  practitioner_id  uuid        primary key references public.practitioners(id) on delete cascade,
  enabled_modules  text[]      not null default '{}',
  updated_at       timestamptz not null default now()
);

alter table public.practitioner_module_settings enable row level security;

-- Le praticien peut lire et modifier uniquement ses propres paramètres
drop policy if exists "module_settings_own" on public.practitioner_module_settings;
create policy "module_settings_own" on public.practitioner_module_settings
  for all using (auth.uid() = practitioner_id);


-- ============================================================
-- MIGRATION : remplacer les icônes emoji par des noms lucide-react
-- ============================================================

UPDATE public.field_props
SET prop_value = CASE prop_value
  WHEN '🌙'   THEN 'moon'
  WHEN '😴'   THEN 'moon'
  WHEN '☀️'  THEN 'sun'
  WHEN '⭐'   THEN 'star'
  WHEN '🔔'   THEN 'bell'
  WHEN '⏱️'  THEN 'timer'
  WHEN '⏳'   THEN 'hourglass'
  WHEN '📅'   THEN 'calendar'
  WHEN '📝'   THEN 'pen-line'
  WHEN '✅'   THEN 'check-circle'
  WHEN '🏃'   THEN 'activity'
  WHEN '🌡️' THEN 'thermometer'
  WHEN '📍'   THEN 'map-pin'
  WHEN '🛠️' THEN 'wrench'
  WHEN '○'    THEN 'circle'
  WHEN '◑'    THEN 'circle-dashed'
  WHEN '💙'   THEN 'heart'
  WHEN '💓'   THEN 'heart'
  WHEN '🔵'   THEN 'circle'
  WHEN '🟠'   THEN 'circle'
  WHEN '🟢'   THEN 'circle'
  WHEN '🟣'   THEN 'circle'
  WHEN '💧'   THEN 'droplet'
  WHEN '🤝'   THEN 'handshake'
  WHEN '🤢'   THEN 'alert-triangle'
  WHEN '⚡'   THEN 'zap'
  WHEN '🌿'   THEN 'leaf'
  WHEN '😊'   THEN 'smile'
  WHEN '😨'   THEN 'frown'
  ELSE prop_value
END
WHERE prop_key = 'icon';


-- ============================================================
-- MIGRATION : ajouter widget_type aux field_rows
-- ============================================================

INSERT INTO public.field_props (field_id, prop_key, prop_value) VALUES
  -- sleep_diary
  ('sleep.field_1', 'widget_type', 'time'),
  ('sleep.field_2', 'widget_type', 'time'),
  ('sleep.field_3', 'widget_type', 'slider:0:120:min'),
  ('sleep.field_4', 'widget_type', 'slider:0:10'),
  ('sleep.field_5', 'widget_type', 'slider:0:120:min'),
  ('sleep.field_6', 'widget_type', 'stars:5'),
  ('sleep.field_7', 'widget_type', 'boolean'),
  ('sleep.field_8', 'widget_type', 'textarea'),
  -- mood_tracker
  ('mood.field_1', 'widget_type', 'slider:1:10'),
  ('mood.field_2', 'widget_type', 'slider:1:10'),
  ('mood.field_3', 'widget_type', 'slider:1:10'),
  ('mood.field_4', 'widget_type', 'slider:1:10'),
  ('mood.field_5', 'widget_type', 'textarea'),
  -- medication_side_effects
  ('mse.field_1', 'widget_type', 'slider:0:3'),
  ('mse.field_2', 'widget_type', 'slider:0:3'),
  ('mse.field_3', 'widget_type', 'slider:0:3'),
  ('mse.field_4', 'widget_type', 'slider:0:3'),
  ('mse.field_5', 'widget_type', 'slider:0:3'),
  ('mse.field_6', 'widget_type', 'slider:0:3'),
  ('mse.field_7', 'widget_type', 'textarea'),
  -- medication_adherence
  ('madh.field_1', 'widget_type', 'radio:ok'),
  ('madh.field_2', 'widget_type', 'radio:partial'),
  ('madh.field_3', 'widget_type', 'radio:miss'),
  ('madh.field_4', 'widget_type', 'textarea'),
  ('madh.field_5', 'widget_type', 'info'),
  -- behavioral_activation
  ('ba.field_1', 'widget_type', 'date'),
  ('ba.field_2', 'widget_type', 'text'),
  ('ba.field_3', 'widget_type', 'checkbox'),
  ('ba.field_4', 'widget_type', 'slider:0:10'),
  ('ba.field_5', 'widget_type', 'slider:0:10'),
  ('ba.field_6', 'widget_type', 'textarea'),
  -- fear_thermometer
  ('ft.field_1', 'widget_type', 'text'),
  ('ft.field_2', 'widget_type', 'slider:0:10'),
  ('ft.field_3', 'widget_type', 'text'),
  ('ft.field_4', 'widget_type', 'slider:0:10'),
  ('ft.field_5', 'widget_type', 'textarea'),
  -- breathing_techniques
  ('bt.field_1', 'widget_type', 'info'),
  ('bt.field_2', 'widget_type', 'info'),
  ('bt.field_3', 'widget_type', 'info'),
  ('bt.field_4', 'widget_type', 'info'),
  ('bt.field_5', 'widget_type', 'info'),
  ('bt.field_6', 'widget_type', 'text')
ON CONFLICT (field_id, prop_key) DO NOTHING;


-- ============================================================
-- MIGRATION : Questionnaires cliniques génériques
-- PHQ-9, GAD-7, BSL-23, SNAP-IV, ASRS-6, ASRS-18
-- preview_kind = 'questionnaire' → ScaleEntryScreen / ScaleHistoryScreen
-- ============================================================

-- Catégorie pour les questionnaires d'évaluation
INSERT INTO public.module_categories (id, sort_order)
VALUES ('assessments', 8)
ON CONFLICT (id) DO NOTHING;

-- Modules
INSERT INTO public.modules (id, category_id, preview_kind, sort_order, is_invite_excluded, icon, mobile_icon, color)
VALUES
  ('phq9',    'assessments', 'questionnaire', 23, false, 'clipboard-list', 'clipboard-text-outline', '#6366F1'),
  ('gad7',    'assessments', 'questionnaire', 24, false, 'clipboard-list', 'clipboard-text-outline', '#6366F1'),
  ('bsl23',   'assessments', 'questionnaire', 25, false, 'clipboard-list', 'clipboard-text-outline', '#6366F1'),
  ('snap_iv', 'assessments', 'questionnaire', 26, false, 'clipboard-list', 'clipboard-text-outline', '#6366F1'),
  ('asrs6',   'assessments', 'questionnaire', 27, false, 'clipboard-list', 'clipboard-text-outline', '#6366F1'),
  ('asrs18',  'assessments', 'questionnaire', 28, false, 'clipboard-list', 'clipboard-text-outline', '#6366F1')
ON CONFLICT (id) DO UPDATE SET preview_kind = EXCLUDED.preview_kind;

-- ── PHQ-9 ─────────────────────────────────────────────────────────────────────
INSERT INTO public.module_content_fields (id, module_id, field_type, text_code, sort_order) VALUES
  ('phq9.instr1', 'phq9', 'scale_instruction', 'modules.phq9.instructions_1', 0),
  ('phq9.instr2', 'phq9', 'scale_instruction', 'modules.phq9.instructions_2', 1),
  ('phq9.opt0',   'phq9', 'scale_option',       'modules.phq9.opt_0',          10),
  ('phq9.opt1',   'phq9', 'scale_option',       'modules.phq9.opt_1',          11),
  ('phq9.opt2',   'phq9', 'scale_option',       'modules.phq9.opt_2',          12),
  ('phq9.opt3',   'phq9', 'scale_option',       'modules.phq9.opt_3',          13),
  ('phq9.q1',     'phq9', 'scale_question',     'modules.phq9.q1',             100),
  ('phq9.q2',     'phq9', 'scale_question',     'modules.phq9.q2',             101),
  ('phq9.q3',     'phq9', 'scale_question',     'modules.phq9.q3',             102),
  ('phq9.q4',     'phq9', 'scale_question',     'modules.phq9.q4',             103),
  ('phq9.q5',     'phq9', 'scale_question',     'modules.phq9.q5',             104),
  ('phq9.q6',     'phq9', 'scale_question',     'modules.phq9.q6',             105),
  ('phq9.q7',     'phq9', 'scale_question',     'modules.phq9.q7',             106),
  ('phq9.q8',     'phq9', 'scale_question',     'modules.phq9.q8',             107),
  ('phq9.q9',     'phq9', 'scale_question',     'modules.phq9.q9',             108),
  ('phq9.footer', 'phq9', 'footer_note',         'modules.phq9.footer',         999)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.field_props (field_id, prop_key, prop_value) VALUES
  ('phq9.opt0', 'value', '0'), ('phq9.opt1', 'value', '1'),
  ('phq9.opt2', 'value', '2'), ('phq9.opt3', 'value', '3')
ON CONFLICT (field_id, prop_key) DO NOTHING;

-- ── GAD-7 ─────────────────────────────────────────────────────────────────────
INSERT INTO public.module_content_fields (id, module_id, field_type, text_code, sort_order) VALUES
  ('gad7.instr1', 'gad7', 'scale_instruction', 'modules.gad7.instructions_1', 0),
  ('gad7.instr2', 'gad7', 'scale_instruction', 'modules.gad7.instructions_2', 1),
  ('gad7.opt0',   'gad7', 'scale_option',       'modules.gad7.opt_0',          10),
  ('gad7.opt1',   'gad7', 'scale_option',       'modules.gad7.opt_1',          11),
  ('gad7.opt2',   'gad7', 'scale_option',       'modules.gad7.opt_2',          12),
  ('gad7.opt3',   'gad7', 'scale_option',       'modules.gad7.opt_3',          13),
  ('gad7.q1',     'gad7', 'scale_question',     'modules.gad7.q1',             100),
  ('gad7.q2',     'gad7', 'scale_question',     'modules.gad7.q2',             101),
  ('gad7.q3',     'gad7', 'scale_question',     'modules.gad7.q3',             102),
  ('gad7.q4',     'gad7', 'scale_question',     'modules.gad7.q4',             103),
  ('gad7.q5',     'gad7', 'scale_question',     'modules.gad7.q5',             104),
  ('gad7.q6',     'gad7', 'scale_question',     'modules.gad7.q6',             105),
  ('gad7.q7',     'gad7', 'scale_question',     'modules.gad7.q7',             106),
  ('gad7.footer', 'gad7', 'footer_note',         'modules.gad7.footer',         999)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.field_props (field_id, prop_key, prop_value) VALUES
  ('gad7.opt0', 'value', '0'), ('gad7.opt1', 'value', '1'),
  ('gad7.opt2', 'value', '2'), ('gad7.opt3', 'value', '3')
ON CONFLICT (field_id, prop_key) DO NOTHING;

-- ── BSL-23 ────────────────────────────────────────────────────────────────────
INSERT INTO public.module_content_fields (id, module_id, field_type, text_code, sort_order) VALUES
  ('bsl23.instr1', 'bsl23', 'scale_instruction', 'modules.bsl23.instructions_1', 0),
  ('bsl23.instr2', 'bsl23', 'scale_instruction', 'modules.bsl23.instructions_2', 1),
  ('bsl23.opt0',   'bsl23', 'scale_option',       'modules.bsl23.opt_0',          10),
  ('bsl23.opt1',   'bsl23', 'scale_option',       'modules.bsl23.opt_1',          11),
  ('bsl23.opt2',   'bsl23', 'scale_option',       'modules.bsl23.opt_2',          12),
  ('bsl23.opt3',   'bsl23', 'scale_option',       'modules.bsl23.opt_3',          13),
  ('bsl23.opt4',   'bsl23', 'scale_option',       'modules.bsl23.opt_4',          14),
  ('bsl23.leg0',   'bsl23', 'scale_legend_item',  'modules.bsl23.legend_0',       20),
  ('bsl23.leg1',   'bsl23', 'scale_legend_item',  'modules.bsl23.legend_1',       21),
  ('bsl23.leg2',   'bsl23', 'scale_legend_item',  'modules.bsl23.legend_2',       22),
  ('bsl23.leg3',   'bsl23', 'scale_legend_item',  'modules.bsl23.legend_3',       23),
  ('bsl23.leg4',   'bsl23', 'scale_legend_item',  'modules.bsl23.legend_4',       24),
  ('bsl23.q1',     'bsl23', 'scale_question',     'modules.bsl23.q1',             100),
  ('bsl23.q2',     'bsl23', 'scale_question',     'modules.bsl23.q2',             101),
  ('bsl23.q3',     'bsl23', 'scale_question',     'modules.bsl23.q3',             102),
  ('bsl23.q4',     'bsl23', 'scale_question',     'modules.bsl23.q4',             103),
  ('bsl23.q5',     'bsl23', 'scale_question',     'modules.bsl23.q5',             104),
  ('bsl23.q6',     'bsl23', 'scale_question',     'modules.bsl23.q6',             105),
  ('bsl23.q7',     'bsl23', 'scale_question',     'modules.bsl23.q7',             106),
  ('bsl23.q8',     'bsl23', 'scale_question',     'modules.bsl23.q8',             107),
  ('bsl23.q9',     'bsl23', 'scale_question',     'modules.bsl23.q9',             108),
  ('bsl23.q10',    'bsl23', 'scale_question',     'modules.bsl23.q10',            109),
  ('bsl23.q11',    'bsl23', 'scale_question',     'modules.bsl23.q11',            110),
  ('bsl23.q12',    'bsl23', 'scale_question',     'modules.bsl23.q12',            111),
  ('bsl23.q13',    'bsl23', 'scale_question',     'modules.bsl23.q13',            112),
  ('bsl23.q14',    'bsl23', 'scale_question',     'modules.bsl23.q14',            113),
  ('bsl23.q15',    'bsl23', 'scale_question',     'modules.bsl23.q15',            114),
  ('bsl23.q16',    'bsl23', 'scale_question',     'modules.bsl23.q16',            115),
  ('bsl23.q17',    'bsl23', 'scale_question',     'modules.bsl23.q17',            116),
  ('bsl23.q18',    'bsl23', 'scale_question',     'modules.bsl23.q18',            117),
  ('bsl23.q19',    'bsl23', 'scale_question',     'modules.bsl23.q19',            118),
  ('bsl23.q20',    'bsl23', 'scale_question',     'modules.bsl23.q20',            119),
  ('bsl23.q21',    'bsl23', 'scale_question',     'modules.bsl23.q21',            120),
  ('bsl23.q22',    'bsl23', 'scale_question',     'modules.bsl23.q22',            121),
  ('bsl23.q23',    'bsl23', 'scale_question',     'modules.bsl23.q23',            122),
  ('bsl23.footer', 'bsl23', 'footer_note',         'modules.bsl23.footer',         999)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.field_props (field_id, prop_key, prop_value) VALUES
  ('bsl23.opt0', 'value', '0'), ('bsl23.opt1', 'value', '1'), ('bsl23.opt2', 'value', '2'),
  ('bsl23.opt3', 'value', '3'), ('bsl23.opt4', 'value', '4'),
  ('bsl23.leg0', 'value', '0'), ('bsl23.leg1', 'value', '1'), ('bsl23.leg2', 'value', '2'),
  ('bsl23.leg3', 'value', '3'), ('bsl23.leg4', 'value', '4')
ON CONFLICT (field_id, prop_key) DO NOTHING;

-- ── SNAP-IV ───────────────────────────────────────────────────────────────────
INSERT INTO public.module_content_fields (id, module_id, field_type, text_code, sort_order) VALUES
  ('snap_iv.instr1',  'snap_iv', 'scale_instruction', 'modules.snap_iv.instructions_1',        0),
  ('snap_iv.instr2',  'snap_iv', 'scale_instruction', 'modules.snap_iv.instructions_2',        1),
  ('snap_iv.opt0',    'snap_iv', 'scale_option',       'modules.snap_iv.opt_0',                 10),
  ('snap_iv.opt1',    'snap_iv', 'scale_option',       'modules.snap_iv.opt_1',                 11),
  ('snap_iv.opt2',    'snap_iv', 'scale_option',       'modules.snap_iv.opt_2',                 12),
  ('snap_iv.opt3',    'snap_iv', 'scale_option',       'modules.snap_iv.opt_3',                 13),
  ('snap_iv.warn',    'snap_iv', 'scale_warning',      'modules.snap_iv.warning',               30),
  ('snap_iv.sec_i',   'snap_iv', 'scale_section',      'modules.snap_iv.section_inattention',   100),
  ('snap_iv.q1',      'snap_iv', 'scale_question',     'modules.snap_iv.q1',                    101),
  ('snap_iv.q2',      'snap_iv', 'scale_question',     'modules.snap_iv.q2',                    102),
  ('snap_iv.q3',      'snap_iv', 'scale_question',     'modules.snap_iv.q3',                    103),
  ('snap_iv.q4',      'snap_iv', 'scale_question',     'modules.snap_iv.q4',                    104),
  ('snap_iv.q5',      'snap_iv', 'scale_question',     'modules.snap_iv.q5',                    105),
  ('snap_iv.q6',      'snap_iv', 'scale_question',     'modules.snap_iv.q6',                    106),
  ('snap_iv.q7',      'snap_iv', 'scale_question',     'modules.snap_iv.q7',                    107),
  ('snap_iv.q8',      'snap_iv', 'scale_question',     'modules.snap_iv.q8',                    108),
  ('snap_iv.q9',      'snap_iv', 'scale_question',     'modules.snap_iv.q9',                    109),
  ('snap_iv.sec_hi',  'snap_iv', 'scale_section',      'modules.snap_iv.section_hyperactivite', 200),
  ('snap_iv.q10',     'snap_iv', 'scale_question',     'modules.snap_iv.q10',                   201),
  ('snap_iv.q11',     'snap_iv', 'scale_question',     'modules.snap_iv.q11',                   202),
  ('snap_iv.q12',     'snap_iv', 'scale_question',     'modules.snap_iv.q12',                   203),
  ('snap_iv.q13',     'snap_iv', 'scale_question',     'modules.snap_iv.q13',                   204),
  ('snap_iv.q14',     'snap_iv', 'scale_question',     'modules.snap_iv.q14',                   205),
  ('snap_iv.q15',     'snap_iv', 'scale_question',     'modules.snap_iv.q15',                   206),
  ('snap_iv.q16',     'snap_iv', 'scale_question',     'modules.snap_iv.q16',                   207),
  ('snap_iv.q17',     'snap_iv', 'scale_question',     'modules.snap_iv.q17',                   208),
  ('snap_iv.q18',     'snap_iv', 'scale_question',     'modules.snap_iv.q18',                   209),
  ('snap_iv.sec_tod', 'snap_iv', 'scale_section',      'modules.snap_iv.section_tod',           300),
  ('snap_iv.q19',     'snap_iv', 'scale_question',     'modules.snap_iv.q19',                   301),
  ('snap_iv.q20',     'snap_iv', 'scale_question',     'modules.snap_iv.q20',                   302),
  ('snap_iv.q21',     'snap_iv', 'scale_question',     'modules.snap_iv.q21',                   303),
  ('snap_iv.q22',     'snap_iv', 'scale_question',     'modules.snap_iv.q22',                   304),
  ('snap_iv.q23',     'snap_iv', 'scale_question',     'modules.snap_iv.q23',                   305),
  ('snap_iv.q24',     'snap_iv', 'scale_question',     'modules.snap_iv.q24',                   306),
  ('snap_iv.q25',     'snap_iv', 'scale_question',     'modules.snap_iv.q25',                   307),
  ('snap_iv.q26',     'snap_iv', 'scale_question',     'modules.snap_iv.q26',                   308),
  ('snap_iv.footer',  'snap_iv', 'footer_note',         'modules.snap_iv.footer',                999)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.field_props (field_id, prop_key, prop_value) VALUES
  ('snap_iv.opt0', 'value', '0'), ('snap_iv.opt1', 'value', '1'),
  ('snap_iv.opt2', 'value', '2'), ('snap_iv.opt3', 'value', '3')
ON CONFLICT (field_id, prop_key) DO NOTHING;

-- ── ASRS-6 ────────────────────────────────────────────────────────────────────
INSERT INTO public.module_content_fields (id, module_id, field_type, text_code, sort_order) VALUES
  ('asrs6.instr1', 'asrs6', 'scale_instruction', 'modules.asrs6.instructions_1', 0),
  ('asrs6.instr2', 'asrs6', 'scale_instruction', 'modules.asrs6.instructions_2', 1),
  ('asrs6.opt0',   'asrs6', 'scale_option',       'modules.asrs6.opt_0',          10),
  ('asrs6.opt1',   'asrs6', 'scale_option',       'modules.asrs6.opt_1',          11),
  ('asrs6.opt2',   'asrs6', 'scale_option',       'modules.asrs6.opt_2',          12),
  ('asrs6.opt3',   'asrs6', 'scale_option',       'modules.asrs6.opt_3',          13),
  ('asrs6.opt4',   'asrs6', 'scale_option',       'modules.asrs6.opt_4',          14),
  ('asrs6.q1',     'asrs6', 'scale_question',     'modules.asrs6.q1',             100),
  ('asrs6.q2',     'asrs6', 'scale_question',     'modules.asrs6.q2',             101),
  ('asrs6.q3',     'asrs6', 'scale_question',     'modules.asrs6.q3',             102),
  ('asrs6.q4',     'asrs6', 'scale_question',     'modules.asrs6.q4',             103),
  ('asrs6.q5',     'asrs6', 'scale_question',     'modules.asrs6.q5',             104),
  ('asrs6.q6',     'asrs6', 'scale_question',     'modules.asrs6.q6',             105),
  ('asrs6.footer', 'asrs6', 'footer_note',         'modules.asrs6.footer',         999)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.field_props (field_id, prop_key, prop_value) VALUES
  ('asrs6.opt0', 'value', '0'), ('asrs6.opt1', 'value', '1'), ('asrs6.opt2', 'value', '2'),
  ('asrs6.opt3', 'value', '3'), ('asrs6.opt4', 'value', '4')
ON CONFLICT (field_id, prop_key) DO NOTHING;

-- ── ASRS-18 ───────────────────────────────────────────────────────────────────
INSERT INTO public.module_content_fields (id, module_id, field_type, text_code, sort_order) VALUES
  ('asrs18.instr1', 'asrs18', 'scale_instruction', 'modules.asrs18.instructions_1', 0),
  ('asrs18.instr2', 'asrs18', 'scale_instruction', 'modules.asrs18.instructions_2', 1),
  ('asrs18.opt0',   'asrs18', 'scale_option',       'modules.asrs18.opt_0',          10),
  ('asrs18.opt1',   'asrs18', 'scale_option',       'modules.asrs18.opt_1',          11),
  ('asrs18.opt2',   'asrs18', 'scale_option',       'modules.asrs18.opt_2',          12),
  ('asrs18.opt3',   'asrs18', 'scale_option',       'modules.asrs18.opt_3',          13),
  ('asrs18.opt4',   'asrs18', 'scale_option',       'modules.asrs18.opt_4',          14),
  ('asrs18.sec_a',  'asrs18', 'scale_section',      'modules.asrs18.section_part_a', 100),
  ('asrs18.q1',     'asrs18', 'scale_question',     'modules.asrs18.q1',             101),
  ('asrs18.q2',     'asrs18', 'scale_question',     'modules.asrs18.q2',             102),
  ('asrs18.q3',     'asrs18', 'scale_question',     'modules.asrs18.q3',             103),
  ('asrs18.q4',     'asrs18', 'scale_question',     'modules.asrs18.q4',             104),
  ('asrs18.q5',     'asrs18', 'scale_question',     'modules.asrs18.q5',             105),
  ('asrs18.q6',     'asrs18', 'scale_question',     'modules.asrs18.q6',             106),
  ('asrs18.sec_b',  'asrs18', 'scale_section',      'modules.asrs18.section_part_b', 200),
  ('asrs18.q7',     'asrs18', 'scale_question',     'modules.asrs18.q7',             201),
  ('asrs18.q8',     'asrs18', 'scale_question',     'modules.asrs18.q8',             202),
  ('asrs18.q9',     'asrs18', 'scale_question',     'modules.asrs18.q9',             203),
  ('asrs18.q10',    'asrs18', 'scale_question',     'modules.asrs18.q10',            204),
  ('asrs18.q11',    'asrs18', 'scale_question',     'modules.asrs18.q11',            205),
  ('asrs18.q12',    'asrs18', 'scale_question',     'modules.asrs18.q12',            206),
  ('asrs18.q13',    'asrs18', 'scale_question',     'modules.asrs18.q13',            207),
  ('asrs18.q14',    'asrs18', 'scale_question',     'modules.asrs18.q14',            208),
  ('asrs18.q15',    'asrs18', 'scale_question',     'modules.asrs18.q15',            209),
  ('asrs18.q16',    'asrs18', 'scale_question',     'modules.asrs18.q16',            210),
  ('asrs18.q17',    'asrs18', 'scale_question',     'modules.asrs18.q17',            211),
  ('asrs18.q18',    'asrs18', 'scale_question',     'modules.asrs18.q18',            212),
  ('asrs18.footer', 'asrs18', 'footer_note',         'modules.asrs18.footer',         999)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.field_props (field_id, prop_key, prop_value) VALUES
  ('asrs18.opt0', 'value', '0'), ('asrs18.opt1', 'value', '1'), ('asrs18.opt2', 'value', '2'),
  ('asrs18.opt3', 'value', '3'), ('asrs18.opt4', 'value', '4')
ON CONFLICT (field_id, prop_key) DO NOTHING;


-- ============================================================
-- MIGRATION : medication_adherence → daily_checkin
-- preview_kind = 'daily_checkin' → DailyCheckinLayout (FieldRenderer)
-- 1 saisie / jour, UPSERT sur (module_id, date) en local SQLite (daily_entries),
-- signal logEvent('SAVE_MEDICATION_ADHERENCE') côté Supabase.
-- ============================================================

UPDATE public.modules SET preview_kind = 'daily_checkin' WHERE id = 'medication_adherence';

-- Champs UI (sans section)
INSERT INTO public.module_content_fields (id, module_id, field_type, text_code, sort_order) VALUES
  ('madh.cfg',                'medication_adherence', 'daily_checkin_config',         NULL,                                              0),
  ('madh.tab_today',          'medication_adherence', 'daily_tab_today_label',         'modules.medication_adherence.tab_today',          5),
  ('madh.tab_history',        'medication_adherence', 'daily_tab_history_label',       'modules.medication_adherence.tab_history',        6),
  ('madh.today_label',        'medication_adherence', 'daily_today_label',             'modules.medication_adherence.today_label',        10),
  ('madh.already_saved',      'medication_adherence', 'daily_already_saved_label',     'modules.medication_adherence.already_saved',      11),
  ('madh.question',           'medication_adherence', 'daily_question',                'modules.medication_adherence.intro',               20),
  ('madh.opt_taken',          'medication_adherence', 'daily_status_option',           'modules.medication_adherence.status_taken',       30),
  ('madh.opt_partial',        'medication_adherence', 'daily_status_option',           'modules.medication_adherence.status_partial',     31),
  ('madh.opt_missed',         'medication_adherence', 'daily_status_option',           'modules.medication_adherence.status_missed',      32),
  ('madh.notes_label',        'medication_adherence', 'daily_notes_label',             'common.notes_optional',                            40),
  ('madh.notes_placeholder',  'medication_adherence', 'daily_notes_placeholder',       'modules.medication_adherence.notes_placeholder',  41),
  ('madh.save_label',         'medication_adherence', 'daily_save_label',              'modules.medication_adherence.save',                50),
  ('madh.update_label',       'medication_adherence', 'daily_update_label',            'common.update',                                    51),
  ('madh.history_empty',      'medication_adherence', 'daily_history_empty_text',      'modules.medication_adherence.empty_history',      60),
  ('madh.missing_title',      'medication_adherence', 'daily_status_missing_title',    'modules.medication_adherence.status_missing',     70),
  ('madh.missing_msg',        'medication_adherence', 'daily_status_missing_msg',      'modules.medication_adherence.status_missing_msg', 71),
  ('madh.delete_title',       'medication_adherence', 'daily_delete_title',            'modules.medication_adherence.delete_entry_title', 72),
  ('madh.saved_message',      'medication_adherence', 'daily_saved_message',           'modules.medication_adherence.saved_message',      73)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.field_props (field_id, prop_key, prop_value) VALUES
  ('madh.cfg',          'engagement_event_type', 'SAVE_MEDICATION_ADHERENCE'),
  -- Status options : value, icon (MaterialCommunityIcons), color (icône + bordure sélectionnée), bg_color (fond sélectionné)
  ('madh.opt_taken',    'value',    'taken'),
  ('madh.opt_taken',    'icon',     'check-circle-outline'),
  ('madh.opt_taken',    'color',    '#10B981'),
  ('madh.opt_taken',    'bg_color', '#ECFDF5'),
  ('madh.opt_partial',  'value',    'partial'),
  ('madh.opt_partial',  'icon',     'circle-half-full'),
  ('madh.opt_partial',  'color',    '#F59E0B'),
  ('madh.opt_partial',  'bg_color', '#FFFBEB'),
  ('madh.opt_missed',   'value',    'missed'),
  ('madh.opt_missed',   'icon',     'circle-outline'),
  ('madh.opt_missed',   'color',    '#6B7280'),
  ('madh.opt_missed',   'bg_color', '#F3F4F6')
ON CONFLICT (field_id, prop_key) DO NOTHING;


-- ============================================================
-- MIGRATION : beck_columns → column_form
-- preview_kind = 'column_form' → ColumnFormLayout (FieldRenderer)
-- N enregistrements / module dans `form_entries` (JSON values).
-- 5 colonnes TCC (sections) avec champs texte + sliders 0–100 hétérogènes.
-- Signal logEvent('SAVE_BECK_THOUGHT_RECORD') côté Supabase.
-- ============================================================

UPDATE public.modules SET preview_kind = 'column_form' WHERE id = 'beck_columns';

-- Champs UI (sans section)
INSERT INTO public.module_content_fields (id, module_id, field_type, text_code, sort_order) VALUES
  ('beck.cfg',              'beck_columns', 'column_form_config',           NULL,                                            0),
  ('beck.new_btn',          'beck_columns', 'column_form_new_btn_label',     'modules.beck_columns.new_thought',              1),
  ('beck.save_label',       'beck_columns', 'column_form_save_label',        'modules.beck_columns.save',                     2),
  ('beck.empty_title',      'beck_columns', 'column_form_empty_title',       'modules.beck_columns.empty_title',              3),
  ('beck.empty_text',       'beck_columns', 'column_form_empty_text',        'modules.beck_columns.intro',                    4),
  ('beck.delete_title',     'beck_columns', 'column_form_delete_title',      'modules.beck_columns.delete_record_title',      5),
  ('beck.validation_title', 'beck_columns', 'column_form_validation_title',  'modules.beck_columns.empty_alert_title',        6),
  ('beck.validation_msg',   'beck_columns', 'column_form_validation_msg',    'modules.beck_columns.empty_alert_msg',          7)
ON CONFLICT (id) DO NOTHING;

-- Colonnes (column_header) — sections triées 10/20/30/40/50
INSERT INTO public.module_content_fields (id, module_id, field_type, text_code, section_id, sort_order) VALUES
  ('beck.col1.h', 'beck_columns', 'column_header', 'modules.beck_columns.entry_col_1_title', 'beck.col_situation', 10),
  ('beck.col2.h', 'beck_columns', 'column_header', 'modules.beck_columns.entry_col_2_title', 'beck.col_emotion',   20),
  ('beck.col3.h', 'beck_columns', 'column_header', 'modules.beck_columns.entry_col_3_title', 'beck.col_thought',   30),
  ('beck.col4.h', 'beck_columns', 'column_header', 'modules.beck_columns.entry_col_4_title', 'beck.col_rational',  40),
  ('beck.col5.h', 'beck_columns', 'column_header', 'modules.beck_columns.entry_col_5_title', 'beck.col_outcome',   50)
ON CONFLICT (id) DO NOTHING;

-- Champs enfants des colonnes (parent_field_id = id du column_header)
INSERT INTO public.module_content_fields (id, module_id, field_type, text_code, section_id, parent_field_id, sort_order) VALUES
  -- Colonne 1 — Situation : 1 champ texte multilignes
  ('beck.col1.text',   'beck_columns', 'column_text_field',   'modules.beck_columns.entry_col_1_placeholder', 'beck.col_situation', 'beck.col1.h', 11),
  -- Colonne 2 — Émotion : 1 texte mono-ligne + 1 slider intensité
  ('beck.col2.text',   'beck_columns', 'column_text_field',   'modules.beck_columns.entry_col_2_placeholder', 'beck.col_emotion',   'beck.col2.h', 21),
  ('beck.col2.slider', 'beck_columns', 'column_slider_field', 'modules.beck_columns.entry_col_2_intensity',   'beck.col_emotion',   'beck.col2.h', 22),
  -- Colonne 3 — Pensée auto : 1 texte multilignes + 1 slider belief
  ('beck.col3.text',   'beck_columns', 'column_text_field',   'modules.beck_columns.entry_col_3_placeholder', 'beck.col_thought',   'beck.col3.h', 31),
  ('beck.col3.slider', 'beck_columns', 'column_slider_field', 'modules.beck_columns.entry_col_3_belief',      'beck.col_thought',   'beck.col3.h', 32),
  -- Colonne 4 — Réponse rationnelle : 1 texte multilignes haut
  ('beck.col4.text',   'beck_columns', 'column_text_field',   'modules.beck_columns.entry_col_4_placeholder', 'beck.col_rational',  'beck.col4.h', 41),
  -- Colonne 5 — Résultat : 1 texte mono-ligne + 2 sliders (intensité, belief)
  ('beck.col5.text',   'beck_columns', 'column_text_field',   'modules.beck_columns.entry_col_5_placeholder', 'beck.col_outcome',   'beck.col5.h', 51),
  ('beck.col5.intens', 'beck_columns', 'column_slider_field', 'modules.beck_columns.entry_col_5_intensity',   'beck.col_outcome',   'beck.col5.h', 52),
  ('beck.col5.belief', 'beck_columns', 'column_slider_field', 'modules.beck_columns.entry_col_5_belief',      'beck.col_outcome',   'beck.col5.h', 53)
ON CONFLICT (id) DO NOTHING;

-- Props : config + headers + champs enfants
INSERT INTO public.field_props (field_id, prop_key, prop_value) VALUES
  ('beck.cfg', 'engagement_event_type', 'SAVE_BECK_THOUGHT_RECORD'),
  ('beck.cfg', 'required_keys_any',     'situation,automatic_thought'),

  -- Headers : color (accent), step_number, hint_code
  ('beck.col1.h', 'color',       '#0EA5E9'),
  ('beck.col1.h', 'step_number', '1'),
  ('beck.col1.h', 'hint_code',   'modules.beck_columns.entry_col_1_hint'),
  ('beck.col2.h', 'color',       '#8B5CF6'),
  ('beck.col2.h', 'step_number', '2'),
  ('beck.col2.h', 'hint_code',   'modules.beck_columns.entry_col_2_hint'),
  ('beck.col3.h', 'color',       '#EF4444'),
  ('beck.col3.h', 'step_number', '3'),
  ('beck.col3.h', 'hint_code',   'modules.beck_columns.entry_col_3_hint'),
  ('beck.col4.h', 'color',       '#059669'),
  ('beck.col4.h', 'step_number', '4'),
  ('beck.col4.h', 'hint_code',   'modules.beck_columns.entry_col_4_hint'),
  ('beck.col5.h', 'color',       '#D97706'),
  ('beck.col5.h', 'step_number', '5'),
  ('beck.col5.h', 'hint_code',   'modules.beck_columns.entry_col_5_hint'),

  -- Texte : key (clé logique JSON), multiline, min_height
  ('beck.col1.text', 'key',        'situation'),
  ('beck.col1.text', 'multiline',  '1'),
  ('beck.col1.text', 'min_height', '72'),
  ('beck.col2.text', 'key',        'emotion'),
  ('beck.col2.text', 'multiline',  '0'),
  ('beck.col3.text', 'key',        'automatic_thought'),
  ('beck.col3.text', 'multiline',  '1'),
  ('beck.col3.text', 'min_height', '72'),
  ('beck.col4.text', 'key',        'rational_response'),
  ('beck.col4.text', 'multiline',  '1'),
  ('beck.col4.text', 'min_height', '88'),
  ('beck.col5.text', 'key',        'outcome_emotion'),
  ('beck.col5.text', 'multiline',  '0'),

  -- Sliders : key, min, max, step, color
  ('beck.col2.slider', 'key',   'emotion_intensity'),
  ('beck.col2.slider', 'min',   '0'),
  ('beck.col2.slider', 'max',   '100'),
  ('beck.col2.slider', 'step',  '10'),
  ('beck.col2.slider', 'color', '#8B5CF6'),
  ('beck.col3.slider', 'key',   'thought_belief'),
  ('beck.col3.slider', 'min',   '0'),
  ('beck.col3.slider', 'max',   '100'),
  ('beck.col3.slider', 'step',  '10'),
  ('beck.col3.slider', 'color', '#EF4444'),
  ('beck.col5.intens', 'key',   'outcome_intensity'),
  ('beck.col5.intens', 'min',   '0'),
  ('beck.col5.intens', 'max',   '100'),
  ('beck.col5.intens', 'step',  '10'),
  ('beck.col5.intens', 'color', '#D97706'),
  ('beck.col5.belief', 'key',   'outcome_belief'),
  ('beck.col5.belief', 'min',   '0'),
  ('beck.col5.belief', 'max',   '100'),
  ('beck.col5.belief', 'step',  '10'),
  ('beck.col5.belief', 'color', '#D97706')
ON CONFLICT (field_id, prop_key) DO NOTHING;


-- ============================================================
-- MODULE : emotion_wheel — Roue des émotions (Plutchik 1980)
-- preview_kind = 'tree_selector' → TreeSelectorLayout (FieldRenderer)
-- Modélisation : arbre 3 niveaux via parent_field_id
--   Niveau 1 — emotion primaire (8 noeuds, color + icon)
--   Niveau 2 — émotion secondaire (24 noeuds, parent = primaire)
--   Niveau 3 — émotion spécifique (72 noeuds, parent = secondaire)
-- ============================================================

UPDATE public.modules SET preview_kind = 'tree_selector' WHERE id = 'emotion_wheel';

-- Champs UI (config + libellés sans section)
INSERT INTO public.module_content_fields (id, module_id, field_type, text_code, sort_order) VALUES
  ('ew.cfg',                   'emotion_wheel', 'tree_selector_config',              NULL,                                                  0),
  ('ew.intro',                 'emotion_wheel', 'tree_selector_intro',               'modules.emotion_wheel.intro',                         1),
  ('ew.step1.title',           'emotion_wheel', 'tree_selector_step_1_title',        'modules.emotion_wheel.step_primary_title',            2),
  ('ew.step1.hint',            'emotion_wheel', 'tree_selector_step_1_hint',         'modules.emotion_wheel.step_primary_hint',             3),
  ('ew.step2.hint',            'emotion_wheel', 'tree_selector_step_2_hint',         'modules.emotion_wheel.step_secondary_hint',           4),
  ('ew.step3.title',           'emotion_wheel', 'tree_selector_step_3_title',        'modules.emotion_wheel.step_specific_title',           5),
  ('ew.step3.hint',            'emotion_wheel', 'tree_selector_step_3_hint',         'modules.emotion_wheel.step_specific_hint',            6),
  ('ew.intensity.title',       'emotion_wheel', 'tree_selector_intensity_title',     'modules.emotion_wheel.step_intensity_title',          7),
  ('ew.intensity.hint',        'emotion_wheel', 'tree_selector_intensity_hint',      'modules.emotion_wheel.step_intensity_hint',           8),
  ('ew.notes.title',           'emotion_wheel', 'tree_selector_notes_title',         'modules.emotion_wheel.step_notes_title',              9),
  ('ew.notes.hint',            'emotion_wheel', 'tree_selector_notes_hint',          'modules.emotion_wheel.step_notes_hint',              10),
  ('ew.notes.placeholder',     'emotion_wheel', 'tree_selector_notes_placeholder',   'modules.emotion_wheel.notes_free_placeholder',       11),
  ('ew.continue_btn',          'emotion_wheel', 'tree_selector_continue_btn',        'modules.emotion_wheel.continue',                     12),
  ('ew.save_btn',              'emotion_wheel', 'tree_selector_save_btn',            'modules.emotion_wheel.save',                         13),
  ('ew.new_btn',               'emotion_wheel', 'tree_selector_new_btn',             'modules.emotion_wheel.identify_btn',                 14),
  ('ew.history_label',         'emotion_wheel', 'tree_selector_history_label',       'modules.emotion_wheel.history_label',                15),
  ('ew.empty_title',           'emotion_wheel', 'tree_selector_empty_title',         'modules.emotion_wheel.empty_title',                  16),
  ('ew.empty_text',            'emotion_wheel', 'tree_selector_empty_text',          'modules.emotion_wheel.empty_text',                   17),
  ('ew.delete_title',          'emotion_wheel', 'tree_selector_delete_title',        'modules.emotion_wheel.delete_entry_title',           18)
ON CONFLICT (id) DO NOTHING;

-- Niveau 1 — émotions primaires (8)
INSERT INTO public.module_content_fields (id, module_id, field_type, text_code, sort_order) VALUES
  ('ew.joy',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy',          100),
  ('ew.trust',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust',        110),
  ('ew.fear',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear',         120),
  ('ew.surprise',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise',     130),
  ('ew.sadness',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness',      140),
  ('ew.disgust',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust',      150),
  ('ew.anger',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger',        160),
  ('ew.anticipation', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation', 170)
ON CONFLICT (id) DO NOTHING;

-- Niveau 2 — émotions secondaires (24)
INSERT INTO public.module_content_fields (id, module_id, field_type, text_code, parent_field_id, sort_order) VALUES
  ('ew.joy.serenity',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__serenity',          'ew.joy',          1),
  ('ew.joy.joy_2',             'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__joy_2',             'ew.joy',          2),
  ('ew.joy.ecstasy',           'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__ecstasy',           'ew.joy',          3),
  ('ew.trust.acceptance',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__acceptance',      'ew.trust',        1),
  ('ew.trust.trust_2',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__trust_2',         'ew.trust',        2),
  ('ew.trust.admiration',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__admiration',      'ew.trust',        3),
  ('ew.fear.apprehension',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__apprehension',     'ew.fear',         1),
  ('ew.fear.fear_2',           'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__fear_2',           'ew.fear',         2),
  ('ew.fear.terror',           'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__terror',           'ew.fear',         3),
  ('ew.surprise.distraction',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__distraction',  'ew.surprise',     1),
  ('ew.surprise.surprise_2',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__surprise_2',   'ew.surprise',     2),
  ('ew.surprise.amazement',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__amazement',    'ew.surprise',     3),
  ('ew.sadness.pensiveness',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__pensiveness',   'ew.sadness',      1),
  ('ew.sadness.sadness_2',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__sadness_2',     'ew.sadness',      2),
  ('ew.sadness.grief',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__grief',         'ew.sadness',      3),
  ('ew.disgust.boredom',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__boredom',       'ew.disgust',      1),
  ('ew.disgust.disgust_2',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__disgust_2',     'ew.disgust',      2),
  ('ew.disgust.loathing',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__loathing',      'ew.disgust',      3),
  ('ew.anger.annoyance',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__annoyance',       'ew.anger',        1),
  ('ew.anger.anger_2',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__anger_2',         'ew.anger',        2),
  ('ew.anger.rage',            'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__rage',            'ew.anger',        3),
  ('ew.anticipation.interest',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__interest',         'ew.anticipation', 1),
  ('ew.anticipation.anticipation_2',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__anticipation_2',   'ew.anticipation', 2),
  ('ew.anticipation.vigilance',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__vigilance',        'ew.anticipation', 3)
ON CONFLICT (id) DO NOTHING;

-- Niveau 3 — émotions spécifiques (72)
INSERT INTO public.module_content_fields (id, module_id, field_type, text_code, parent_field_id, sort_order) VALUES
  ('ew.joy.serenity.calm',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__serenity__calm',         'ew.joy.serenity',     1),
  ('ew.joy.serenity.peaceful',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__serenity__peaceful',     'ew.joy.serenity',     2),
  ('ew.joy.serenity.content',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__serenity__content',      'ew.joy.serenity',     3),
  ('ew.joy.joy_2.happy',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__joy_2__happy',           'ew.joy.joy_2',        1),
  ('ew.joy.joy_2.cheerful',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__joy_2__cheerful',        'ew.joy.joy_2',        2),
  ('ew.joy.joy_2.amused',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__joy_2__amused',          'ew.joy.joy_2',        3),
  ('ew.joy.ecstasy.elated',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__ecstasy__elated',        'ew.joy.ecstasy',      1),
  ('ew.joy.ecstasy.euphoric',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__ecstasy__euphoric',      'ew.joy.ecstasy',      2),
  ('ew.joy.ecstasy.overjoyed',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__ecstasy__overjoyed',     'ew.joy.ecstasy',      3),
  ('ew.trust.acceptance.open',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__acceptance__open',          'ew.trust.acceptance', 1),
  ('ew.trust.acceptance.tolerant',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__acceptance__tolerant',      'ew.trust.acceptance', 2),
  ('ew.trust.acceptance.receptive',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__acceptance__receptive',     'ew.trust.acceptance', 3),
  ('ew.trust.trust_2.secure',           'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__trust_2__secure',           'ew.trust.trust_2',    1),
  ('ew.trust.trust_2.confident',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__trust_2__confident',        'ew.trust.trust_2',    2),
  ('ew.trust.trust_2.assured',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__trust_2__assured',          'ew.trust.trust_2',    3),
  ('ew.trust.admiration.admiring',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__admiration__admiring',      'ew.trust.admiration', 1),
  ('ew.trust.admiration.grateful',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__admiration__grateful',      'ew.trust.admiration', 2),
  ('ew.trust.admiration.reverent',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__admiration__reverent',      'ew.trust.admiration', 3),
  ('ew.fear.apprehension.uneasy',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__apprehension__uneasy',       'ew.fear.apprehension', 1),
  ('ew.fear.apprehension.worried',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__apprehension__worried',      'ew.fear.apprehension', 2),
  ('ew.fear.apprehension.nervous',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__apprehension__nervous',      'ew.fear.apprehension', 3),
  ('ew.fear.fear_2.scared',             'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__fear_2__scared',             'ew.fear.fear_2',       1),
  ('ew.fear.fear_2.anxious',            'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__fear_2__anxious',            'ew.fear.fear_2',       2),
  ('ew.fear.fear_2.threatened',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__fear_2__threatened',         'ew.fear.fear_2',       3),
  ('ew.fear.terror.panicked',           'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__terror__panicked',           'ew.fear.terror',       1),
  ('ew.fear.terror.horrified',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__terror__horrified',          'ew.fear.terror',       2),
  ('ew.fear.terror.overwhelmed',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__terror__overwhelmed',        'ew.fear.terror',       3),
  ('ew.surprise.distraction.confused',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__distraction__confused',  'ew.surprise.distraction', 1),
  ('ew.surprise.distraction.uncertain', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__distraction__uncertain', 'ew.surprise.distraction', 2),
  ('ew.surprise.distraction.perplexed', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__distraction__perplexed', 'ew.surprise.distraction', 3),
  ('ew.surprise.surprise_2.surprised',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__surprise_2__surprised',  'ew.surprise.surprise_2',  1),
  ('ew.surprise.surprise_2.startled',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__surprise_2__startled',   'ew.surprise.surprise_2',  2),
  ('ew.surprise.surprise_2.astonished', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__surprise_2__astonished', 'ew.surprise.surprise_2',  3),
  ('ew.surprise.amazement.amazed',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__amazement__amazed',      'ew.surprise.amazement',   1),
  ('ew.surprise.amazement.awed',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__amazement__awed',        'ew.surprise.amazement',   2),
  ('ew.surprise.amazement.dumbfounded', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__amazement__dumbfounded', 'ew.surprise.amazement',   3),
  ('ew.sadness.pensiveness.pensive',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__pensiveness__pensive',    'ew.sadness.pensiveness', 1),
  ('ew.sadness.pensiveness.nostalgic',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__pensiveness__nostalgic',  'ew.sadness.pensiveness', 2),
  ('ew.sadness.pensiveness.wistful',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__pensiveness__wistful',    'ew.sadness.pensiveness', 3),
  ('ew.sadness.sadness_2.sad',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__sadness_2__sad',          'ew.sadness.sadness_2',   1),
  ('ew.sadness.sadness_2.sorrowful',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__sadness_2__sorrowful',    'ew.sadness.sadness_2',   2),
  ('ew.sadness.sadness_2.dejected',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__sadness_2__dejected',     'ew.sadness.sadness_2',   3),
  ('ew.sadness.grief.hopeless',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__grief__hopeless',         'ew.sadness.grief',       1),
  ('ew.sadness.grief.despairing',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__grief__despairing',       'ew.sadness.grief',       2),
  ('ew.sadness.grief.anguished',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__grief__anguished',        'ew.sadness.grief',       3),
  ('ew.disgust.boredom.bored',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__boredom__bored',          'ew.disgust.boredom',     1),
  ('ew.disgust.boredom.indifferent',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__boredom__indifferent',    'ew.disgust.boredom',     2),
  ('ew.disgust.boredom.apathetic',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__boredom__apathetic',      'ew.disgust.boredom',     3),
  ('ew.disgust.disgust_2.disgusted',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__disgust_2__disgusted',    'ew.disgust.disgust_2',   1),
  ('ew.disgust.disgust_2.revolted',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__disgust_2__revolted',     'ew.disgust.disgust_2',   2),
  ('ew.disgust.disgust_2.repulsed',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__disgust_2__repulsed',     'ew.disgust.disgust_2',   3),
  ('ew.disgust.loathing.loathing',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__loathing__loathing',      'ew.disgust.loathing',    1),
  ('ew.disgust.loathing.contemptuous',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__loathing__contemptuous',  'ew.disgust.loathing',    2),
  ('ew.disgust.loathing.hateful',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__loathing__hateful',       'ew.disgust.loathing',    3),
  ('ew.anger.annoyance.annoyed',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__annoyance__annoyed',        'ew.anger.annoyance',     1),
  ('ew.anger.annoyance.irritated',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__annoyance__irritated',      'ew.anger.annoyance',     2),
  ('ew.anger.annoyance.impatient',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__annoyance__impatient',      'ew.anger.annoyance',     3),
  ('ew.anger.anger_2.angry',            'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__anger_2__angry',            'ew.anger.anger_2',       1),
  ('ew.anger.anger_2.frustrated',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__anger_2__frustrated',       'ew.anger.anger_2',       2),
  ('ew.anger.anger_2.resentful',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__anger_2__resentful',        'ew.anger.anger_2',       3),
  ('ew.anger.rage.furious',             'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__rage__furious',             'ew.anger.rage',          1),
  ('ew.anger.rage.outraged',            'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__rage__outraged',            'ew.anger.rage',          2),
  ('ew.anger.rage.enraged',             'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__rage__enraged',             'ew.anger.rage',          3),
  ('ew.anticipation.interest.curious',                'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__interest__curious',                 'ew.anticipation.interest',         1),
  ('ew.anticipation.interest.interested',             'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__interest__interested',              'ew.anticipation.interest',         2),
  ('ew.anticipation.interest.attentive',              'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__interest__attentive',               'ew.anticipation.interest',         3),
  ('ew.anticipation.anticipation_2.expectant',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__anticipation_2__expectant',         'ew.anticipation.anticipation_2',   1),
  ('ew.anticipation.anticipation_2.hopeful',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__anticipation_2__hopeful',           'ew.anticipation.anticipation_2',   2),
  ('ew.anticipation.anticipation_2.eager',            'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__anticipation_2__eager',             'ew.anticipation.anticipation_2',   3),
  ('ew.anticipation.vigilance.alert',                 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__vigilance__alert',                  'ew.anticipation.vigilance',        1),
  ('ew.anticipation.vigilance.cautious',              'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__vigilance__cautious',               'ew.anticipation.vigilance',        2),
  ('ew.anticipation.vigilance.watchful',              'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__vigilance__watchful',               'ew.anticipation.vigilance',        3)
ON CONFLICT (id) DO NOTHING;

-- Props : config + couleur/icône des 8 émotions primaires
INSERT INTO public.field_props (field_id, prop_key, prop_value) VALUES
  ('ew.cfg', 'enable_intensity', '1'),
  ('ew.cfg', 'intensity_min',    '1'),
  ('ew.cfg', 'intensity_max',    '10'),
  ('ew.cfg', 'enable_notes',     '1'),
  -- Joie — orange chaud
  ('ew.joy',          'color', '#F59E0B'),
  ('ew.joy',          'icon',  'emoticon-happy-outline'),
  -- Confiance — vert
  ('ew.trust',        'color', '#10B981'),
  ('ew.trust',        'icon',  'shield-heart-outline'),
  -- Peur — vert clair (Plutchik)
  ('ew.fear',         'color', '#6EE7B7'),
  ('ew.fear',         'icon',  'alert-circle-outline'),
  -- Surprise — cyan
  ('ew.surprise',     'color', '#06B6D4'),
  ('ew.surprise',     'icon',  'emoticon-excited-outline'),
  -- Tristesse — bleu
  ('ew.sadness',      'color', '#3B82F6'),
  ('ew.sadness',      'icon',  'emoticon-sad-outline'),
  -- Dégoût — violet
  ('ew.disgust',      'color', '#8B5CF6'),
  ('ew.disgust',      'icon',  'emoticon-sick-outline'),
  -- Colère — rouge
  ('ew.anger',        'color', '#EF4444'),
  ('ew.anger',        'icon',  'emoticon-angry-outline'),
  -- Anticipation — orange vif
  ('ew.anticipation', 'color', '#F97316'),
  ('ew.anticipation', 'icon',  'clock-fast')
ON CONFLICT (field_id, prop_key) DO NOTHING;


-- ============================================================
-- MIGRATION : sleep_diary → sleep_journal
-- preview_kind = 'sleep_journal' → SleepJournalLayout (FieldRenderer)
-- 3 modes internes : list | entry | month
-- Persistance SQLite : sleep_diary_entries (UNIQUE par date)
-- Conformité MDR 2017/745 : valeurs brutes uniquement, aucun seuil
-- interprétatif. La couleur des cellules calendrier est une convention
-- d'affichage des étoiles saisies, pas une interprétation clinique.
-- ============================================================

-- Nettoyer les anciens widget_type props (preview_kind 'fields' obsolète)
DELETE FROM public.field_props
WHERE field_id IN ('sleep.field_1','sleep.field_2','sleep.field_3','sleep.field_4',
                   'sleep.field_5','sleep.field_6','sleep.field_7','sleep.field_8');
DELETE FROM public.module_content_fields WHERE module_id = 'sleep_diary';

UPDATE public.modules SET preview_kind = 'sleep_journal' WHERE id = 'sleep_diary';

INSERT INTO public.module_content_fields (id, module_id, field_type, text_code, sort_order)
VALUES
  ('sj.cfg',                   'sleep_diary', 'sleep_journal_config',                   NULL,                                       0),
  ('sj.cta_title',             'sleep_diary', 'sleep_journal_cta_title',                'modules.sleep_diary.cta_title',            1),
  ('sj.monthly_button',        'sleep_diary', 'sleep_journal_monthly_button_label',     'modules.sleep_diary.monthly_button',       2),
  ('sj.list_header',           'sleep_diary', 'sleep_journal_list_header',              'modules.sleep_diary.list_header',          3),
  ('sj.incomplete',            'sleep_diary', 'sleep_journal_incomplete_label',         'modules.sleep_diary.incomplete',           4),
  ('sj.empty_day',             'sleep_diary', 'sleep_journal_empty_day_label',          'modules.sleep_diary.empty_day',            5),
  ('sj.section_schedule',      'sleep_diary', 'sleep_journal_section_schedule_title',   'modules.sleep_diary.section_schedule',     6),
  ('sj.section_awakenings',    'sleep_diary', 'sleep_journal_section_awakenings_title', 'modules.sleep_diary.section_awakenings',   7),
  ('sj.section_nightmares',    'sleep_diary', 'sleep_journal_section_nightmares_title', 'modules.sleep_diary.section_nightmares',   8),
  ('sj.section_quality',       'sleep_diary', 'sleep_journal_section_quality_title',    'modules.sleep_diary.section_quality',      9),
  ('sj.section_notes',         'sleep_diary', 'sleep_journal_section_notes_title',      'modules.sleep_diary.notes_label',         10),
  ('sj.bedtime_label',         'sleep_diary', 'sleep_journal_bedtime_label',            'modules.sleep_diary.bedtime_label',       11),
  ('sj.wake_time_label',       'sleep_diary', 'sleep_journal_wake_time_label',          'modules.sleep_diary.wake_time_label',     12),
  ('sj.onset_label',           'sleep_diary', 'sleep_journal_onset_label',              'modules.sleep_diary.onset_label',         13),
  ('sj.awakenings_label',      'sleep_diary', 'sleep_journal_awakenings_label',         'modules.sleep_diary.awakenings_label',    14),
  ('sj.awakenings_dur_label',  'sleep_diary', 'sleep_journal_awakenings_duration_label','modules.sleep_diary.awakenings_duration_label', 15),
  ('sj.nightmares_label',      'sleep_diary', 'sleep_journal_nightmares_label',         'modules.sleep_diary.nightmares_label',    16),
  ('sj.quality_label',         'sleep_diary', 'sleep_journal_quality_label',            'modules.sleep_diary.quality_label',       17),
  ('sj.quality_missing_title', 'sleep_diary', 'sleep_journal_quality_missing_title',    'modules.sleep_diary.quality_missing',     18),
  ('sj.quality_missing_msg',   'sleep_diary', 'sleep_journal_quality_missing_msg',      'modules.sleep_diary.quality_missing_msg', 19),
  ('sj.efficiency_label',      'sleep_diary', 'sleep_journal_efficiency_label',         'modules.sleep_diary.sleep_efficiency',    20),
  ('sj.date_label',            'sleep_diary', 'sleep_journal_date_label',               'modules.sleep_diary.date_label',          21),
  ('sj.save_label',            'sleep_diary', 'sleep_journal_save_label',               'modules.sleep_diary.save_night',          22),
  ('sj.update_label',          'sleep_diary', 'sleep_journal_update_label',             'modules.sleep_diary.update_entry',        23),
  ('sj.delete_label',          'sleep_diary', 'sleep_journal_delete_label',             'modules.sleep_diary.delete_entry',        24),
  ('sj.delete_title',          'sleep_diary', 'sleep_journal_delete_title',             'modules.sleep_diary.delete_entry',        25),
  ('sj.notes_placeholder',     'sleep_diary', 'sleep_journal_notes_placeholder',        'modules.sleep_diary.notes_placeholder',   26),
  ('sj.month_summary',         'sleep_diary', 'sleep_journal_month_summary_title',      'modules.sleep_diary.month_summary',       27),
  ('sj.legend_title',          'sleep_diary', 'sleep_journal_legend_title',             'modules.sleep_diary.legend',              28),
  ('sj.legend_good',           'sleep_diary', 'sleep_journal_legend_good_label',        'modules.sleep_diary.legend_good',         29),
  ('sj.legend_average',        'sleep_diary', 'sleep_journal_legend_average_label',     'modules.sleep_diary.legend_average',      30),
  ('sj.legend_bad',            'sleep_diary', 'sleep_journal_legend_bad_label',         'modules.sleep_diary.legend_bad',          31),
  ('sj.legend_empty',          'sleep_diary', 'sleep_journal_legend_empty_label',       'modules.sleep_diary.legend_empty',        32),
  ('sj.legend_nightmare',      'sleep_diary', 'sleep_journal_legend_nightmare_label',   'modules.sleep_diary.legend_nightmare',    33),
  ('sj.stat_avg_duration',     'sleep_diary', 'sleep_journal_stat_avg_duration_label',  'modules.sleep_diary.stat_avg_duration',   34),
  ('sj.stat_avg_awakenings',   'sleep_diary', 'sleep_journal_stat_avg_awakenings_label','modules.sleep_diary.stat_avg_awakenings', 35),
  ('sj.stat_nights_filled',    'sleep_diary', 'sleep_journal_stat_nights_filled_label', 'modules.sleep_diary.stat_nights_filled',  36),
  ('sj.stat_nightmares',       'sleep_diary', 'sleep_journal_stat_nightmares_label',    'modules.sleep_diary.stat_nightmares',     37),
  ('sj.minutes_unit',          'sleep_diary', 'sleep_journal_minutes_unit',             'modules.sleep_diary.minutes_unit',        38),
  ('sj.tap_to_modify',         'sleep_diary', 'sleep_journal_tap_to_modify_hint',       'modules.sleep_diary.tap_to_modify',       39),
  ('sj.confirm_label',         'sleep_diary', 'sleep_journal_confirm_label',            'modules.sleep_diary.confirm_label',       40),
  ('sj.back_label',            'sleep_diary', 'sleep_journal_back_label',               'modules.sleep_diary.back_btn',            41),
  ('sj.quality_label_1',       'sleep_diary', 'sleep_journal_quality_label_1',          'modules.sleep_diary.quality_very_bad',    42),
  ('sj.quality_label_2',       'sleep_diary', 'sleep_journal_quality_label_2',          'modules.sleep_diary.quality_bad',         43),
  ('sj.quality_label_3',       'sleep_diary', 'sleep_journal_quality_label_3',          'modules.sleep_diary.quality_average',     44),
  ('sj.quality_label_4',       'sleep_diary', 'sleep_journal_quality_label_4',          'modules.sleep_diary.quality_good',        45),
  ('sj.quality_label_5',       'sleep_diary', 'sleep_journal_quality_label_5',          'modules.sleep_diary.quality_excellent',   46)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.field_props (field_id, prop_key, prop_value) VALUES
  ('sj.cfg', 'history_days',                '14'),
  ('sj.cfg', 'awakenings_max',              '20'),
  ('sj.cfg', 'onset_max_minutes',           '180'),
  ('sj.cfg', 'awak_duration_max_minutes',   '300'),
  ('sj.cfg', 'efficiency_good',             '85'),
  ('sj.cfg', 'efficiency_warning',          '70'),
  ('sj.cfg', 'quality_max',                 '5'),
  ('sj.cfg', 'quality_good_threshold',      '4'),
  ('sj.cfg', 'quality_avg_threshold',       '3')
ON CONFLICT (field_id, prop_key) DO NOTHING;


-- ============================================================
-- MIGRATION : behavioral_activation → activity_log
-- preview_kind = 'activity_log' → ActivityLogLayout (FieldRenderer)
-- 3 modes internes : list | entry | month
-- Persistance SQLite : activity_records (table dédiée existante)
-- Conformité MDR 2017/745 : valeurs brutes uniquement (Plaisir / Maîtrise),
-- aucun seuil, aucune interprétation. Les couleurs des points calendrier
-- sont une convention d'affichage des statuts done/planned saisis.
-- ============================================================

-- Nettoyer les anciens widget_type props (preview_kind 'fields' obsolète)
DELETE FROM public.field_props
WHERE field_id IN ('ba.field_1','ba.field_2','ba.field_3','ba.field_4','ba.field_5','ba.field_6');
DELETE FROM public.module_content_fields WHERE module_id = 'behavioral_activation';

UPDATE public.modules SET preview_kind = 'activity_log' WHERE id = 'behavioral_activation';

INSERT INTO public.module_content_fields (id, module_id, field_type, text_code, sort_order)
VALUES
  ('al.cfg',                'behavioral_activation', 'activity_log_config',                  NULL,                                                  0),
  ('al.tab_list',           'behavioral_activation', 'activity_log_tab_list_label',          'modules.behavioral_activation.tab_list',              1),
  ('al.tab_month',          'behavioral_activation', 'activity_log_tab_month_label',         'modules.behavioral_activation.tab_month',             2),
  ('al.add_btn',            'behavioral_activation', 'activity_log_add_btn',                 'modules.behavioral_activation.add_btn',               3),
  ('al.empty_title',        'behavioral_activation', 'activity_log_empty_title',             'modules.behavioral_activation.empty_title',           4),
  ('al.empty_text',         'behavioral_activation', 'activity_log_empty_text',              'modules.behavioral_activation.empty_text',            5),
  ('al.section_activity',   'behavioral_activation', 'activity_log_section_activity_title',  'modules.behavioral_activation.section_activity',      10),
  ('al.section_evaluation', 'behavioral_activation', 'activity_log_section_evaluation_title','modules.behavioral_activation.section_evaluation',    11),
  ('al.section_notes',      'behavioral_activation', 'activity_log_section_notes_title',     'modules.behavioral_activation.section_notes',         12),
  ('al.activity_placeholder','behavioral_activation','activity_log_activity_placeholder',    'modules.behavioral_activation.activity_placeholder',  13),
  ('al.pleasure_label',     'behavioral_activation', 'activity_log_pleasure_label',          'modules.behavioral_activation.pleasure_label',        14),
  ('al.pleasure_sublabel',  'behavioral_activation', 'activity_log_pleasure_sublabel',       'modules.behavioral_activation.pleasure_sublabel',     15),
  ('al.mastery_label',      'behavioral_activation', 'activity_log_mastery_label',           'modules.behavioral_activation.mastery_label',         16),
  ('al.mastery_sublabel',   'behavioral_activation', 'activity_log_mastery_sublabel',        'modules.behavioral_activation.mastery_sublabel',      17),
  ('al.done_label',         'behavioral_activation', 'activity_log_done_label',              'modules.behavioral_activation.done_label',            18),
  ('al.mark_done',          'behavioral_activation', 'activity_log_mark_done_label',         'modules.behavioral_activation.mark_done',             19),
  ('al.mark_undone',        'behavioral_activation', 'activity_log_mark_undone_label',       'modules.behavioral_activation.mark_undone',           20),
  ('al.notes_placeholder',  'behavioral_activation', 'activity_log_notes_placeholder',       'common.notes_placeholder',                            21),
  ('al.date_label',         'behavioral_activation', 'activity_log_date_label',              'modules.behavioral_activation.date_label',            22),
  ('al.date_confirm',       'behavioral_activation', 'activity_log_date_confirm_label',      'modules.behavioral_activation.date_confirm',          23),
  ('al.save_label',         'behavioral_activation', 'activity_log_save_label',              'modules.behavioral_activation.save',                  30),
  ('al.update_label',       'behavioral_activation', 'activity_log_update_label',            'common.update',                                       31),
  ('al.delete_label',       'behavioral_activation', 'activity_log_delete_label',            'common.delete',                                       32),
  ('al.delete_title',       'behavioral_activation', 'activity_log_delete_title',            'modules.behavioral_activation.delete_activity_title', 33),
  ('al.name_missing_title', 'behavioral_activation', 'activity_log_name_missing_title',      'modules.behavioral_activation.name_missing',          34),
  ('al.name_missing_msg',   'behavioral_activation', 'activity_log_name_missing_msg',        'modules.behavioral_activation.name_missing_msg',      35),
  ('al.legend_done',        'behavioral_activation', 'activity_log_legend_done_label',       'modules.behavioral_activation.legend_done',           40),
  ('al.legend_planned',     'behavioral_activation', 'activity_log_legend_planned_label',    'modules.behavioral_activation.legend_planned',        41),
  ('al.month_hint_tap',     'behavioral_activation', 'activity_log_month_hint_tap',          'modules.behavioral_activation.month_hint_tap',        42),
  ('al.month_hint_empty',   'behavioral_activation', 'activity_log_month_hint_empty',        'modules.behavioral_activation.month_hint_empty',      43),
  ('al.back_label',         'behavioral_activation', 'activity_log_back_label',              'modules.behavioral_activation.back_btn',              44),
  -- Suggestions (chips). 20 propositions copiées de l'ancien écran custom.
  ('al.sug_walk',           'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_walk',       100),
  ('al.sug_groceries',      'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_groceries',  101),
  ('al.sug_gym',            'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_gym',        102),
  ('al.sug_bike',           'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_bike',       103),
  ('al.sug_yoga',           'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_yoga',       104),
  ('al.sug_meditation',     'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_meditation', 105),
  ('al.sug_reading',        'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_reading',    106),
  ('al.sug_cooking',        'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_cooking',    107),
  ('al.sug_call_friend',    'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_call_friend',108),
  ('al.sug_cafe',           'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_cafe',       109),
  ('al.sug_gardening',      'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_gardening',  110),
  ('al.sug_music',          'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_music',      111),
  ('al.sug_movie',          'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_movie',      112),
  ('al.sug_bath',           'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_bath',       113),
  ('al.sug_cleaning',       'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_cleaning',   114),
  ('al.sug_drawing',        'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_drawing',    115),
  ('al.sug_board_game',     'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_board_game', 116),
  ('al.sug_journal',        'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_journal',    117),
  ('al.sug_swimming',       'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_swimming',   118),
  ('al.sug_running',        'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_running',    119)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.field_props (field_id, prop_key, prop_value) VALUES
  ('al.cfg', 'engagement_event_type', 'SAVE_BEHAVIORAL_ACTIVATION'),
  ('al.cfg', 'pleasure_min',          '0'),
  ('al.cfg', 'pleasure_max',          '10'),
  ('al.cfg', 'pleasure_step',         '1'),
  ('al.cfg', 'mastery_min',           '0'),
  ('al.cfg', 'mastery_max',           '10'),
  ('al.cfg', 'mastery_step',          '1'),
  ('al.cfg', 'pleasure_color',        '#059669'),
  ('al.cfg', 'mastery_color',         '#4F46E5'),
  ('al.cfg', 'dot_done_color',        '#10B981'),
  ('al.cfg', 'dot_planned_color',     '#3B82F6'),
  ('al.cfg', 'locale',                'fr-FR')
ON CONFLICT (field_id, prop_key) DO NOTHING;


-- ============================================================
-- MIGRATION : fear_thermometer → exposure_tracker
-- preview_kind = 'exposure_tracker' → ExposureTrackerLayout (FieldRenderer)
-- 3 modes internes : list (avec tabs Saisies / Situations) | entry
-- Persistance SQLite : fear_entries + fear_situations (tables existantes)
-- Conformité MDR 2017/745 : SUDs 0–100 affichés bruts, sans label
-- interprétatif. Les couleurs avant (rouge) / après (vert) = convention
-- d'affichage de l'ordre temporel saisi.
-- ============================================================

-- Nettoyer les anciens widget_type props (preview_kind 'fields' obsolète)
DELETE FROM public.field_props
WHERE field_id IN ('ft.field_1','ft.field_2','ft.field_3','ft.field_4','ft.field_5');
DELETE FROM public.module_content_fields WHERE module_id = 'fear_thermometer';

UPDATE public.modules SET preview_kind = 'exposure_tracker' WHERE id = 'fear_thermometer';

INSERT INTO public.module_content_fields (id, module_id, field_type, text_code, sort_order)
VALUES
  ('et.cfg',                   'fear_thermometer', 'exposure_tracker_config',                   NULL,                                                  0),
  -- Tabs et liste principale
  ('et.tab_entries',           'fear_thermometer', 'exposure_tracker_tab_entries_label',        'modules.fear_thermometer.tab_entries',                1),
  ('et.tab_situations',        'fear_thermometer', 'exposure_tracker_tab_situations_label',     'modules.fear_thermometer.tab_situations',             2),
  ('et.add_btn',               'fear_thermometer', 'exposure_tracker_add_btn',                  'modules.fear_thermometer.new_entry',                  3),
  ('et.empty_title',           'fear_thermometer', 'exposure_tracker_empty_title',              'modules.fear_thermometer.empty_title',                4),
  ('et.empty_text',            'fear_thermometer', 'exposure_tracker_empty_text',               'modules.fear_thermometer.empty_text',                 5),
  -- Sections du formulaire entry
  ('et.section_trigger',       'fear_thermometer', 'exposure_tracker_section_trigger_title',    'modules.fear_thermometer.section_trigger',            10),
  ('et.section_before',        'fear_thermometer', 'exposure_tracker_section_before_title',     'modules.fear_thermometer.section_before',             11),
  ('et.section_strategies',    'fear_thermometer', 'exposure_tracker_section_strategies_title', 'modules.fear_thermometer.section_strategies',         12),
  ('et.section_after',         'fear_thermometer', 'exposure_tracker_section_after_title',      'modules.fear_thermometer.section_after',              13),
  ('et.section_notes',         'fear_thermometer', 'exposure_tracker_section_notes_title',      'modules.fear_thermometer.section_notes',              14),
  -- Situation picker
  ('et.sit_mode_catalogue',    'fear_thermometer', 'exposure_tracker_situation_mode_catalogue', 'modules.fear_thermometer.situation_mode_catalogue',   20),
  ('et.sit_mode_free',         'fear_thermometer', 'exposure_tracker_situation_mode_free',      'modules.fear_thermometer.situation_mode_free',        21),
  ('et.sit_free_ph',           'fear_thermometer', 'exposure_tracker_situation_free_placeholder','modules.fear_thermometer.situation_free_placeholder',22),
  ('et.sit_cat_empty',         'fear_thermometer', 'exposure_tracker_situation_catalogue_empty','modules.fear_thermometer.situation_catalogue_empty',  23),
  -- SUDs labels et hints
  ('et.suds_before_label',     'fear_thermometer', 'exposure_tracker_suds_before_label',        'modules.fear_thermometer.suds_before',                30),
  ('et.suds_before_hint',      'fear_thermometer', 'exposure_tracker_suds_before_hint',         'modules.fear_thermometer.suds_hint_before',           31),
  ('et.suds_after_label',      'fear_thermometer', 'exposure_tracker_suds_after_label',         'modules.fear_thermometer.suds_after',                 32),
  ('et.suds_after_hint',       'fear_thermometer', 'exposure_tracker_suds_after_hint',          'modules.fear_thermometer.suds_hint_after',            33),
  ('et.suds_skip_null',        'fear_thermometer', 'exposure_tracker_suds_skip_null',           'modules.fear_thermometer.suds_skip_null',             34),
  ('et.suds_skip_later',       'fear_thermometer', 'exposure_tracker_suds_skip_later',          'modules.fear_thermometer.suds_skip_later',            35),
  -- Stratégies
  ('et.strategies_hint',       'fear_thermometer', 'exposure_tracker_strategies_hint',          'modules.fear_thermometer.strategies_hint',            40),
  ('et.strategy_custom_ph',    'fear_thermometer', 'exposure_tracker_strategy_custom_placeholder','modules.fear_thermometer.strategy_custom_placeholder',41),
  -- Notes / boutons
  ('et.notes_placeholder',     'fear_thermometer', 'exposure_tracker_notes_placeholder',        'modules.fear_thermometer.notes_placeholder',          50),
  ('et.save_label',            'fear_thermometer', 'exposure_tracker_save_label',               'modules.fear_thermometer.save',                       60),
  ('et.update_label',          'fear_thermometer', 'exposure_tracker_update_label',             'common.update',                                       61),
  ('et.delete_label',          'fear_thermometer', 'exposure_tracker_delete_label',             'common.delete',                                       62),
  ('et.back_label',            'fear_thermometer', 'exposure_tracker_back_label',               'common.back',                                         63),
  -- Validation
  ('et.sit_missing_title',     'fear_thermometer', 'exposure_tracker_situation_missing_title',  'modules.fear_thermometer.situation_missing',          70),
  ('et.sit_missing_msg',       'fear_thermometer', 'exposure_tracker_situation_missing_msg',    'modules.fear_thermometer.situation_missing_msg',      71),
  -- Suppression
  ('et.delete_entry_title',    'fear_thermometer', 'exposure_tracker_delete_entry_title',       'modules.fear_thermometer.delete_entry_title',         72),
  ('et.sit_delete_title',      'fear_thermometer', 'exposure_tracker_situation_delete_title',   'modules.fear_thermometer.delete_situation_title',     73),
  -- Panneau gestion des situations
  ('et.panel_title',           'fear_thermometer', 'exposure_tracker_situations_panel_title',   'modules.fear_thermometer.situations_title',           80),
  ('et.panel_hint',            'fear_thermometer', 'exposure_tracker_situations_panel_hint',    'modules.fear_thermometer.situations_hint',            81),
  ('et.sit_placeholder',       'fear_thermometer', 'exposure_tracker_situation_placeholder',    'modules.fear_thermometer.situation_placeholder',      82),
  ('et.sit_empty',             'fear_thermometer', 'exposure_tracker_situation_empty',          'modules.fear_thermometer.situation_empty',            83),
  -- Stratégies catalogue (champs sortés par sort_order, ID = key stockée en JSON)
  ('et.strategy_breathing',    'fear_thermometer', 'exposure_tracker_strategy',                 'modules.fear_thermometer.strategy_breathing',         100),
  ('et.strategy_grounding',    'fear_thermometer', 'exposure_tracker_strategy',                 'modules.fear_thermometer.strategy_grounding',         101),
  ('et.strategy_movement',     'fear_thermometer', 'exposure_tracker_strategy',                 'modules.fear_thermometer.strategy_movement',          102),
  ('et.strategy_exposure',     'fear_thermometer', 'exposure_tracker_strategy',                 'modules.fear_thermometer.strategy_exposure',          103),
  ('et.strategy_distraction',  'fear_thermometer', 'exposure_tracker_strategy',                 'modules.fear_thermometer.strategy_distraction',       104),
  ('et.strategy_contact',      'fear_thermometer', 'exposure_tracker_strategy',                 'modules.fear_thermometer.strategy_contact',           105)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.field_props (field_id, prop_key, prop_value) VALUES
  ('et.cfg', 'engagement_event_type', 'SAVE_FEAR_ENTRY'),
  ('et.cfg', 'suds_min',              '0'),
  ('et.cfg', 'suds_max',              '100'),
  ('et.cfg', 'suds_step',             '10'),
  ('et.cfg', 'suds_default_before',   '50'),
  ('et.cfg', 'suds_before_color',     '#EF4444'),
  ('et.cfg', 'suds_after_color',      '#059669')
ON CONFLICT (field_id, prop_key) DO NOTHING;
