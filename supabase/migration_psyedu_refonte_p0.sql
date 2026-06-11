-- ============================================================
-- MIGRATION — Refonte psychoéducation, PHASE 0 (fondations psyedu)
-- À coller dans Supabase Studio → SQL Editor → Run.
-- Idempotent : ré-exécutable sans risque. 100 % non destructif (aucun DROP/DELETE).
-- Reflète schema.sql. Spec : docs/spec/refonte-psychoeducation.md
--
-- PRÉREQUIS : la taxonomie (tag_dimensions / tags / module_tags) doit déjà exister
-- (branche feat/improve-module-organization). Cette migration ne crée QUE les
-- tables propres à la refonte psychoéducation.
-- ============================================================

-- ── Thèmes de la bibliothèque ────────────────────────────────────────────────
create table if not exists public.psyedu_themes (
  id          text primary key,
  icon_name   text not null,
  sort_order  int  not null default 0
);
alter table public.psyedu_themes enable row level security;
drop policy if exists "psyedu_themes_read" on public.psyedu_themes;
create policy "psyedu_themes_read" on public.psyedu_themes
  for select to authenticated using (true);

-- ── Découplage fiche ↔ module ────────────────────────────────────────────────
alter table public.psyedu_topics add column if not exists theme_id    text references public.psyedu_themes(id);
alter table public.psyedu_topics add column if not exists reviewed_at date;
alter table public.psyedu_topics alter column module_key drop not null;
create index if not exists idx_psyedu_topics_theme on public.psyedu_topics(theme_id);

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

-- ── Seed thèmes ──────────────────────────────────────────────────────────────
insert into public.psyedu_themes (id, icon_name, sort_order) values
  ('treatment', 'Pill', 1), ('lifestyle', 'HeartPulse', 2)
on conflict (id) do update set icon_name = excluded.icon_name, sort_order = excluded.sort_order;
