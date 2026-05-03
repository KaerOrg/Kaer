-- Seed idempotent — Journal de craving (module_key = 'craving_journal')
-- 4 topics + blocs psyedu
-- Textes stockés comme text_code (clés i18n) — jamais de texte brut.

-- ─── Topics ──────────────────────────────────────────────────────────────────

INSERT INTO psyedu_topics (id, module_key, topic_key, icon_name, sort_order, is_active)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'craving_journal', 'what_is_craving',  'Zap',    1, true),
  ('b1000000-0000-0000-0000-000000000002', 'craving_journal', 'triggers_abc',     'Search', 2, true),
  ('b1000000-0000-0000-0000-000000000003', 'craving_journal', 'urge_surfing',     'Waves',  3, true),
  ('b1000000-0000-0000-0000-000000000004', 'craving_journal', 'after_the_craving','Heart',  4, true)
ON CONFLICT (module_key, topic_key) DO UPDATE
  SET icon_name  = EXCLUDED.icon_name,
      sort_order = EXCLUDED.sort_order,
      is_active  = EXCLUDED.is_active;

-- ─── Blocs : what_is_craving ─────────────────────────────────────────────────

INSERT INTO psyedu_blocks (id, topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
VALUES
  -- WHY
  ('b1000001-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'why', 'heading',    'section.why', NULL, NULL, 1),
  ('b1000001-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'why', 'paragraph',  'craving_journal.what_is_craving.why.p1', NULL, NULL, 2),
  ('b1000001-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'why', 'paragraph',  'craving_journal.what_is_craving.why.p2', NULL, NULL, 3),
  ('b1000001-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'why', 'paragraph',  'craving_journal.what_is_craving.why.p3', NULL, NULL, 4),
  ('b1000001-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'why', 'tip',        'craving_journal.what_is_craving.why.tip1', NULL, NULL, 5),
  ('b1000001-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'why', 'paragraph',  'craving_journal.what_is_craving.why.p4', NULL, NULL, 6),
  -- HOW
  ('b1000001-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000001', 'how', 'heading',    'section.how', NULL, NULL, 1),
  ('b1000001-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000001', 'how', 'paragraph',  'craving_journal.what_is_craving.how.intro', NULL, NULL, 2),
  ('b1000001-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000001', 'how', 'bullet_list', NULL,
    ARRAY[
      'craving_journal.what_is_craving.how.item1',
      'craving_journal.what_is_craving.how.item2',
      'craving_journal.what_is_craving.how.item3'
    ], NULL, 3),
  -- SOURCES
  ('b1000001-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000001', 'sources', 'heading',     'section.sources', NULL, NULL, 1),
  ('b1000001-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000001', 'sources', 'source_link', 'craving_journal.what_is_craving.src1', NULL, 'https://www.has-sante.fr', 2),
  ('b1000001-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000001', 'sources', 'source_link', 'craving_journal.what_is_craving.src2', NULL, 'https://www.who.int/fr/news-room/fact-sheets/detail/alcohol', 3)
ON CONFLICT (id) DO UPDATE
  SET text_code = EXCLUDED.text_code, items_codes = EXCLUDED.items_codes,
      href = EXCLUDED.href, sort_order = EXCLUDED.sort_order;

-- ─── Blocs : triggers_abc ────────────────────────────────────────────────────

INSERT INTO psyedu_blocks (id, topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
VALUES
  -- WHY
  ('b1000002-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'why', 'heading',    'section.why', NULL, NULL, 1),
  ('b1000002-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'why', 'paragraph',  'craving_journal.triggers_abc.why.p1', NULL, NULL, 2),
  ('b1000002-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 'why', 'paragraph',  'craving_journal.triggers_abc.why.p2', NULL, NULL, 3),
  ('b1000002-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', 'why', 'tip',        'craving_journal.triggers_abc.why.tip1', NULL, NULL, 4),
  ('b1000002-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002', 'why', 'paragraph',  'craving_journal.triggers_abc.why.p3', NULL, NULL, 5),
  -- HOW
  ('b1000002-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000002', 'how', 'heading',    'section.how', NULL, NULL, 1),
  ('b1000002-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000002', 'how', 'paragraph',  'craving_journal.triggers_abc.how.intro', NULL, NULL, 2),
  ('b1000002-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000002', 'how', 'bullet_list', NULL,
    ARRAY[
      'craving_journal.triggers_abc.how.item1',
      'craving_journal.triggers_abc.how.item2',
      'craving_journal.triggers_abc.how.item3',
      'craving_journal.triggers_abc.how.item4'
    ], NULL, 3),
  ('b1000002-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000002', 'how', 'blockquote', 'craving_journal.triggers_abc.how.bq1', NULL, NULL, 4),
  -- SOURCES
  ('b1000002-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000002', 'sources', 'heading',     'section.sources', NULL, NULL, 1),
  ('b1000002-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000002', 'sources', 'source_link', 'craving_journal.triggers_abc.src1', NULL, 'https://pubmed.ncbi.nlm.nih.gov/3712803/', 2)
ON CONFLICT (id) DO UPDATE
  SET text_code = EXCLUDED.text_code, items_codes = EXCLUDED.items_codes,
      href = EXCLUDED.href, sort_order = EXCLUDED.sort_order;

-- ─── Blocs : urge_surfing ────────────────────────────────────────────────────

INSERT INTO psyedu_blocks (id, topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
VALUES
  -- WHY
  ('b1000003-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'why', 'heading',    'section.why', NULL, NULL, 1),
  ('b1000003-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 'why', 'paragraph',  'craving_journal.urge_surfing.why.p1', NULL, NULL, 2),
  ('b1000003-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'why', 'paragraph',  'craving_journal.urge_surfing.why.p2', NULL, NULL, 3),
  ('b1000003-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003', 'why', 'tip',        'craving_journal.urge_surfing.why.tip1', NULL, NULL, 4),
  -- HOW
  ('b1000003-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000003', 'how', 'heading',    'section.how', NULL, NULL, 1),
  ('b1000003-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000003', 'how', 'paragraph',  'craving_journal.urge_surfing.how.intro', NULL, NULL, 2),
  ('b1000003-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000003', 'how', 'bullet_list', NULL,
    ARRAY[
      'craving_journal.urge_surfing.how.item1',
      'craving_journal.urge_surfing.how.item2',
      'craving_journal.urge_surfing.how.item3',
      'craving_journal.urge_surfing.how.item4'
    ], NULL, 3),
  ('b1000003-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000003', 'how', 'blockquote', 'craving_journal.urge_surfing.how.bq1', NULL, NULL, 4),
  -- SOURCES
  ('b1000003-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000003', 'sources', 'heading',     'section.sources', NULL, NULL, 1),
  ('b1000003-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000003', 'sources', 'source_link', 'craving_journal.urge_surfing.src1', NULL, 'https://pubmed.ncbi.nlm.nih.gov/3712803/', 2),
  ('b1000003-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000003', 'sources', 'source_link', 'craving_journal.urge_surfing.src2', NULL, 'https://pubmed.ncbi.nlm.nih.gov/9200631/', 3)
ON CONFLICT (id) DO UPDATE
  SET text_code = EXCLUDED.text_code, items_codes = EXCLUDED.items_codes,
      href = EXCLUDED.href, sort_order = EXCLUDED.sort_order;

-- ─── Blocs : after_the_craving ───────────────────────────────────────────────

INSERT INTO psyedu_blocks (id, topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
VALUES
  -- WHY
  ('b1000004-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', 'why', 'heading',    'section.why', NULL, NULL, 1),
  ('b1000004-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'why', 'paragraph',  'craving_journal.after_the_craving.why.p1', NULL, NULL, 2),
  ('b1000004-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', 'why', 'paragraph',  'craving_journal.after_the_craving.why.p2', NULL, NULL, 3),
  ('b1000004-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 'why', 'tip',        'craving_journal.after_the_craving.why.tip1', NULL, NULL, 4),
  ('b1000004-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004', 'why', 'blockquote', 'craving_journal.after_the_craving.why.bq1', NULL, NULL, 5),
  -- HOW
  ('b1000004-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000004', 'how', 'heading',    'section.how', NULL, NULL, 1),
  ('b1000004-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000004', 'how', 'paragraph',  'craving_journal.after_the_craving.how.intro', NULL, NULL, 2),
  ('b1000004-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000004', 'how', 'bullet_list', NULL,
    ARRAY[
      'craving_journal.after_the_craving.how.item1',
      'craving_journal.after_the_craving.how.item2',
      'craving_journal.after_the_craving.how.item3'
    ], NULL, 3),
  -- SOURCES
  ('b1000004-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000004', 'sources', 'heading',     'section.sources', NULL, NULL, 1),
  ('b1000004-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000004', 'sources', 'source_link', 'craving_journal.after_the_craving.src1', NULL, 'https://pubmed.ncbi.nlm.nih.gov/3712803/', 2),
  ('b1000004-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000004', 'sources', 'source_link', 'craving_journal.after_the_craving.src2', NULL, 'https://www.has-sante.fr', 3)
ON CONFLICT (id) DO UPDATE
  SET text_code = EXCLUDED.text_code, items_codes = EXCLUDED.items_codes,
      href = EXCLUDED.href, sort_order = EXCLUDED.sort_order;
