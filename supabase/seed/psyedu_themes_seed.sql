-- ============================================================
-- SEED — psyedu_themes (thèmes de la bibliothèque psychoéducation)
-- Idempotent. Libellés via i18n : psyedu.theme.<id> (+ variante teen).
-- Refonte psychoéducation : cf. docs/spec/refonte-psychoeducation.md
-- ============================================================

insert into public.psyedu_themes (id, icon_name, sort_order) values
  ('treatment',     'Pill',        1),   -- 🟣 Mon traitement (psychotropes, prise de poids, sécurité)
  ('lifestyle',     'HeartPulse',  2),   -- 🟢 Hygiène de vie (sommeil, alimentation, activité)
  ('understanding', 'Brain',       3)    -- 🔵 Mieux comprendre (distorsions cognitives, concepts TCC…)
on conflict (id) do update set
  icon_name  = excluded.icon_name,
  sort_order = excluded.sort_order;
