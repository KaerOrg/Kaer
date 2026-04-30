-- ============================================================
-- SEED — psyedu_topics + psyedu_blocks
-- Module : chronobiology_tracker (régularité chronobiologique)
-- Idempotent : DELETE + INSERT avec UUIDs fixes
-- Sources vérifiées : PubMed IDs confirmés par recherche 2026-04-30
-- ============================================================

delete from public.psyedu_topics
where module_key = 'chronobiology_tracker';

-- ────────────────────────────────────────────────────────────
-- TOPICS (7 fiches)
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_topics (id, module_key, topic_key, icon_name, sort_order)
values
  ('00000002-0000-0000-0000-000000000001', 'chronobiology_tracker', 'what_is_chrono',  'Clock',         1),
  ('00000002-0000-0000-0000-000000000002', 'chronobiology_tracker', 'why_regularity',  'Brain',         2),
  ('00000002-0000-0000-0000-000000000003', 'chronobiology_tracker', 'light_anchor',    'Sun',           3),
  ('00000002-0000-0000-0000-000000000004', 'chronobiology_tracker', 'meals_timing',    'Utensils',      4),
  ('00000002-0000-0000-0000-000000000005', 'chronobiology_tracker', 'social_rhythm',   'Users',         5),
  ('00000002-0000-0000-0000-000000000006', 'chronobiology_tracker', 'sleep_wake',      'Moon',          6),
  ('00000002-0000-0000-0000-000000000007', 'chronobiology_tracker', 'disruptions',     'AlertTriangle', 7);


-- ────────────────────────────────────────────────────────────
-- BLOCS — what_is_chrono
-- Sources :
--   s1 : Aschoff 1965 Science (pas de PMID vérifié — lien null)
--   s2 : Wirz-Justice A, Benedetti F, Terman M. Chronotherapeutics. Karger, 2009.
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  -- why
  ('00000002-0000-0000-0000-000000000001', 'why', 'heading',    'section.why',                                                null, null, 1),
  ('00000002-0000-0000-0000-000000000001', 'why', 'paragraph',  'chronobiology_tracker.what_is_chrono.why.p1',                null, null, 2),
  ('00000002-0000-0000-0000-000000000001', 'why', 'paragraph',  'chronobiology_tracker.what_is_chrono.why.p2',                null, null, 3),
  ('00000002-0000-0000-0000-000000000001', 'why', 'paragraph',  'chronobiology_tracker.what_is_chrono.why.p3',                null, null, 4),
  ('00000002-0000-0000-0000-000000000001', 'why', 'tip',        'chronobiology_tracker.what_is_chrono.why.tip1',              null, null, 5),
  -- how
  ('00000002-0000-0000-0000-000000000001', 'how', 'heading',    'section.how',                                                null, null, 1),
  ('00000002-0000-0000-0000-000000000001', 'how', 'paragraph',  'chronobiology_tracker.what_is_chrono.how.p1',                null, null, 2),
  ('00000002-0000-0000-0000-000000000001', 'how', 'paragraph',  'chronobiology_tracker.what_is_chrono.how.p2',                null, null, 3),
  ('00000002-0000-0000-0000-000000000001', 'how', 'bullet_list', null, ARRAY[
    'chronobiology_tracker.what_is_chrono.how.item1',
    'chronobiology_tracker.what_is_chrono.how.item2',
    'chronobiology_tracker.what_is_chrono.how.item3'
  ], null, 4),
  -- sources
  ('00000002-0000-0000-0000-000000000001', 'sources', 'heading',     'section.sources',                                       null, null, 1),
  ('00000002-0000-0000-0000-000000000001', 'sources', 'source_link', 'chronobiology_tracker.what_is_chrono.sources.s1',       null, null, 2),
  ('00000002-0000-0000-0000-000000000001', 'sources', 'source_link', 'chronobiology_tracker.what_is_chrono.sources.s2',       null, 'https://karger.com/books/book/2977/', 3);


-- ────────────────────────────────────────────────────────────
-- BLOCS — why_regularity
-- Sources :
--   s1 : Frank E et al. (2005). Arch Gen Psychiatry. PMID 16143731
--   s2 : Phillips AJK et al. (2024). Psychological Medicine. PMID 40814280
--   s3 : Roenneberg T et al. (2012). Curr Biol. PMID 22578422
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  -- why
  ('00000002-0000-0000-0000-000000000002', 'why', 'heading',    'section.why',                                                null, null, 1),
  ('00000002-0000-0000-0000-000000000002', 'why', 'paragraph',  'chronobiology_tracker.why_regularity.why.p1',                null, null, 2),
  ('00000002-0000-0000-0000-000000000002', 'why', 'paragraph',  'chronobiology_tracker.why_regularity.why.p2',                null, null, 3),
  ('00000002-0000-0000-0000-000000000002', 'why', 'paragraph',  'chronobiology_tracker.why_regularity.why.p3',                null, null, 4),
  ('00000002-0000-0000-0000-000000000002', 'why', 'tip',        'chronobiology_tracker.why_regularity.why.tip1',              null, null, 5),
  -- how
  ('00000002-0000-0000-0000-000000000002', 'how', 'heading',    'section.how',                                                null, null, 1),
  ('00000002-0000-0000-0000-000000000002', 'how', 'paragraph',  'chronobiology_tracker.why_regularity.how.p1',                null, null, 2),
  ('00000002-0000-0000-0000-000000000002', 'how', 'paragraph',  'chronobiology_tracker.why_regularity.how.p2',                null, null, 3),
  ('00000002-0000-0000-0000-000000000002', 'how', 'bullet_list', null, ARRAY[
    'chronobiology_tracker.why_regularity.how.item1',
    'chronobiology_tracker.why_regularity.how.item2',
    'chronobiology_tracker.why_regularity.how.item3'
  ], null, 4),
  -- sources
  ('00000002-0000-0000-0000-000000000002', 'sources', 'heading',     'section.sources',                                       null, null, 1),
  ('00000002-0000-0000-0000-000000000002', 'sources', 'source_link', 'chronobiology_tracker.why_regularity.sources.s1',       null, 'https://pubmed.ncbi.nlm.nih.gov/16143731/', 2),
  ('00000002-0000-0000-0000-000000000002', 'sources', 'source_link', 'chronobiology_tracker.why_regularity.sources.s2',       null, 'https://pubmed.ncbi.nlm.nih.gov/40814280/', 3),
  ('00000002-0000-0000-0000-000000000002', 'sources', 'source_link', 'chronobiology_tracker.why_regularity.sources.s3',       null, 'https://pubmed.ncbi.nlm.nih.gov/22578422/', 4);


-- ────────────────────────────────────────────────────────────
-- BLOCS — light_anchor
-- Sources :
--   s1 : Leproult R & Van Cauter E (2010). Prog Brain Res. (PMID non vérifié — lien null)
--   s2 : Rosenthal NE et al. (1984). Arch Gen Psychiatry. PMID 6581756
--   s3 : HAS — Recommandations insomnie médecine générale (2006)
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  -- why
  ('00000002-0000-0000-0000-000000000003', 'why', 'heading',    'section.why',                                                null, null, 1),
  ('00000002-0000-0000-0000-000000000003', 'why', 'paragraph',  'chronobiology_tracker.light_anchor.why.p1',                  null, null, 2),
  ('00000002-0000-0000-0000-000000000003', 'why', 'paragraph',  'chronobiology_tracker.light_anchor.why.p2',                  null, null, 3),
  ('00000002-0000-0000-0000-000000000003', 'why', 'paragraph',  'chronobiology_tracker.light_anchor.why.p3',                  null, null, 4),
  ('00000002-0000-0000-0000-000000000003', 'why', 'tip',        'chronobiology_tracker.light_anchor.why.tip1',                null, null, 5),
  -- how
  ('00000002-0000-0000-0000-000000000003', 'how', 'heading',    'section.how',                                                null, null, 1),
  ('00000002-0000-0000-0000-000000000003', 'how', 'paragraph',  'chronobiology_tracker.light_anchor.how.p1',                  null, null, 2),
  ('00000002-0000-0000-0000-000000000003', 'how', 'paragraph',  'chronobiology_tracker.light_anchor.how.p2',                  null, null, 3),
  ('00000002-0000-0000-0000-000000000003', 'how', 'bullet_list', null, ARRAY[
    'chronobiology_tracker.light_anchor.how.item1',
    'chronobiology_tracker.light_anchor.how.item2',
    'chronobiology_tracker.light_anchor.how.item3',
    'chronobiology_tracker.light_anchor.how.item4'
  ], null, 4),
  -- sources
  ('00000002-0000-0000-0000-000000000003', 'sources', 'heading',     'section.sources',                                       null, null, 1),
  ('00000002-0000-0000-0000-000000000003', 'sources', 'source_link', 'chronobiology_tracker.light_anchor.sources.s1',         null, null, 2),
  ('00000002-0000-0000-0000-000000000003', 'sources', 'source_link', 'chronobiology_tracker.light_anchor.sources.s2',         null, 'https://pubmed.ncbi.nlm.nih.gov/6581756/', 3),
  ('00000002-0000-0000-0000-000000000003', 'sources', 'source_link', 'chronobiology_tracker.light_anchor.sources.s3',         null, 'https://www.has-sante.fr/jcms/c_522637/fr/prise-en-charge-du-patient-adulte-se-plaignant-d-insomnie-en-medecine-generale', 4);


-- ────────────────────────────────────────────────────────────
-- BLOCS — meals_timing
-- Sources :
--   s1 : Asher G & Schibler U (2011). Cell Metab. PMID 21284980
--   s2 : Pot GK et al. (2016). Proc Nutr Soc. (PMID non vérifié — lien null)
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  -- why
  ('00000002-0000-0000-0000-000000000004', 'why', 'heading',    'section.why',                                                null, null, 1),
  ('00000002-0000-0000-0000-000000000004', 'why', 'paragraph',  'chronobiology_tracker.meals_timing.why.p1',                  null, null, 2),
  ('00000002-0000-0000-0000-000000000004', 'why', 'paragraph',  'chronobiology_tracker.meals_timing.why.p2',                  null, null, 3),
  ('00000002-0000-0000-0000-000000000004', 'why', 'paragraph',  'chronobiology_tracker.meals_timing.why.p3',                  null, null, 4),
  -- how
  ('00000002-0000-0000-0000-000000000004', 'how', 'heading',    'section.how',                                                null, null, 1),
  ('00000002-0000-0000-0000-000000000004', 'how', 'paragraph',  'chronobiology_tracker.meals_timing.how.p1',                  null, null, 2),
  ('00000002-0000-0000-0000-000000000004', 'how', 'paragraph',  'chronobiology_tracker.meals_timing.how.p2',                  null, null, 3),
  ('00000002-0000-0000-0000-000000000004', 'how', 'bullet_list', null, ARRAY[
    'chronobiology_tracker.meals_timing.how.item1',
    'chronobiology_tracker.meals_timing.how.item2',
    'chronobiology_tracker.meals_timing.how.item3'
  ], null, 4),
  -- sources
  ('00000002-0000-0000-0000-000000000004', 'sources', 'heading',     'section.sources',                                       null, null, 1),
  ('00000002-0000-0000-0000-000000000004', 'sources', 'source_link', 'chronobiology_tracker.meals_timing.sources.s1',         null, 'https://pubmed.ncbi.nlm.nih.gov/21284980/', 2),
  ('00000002-0000-0000-0000-000000000004', 'sources', 'source_link', 'chronobiology_tracker.meals_timing.sources.s2',         null, null, 3);


-- ────────────────────────────────────────────────────────────
-- BLOCS — social_rhythm
-- Sources :
--   s1 : Frank E et al. (2005). Arch Gen Psychiatry. PMID 16143731
--   s2 : Monk TH et al. (1990). J Nerv Ment Dis. PMID 2299336
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  -- why
  ('00000002-0000-0000-0000-000000000005', 'why', 'heading',    'section.why',                                                null, null, 1),
  ('00000002-0000-0000-0000-000000000005', 'why', 'paragraph',  'chronobiology_tracker.social_rhythm.why.p1',                 null, null, 2),
  ('00000002-0000-0000-0000-000000000005', 'why', 'paragraph',  'chronobiology_tracker.social_rhythm.why.p2',                 null, null, 3),
  ('00000002-0000-0000-0000-000000000005', 'why', 'paragraph',  'chronobiology_tracker.social_rhythm.why.p3',                 null, null, 4),
  ('00000002-0000-0000-0000-000000000005', 'why', 'tip',        'chronobiology_tracker.social_rhythm.why.tip1',               null, null, 5),
  -- how
  ('00000002-0000-0000-0000-000000000005', 'how', 'heading',    'section.how',                                                null, null, 1),
  ('00000002-0000-0000-0000-000000000005', 'how', 'paragraph',  'chronobiology_tracker.social_rhythm.how.p1',                 null, null, 2),
  ('00000002-0000-0000-0000-000000000005', 'how', 'paragraph',  'chronobiology_tracker.social_rhythm.how.p2',                 null, null, 3),
  ('00000002-0000-0000-0000-000000000005', 'how', 'bullet_list', null, ARRAY[
    'chronobiology_tracker.social_rhythm.how.item1',
    'chronobiology_tracker.social_rhythm.how.item2',
    'chronobiology_tracker.social_rhythm.how.item3'
  ], null, 4),
  -- sources
  ('00000002-0000-0000-0000-000000000005', 'sources', 'heading',     'section.sources',                                       null, null, 1),
  ('00000002-0000-0000-0000-000000000005', 'sources', 'source_link', 'chronobiology_tracker.social_rhythm.sources.s1',        null, 'https://pubmed.ncbi.nlm.nih.gov/16143731/', 2),
  ('00000002-0000-0000-0000-000000000005', 'sources', 'source_link', 'chronobiology_tracker.social_rhythm.sources.s2',        null, 'https://pubmed.ncbi.nlm.nih.gov/2299336/', 3);


-- ────────────────────────────────────────────────────────────
-- BLOCS — sleep_wake
-- Sources :
--   s1 : Phillips AJK et al. (2024). Psychological Medicine. PMID 40814280
--   s2 : HAS — Recommandations insomnie médecine générale (2006)
--   s3 : Borbély AA (1982). Hum Neurobiol. PMID 7185792
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  -- why
  ('00000002-0000-0000-0000-000000000006', 'why', 'heading',    'section.why',                                                null, null, 1),
  ('00000002-0000-0000-0000-000000000006', 'why', 'paragraph',  'chronobiology_tracker.sleep_wake.why.p1',                    null, null, 2),
  ('00000002-0000-0000-0000-000000000006', 'why', 'paragraph',  'chronobiology_tracker.sleep_wake.why.p2',                    null, null, 3),
  ('00000002-0000-0000-0000-000000000006', 'why', 'paragraph',  'chronobiology_tracker.sleep_wake.why.p3',                    null, null, 4),
  ('00000002-0000-0000-0000-000000000006', 'why', 'tip',        'chronobiology_tracker.sleep_wake.why.tip1',                  null, null, 5),
  -- how
  ('00000002-0000-0000-0000-000000000006', 'how', 'heading',    'section.how',                                                null, null, 1),
  ('00000002-0000-0000-0000-000000000006', 'how', 'paragraph',  'chronobiology_tracker.sleep_wake.how.p1',                    null, null, 2),
  ('00000002-0000-0000-0000-000000000006', 'how', 'paragraph',  'chronobiology_tracker.sleep_wake.how.p2',                    null, null, 3),
  ('00000002-0000-0000-0000-000000000006', 'how', 'paragraph',  'chronobiology_tracker.sleep_wake.how.p3',                    null, null, 4),
  ('00000002-0000-0000-0000-000000000006', 'how', 'bullet_list', null, ARRAY[
    'chronobiology_tracker.sleep_wake.how.item1',
    'chronobiology_tracker.sleep_wake.how.item2',
    'chronobiology_tracker.sleep_wake.how.item3'
  ], null, 5),
  -- sources
  ('00000002-0000-0000-0000-000000000006', 'sources', 'heading',     'section.sources',                                       null, null, 1),
  ('00000002-0000-0000-0000-000000000006', 'sources', 'source_link', 'chronobiology_tracker.sleep_wake.sources.s1',           null, 'https://pubmed.ncbi.nlm.nih.gov/40814280/', 2),
  ('00000002-0000-0000-0000-000000000006', 'sources', 'source_link', 'chronobiology_tracker.sleep_wake.sources.s2',           null, 'https://www.has-sante.fr/jcms/c_522637/fr/prise-en-charge-du-patient-adulte-se-plaignant-d-insomnie-en-medecine-generale', 3),
  ('00000002-0000-0000-0000-000000000006', 'sources', 'source_link', 'chronobiology_tracker.sleep_wake.sources.s3',           null, 'https://pubmed.ncbi.nlm.nih.gov/7185792/', 4);


-- ────────────────────────────────────────────────────────────
-- BLOCS — disruptions
-- Sources :
--   s1 : Wirz-Justice A (2006). Int Clin Psychopharmacol. (PMID non vérifié — lien null)
--   s2 : Roenneberg T et al. (2012). Curr Biol. PMID 22578422
-- ────────────────────────────────────────────────────────────

insert into public.psyedu_blocks
  (topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
values
  -- why
  ('00000002-0000-0000-0000-000000000007', 'why', 'heading',    'section.why',                                                null, null, 1),
  ('00000002-0000-0000-0000-000000000007', 'why', 'paragraph',  'chronobiology_tracker.disruptions.why.p1',                   null, null, 2),
  ('00000002-0000-0000-0000-000000000007', 'why', 'paragraph',  'chronobiology_tracker.disruptions.why.p2',                   null, null, 3),
  ('00000002-0000-0000-0000-000000000007', 'why', 'paragraph',  'chronobiology_tracker.disruptions.why.p3',                   null, null, 4),
  ('00000002-0000-0000-0000-000000000007', 'why', 'tip',        'chronobiology_tracker.disruptions.why.tip1',                 null, null, 5),
  -- how
  ('00000002-0000-0000-0000-000000000007', 'how', 'heading',    'section.how',                                                null, null, 1),
  ('00000002-0000-0000-0000-000000000007', 'how', 'paragraph',  'chronobiology_tracker.disruptions.how.p1',                   null, null, 2),
  ('00000002-0000-0000-0000-000000000007', 'how', 'paragraph',  'chronobiology_tracker.disruptions.how.p2',                   null, null, 3),
  ('00000002-0000-0000-0000-000000000007', 'how', 'bullet_list', null, ARRAY[
    'chronobiology_tracker.disruptions.how.item1',
    'chronobiology_tracker.disruptions.how.item2',
    'chronobiology_tracker.disruptions.how.item3'
  ], null, 4),
  -- sources
  ('00000002-0000-0000-0000-000000000007', 'sources', 'heading',     'section.sources',                                       null, null, 1),
  ('00000002-0000-0000-0000-000000000007', 'sources', 'source_link', 'chronobiology_tracker.disruptions.sources.s1',          null, null, 2),
  ('00000002-0000-0000-0000-000000000007', 'sources', 'source_link', 'chronobiology_tracker.disruptions.sources.s2',          null, 'https://pubmed.ncbi.nlm.nih.gov/22578422/', 3);
