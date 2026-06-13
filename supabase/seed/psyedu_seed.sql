-- ============================================================
-- SEED — psyedu_topics + psyedu_blocks (bibliothèque psychoéducation)
-- ============================================================
-- Modules gérés : diet_weight_psycho, cognitive_distortions, psyedu_sleep,
--                 psyedu_nutrition, psyedu_activity  (11 fiches).
-- Contenu action-first (langage patient) — cf. docs/spec/refonte-psychoeducation.md §6.
-- Idempotent : DELETE (cascade sur les blocs) + INSERT. Reflète la prod.
-- Généré depuis la prod le 2026-06-13 (Phase 5 — consolidation des seeds).
--
-- ORDRE D'EXÉCUTION :
--   1. psyedu_themes_seed.sql   (FK psyedu_topics.theme_id)
--   2. taxonomy (tags)          (FK psyedu_topic_tags.tag_id)
--   3. CE FICHIER               (topics + blocs)
--   4. psyedu_refonte_p1_seed.sql (tags des fiches + liens module_topics)
-- ============================================================

delete from public.psyedu_topics
where module_key in ('diet_weight_psycho','cognitive_distortions','psyedu_sleep','psyedu_nutrition','psyedu_activity');

-- ── TOPICS (module_key, thème, icône) ────────────────────────────────────────
insert into public.psyedu_topics (id, module_key, topic_key, icon_name, sort_order, is_active, theme_id) values
  ('00000001-0000-0000-0000-000000000010', 'cognitive_distortions', 'cog_distortions_intro', 'BrainCircuit', 1, true, 'understanding'),
  ('00000001-0000-0000-0000-000000000004', 'diet_weight_psycho', 'general', 'Info', 1, true, 'treatment'),
  ('00000001-0000-0000-0000-000000000005', 'diet_weight_psycho', 'antipsychotics', 'Pill', 2, true, 'treatment'),
  ('00000001-0000-0000-0000-000000000006', 'diet_weight_psycho', 'methylphenidate', 'Zap', 3, true, 'treatment'),
  ('00000001-0000-0000-0000-000000000007', 'diet_weight_psycho', 'antidepressants', 'SmilePlus', 4, true, 'treatment'),
  ('00000001-0000-0000-0000-000000000008', 'diet_weight_psycho', 'mood_stabilizers', 'HeartPulse', 5, true, 'treatment'),
  ('00000001-0000-0000-0000-000000000011', 'diet_weight_psycho', 'lithium_safety', 'Droplet', 6, true, 'treatment'),
  ('00000001-0000-0000-0000-000000000003', 'psyedu_activity', 'gentle_activity', 'Footprints', 1, true, 'lifestyle'),
  ('00000001-0000-0000-0000-000000000002', 'psyedu_nutrition', 'nutrition_brain', 'Apple', 1, true, 'lifestyle'),
  ('00000001-0000-0000-0000-000000000001', 'psyedu_sleep', 'sleep_chrono', 'Moon', 1, true, 'lifestyle'),
  ('00000001-0000-0000-0000-000000000009', 'psyedu_sleep', 'sleep_hygiene_rules', 'ListChecks', 2, true, 'lifestyle');

-- ── BLOCS (why → how[action_list] → sources) ─────────────────────────────────
insert into public.psyedu_blocks (topic_id, section_key, block_type, text_code, items_codes, href, sort_order) values
  ('00000001-0000-0000-0000-000000000010', 'why', 'heading', 'section.why', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000010', 'why', 'paragraph', 'cognitive_distortions.cog_distortions_intro.why.p1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000010', 'why', 'paragraph', 'cognitive_distortions.cog_distortions_intro.why.tip1', null, NULL, 3),
  ('00000001-0000-0000-0000-000000000010', 'why', 'bullet_list', NULL, '{cognitive_distortions.cog_distortions_intro.why.d1,cognitive_distortions.cog_distortions_intro.why.d2,cognitive_distortions.cog_distortions_intro.why.d3,cognitive_distortions.cog_distortions_intro.why.d4,cognitive_distortions.cog_distortions_intro.why.d5,cognitive_distortions.cog_distortions_intro.why.d6,cognitive_distortions.cog_distortions_intro.why.d7,cognitive_distortions.cog_distortions_intro.why.d8,cognitive_distortions.cog_distortions_intro.why.d9,cognitive_distortions.cog_distortions_intro.why.d10}'::text[], NULL, 4),
  ('00000001-0000-0000-0000-000000000010', 'how', 'action_list', NULL, '{cognitive_distortions.cog_distortions_intro.how.step1,cognitive_distortions.cog_distortions_intro.how.step2,cognitive_distortions.cog_distortions_intro.how.step3}'::text[], NULL, 1),
  ('00000001-0000-0000-0000-000000000010', 'how', 'blockquote', 'cognitive_distortions.cog_distortions_intro.how.bq1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000010', 'sources', 'heading', 'section.sources', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000010', 'sources', 'source_link', 'cognitive_distortions.cog_distortions_intro.sources.s1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000010', 'sources', 'source_link', 'cognitive_distortions.cog_distortions_intro.sources.s2', null, NULL, 3),
  ('00000001-0000-0000-0000-000000000004', 'why', 'heading', 'section.why', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000004', 'why', 'paragraph', 'diet_weight_psycho.general.why.p1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000004', 'how', 'action_list', NULL, '{diet_weight_psycho.general.how.action1,diet_weight_psycho.general.how.action2,diet_weight_psycho.general.how.action3,diet_weight_psycho.general.how.action4,diet_weight_psycho.general.how.action5}'::text[], NULL, 1),
  ('00000001-0000-0000-0000-000000000004', 'how', 'tip', 'diet_weight_psycho.general.how.tip_weigh', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000004', 'sources', 'heading', 'section.sources', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000004', 'sources', 'source_link', 'diet_weight_psycho.general.sources.s1', null, 'https://doi.org/10.1177/13591053241227384', 2),
  ('00000001-0000-0000-0000-000000000004', 'sources', 'source_link', 'diet_weight_psycho.general.sources.s2', null, 'https://doi.org/10.1001/jama.2023.19897', 3),
  ('00000001-0000-0000-0000-000000000005', 'why', 'heading', 'section.why', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000005', 'why', 'paragraph', 'diet_weight_psycho.antipsychotics.why.p1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000005', 'how', 'action_list', NULL, '{diet_weight_psycho.antipsychotics.how.action1,diet_weight_psycho.antipsychotics.how.action2,diet_weight_psycho.antipsychotics.how.action3,diet_weight_psycho.antipsychotics.how.action4,diet_weight_psycho.antipsychotics.how.action5}'::text[], NULL, 1),
  ('00000001-0000-0000-0000-000000000005', 'how', 'tip', 'diet_weight_psycho.antipsychotics.how.tip_weigh', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000005', 'how', 'blockquote', 'diet_weight_psycho.antipsychotics.how.bq_safety', null, NULL, 3),
  ('00000001-0000-0000-0000-000000000005', 'sources', 'heading', 'section.sources', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000005', 'sources', 'source_link', 'diet_weight_psycho.antipsychotics.sources.s1', null, 'https://www.has-sante.fr', 2),
  ('00000001-0000-0000-0000-000000000005', 'sources', 'source_link', 'diet_weight_psycho.antipsychotics.sources.s2', null, 'https://www.bap.org.uk/articles/antipsychotic-medication-and-weight-gain/', 3),
  ('00000001-0000-0000-0000-000000000006', 'why', 'heading', 'section.why', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000006', 'why', 'paragraph', 'diet_weight_psycho.methylphenidate.why.p1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000006', 'how', 'action_list', NULL, '{diet_weight_psycho.methylphenidate.how.action1,diet_weight_psycho.methylphenidate.how.action2,diet_weight_psycho.methylphenidate.how.action3,diet_weight_psycho.methylphenidate.how.action4}'::text[], NULL, 1),
  ('00000001-0000-0000-0000-000000000006', 'how', 'tip', 'diet_weight_psycho.methylphenidate.how.tip_weigh', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000006', 'sources', 'heading', 'section.sources', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000006', 'sources', 'source_link', 'diet_weight_psycho.methylphenidate.sources.s1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000006', 'sources', 'source_link', 'diet_weight_psycho.methylphenidate.sources.s2', null, NULL, 3),
  ('00000001-0000-0000-0000-000000000007', 'why', 'heading', 'section.why', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000007', 'why', 'paragraph', 'diet_weight_psycho.antidepressants.why.p1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000007', 'how', 'action_list', NULL, '{diet_weight_psycho.antidepressants.how.action1,diet_weight_psycho.antidepressants.how.action2,diet_weight_psycho.antidepressants.how.action3,diet_weight_psycho.antidepressants.how.action4}'::text[], NULL, 1),
  ('00000001-0000-0000-0000-000000000007', 'how', 'tip', 'diet_weight_psycho.antidepressants.how.tip', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000007', 'sources', 'heading', 'section.sources', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000007', 'sources', 'source_link', 'diet_weight_psycho.antidepressants.sources.s1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000007', 'sources', 'source_link', 'diet_weight_psycho.antidepressants.sources.s2', null, 'https://doi.org/10.1001/jama.2023.19897', 3),
  ('00000001-0000-0000-0000-000000000008', 'why', 'heading', 'section.why', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000008', 'why', 'paragraph', 'diet_weight_psycho.mood_stabilizers.why.p1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000008', 'how', 'action_list', NULL, '{diet_weight_psycho.mood_stabilizers.how.action1,diet_weight_psycho.mood_stabilizers.how.action2,diet_weight_psycho.mood_stabilizers.how.action3,diet_weight_psycho.mood_stabilizers.how.action4}'::text[], NULL, 1),
  ('00000001-0000-0000-0000-000000000008', 'how', 'tip', 'diet_weight_psycho.mood_stabilizers.how.tip_weigh', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000008', 'how', 'blockquote', 'diet_weight_psycho.mood_stabilizers.how.bq_safety', null, NULL, 3),
  ('00000001-0000-0000-0000-000000000008', 'sources', 'heading', 'section.sources', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000008', 'sources', 'source_link', 'diet_weight_psycho.mood_stabilizers.sources.s1', null, 'https://doi.org/10.1001/jama.2023.18588', 2),
  ('00000001-0000-0000-0000-000000000008', 'sources', 'source_link', 'diet_weight_psycho.mood_stabilizers.sources.s2', null, NULL, 3),
  ('00000001-0000-0000-0000-000000000011', 'why', 'heading', 'section.why', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000011', 'why', 'paragraph', 'diet_weight_psycho.lithium_safety.why.p1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000011', 'how', 'action_list', NULL, '{diet_weight_psycho.lithium_safety.how.rule1,diet_weight_psycho.lithium_safety.how.rule2,diet_weight_psycho.lithium_safety.how.rule3,diet_weight_psycho.lithium_safety.how.avoid1}'::text[], NULL, 1),
  ('00000001-0000-0000-0000-000000000011', 'how', 'tip', 'diet_weight_psycho.lithium_safety.how.alert', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000011', 'how', 'blockquote', 'diet_weight_psycho.lithium_safety.how.bq1', null, NULL, 3),
  ('00000001-0000-0000-0000-000000000011', 'sources', 'heading', 'section.sources', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000011', 'sources', 'source_link', 'diet_weight_psycho.lithium_safety.sources.s1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000011', 'sources', 'source_link', 'diet_weight_psycho.lithium_safety.sources.s2', null, 'https://doi.org/10.1007/s00210-024-03210-8', 3),
  ('00000001-0000-0000-0000-000000000003', 'why', 'heading', 'section.why', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000003', 'why', 'paragraph', 'diet_weight_psycho.gentle_activity.why.p1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000003', 'how', 'action_list', NULL, '{diet_weight_psycho.gentle_activity.how.action1,diet_weight_psycho.gentle_activity.how.action2,diet_weight_psycho.gentle_activity.how.action3,diet_weight_psycho.gentle_activity.how.action4,diet_weight_psycho.gentle_activity.how.action5}'::text[], NULL, 1),
  ('00000001-0000-0000-0000-000000000003', 'how', 'tip', 'diet_weight_psycho.gentle_activity.how.tip', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000003', 'sources', 'heading', 'section.sources', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000003', 'sources', 'source_link', 'diet_weight_psycho.gentle_activity.sources.s1', null, 'https://doi.org/10.1136/bmj-2023-075847', 2),
  ('00000001-0000-0000-0000-000000000003', 'sources', 'source_link', 'diet_weight_psycho.gentle_activity.sources.s2', null, 'https://doi.org/10.1001/jamapsychiatry.2022.0609', 3),
  ('00000001-0000-0000-0000-000000000002', 'why', 'heading', 'section.why', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000002', 'why', 'paragraph', 'diet_weight_psycho.nutrition_brain.why.p1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000002', 'how', 'action_list', NULL, '{diet_weight_psycho.nutrition_brain.how.action1,diet_weight_psycho.nutrition_brain.how.action2,diet_weight_psycho.nutrition_brain.how.action3,diet_weight_psycho.nutrition_brain.how.action4,diet_weight_psycho.nutrition_brain.how.action5}'::text[], NULL, 1),
  ('00000001-0000-0000-0000-000000000002', 'how', 'tip', 'diet_weight_psycho.nutrition_brain.how.tip', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000002', 'sources', 'heading', 'section.sources', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000002', 'sources', 'source_link', 'diet_weight_psycho.nutrition_brain.sources.s1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000002', 'sources', 'source_link', 'diet_weight_psycho.nutrition_brain.sources.s2', null, 'https://doi.org/10.1097/PSY.0000000000000673', 3),
  ('00000001-0000-0000-0000-000000000001', 'why', 'heading', 'section.why', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000001', 'why', 'paragraph', 'diet_weight_psycho.sleep_chrono.why.p1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000001', 'how', 'action_list', NULL, '{diet_weight_psycho.sleep_chrono.how.action1,diet_weight_psycho.sleep_chrono.how.action2,diet_weight_psycho.sleep_chrono.how.action3,diet_weight_psycho.sleep_chrono.how.action4,diet_weight_psycho.sleep_chrono.how.action5}'::text[], NULL, 1),
  ('00000001-0000-0000-0000-000000000001', 'how', 'tip', 'diet_weight_psycho.sleep_chrono.how.tip', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000001', 'sources', 'heading', 'section.sources', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000001', 'sources', 'source_link', 'diet_weight_psycho.sleep_chrono.sources.s1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000001', 'sources', 'source_link', 'diet_weight_psycho.sleep_chrono.sources.s2', null, 'https://doi.org/10.1001/jamapsychiatry.2023.5060', 3),
  ('00000001-0000-0000-0000-000000000009', 'why', 'heading', 'section.why', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000009', 'why', 'paragraph', 'psyedu_sleep.sleep_hygiene_rules.why.p1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000009', 'how', 'action_list', NULL, '{psyedu_sleep.sleep_hygiene_rules.how.action1,psyedu_sleep.sleep_hygiene_rules.how.action2,psyedu_sleep.sleep_hygiene_rules.how.action3,psyedu_sleep.sleep_hygiene_rules.how.action4,psyedu_sleep.sleep_hygiene_rules.how.action5,psyedu_sleep.sleep_hygiene_rules.how.action6}'::text[], NULL, 1),
  ('00000001-0000-0000-0000-000000000009', 'how', 'tip', 'psyedu_sleep.sleep_hygiene_rules.how.tip', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000009', 'sources', 'heading', 'section.sources', null, NULL, 1),
  ('00000001-0000-0000-0000-000000000009', 'sources', 'source_link', 'psyedu_sleep.sleep_hygiene_rules.sources.s1', null, NULL, 2),
  ('00000001-0000-0000-0000-000000000009', 'sources', 'source_link', 'psyedu_sleep.sleep_hygiene_rules.sources.s2', null, 'https://doi.org/10.1001/jamapsychiatry.2023.5060', 3);
