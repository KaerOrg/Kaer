-- ============================================================
-- SEED — psyedu_topics + psyedu_blocks
-- Modules : psyedu_sleep, psyedu_nutrition, psyedu_activity, diet_weight_psycho, cognitive_distortions
-- Idempotent : DELETE + INSERT avec topic_key comme clé stable
-- ============================================================

-- Nettoyage (cascade supprime les blocs liés)
delete from public.psyedu_topics
where module_key in ('diet_weight_psycho', 'psyedu_sleep', 'psyedu_nutrition', 'psyedu_activity', 'cognitive_distortions');

-- ────────────────────────────────────────────────────────────
-- TOPICS
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_topics (id, module_key, topic_key, icon_name, sort_order)
values
  -- Sommeil & récupération
  ('00000001-0000-0000-0000-000000000001', 'psyedu_sleep',      'sleep_chrono',         'Moon',       1),
  ('00000001-0000-0000-0000-000000000009', 'psyedu_sleep',      'sleep_hygiene_rules',  'ListChecks', 2),
  -- Alimentation & cerveau
  ('00000001-0000-0000-0000-000000000002', 'psyedu_nutrition',  'nutrition_brain', 'Apple',      1),
  -- Activité physique douce
  ('00000001-0000-0000-0000-000000000003', 'psyedu_activity',   'gentle_activity', 'Footprints', 1),
  -- Psychotropes & alimentation (fiches médicaments)
  ('00000001-0000-0000-0000-000000000004', 'diet_weight_psycho','general',         'Info',       1),
  ('00000001-0000-0000-0000-000000000005', 'diet_weight_psycho','antipsychotics',  'Pill',       2),
  ('00000001-0000-0000-0000-000000000006', 'diet_weight_psycho','methylphenidate', 'Zap',        3),
  ('00000001-0000-0000-0000-000000000007', 'diet_weight_psycho','antidepressants', 'SmilePlus',  4),
  ('00000001-0000-0000-0000-000000000008', 'diet_weight_psycho','mood_stabilizers','HeartPulse', 5),
  -- Distorsions cognitives
  ('00000001-0000-0000-0000-000000000010', 'cognitive_distortions','cog_distortions_intro', 'BrainCircuit', 1);

-- ────────────────────────────────────────────────────────────
-- BLOCS — sleep_chrono
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  -- why
  ('00000001-0000-0000-0000-000000000001', 'why', 'heading',    'section.why',                                                       null, null, 1),
  ('00000001-0000-0000-0000-000000000001', 'why', 'paragraph',  'diet_weight_psycho.sleep_chrono.why.p1',                            null, null, 2),
  ('00000001-0000-0000-0000-000000000001', 'why', 'paragraph',  'diet_weight_psycho.sleep_chrono.why.p2',                            null, null, 3),
  ('00000001-0000-0000-0000-000000000001', 'why', 'paragraph',  'diet_weight_psycho.sleep_chrono.why.p3',                            null, null, 4),
  ('00000001-0000-0000-0000-000000000001', 'why', 'tip',        'diet_weight_psycho.sleep_chrono.why.tip1',                          null, null, 5),
  ('00000001-0000-0000-0000-000000000001', 'why', 'paragraph',  'diet_weight_psycho.sleep_chrono.why.p4',                            null, null, 6),
  ('00000001-0000-0000-0000-000000000001', 'why', 'paragraph',  'diet_weight_psycho.sleep_chrono.why.p5',                            null, null, 7),
  ('00000001-0000-0000-0000-000000000001', 'why', 'paragraph',  'diet_weight_psycho.sleep_chrono.why.p6',                            null, null, 8),
  ('00000001-0000-0000-0000-000000000001', 'why', 'paragraph',  'diet_weight_psycho.sleep_chrono.why.p7',                            null, null, 9),
  -- how
  ('00000001-0000-0000-0000-000000000001', 'how', 'heading',    'section.how',                                                       null, null, 1),
  ('00000001-0000-0000-0000-000000000001', 'how', 'tip',        'diet_weight_psycho.sleep_chrono.how.intro',                         null, null, 2),
  ('00000001-0000-0000-0000-000000000001', 'how', 'bullet_list', null,
    array[
      'diet_weight_psycho.sleep_chrono.how.item1',
      'diet_weight_psycho.sleep_chrono.how.item2',
      'diet_weight_psycho.sleep_chrono.how.item3',
      'diet_weight_psycho.sleep_chrono.how.item4',
      'diet_weight_psycho.sleep_chrono.how.item5'
    ], null, 3),
  -- sources
  ('00000001-0000-0000-0000-000000000001', 'sources', 'heading',     'section.sources',                                              null, null, 1),
  ('00000001-0000-0000-0000-000000000001', 'sources', 'source_link', 'diet_weight_psycho.sleep_chrono.sources.s1',                   null, 'https://www.has-sante.fr', 2),
  ('00000001-0000-0000-0000-000000000001', 'sources', 'source_link', 'diet_weight_psycho.sleep_chrono.sources.s2',                   null, 'https://www.insv.fr', 3),
  ('00000001-0000-0000-0000-000000000001', 'sources', 'source_link', 'diet_weight_psycho.sleep_chrono.sources.s3',                   null, null, 4),
  ('00000001-0000-0000-0000-000000000001', 'sources', 'source_link', 'diet_weight_psycho.sleep_chrono.sources.s4',                   null, null, 5);

-- ────────────────────────────────────────────────────────────
-- BLOCS — nutrition_brain
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  ('00000001-0000-0000-0000-000000000002', 'why', 'heading',    'section.why',                                                       null, null, 1),
  ('00000001-0000-0000-0000-000000000002', 'why', 'paragraph',  'diet_weight_psycho.nutrition_brain.why.p1',                         null, null, 2),
  ('00000001-0000-0000-0000-000000000002', 'why', 'paragraph',  'diet_weight_psycho.nutrition_brain.why.p2',                         null, null, 3),
  ('00000001-0000-0000-0000-000000000002', 'why', 'paragraph',  'diet_weight_psycho.nutrition_brain.why.p3',                         null, null, 4),
  ('00000001-0000-0000-0000-000000000002', 'why', 'paragraph',  'diet_weight_psycho.nutrition_brain.why.p4',                         null, null, 5),
  ('00000001-0000-0000-0000-000000000002', 'why', 'paragraph',  'diet_weight_psycho.nutrition_brain.why.p5',                         null, null, 6),
  ('00000001-0000-0000-0000-000000000002', 'why', 'paragraph',  'diet_weight_psycho.nutrition_brain.why.p6',                         null, null, 7),
  ('00000001-0000-0000-0000-000000000002', 'why', 'blockquote', 'diet_weight_psycho.nutrition_brain.why.bq1',                        null, null, 8),

  ('00000001-0000-0000-0000-000000000002', 'how', 'heading',    'section.how',                                                       null, null, 1),
  ('00000001-0000-0000-0000-000000000002', 'how', 'paragraph',  'diet_weight_psycho.nutrition_brain.how.p1',                         null, null, 2),
  ('00000001-0000-0000-0000-000000000002', 'how', 'bullet_list', null,
    array[
      'diet_weight_psycho.nutrition_brain.how.tier1',
      'diet_weight_psycho.nutrition_brain.how.tier2',
      'diet_weight_psycho.nutrition_brain.how.tier3'
    ], null, 3),
  ('00000001-0000-0000-0000-000000000002', 'how', 'tip',        'diet_weight_psycho.nutrition_brain.how.tip1',                       null, null, 4),
  ('00000001-0000-0000-0000-000000000002', 'how', 'paragraph',  'diet_weight_psycho.nutrition_brain.how.p2',                         null, null, 5),
  ('00000001-0000-0000-0000-000000000002', 'how', 'bullet_list', null,
    array[
      'diet_weight_psycho.nutrition_brain.how.habit1',
      'diet_weight_psycho.nutrition_brain.how.habit2',
      'diet_weight_psycho.nutrition_brain.how.habit3'
    ], null, 6),

  ('00000001-0000-0000-0000-000000000002', 'sources', 'heading',     'section.sources',                                              null, null, 1),
  ('00000001-0000-0000-0000-000000000002', 'sources', 'source_link', 'diet_weight_psycho.nutrition_brain.sources.s1',                null, 'https://www.who.int/fr', 2),
  ('00000001-0000-0000-0000-000000000002', 'sources', 'source_link', 'diet_weight_psycho.nutrition_brain.sources.s2',                null, 'https://www.mangerbouger.fr', 3),
  ('00000001-0000-0000-0000-000000000002', 'sources', 'source_link', 'diet_weight_psycho.nutrition_brain.sources.s3',                null, null, 4),
  ('00000001-0000-0000-0000-000000000002', 'sources', 'source_link', 'diet_weight_psycho.nutrition_brain.sources.s4',                null, null, 5);

-- ────────────────────────────────────────────────────────────
-- BLOCS — gentle_activity
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  ('00000001-0000-0000-0000-000000000003', 'why', 'heading',    'section.why',                                                       null, null, 1),
  ('00000001-0000-0000-0000-000000000003', 'why', 'paragraph',  'diet_weight_psycho.gentle_activity.why.p1',                         null, null, 2),
  ('00000001-0000-0000-0000-000000000003', 'why', 'paragraph',  'diet_weight_psycho.gentle_activity.why.p2',                         null, null, 3),
  ('00000001-0000-0000-0000-000000000003', 'why', 'paragraph',  'diet_weight_psycho.gentle_activity.why.p3',                         null, null, 4),
  ('00000001-0000-0000-0000-000000000003', 'why', 'paragraph',  'diet_weight_psycho.gentle_activity.why.p4',                         null, null, 5),
  ('00000001-0000-0000-0000-000000000003', 'why', 'tip',        'diet_weight_psycho.gentle_activity.why.tip1',                       null, null, 6),
  ('00000001-0000-0000-0000-000000000003', 'why', 'paragraph',  'diet_weight_psycho.gentle_activity.why.p5',                         null, null, 7),
  ('00000001-0000-0000-0000-000000000003', 'why', 'paragraph',  'diet_weight_psycho.gentle_activity.why.p6',                         null, null, 8),
  ('00000001-0000-0000-0000-000000000003', 'why', 'blockquote', 'diet_weight_psycho.gentle_activity.why.bq1',                        null, null, 9),

  ('00000001-0000-0000-0000-000000000003', 'how', 'heading',    'section.how',                                                       null, null, 1),
  ('00000001-0000-0000-0000-000000000003', 'how', 'tip',        'diet_weight_psycho.gentle_activity.how.tip1',                       null, null, 2),
  ('00000001-0000-0000-0000-000000000003', 'how', 'paragraph',  'diet_weight_psycho.gentle_activity.how.p1',                         null, null, 3),
  ('00000001-0000-0000-0000-000000000003', 'how', 'bullet_list', null,
    array[
      'diet_weight_psycho.gentle_activity.how.neat1',
      'diet_weight_psycho.gentle_activity.how.neat2',
      'diet_weight_psycho.gentle_activity.how.neat3',
      'diet_weight_psycho.gentle_activity.how.neat4'
    ], null, 4),
  ('00000001-0000-0000-0000-000000000003', 'how', 'paragraph',  'diet_weight_psycho.gentle_activity.how.p2',                         null, null, 5),
  ('00000001-0000-0000-0000-000000000003', 'how', 'paragraph',  'diet_weight_psycho.gentle_activity.how.p3',                         null, null, 6),

  ('00000001-0000-0000-0000-000000000003', 'sources', 'heading',     'section.sources',                                              null, null, 1),
  ('00000001-0000-0000-0000-000000000003', 'sources', 'source_link', 'diet_weight_psycho.gentle_activity.sources.s1',                null, 'https://www.has-sante.fr', 2),
  ('00000001-0000-0000-0000-000000000003', 'sources', 'source_link', 'diet_weight_psycho.gentle_activity.sources.s2',                null, 'https://www.who.int/fr', 3),
  ('00000001-0000-0000-0000-000000000003', 'sources', 'source_link', 'diet_weight_psycho.gentle_activity.sources.s3',                null, null, 4),
  ('00000001-0000-0000-0000-000000000003', 'sources', 'source_link', 'diet_weight_psycho.gentle_activity.sources.s4',                null, null, 5);

-- ────────────────────────────────────────────────────────────
-- BLOCS — general (Psychotropes et alimentation — migré)
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  ('00000001-0000-0000-0000-000000000004', 'why', 'heading',    'section.why',                                                       null, null, 1),
  ('00000001-0000-0000-0000-000000000004', 'why', 'paragraph',  'diet_weight_psycho.general.why.p1',                                 null, null, 2),
  ('00000001-0000-0000-0000-000000000004', 'why', 'bullet_list', null,
    array[
      'diet_weight_psycho.general.why.effect1',
      'diet_weight_psycho.general.why.effect2',
      'diet_weight_psycho.general.why.effect3',
      'diet_weight_psycho.general.why.effect4'
    ], null, 3),
  ('00000001-0000-0000-0000-000000000004', 'why', 'paragraph',  'diet_weight_psycho.general.why.p2',                                 null, null, 4),

  ('00000001-0000-0000-0000-000000000004', 'how', 'heading',    'section.how',                                                       null, null, 1),
  ('00000001-0000-0000-0000-000000000004', 'how', 'paragraph',  'diet_weight_psycho.general.how.p1',                                 null, null, 2),
  ('00000001-0000-0000-0000-000000000004', 'how', 'bullet_list', null,
    array[
      'diet_weight_psycho.general.how.tip1',
      'diet_weight_psycho.general.how.tip2',
      'diet_weight_psycho.general.how.tip3',
      'diet_weight_psycho.general.how.tip4',
      'diet_weight_psycho.general.how.tip5'
    ], null, 3),
  ('00000001-0000-0000-0000-000000000004', 'how', 'blockquote', 'diet_weight_psycho.general.how.bq1',                                null, null, 4),

  ('00000001-0000-0000-0000-000000000004', 'sources', 'heading',     'section.sources',                                              null, null, 1),
  ('00000001-0000-0000-0000-000000000004', 'sources', 'source_link', 'diet_weight_psycho.general.sources.s1',                        null, 'https://www.has-sante.fr', 2),
  ('00000001-0000-0000-0000-000000000004', 'sources', 'source_link', 'diet_weight_psycho.general.sources.s2',                        null, 'https://ansm.sante.fr', 3),
  ('00000001-0000-0000-0000-000000000004', 'sources', 'source_link', 'diet_weight_psycho.general.sources.s3',                        null, 'https://www.who.int/fr', 4);

-- ────────────────────────────────────────────────────────────
-- BLOCS — antipsychotics (migré)
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  ('00000001-0000-0000-0000-000000000005', 'why', 'heading',    'section.why',                                                       null, null, 1),
  ('00000001-0000-0000-0000-000000000005', 'why', 'paragraph',  'diet_weight_psycho.antipsychotics.why.p1',                          null, null, 2),
  ('00000001-0000-0000-0000-000000000005', 'why', 'bullet_list', null,
    array[
      'diet_weight_psycho.antipsychotics.why.mech1',
      'diet_weight_psycho.antipsychotics.why.mech2',
      'diet_weight_psycho.antipsychotics.why.mech3'
    ], null, 3),
  ('00000001-0000-0000-0000-000000000005', 'why', 'paragraph',  'diet_weight_psycho.antipsychotics.why.p2',                          null, null, 4),
  ('00000001-0000-0000-0000-000000000005', 'why', 'blockquote', 'diet_weight_psycho.antipsychotics.why.bq1',                         null, null, 5),

  ('00000001-0000-0000-0000-000000000005', 'how', 'heading',    'section.how',                                                       null, null, 1),
  ('00000001-0000-0000-0000-000000000005', 'how', 'paragraph',  'diet_weight_psycho.antipsychotics.how.suivi_intro',                  null, null, 2),
  ('00000001-0000-0000-0000-000000000005', 'how', 'bullet_list', null,
    array[
      'diet_weight_psycho.antipsychotics.how.suivi1',
      'diet_weight_psycho.antipsychotics.how.suivi2',
      'diet_weight_psycho.antipsychotics.how.suivi3',
      'diet_weight_psycho.antipsychotics.how.suivi4'
    ], null, 3),
  ('00000001-0000-0000-0000-000000000005', 'how', 'paragraph',  'diet_weight_psycho.antipsychotics.how.meals_intro',                  null, null, 4),
  ('00000001-0000-0000-0000-000000000005', 'how', 'bullet_list', null,
    array[
      'diet_weight_psycho.antipsychotics.how.meal1',
      'diet_weight_psycho.antipsychotics.how.meal2',
      'diet_weight_psycho.antipsychotics.how.meal3'
    ], null, 5),

  ('00000001-0000-0000-0000-000000000005', 'sources', 'heading',     'section.sources',                                              null, null, 1),
  ('00000001-0000-0000-0000-000000000005', 'sources', 'source_link', 'diet_weight_psycho.antipsychotics.sources.s1',                  null, 'https://www.has-sante.fr', 2),
  ('00000001-0000-0000-0000-000000000005', 'sources', 'source_link', 'diet_weight_psycho.antipsychotics.sources.s2',                  null, null, 3),
  ('00000001-0000-0000-0000-000000000005', 'sources', 'source_link', 'diet_weight_psycho.antipsychotics.sources.s3',                  null, null, 4);

-- ────────────────────────────────────────────────────────────
-- BLOCS — methylphenidate (migré)
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  ('00000001-0000-0000-0000-000000000006', 'why', 'heading',    'section.why',                                                       null, null, 1),
  ('00000001-0000-0000-0000-000000000006', 'why', 'paragraph',  'diet_weight_psycho.methylphenidate.why.p1',                         null, null, 2),
  ('00000001-0000-0000-0000-000000000006', 'why', 'paragraph',  'diet_weight_psycho.methylphenidate.why.p2',                         null, null, 3),
  ('00000001-0000-0000-0000-000000000006', 'why', 'bullet_list', null,
    array[
      'diet_weight_psycho.methylphenidate.why.cons1',
      'diet_weight_psycho.methylphenidate.why.cons2',
      'diet_weight_psycho.methylphenidate.why.cons3'
    ], null, 4),
  ('00000001-0000-0000-0000-000000000006', 'why', 'blockquote', 'diet_weight_psycho.methylphenidate.why.bq_child',                   null, null, 5),

  ('00000001-0000-0000-0000-000000000006', 'how', 'heading',    'section.how',                                                       null, null, 1),
  ('00000001-0000-0000-0000-000000000006', 'how', 'paragraph',  'diet_weight_psycho.methylphenidate.how.breakfast_intro',             null, null, 2),
  ('00000001-0000-0000-0000-000000000006', 'how', 'bullet_list', null,
    array[
      'diet_weight_psycho.methylphenidate.how.b1',
      'diet_weight_psycho.methylphenidate.how.b2'
    ], null, 3),
  ('00000001-0000-0000-0000-000000000006', 'how', 'paragraph',  'diet_weight_psycho.methylphenidate.how.lunch_intro',                 null, null, 4),
  ('00000001-0000-0000-0000-000000000006', 'how', 'bullet_list', null,
    array[
      'diet_weight_psycho.methylphenidate.how.l1',
      'diet_weight_psycho.methylphenidate.how.l2'
    ], null, 5),
  ('00000001-0000-0000-0000-000000000006', 'how', 'blockquote', 'diet_weight_psycho.methylphenidate.how.bq1',                        null, null, 6),

  ('00000001-0000-0000-0000-000000000006', 'sources', 'heading',     'section.sources',                                              null, null, 1),
  ('00000001-0000-0000-0000-000000000006', 'sources', 'source_link', 'diet_weight_psycho.methylphenidate.sources.s1',                 null, 'https://ansm.sante.fr', 2),
  ('00000001-0000-0000-0000-000000000006', 'sources', 'source_link', 'diet_weight_psycho.methylphenidate.sources.s2',                 null, null, 3);

-- ────────────────────────────────────────────────────────────
-- BLOCS — antidepressants (migré)
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  ('00000001-0000-0000-0000-000000000007', 'why', 'heading',    'section.why',                                                       null, null, 1),
  ('00000001-0000-0000-0000-000000000007', 'why', 'paragraph',  'diet_weight_psycho.antidepressants.why.p1',                         null, null, 2),
  ('00000001-0000-0000-0000-000000000007', 'why', 'paragraph',  'diet_weight_psycho.antidepressants.why.p2',                         null, null, 3),
  ('00000001-0000-0000-0000-000000000007', 'why', 'paragraph',  'diet_weight_psycho.antidepressants.why.p3',                         null, null, 4),
  ('00000001-0000-0000-0000-000000000007', 'why', 'paragraph',  'diet_weight_psycho.antidepressants.why.p4',                         null, null, 5),
  ('00000001-0000-0000-0000-000000000007', 'why', 'blockquote', 'diet_weight_psycho.antidepressants.why.bq1',                        null, null, 6),

  ('00000001-0000-0000-0000-000000000007', 'how', 'heading',    'section.how',                                                       null, null, 1),
  ('00000001-0000-0000-0000-000000000007', 'how', 'paragraph',  'diet_weight_psycho.antidepressants.how.p1',                         null, null, 2),
  ('00000001-0000-0000-0000-000000000007', 'how', 'blockquote', 'diet_weight_psycho.antidepressants.how.bq1',                        null, null, 3),

  ('00000001-0000-0000-0000-000000000007', 'sources', 'heading',     'section.sources',                                              null, null, 1),
  ('00000001-0000-0000-0000-000000000007', 'sources', 'source_link', 'diet_weight_psycho.antidepressants.sources.s1',                 null, 'https://ansm.sante.fr', 2),
  ('00000001-0000-0000-0000-000000000007', 'sources', 'source_link', 'diet_weight_psycho.antidepressants.sources.s2',                 null, null, 3);

-- ────────────────────────────────────────────────────────────
-- BLOCS — mood_stabilizers (migré)
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  ('00000001-0000-0000-0000-000000000008', 'why', 'heading',    'section.why',                                                       null, null, 1),
  ('00000001-0000-0000-0000-000000000008', 'why', 'paragraph',  'diet_weight_psycho.mood_stabilizers.why.p1',                        null, null, 2),
  ('00000001-0000-0000-0000-000000000008', 'why', 'paragraph',  'diet_weight_psycho.mood_stabilizers.why.p2',                        null, null, 3),
  ('00000001-0000-0000-0000-000000000008', 'why', 'paragraph',  'diet_weight_psycho.mood_stabilizers.why.p3',                        null, null, 4),
  ('00000001-0000-0000-0000-000000000008', 'why', 'blockquote', 'diet_weight_psycho.mood_stabilizers.why.bq_lithium',                null, null, 5),
  ('00000001-0000-0000-0000-000000000008', 'why', 'paragraph',  'diet_weight_psycho.mood_stabilizers.why.p4',                        null, null, 6),

  ('00000001-0000-0000-0000-000000000008', 'how', 'heading',    'section.how',                                                       null, null, 1),
  ('00000001-0000-0000-0000-000000000008', 'how', 'paragraph',  'diet_weight_psycho.mood_stabilizers.how.p1',                        null, null, 2),
  ('00000001-0000-0000-0000-000000000008', 'how', 'bullet_list', null,
    array[
      'diet_weight_psycho.mood_stabilizers.how.tip1',
      'diet_weight_psycho.mood_stabilizers.how.tip2',
      'diet_weight_psycho.mood_stabilizers.how.tip3'
    ], null, 3),
  ('00000001-0000-0000-0000-000000000008', 'how', 'blockquote', 'diet_weight_psycho.mood_stabilizers.how.bq1',                       null, null, 4),

  ('00000001-0000-0000-0000-000000000008', 'sources', 'heading',     'section.sources',                                              null, null, 1),
  ('00000001-0000-0000-0000-000000000008', 'sources', 'source_link', 'diet_weight_psycho.mood_stabilizers.sources.s1',                null, 'https://ansm.sante.fr', 2),
  ('00000001-0000-0000-0000-000000000008', 'sources', 'source_link', 'diet_weight_psycho.mood_stabilizers.sources.s2',                null, null, 3);

-- ────────────────────────────────────────────────────────────
-- BLOCS — sleep_hygiene_rules (psyedu_sleep, topic 2)
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  -- why
  ('00000001-0000-0000-0000-000000000009', 'why', 'heading',    'section.why',                                                    null, null, 1),
  ('00000001-0000-0000-0000-000000000009', 'why', 'paragraph',  'psyedu_sleep.sleep_hygiene_rules.why.p1',                        null, null, 2),
  ('00000001-0000-0000-0000-000000000009', 'why', 'paragraph',  'psyedu_sleep.sleep_hygiene_rules.why.p2',                        null, null, 3),
  ('00000001-0000-0000-0000-000000000009', 'why', 'tip',        'psyedu_sleep.sleep_hygiene_rules.why.tip1',                      null, null, 4),
  -- how
  ('00000001-0000-0000-0000-000000000009', 'how', 'heading',    'section.how',                                                    null, null, 1),
  ('00000001-0000-0000-0000-000000000009', 'how', 'paragraph',  'psyedu_sleep.sleep_hygiene_rules.how.intro',                     null, null, 2),
  ('00000001-0000-0000-0000-000000000009', 'how', 'bullet_list', null,
    array[
      'psyedu_sleep.sleep_hygiene_rules.how.item1',
      'psyedu_sleep.sleep_hygiene_rules.how.item2',
      'psyedu_sleep.sleep_hygiene_rules.how.item3',
      'psyedu_sleep.sleep_hygiene_rules.how.item4',
      'psyedu_sleep.sleep_hygiene_rules.how.item5',
      'psyedu_sleep.sleep_hygiene_rules.how.item6',
      'psyedu_sleep.sleep_hygiene_rules.how.item7',
      'psyedu_sleep.sleep_hygiene_rules.how.item8',
      'psyedu_sleep.sleep_hygiene_rules.how.item9',
      'psyedu_sleep.sleep_hygiene_rules.how.item10'
    ], null, 3),
  ('00000001-0000-0000-0000-000000000009', 'how', 'tip',        'psyedu_sleep.sleep_hygiene_rules.how.tip1',                      null, null, 4),
  -- sources
  ('00000001-0000-0000-0000-000000000009', 'sources', 'heading',     'section.sources',                                          null, null, 1),
  ('00000001-0000-0000-0000-000000000009', 'sources', 'source_link', 'psyedu_sleep.sleep_hygiene_rules.sources.s1',               null, 'https://www.has-sante.fr', 2),
  ('00000001-0000-0000-0000-000000000009', 'sources', 'source_link', 'psyedu_sleep.sleep_hygiene_rules.sources.s2',               null, 'https://www.insv.fr', 3);

-- ────────────────────────────────────────────────────────────
-- BLOCS — cog_distortions_intro (cognitive_distortions, topic 1)
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  -- why
  ('00000001-0000-0000-0000-000000000010', 'why', 'heading',    'section.why',                                                    null, null, 1),
  ('00000001-0000-0000-0000-000000000010', 'why', 'paragraph',  'cognitive_distortions.cog_distortions_intro.why.p1',             null, null, 2),
  ('00000001-0000-0000-0000-000000000010', 'why', 'paragraph',  'cognitive_distortions.cog_distortions_intro.why.p2',             null, null, 3),
  ('00000001-0000-0000-0000-000000000010', 'why', 'tip',        'cognitive_distortions.cog_distortions_intro.why.tip1',           null, null, 4),
  ('00000001-0000-0000-0000-000000000010', 'why', 'bullet_list', null,
    array[
      'cognitive_distortions.cog_distortions_intro.why.d1',
      'cognitive_distortions.cog_distortions_intro.why.d2',
      'cognitive_distortions.cog_distortions_intro.why.d3',
      'cognitive_distortions.cog_distortions_intro.why.d4',
      'cognitive_distortions.cog_distortions_intro.why.d5',
      'cognitive_distortions.cog_distortions_intro.why.d6',
      'cognitive_distortions.cog_distortions_intro.why.d7',
      'cognitive_distortions.cog_distortions_intro.why.d8',
      'cognitive_distortions.cog_distortions_intro.why.d9',
      'cognitive_distortions.cog_distortions_intro.why.d10'
    ], null, 5),
  -- how
  ('00000001-0000-0000-0000-000000000010', 'how', 'heading',    'section.how',                                                    null, null, 1),
  ('00000001-0000-0000-0000-000000000010', 'how', 'paragraph',  'cognitive_distortions.cog_distortions_intro.how.p1',             null, null, 2),
  ('00000001-0000-0000-0000-000000000010', 'how', 'bullet_list', null,
    array[
      'cognitive_distortions.cog_distortions_intro.how.step1',
      'cognitive_distortions.cog_distortions_intro.how.step2',
      'cognitive_distortions.cog_distortions_intro.how.step3'
    ], null, 3),
  ('00000001-0000-0000-0000-000000000010', 'how', 'blockquote', 'cognitive_distortions.cog_distortions_intro.how.bq1',            null, null, 4),
  -- sources
  ('00000001-0000-0000-0000-000000000010', 'sources', 'heading',     'section.sources',                                          null, null, 1),
  ('00000001-0000-0000-0000-000000000010', 'sources', 'source_link', 'cognitive_distortions.cog_distortions_intro.sources.s1',   null, null, 2),
  ('00000001-0000-0000-0000-000000000010', 'sources', 'source_link', 'cognitive_distortions.cog_distortions_intro.sources.s2',   null, null, 3);
