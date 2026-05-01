-- ============================================================
-- SEED — psyedu_topics + psyedu_blocks
-- Module : distress_tolerance (tolérance à la détresse — DBT)
-- Idempotent : DELETE + INSERT avec UUIDs fixes
-- Sources vérifiées : Linehan 1993/2015, validation DBT RCTs
-- ============================================================

delete from public.psyedu_topics
where module_key = 'distress_tolerance';

-- ────────────────────────────────────────────────────────────
-- TOPICS (6 fiches)
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_topics (id, module_key, topic_key, icon_name, sort_order)
values
  ('00000003-0000-0000-0000-000000000001', 'distress_tolerance', 'intro',        'BookOpen', 1),
  ('00000003-0000-0000-0000-000000000002', 'distress_tolerance', 'tipp',         'Zap',      2),
  ('00000003-0000-0000-0000-000000000003', 'distress_tolerance', 'accepts',      'Wind',     3),
  ('00000003-0000-0000-0000-000000000004', 'distress_tolerance', 'self_soothing','Heart',    4),
  ('00000003-0000-0000-0000-000000000005', 'distress_tolerance', 'improve',      'Star',     5),
  ('00000003-0000-0000-0000-000000000006', 'distress_tolerance', 'pros_cons',    'Scale',    6);


-- ────────────────────────────────────────────────────────────
-- BLOCS — intro
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  -- why
  ('00000003-0000-0000-0000-000000000001', 'why', 'heading',    'section.why',                                        null, null, 1),
  ('00000003-0000-0000-0000-000000000001', 'why', 'paragraph',  'distress_tolerance.intro.why.p1',                    null, null, 2),
  ('00000003-0000-0000-0000-000000000001', 'why', 'paragraph',  'distress_tolerance.intro.why.p2',                    null, null, 3),
  ('00000003-0000-0000-0000-000000000001', 'why', 'paragraph',  'distress_tolerance.intro.why.p3',                    null, null, 4),
  ('00000003-0000-0000-0000-000000000001', 'why', 'tip',        'distress_tolerance.intro.why.tip1',                  null, null, 5),
  -- how
  ('00000003-0000-0000-0000-000000000001', 'how', 'heading',    'section.how',                                        null, null, 1),
  ('00000003-0000-0000-0000-000000000001', 'how', 'paragraph',  'distress_tolerance.intro.how.p1',                    null, null, 2),
  ('00000003-0000-0000-0000-000000000001', 'how', 'paragraph',  'distress_tolerance.intro.how.p2',                    null, null, 3),
  ('00000003-0000-0000-0000-000000000001', 'how', 'bullet_list', null, ARRAY[
    'distress_tolerance.intro.how.item1',
    'distress_tolerance.intro.how.item2',
    'distress_tolerance.intro.how.item3'
  ], null, 4),
  -- sources
  ('00000003-0000-0000-0000-000000000001', 'sources', 'heading',     'section.sources',                               null, null, 1),
  ('00000003-0000-0000-0000-000000000001', 'sources', 'source_link', 'distress_tolerance.intro.sources.s1',           null, null, 2),
  ('00000003-0000-0000-0000-000000000001', 'sources', 'source_link', 'distress_tolerance.intro.sources.s2',           null, null, 3);


-- ────────────────────────────────────────────────────────────
-- BLOCS — tipp
-- Sources :
--   Linehan MM (2015) — DBT Skills Training Manual, 2nd ed. Guilford Press.
--   Porges SW (2011) — The Polyvagal Theory. W.W. Norton.
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  -- why
  ('00000003-0000-0000-0000-000000000002', 'why', 'heading',    'section.why',                                        null, null, 1),
  ('00000003-0000-0000-0000-000000000002', 'why', 'paragraph',  'distress_tolerance.tipp.why.p1',                     null, null, 2),
  ('00000003-0000-0000-0000-000000000002', 'why', 'paragraph',  'distress_tolerance.tipp.why.p2',                     null, null, 3),
  ('00000003-0000-0000-0000-000000000002', 'why', 'paragraph',  'distress_tolerance.tipp.why.p3',                     null, null, 4),
  ('00000003-0000-0000-0000-000000000002', 'why', 'paragraph',  'distress_tolerance.tipp.why.p4',                     null, null, 5),
  ('00000003-0000-0000-0000-000000000002', 'why', 'paragraph',  'distress_tolerance.tipp.why.p5',                     null, null, 6),
  ('00000003-0000-0000-0000-000000000002', 'why', 'tip',        'distress_tolerance.tipp.why.tip1',                   null, null, 7),
  -- how
  ('00000003-0000-0000-0000-000000000002', 'how', 'heading',    'section.how',                                        null, null, 1),
  ('00000003-0000-0000-0000-000000000002', 'how', 'paragraph',  'distress_tolerance.tipp.how.p1',                     null, null, 2),
  ('00000003-0000-0000-0000-000000000002', 'how', 'paragraph',  'distress_tolerance.tipp.how.p2',                     null, null, 3),
  ('00000003-0000-0000-0000-000000000002', 'how', 'paragraph',  'distress_tolerance.tipp.how.p3',                     null, null, 4),
  ('00000003-0000-0000-0000-000000000002', 'how', 'paragraph',  'distress_tolerance.tipp.how.p4',                     null, null, 5),
  ('00000003-0000-0000-0000-000000000002', 'how', 'bullet_list', null, ARRAY[
    'distress_tolerance.tipp.how.item1',
    'distress_tolerance.tipp.how.item2',
    'distress_tolerance.tipp.how.item3'
  ], null, 6);


-- ────────────────────────────────────────────────────────────
-- BLOCS — accepts
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  -- why
  ('00000003-0000-0000-0000-000000000003', 'why', 'heading',    'section.why',                                        null, null, 1),
  ('00000003-0000-0000-0000-000000000003', 'why', 'paragraph',  'distress_tolerance.accepts.why.p1',                  null, null, 2),
  ('00000003-0000-0000-0000-000000000003', 'why', 'paragraph',  'distress_tolerance.accepts.why.p2',                  null, null, 3),
  ('00000003-0000-0000-0000-000000000003', 'why', 'tip',        'distress_tolerance.accepts.why.tip1',                null, null, 4),
  -- how
  ('00000003-0000-0000-0000-000000000003', 'how', 'heading',    'section.how',                                        null, null, 1),
  ('00000003-0000-0000-0000-000000000003', 'how', 'paragraph',  'distress_tolerance.accepts.how.p1',                  null, null, 2),
  ('00000003-0000-0000-0000-000000000003', 'how', 'paragraph',  'distress_tolerance.accepts.how.p2',                  null, null, 3),
  ('00000003-0000-0000-0000-000000000003', 'how', 'paragraph',  'distress_tolerance.accepts.how.p3',                  null, null, 4),
  ('00000003-0000-0000-0000-000000000003', 'how', 'paragraph',  'distress_tolerance.accepts.how.p4',                  null, null, 5),
  ('00000003-0000-0000-0000-000000000003', 'how', 'paragraph',  'distress_tolerance.accepts.how.p5',                  null, null, 6),
  ('00000003-0000-0000-0000-000000000003', 'how', 'paragraph',  'distress_tolerance.accepts.how.p6',                  null, null, 7),
  ('00000003-0000-0000-0000-000000000003', 'how', 'paragraph',  'distress_tolerance.accepts.how.p7',                  null, null, 8);


-- ────────────────────────────────────────────────────────────
-- BLOCS — self_soothing
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  -- why
  ('00000003-0000-0000-0000-000000000004', 'why', 'heading',    'section.why',                                        null, null, 1),
  ('00000003-0000-0000-0000-000000000004', 'why', 'paragraph',  'distress_tolerance.self_soothing.why.p1',            null, null, 2),
  ('00000003-0000-0000-0000-000000000004', 'why', 'paragraph',  'distress_tolerance.self_soothing.why.p2',            null, null, 3),
  ('00000003-0000-0000-0000-000000000004', 'why', 'tip',        'distress_tolerance.self_soothing.why.tip1',          null, null, 4),
  -- how
  ('00000003-0000-0000-0000-000000000004', 'how', 'heading',    'section.how',                                        null, null, 1),
  ('00000003-0000-0000-0000-000000000004', 'how', 'paragraph',  'distress_tolerance.self_soothing.how.p1',            null, null, 2),
  ('00000003-0000-0000-0000-000000000004', 'how', 'paragraph',  'distress_tolerance.self_soothing.how.p2',            null, null, 3),
  ('00000003-0000-0000-0000-000000000004', 'how', 'paragraph',  'distress_tolerance.self_soothing.how.p3',            null, null, 4),
  ('00000003-0000-0000-0000-000000000004', 'how', 'paragraph',  'distress_tolerance.self_soothing.how.p4',            null, null, 5),
  ('00000003-0000-0000-0000-000000000004', 'how', 'paragraph',  'distress_tolerance.self_soothing.how.p5',            null, null, 6),
  ('00000003-0000-0000-0000-000000000004', 'how', 'bullet_list', null, ARRAY[
    'distress_tolerance.self_soothing.how.item1',
    'distress_tolerance.self_soothing.how.item2',
    'distress_tolerance.self_soothing.how.item3'
  ], null, 7);


-- ────────────────────────────────────────────────────────────
-- BLOCS — improve
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  -- why
  ('00000003-0000-0000-0000-000000000005', 'why', 'heading',    'section.why',                                        null, null, 1),
  ('00000003-0000-0000-0000-000000000005', 'why', 'paragraph',  'distress_tolerance.improve.why.p1',                  null, null, 2),
  ('00000003-0000-0000-0000-000000000005', 'why', 'paragraph',  'distress_tolerance.improve.why.p2',                  null, null, 3),
  ('00000003-0000-0000-0000-000000000005', 'why', 'tip',        'distress_tolerance.improve.why.tip1',                null, null, 4),
  -- how
  ('00000003-0000-0000-0000-000000000005', 'how', 'heading',    'section.how',                                        null, null, 1),
  ('00000003-0000-0000-0000-000000000005', 'how', 'paragraph',  'distress_tolerance.improve.how.p1',                  null, null, 2),
  ('00000003-0000-0000-0000-000000000005', 'how', 'paragraph',  'distress_tolerance.improve.how.p2',                  null, null, 3),
  ('00000003-0000-0000-0000-000000000005', 'how', 'paragraph',  'distress_tolerance.improve.how.p3',                  null, null, 4),
  ('00000003-0000-0000-0000-000000000005', 'how', 'paragraph',  'distress_tolerance.improve.how.p4',                  null, null, 5),
  ('00000003-0000-0000-0000-000000000005', 'how', 'paragraph',  'distress_tolerance.improve.how.p5',                  null, null, 6),
  ('00000003-0000-0000-0000-000000000005', 'how', 'paragraph',  'distress_tolerance.improve.how.p6',                  null, null, 7),
  ('00000003-0000-0000-0000-000000000005', 'how', 'paragraph',  'distress_tolerance.improve.how.p7',                  null, null, 8);


-- ────────────────────────────────────────────────────────────
-- BLOCS — pros_cons
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  -- why
  ('00000003-0000-0000-0000-000000000006', 'why', 'heading',    'section.why',                                        null, null, 1),
  ('00000003-0000-0000-0000-000000000006', 'why', 'paragraph',  'distress_tolerance.pros_cons.why.p1',                null, null, 2),
  ('00000003-0000-0000-0000-000000000006', 'why', 'paragraph',  'distress_tolerance.pros_cons.why.p2',                null, null, 3),
  ('00000003-0000-0000-0000-000000000006', 'why', 'paragraph',  'distress_tolerance.pros_cons.why.p3',                null, null, 4),
  ('00000003-0000-0000-0000-000000000006', 'why', 'tip',        'distress_tolerance.pros_cons.why.tip1',              null, null, 5),
  -- how
  ('00000003-0000-0000-0000-000000000006', 'how', 'heading',    'section.how',                                        null, null, 1),
  ('00000003-0000-0000-0000-000000000006', 'how', 'paragraph',  'distress_tolerance.pros_cons.how.p1',                null, null, 2),
  ('00000003-0000-0000-0000-000000000006', 'how', 'paragraph',  'distress_tolerance.pros_cons.how.p2',                null, null, 3),
  ('00000003-0000-0000-0000-000000000006', 'how', 'paragraph',  'distress_tolerance.pros_cons.how.p3',                null, null, 4),
  ('00000003-0000-0000-0000-000000000006', 'how', 'paragraph',  'distress_tolerance.pros_cons.how.p4',                null, null, 5),
  ('00000003-0000-0000-0000-000000000006', 'how', 'paragraph',  'distress_tolerance.pros_cons.how.p5',                null, null, 6),
  ('00000003-0000-0000-0000-000000000006', 'how', 'bullet_list', null, ARRAY[
    'distress_tolerance.pros_cons.how.item1',
    'distress_tolerance.pros_cons.how.item2',
    'distress_tolerance.pros_cons.how.item3'
  ], null, 7);
