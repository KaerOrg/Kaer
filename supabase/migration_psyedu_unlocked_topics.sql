-- ============================================================
-- MIGRATION — Refonte psychoéducation, PHASE 3
-- Bascule du module psychoeducation vers la bibliothèque de fiches.
-- À coller dans Supabase Studio → SQL Editor → Run. Idempotent.
-- Spec : docs/spec/refonte-psychoeducation.md
-- ============================================================

-- 1. preview_kind : cards -> psyedu_library (rendu = bibliothèque par thème)
update public.modules set preview_kind = 'psyedu_library' where id = 'psychoeducation';

-- 2. Migration des configs patient : unlocked_cards (legacy) -> unlocked_topics.
--    Mapping cartes codées en dur -> fiches psyedu (cf. Phase 1b).
--    card_grounding_01 abandonnée (couverte par le module grounding) -> non reprise.
--    Idempotent : les lignes déjà migrées (sans 'unlocked_cards') sont ignorées.
with mapping(card_id, topic_id) as (values
  ('card_sleep_01',               '00000001-0000-0000-0000-000000000009'),  -- psyedu_sleep / sleep_hygiene_rules
  ('card_cbt_01',                 '00000001-0000-0000-0000-000000000010'),  -- cognitive_distortions / cog_distortions_intro
  ('card_medication_appetite_01', '00000001-0000-0000-0000-000000000004'),  -- diet_weight_psycho / general
  ('card_medication_lithium_01',  '00000001-0000-0000-0000-000000000011')   -- diet_weight_psycho / lithium_safety
),
transformed as (
  select pm.id,
    jsonb_build_object('unlocked_topics', jsonb_agg(
      jsonb_build_object(
        'topic_id',    m.topic_id,
        'is_read',     (c->>'is_read')::boolean,
        'unlocked_at', c->>'unlocked_at'
      ) order by c->>'unlocked_at'
    )) as new_config
  from public.patient_modules pm
  cross join lateral jsonb_array_elements(pm.config->'unlocked_cards') c
  join mapping m on m.card_id = c->>'card_id'
  where pm.module_type = 'psychoeducation' and pm.config ? 'unlocked_cards'
  group by pm.id
)
update public.patient_modules pm
set config = t.new_config
from transformed t
where pm.id = t.id;
