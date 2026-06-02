-- Seed idempotent — Balance motivationnelle / Entretien Motivationnel
-- module_key = 'motivational_balance'
-- 4 topics + blocs psyedu. Textes = text_code (clés i18n), jamais de texte brut.
-- UUIDs préfixe e1------

-- ─── Topics ──────────────────────────────────────────────────────────────────

INSERT INTO psyedu_topics (id, module_key, topic_key, icon_name, sort_order, is_active)
VALUES
  ('e1000000-0000-0000-0000-000000000001', 'motivational_balance', 'ambivalence',       'Scale',         1, true),
  ('e1000000-0000-0000-0000-000000000002', 'motivational_balance', 'stages_of_change',  'RotateCcw',     2, true),
  ('e1000000-0000-0000-0000-000000000003', 'motivational_balance', 'values_and_change', 'Heart',         3, true),
  ('e1000000-0000-0000-0000-000000000004', 'motivational_balance', 'change_talk',       'MessageCircle', 4, true)
ON CONFLICT (module_key, topic_key) DO UPDATE
  SET icon_name  = EXCLUDED.icon_name,
      sort_order = EXCLUDED.sort_order,
      is_active  = EXCLUDED.is_active;

-- ─── Blocs : ambivalence ─────────────────────────────────────────────────────

INSERT INTO psyedu_blocks (id, topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
VALUES
  -- WHY
  ('e1000001-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'why', 'heading',    'section.why', NULL, NULL, 1),
  ('e1000001-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'why', 'paragraph',  'motivational_balance.ambivalence.why.p1', NULL, NULL, 2),
  ('e1000001-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'why', 'paragraph',  'motivational_balance.ambivalence.why.p2', NULL, NULL, 3),
  ('e1000001-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000001', 'why', 'tip',        'motivational_balance.ambivalence.why.tip1', NULL, NULL, 4),
  -- HOW
  ('e1000001-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000001', 'how', 'heading',    'section.how', NULL, NULL, 1),
  ('e1000001-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000001', 'how', 'paragraph',  'motivational_balance.ambivalence.how.intro', NULL, NULL, 2),
  ('e1000001-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000001', 'how', 'bullet_list', NULL,
    ARRAY[
      'motivational_balance.ambivalence.how.item1',
      'motivational_balance.ambivalence.how.item2',
      'motivational_balance.ambivalence.how.item3'
    ], NULL, 3),
  ('e1000001-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000001', 'how', 'blockquote', 'motivational_balance.ambivalence.how.bq1', NULL, NULL, 4),
  -- SOURCES
  ('e1000001-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000001', 'sources', 'heading',     'section.sources', NULL, NULL, 1),
  ('e1000001-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000001', 'sources', 'source_link', 'motivational_balance.ambivalence.src1', NULL, 'https://pubmed.ncbi.nlm.nih.gov/22547733/', 2),
  ('e1000001-0000-0000-0000-000000000011', 'e1000000-0000-0000-0000-000000000001', 'sources', 'source_link', 'motivational_balance.ambivalence.src2', NULL, 'https://www.has-sante.fr', 3)
ON CONFLICT (id) DO UPDATE
  SET text_code = EXCLUDED.text_code, items_codes = EXCLUDED.items_codes,
      href = EXCLUDED.href, sort_order = EXCLUDED.sort_order;

-- ─── Blocs : stages_of_change ────────────────────────────────────────────────

INSERT INTO psyedu_blocks (id, topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
VALUES
  -- WHY
  ('e1000002-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002', 'why', 'heading',    'section.why', NULL, NULL, 1),
  ('e1000002-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002', 'why', 'paragraph',  'motivational_balance.stages_of_change.why.p1', NULL, NULL, 2),
  ('e1000002-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000002', 'why', 'paragraph',  'motivational_balance.stages_of_change.why.p2', NULL, NULL, 3),
  ('e1000002-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000002', 'why', 'bullet_list', NULL,
    ARRAY[
      'motivational_balance.stages_of_change.why.stage1',
      'motivational_balance.stages_of_change.why.stage2',
      'motivational_balance.stages_of_change.why.stage3',
      'motivational_balance.stages_of_change.why.stage4',
      'motivational_balance.stages_of_change.why.stage5',
      'motivational_balance.stages_of_change.why.stage6'
    ], NULL, 4),
  ('e1000002-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000002', 'why', 'tip',        'motivational_balance.stages_of_change.why.tip1', NULL, NULL, 5),
  -- HOW
  ('e1000002-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000002', 'how', 'heading',    'section.how', NULL, NULL, 1),
  ('e1000002-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000002', 'how', 'paragraph',  'motivational_balance.stages_of_change.how.intro', NULL, NULL, 2),
  ('e1000002-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000002', 'how', 'bullet_list', NULL,
    ARRAY[
      'motivational_balance.stages_of_change.how.item1',
      'motivational_balance.stages_of_change.how.item2',
      'motivational_balance.stages_of_change.how.item3'
    ], NULL, 3),
  -- SOURCES
  ('e1000002-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000002', 'sources', 'heading',     'section.sources', NULL, NULL, 1),
  ('e1000002-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000002', 'sources', 'source_link', 'motivational_balance.stages_of_change.src1', NULL, 'https://pubmed.ncbi.nlm.nih.gov/6863699/', 2),
  ('e1000002-0000-0000-0000-000000000011', 'e1000000-0000-0000-0000-000000000002', 'sources', 'source_link', 'motivational_balance.stages_of_change.src2', NULL, 'https://pubmed.ncbi.nlm.nih.gov/22547733/', 3)
ON CONFLICT (id) DO UPDATE
  SET text_code = EXCLUDED.text_code, items_codes = EXCLUDED.items_codes,
      href = EXCLUDED.href, sort_order = EXCLUDED.sort_order;

-- ─── Blocs : values_and_change ───────────────────────────────────────────────

INSERT INTO psyedu_blocks (id, topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
VALUES
  -- WHY
  ('e1000003-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000003', 'why', 'heading',    'section.why', NULL, NULL, 1),
  ('e1000003-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000003', 'why', 'paragraph',  'motivational_balance.values_and_change.why.p1', NULL, NULL, 2),
  ('e1000003-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000003', 'why', 'paragraph',  'motivational_balance.values_and_change.why.p2', NULL, NULL, 3),
  ('e1000003-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000003', 'why', 'tip',        'motivational_balance.values_and_change.why.tip1', NULL, NULL, 4),
  -- HOW
  ('e1000003-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000003', 'how', 'heading',    'section.how', NULL, NULL, 1),
  ('e1000003-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000003', 'how', 'paragraph',  'motivational_balance.values_and_change.how.intro', NULL, NULL, 2),
  ('e1000003-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000003', 'how', 'bullet_list', NULL,
    ARRAY[
      'motivational_balance.values_and_change.how.item1',
      'motivational_balance.values_and_change.how.item2',
      'motivational_balance.values_and_change.how.item3'
    ], NULL, 3),
  ('e1000003-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000003', 'how', 'blockquote', 'motivational_balance.values_and_change.how.bq1', NULL, NULL, 4),
  -- SOURCES
  ('e1000003-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000003', 'sources', 'heading',     'section.sources', NULL, NULL, 1),
  ('e1000003-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000003', 'sources', 'source_link', 'motivational_balance.values_and_change.src1', NULL, 'https://pubmed.ncbi.nlm.nih.gov/11392867/', 2),
  ('e1000003-0000-0000-0000-000000000011', 'e1000000-0000-0000-0000-000000000003', 'sources', 'source_link', 'motivational_balance.values_and_change.src2', NULL, 'https://pubmed.ncbi.nlm.nih.gov/22547733/', 3)
ON CONFLICT (id) DO UPDATE
  SET text_code = EXCLUDED.text_code, items_codes = EXCLUDED.items_codes,
      href = EXCLUDED.href, sort_order = EXCLUDED.sort_order;

-- ─── Blocs : change_talk ─────────────────────────────────────────────────────

INSERT INTO psyedu_blocks (id, topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
VALUES
  -- WHY
  ('e1000004-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000004', 'why', 'heading',    'section.why', NULL, NULL, 1),
  ('e1000004-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000004', 'why', 'paragraph',  'motivational_balance.change_talk.why.p1', NULL, NULL, 2),
  ('e1000004-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000004', 'why', 'paragraph',  'motivational_balance.change_talk.why.p2', NULL, NULL, 3),
  ('e1000004-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000004', 'why', 'bullet_list', NULL,
    ARRAY[
      'motivational_balance.change_talk.why.item1',
      'motivational_balance.change_talk.why.item2',
      'motivational_balance.change_talk.why.item3',
      'motivational_balance.change_talk.why.item4'
    ], NULL, 4),
  ('e1000004-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000004', 'why', 'tip',        'motivational_balance.change_talk.why.tip1', NULL, NULL, 5),
  -- HOW
  ('e1000004-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000004', 'how', 'heading',    'section.how', NULL, NULL, 1),
  ('e1000004-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000004', 'how', 'paragraph',  'motivational_balance.change_talk.how.intro', NULL, NULL, 2),
  ('e1000004-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000004', 'how', 'bullet_list', NULL,
    ARRAY[
      'motivational_balance.change_talk.how.item1',
      'motivational_balance.change_talk.how.item2',
      'motivational_balance.change_talk.how.item3'
    ], NULL, 3),
  ('e1000004-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000004', 'how', 'blockquote', 'motivational_balance.change_talk.how.bq1', NULL, NULL, 4),
  -- SOURCES
  ('e1000004-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000004', 'sources', 'heading',     'section.sources', NULL, NULL, 1),
  ('e1000004-0000-0000-0000-000000000011', 'e1000000-0000-0000-0000-000000000004', 'sources', 'source_link', 'motivational_balance.change_talk.src1', NULL, 'https://pubmed.ncbi.nlm.nih.gov/22547733/', 2),
  ('e1000004-0000-0000-0000-000000000012', 'e1000000-0000-0000-0000-000000000004', 'sources', 'source_link', 'motivational_balance.change_talk.src2', NULL, 'https://pubmed.ncbi.nlm.nih.gov/15641957/', 3)
ON CONFLICT (id) DO UPDATE
  SET text_code = EXCLUDED.text_code, items_codes = EXCLUDED.items_codes,
      href = EXCLUDED.href, sort_order = EXCLUDED.sort_order;
