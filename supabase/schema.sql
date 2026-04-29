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
