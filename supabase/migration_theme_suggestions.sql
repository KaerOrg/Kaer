-- ============================================================
-- MIGRATION : theme_suggestions (suggestions de fiches psychoéducation)
-- À coller dans Supabase Studio, ou appliquée via MCP. Idempotent, non destructif.
-- Spec : docs/spec/refonte-psychoeducation.md (Phase 4)
-- ============================================================

create table if not exists public.theme_suggestions (
  id              uuid        primary key default gen_random_uuid(),
  practitioner_id uuid        references public.practitioners(id) on delete set null,
  suggestion      text        not null,
  status          text        not null default 'new' check (status in ('new', 'reviewed', 'done', 'declined')),
  ip_hash         text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_theme_suggestions_status
  on public.theme_suggestions(status, created_at desc);
create index if not exists idx_theme_suggestions_ip_recent
  on public.theme_suggestions(ip_hash, created_at desc);

alter table public.theme_suggestions enable row level security;
-- Aucune policy client : insertion via Edge Function send-theme-suggestion (service_role).
