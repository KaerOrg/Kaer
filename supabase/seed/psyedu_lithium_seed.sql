-- ============================================================
-- SEED — Refonte psychoéducation, PHASE 1b
-- Fiche dédiée « Lithium : sécurité au quotidien » (rapatriée de la carte legacy)
-- + enrichissement de la fiche `general` (2 astuces appétit uniques).
-- Idempotent. Contenu i18n : fr/psyedu.json (+ fr/psyedu_teen.json).
-- Spec : docs/spec/refonte-psychoeducation.md
-- ============================================================

-- ── Fiche lithium_safety (thème treatment) ───────────────────────────────────
delete from public.psyedu_topics where id = '00000001-0000-0000-0000-000000000011';

insert into public.psyedu_topics (id, module_key, theme_id, topic_key, icon_name, sort_order, is_active)
values ('00000001-0000-0000-0000-000000000011', 'diet_weight_psycho', 'treatment', 'lithium_safety', 'Droplet', 6, true);

insert into public.psyedu_blocks (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  -- why (court, langage patient)
  ('00000001-0000-0000-0000-000000000011', 'why', 'heading',   'section.why', null, null, 1),
  ('00000001-0000-0000-0000-000000000011', 'why', 'paragraph', 'diet_weight_psycho.lithium_safety.why.p1', null, null, 2),
  -- how (carte d'actions + signes d'alerte + sécurité)
  ('00000001-0000-0000-0000-000000000011', 'how', 'action_list', null,
     array['diet_weight_psycho.lithium_safety.how.rule1',
           'diet_weight_psycho.lithium_safety.how.rule2',
           'diet_weight_psycho.lithium_safety.how.rule3',
           'diet_weight_psycho.lithium_safety.how.avoid1'], null, 1),
  ('00000001-0000-0000-0000-000000000011', 'how', 'tip',        'diet_weight_psycho.lithium_safety.how.alert', null, null, 2),
  ('00000001-0000-0000-0000-000000000011', 'how', 'blockquote', 'diet_weight_psycho.lithium_safety.how.bq1', null, null, 3),
  -- sources
  ('00000001-0000-0000-0000-000000000011', 'sources', 'heading',     'section.sources', null, null, 1),
  ('00000001-0000-0000-0000-000000000011', 'sources', 'source_link', 'diet_weight_psycho.lithium_safety.sources.s1', null, null, 2),
  ('00000001-0000-0000-0000-000000000011', 'sources', 'source_link', 'diet_weight_psycho.lithium_safety.sources.s2', null, 'https://doi.org/10.1007/s00210-024-03210-8', 3);

-- Tags (mêmes axes que mood_stabilizers)
insert into public.psyedu_topic_tags (topic_id, tag_id)
values
  ('00000001-0000-0000-0000-000000000011', 'psychoeducation'),
  ('00000001-0000-0000-0000-000000000011', 'bipolar'),
  ('00000001-0000-0000-0000-000000000011', 'adult'),
  ('00000001-0000-0000-0000-000000000011', 'teen'),
  ('00000001-0000-0000-0000-000000000011', 'senior')
on conflict (topic_id, tag_id) do nothing;

-- Liens fiche ↔ outils de suivi du traitement
insert into public.module_topics (module_id, topic_id, sort_order)
values
  ('medication_adherence',     '00000001-0000-0000-0000-000000000011', 5),
  ('medication_side_effects',  '00000001-0000-0000-0000-000000000011', 5)
on conflict (module_id, topic_id) do nothing;

-- ── Enrichissement fiche `general` : 2 astuces appétit (soif, marche) ─────────
update public.psyedu_blocks
set items_codes = array[
  'diet_weight_psycho.general.how.tip1',
  'diet_weight_psycho.general.how.tip2',
  'diet_weight_psycho.general.how.tip3',
  'diet_weight_psycho.general.how.tip4',
  'diet_weight_psycho.general.how.tip5',
  'diet_weight_psycho.general.how.tip6',
  'diet_weight_psycho.general.how.tip7'
]
where topic_id = (select id from public.psyedu_topics where module_key='diet_weight_psycho' and topic_key='general')
  and section_key = 'how' and block_type = 'bullet_list';
