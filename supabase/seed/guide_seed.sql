-- ============================================================
-- Guide Universel — seed idempotent
-- Contenu "Comment ça marche ?" par module
-- Basé sur des recommandations de bonne pratique validées
-- ============================================================

-- ─── breathing_techniques ────────────────────────────────────────────────────

INSERT INTO psyedu_topics (id, module_key, topic_key, icon_name, sort_order, is_active)
VALUES (
  'c0de0001-0000-4000-8000-000000000001',
  'breathing_techniques',
  'guide',
  'HelpCircle',
  99,
  true
)
ON CONFLICT (module_key, topic_key) DO NOTHING;

-- Section WHY
INSERT INTO psyedu_blocks (id, topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
VALUES
  ('c0de0001-0000-4000-8000-000000000101', 'c0de0001-0000-4000-8000-000000000001', 'why', 'heading',    'psyedu.section.why',                                          NULL, NULL, 1),
  ('c0de0001-0000-4000-8000-000000000102', 'c0de0001-0000-4000-8000-000000000001', 'why', 'paragraph',  'psyedu.breathing_techniques.guide.why.p1',                    NULL, NULL, 2),
  ('c0de0001-0000-4000-8000-000000000103', 'c0de0001-0000-4000-8000-000000000001', 'why', 'paragraph',  'psyedu.breathing_techniques.guide.why.p2',                    NULL, NULL, 3),
  ('c0de0001-0000-4000-8000-000000000104', 'c0de0001-0000-4000-8000-000000000001', 'why', 'paragraph',  'psyedu.breathing_techniques.guide.why.p3',                    NULL, NULL, 4),
  ('c0de0001-0000-4000-8000-000000000105', 'c0de0001-0000-4000-8000-000000000001', 'why', 'tip',        'psyedu.breathing_techniques.guide.why.tip1',                  NULL, NULL, 5)
ON CONFLICT (id) DO NOTHING;

-- Section HOW
INSERT INTO psyedu_blocks (id, topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
VALUES
  ('c0de0001-0000-4000-8000-000000000201', 'c0de0001-0000-4000-8000-000000000001', 'how', 'heading',    'psyedu.section.how',                                          NULL, NULL, 1),
  ('c0de0001-0000-4000-8000-000000000202', 'c0de0001-0000-4000-8000-000000000001', 'how', 'paragraph',  'psyedu.breathing_techniques.guide.how.p1',                    NULL, NULL, 2),
  (
    'c0de0001-0000-4000-8000-000000000203',
    'c0de0001-0000-4000-8000-000000000001',
    'how',
    'bullet_list',
    NULL,
    ARRAY[
      'psyedu.breathing_techniques.guide.how.item1',
      'psyedu.breathing_techniques.guide.how.item2',
      'psyedu.breathing_techniques.guide.how.item3',
      'psyedu.breathing_techniques.guide.how.item4'
    ],
    NULL,
    3
  ),
  ('c0de0001-0000-4000-8000-000000000204', 'c0de0001-0000-4000-8000-000000000001', 'how', 'tip',        'psyedu.breathing_techniques.guide.how.tip1',                  NULL, NULL, 4)
ON CONFLICT (id) DO NOTHING;

-- Section SOURCES
INSERT INTO psyedu_blocks (id, topic_id, section_key, block_type, text_code, items_codes, href, sort_order)
VALUES
  ('c0de0001-0000-4000-8000-000000000301', 'c0de0001-0000-4000-8000-000000000001', 'sources', 'heading',     'psyedu.section.sources',                                     NULL, NULL,                                                                                                    1),
  ('c0de0001-0000-4000-8000-000000000302', 'c0de0001-0000-4000-8000-000000000001', 'sources', 'source_link', 'psyedu.breathing_techniques.guide.sources.s1',               NULL, 'https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2014.00756/full',          2),
  ('c0de0001-0000-4000-8000-000000000303', 'c0de0001-0000-4000-8000-000000000001', 'sources', 'source_link', 'psyedu.breathing_techniques.guide.sources.s2',               NULL, 'https://www.cambridge.org/core/journals/psychological-medicine/article/effect-of-heart-rate-variability-biofeedback-training-on-stress-and-anxiety-a-metaanalysis/A839E9C968E54774DF5C8FB186764EF0', 3),
  ('c0de0001-0000-4000-8000-000000000304', 'c0de0001-0000-4000-8000-000000000001', 'sources', 'source_link', 'psyedu.breathing_techniques.guide.sources.s3',               NULL, 'https://www.nature.com/articles/s41598-022-27247-y',                                             4),
  ('c0de0001-0000-4000-8000-000000000305', 'c0de0001-0000-4000-8000-000000000001', 'sources', 'source_link', 'psyedu.breathing_techniques.guide.sources.s4',               NULL, 'https://www.has-sante.fr/upload/docs/application/pdf/2011-06/developpement_de_la_prescription_de_therapeutiques_non_medicamenteuses_rapport.pdf', 5)
ON CONFLICT (id) DO NOTHING;
