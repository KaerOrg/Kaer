-- ============================================================
-- SEED — 5 modules introduits par la branche `remodeling-fiches-ETP`,
-- migrés vers le ModuleRenderer data-driven.
--
--   - diet_weight_psycho       → preview_kind='psyedu'
--   - distress_tolerance       → preview_kind='tabbed'    (psyedu + cards)
--   - chronobiology_tracker    → preview_kind='tabbed'    (psyedu + column_form
--                                                          + chrono_month)
--   - craving_journal          → preview_kind='tabbed'    (psyedu + column_form)
--   - exposure_hierarchy       → preview_kind='exposure_hierarchy'
--
-- Pré-requis :
--   - schema.sql appliqué (tables modules, module_content_fields, field_props,
--     psyedu_topics, psyedu_blocks, exposure_hierarchies)
--   - seed.sql appliqué (categories + modules avec preview_kind='coming_soon')
--   - seed/psyedu_seed.sql + chrono_seed.sql + craving_seed.sql +
--     distress_tolerance_seed.sql appliqués (psyedu_topics + psyedu_blocks
--     pour les 4 modules psyedu).
--
-- Idempotent : DELETE des fields existants par module + INSERT.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1) UPDATE preview_kind sur les 5 modules
-- ────────────────────────────────────────────────────────────

update public.modules set preview_kind = 'psyedu'              where id = 'diet_weight_psycho';
update public.modules set preview_kind = 'tabbed'              where id = 'distress_tolerance';
update public.modules set preview_kind = 'tabbed'              where id = 'chronobiology_tracker';
update public.modules set preview_kind = 'tabbed'              where id = 'craving_journal';
update public.modules set preview_kind = 'exposure_hierarchy'  where id = 'exposure_hierarchy';


-- ────────────────────────────────────────────────────────────
-- 2) Reset des fields des modules tabbed (avant ré-insertion)
--    diet_weight_psycho et exposure_hierarchy n'ont pas de fields.
-- ────────────────────────────────────────────────────────────

delete from public.module_content_fields
where module_id in ('distress_tolerance', 'chronobiology_tracker', 'craving_journal');


-- ────────────────────────────────────────────────────────────
-- 3) distress_tolerance — tabs : Fiches (psyedu) + En crise (cards)
-- ────────────────────────────────────────────────────────────

insert into public.module_content_fields
  (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order)
values
  -- bandeau MDR
  ('dt.disclaimer', 'distress_tolerance', null, null,
   'disclaimer_banner', null, 0),

  -- tab Fiches → psyedu (lit psyedu_topics par module_key='distress_tolerance')
  ('dt.tab.fiches', 'distress_tolerance', null, null, 'tab',
   'modules.distress_tolerance.tab_fiches', 10),

  -- tab En crise → cards (sous-fields à compléter ultérieurement avec le
  -- contenu détaillé TIPP / ACCEPTS / IMPROVE / etc.)
  ('dt.tab.crisis', 'distress_tolerance', null, null, 'tab',
   'modules.distress_tolerance.tab_crisis', 20);

insert into public.field_props (field_id, prop_key, prop_value) values
  ('dt.tab.fiches', 'tab_key',          'fiches'),
  ('dt.tab.fiches', 'sub_preview_kind', 'psyedu'),
  ('dt.tab.fiches', 'icon_name',        'BookOpen'),
  ('dt.tab.crisis', 'tab_key',          'crisis'),
  ('dt.tab.crisis', 'sub_preview_kind', 'cards'),
  ('dt.tab.crisis', 'icon_name',        'Zap');


-- ────────────────────────────────────────────────────────────
-- 4) craving_journal — tabs : Fiches (psyedu) + Journal (column_form)
-- ────────────────────────────────────────────────────────────

insert into public.module_content_fields
  (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order)
values
  -- bandeau MDR
  ('cj.disclaimer', 'craving_journal', null, null,
   'disclaimer_banner', null, 0),

  -- tab Fiches → psyedu
  ('cj.tab.fiches', 'craving_journal', null, null, 'tab',
   'modules.craving_journal.tab_fiches', 10),

  -- tab Journal → column_form (5 champs : intensity slider + 4 textareas)
  ('cj.tab.journal', 'craving_journal', null, null, 'tab',
   'modules.craving_journal.tab_journal', 20),

  -- column_form config + labels (enfants du tab.journal)
  ('cj.cfg',          'craving_journal', null, 'cj.tab.journal', 'column_form_config',           null, 0),
  ('cj.new_btn',      'craving_journal', null, 'cj.tab.journal', 'column_form_new_btn_label',
   'modules.craving_journal.new_entry_btn', 1),
  ('cj.empty_title',  'craving_journal', null, 'cj.tab.journal', 'column_form_empty_title',
   'modules.craving_journal.empty_title', 2),
  ('cj.empty_text',   'craving_journal', null, 'cj.tab.journal', 'column_form_empty_text',
   'modules.craving_journal.empty_text', 3),

  -- column 1 : intensité (slider 0-10)
  ('cj.col1.h',       'craving_journal', 'cj.intensity', 'cj.tab.journal', 'column_header',
   'modules.craving_journal.section_intensity', 10),
  ('cj.col1.slider',  'craving_journal', 'cj.intensity', 'cj.col1.h',      'column_slider_field',
   'modules.craving_journal.intensity_label', 11),

  -- column 2 : déclencheur (textarea)
  ('cj.col2.h',       'craving_journal', 'cj.trigger', 'cj.tab.journal', 'column_header',
   'modules.craving_journal.section_trigger', 20),
  ('cj.col2.text',    'craving_journal', 'cj.trigger', 'cj.col2.h',      'column_text_field',
   'modules.craving_journal.trigger_placeholder', 21),

  -- column 3 : émotion (textarea)
  ('cj.col3.h',       'craving_journal', 'cj.emotion', 'cj.tab.journal', 'column_header',
   'modules.craving_journal.section_emotion', 30),
  ('cj.col3.text',    'craving_journal', 'cj.emotion', 'cj.col3.h',      'column_text_field',
   'modules.craving_journal.emotion_placeholder', 31),

  -- column 4 : pensée automatique (textarea)
  ('cj.col4.h',       'craving_journal', 'cj.thought', 'cj.tab.journal', 'column_header',
   'modules.craving_journal.section_thought', 40),
  ('cj.col4.text',    'craving_journal', 'cj.thought', 'cj.col4.h',      'column_text_field',
   'modules.craving_journal.thought_placeholder', 41),

  -- column 5 : stratégie utilisée (textarea)
  ('cj.col5.h',       'craving_journal', 'cj.coping', 'cj.tab.journal', 'column_header',
   'modules.craving_journal.section_coping', 50),
  ('cj.col5.text',    'craving_journal', 'cj.coping', 'cj.col5.h',      'column_text_field',
   'modules.craving_journal.coping_placeholder', 51);

insert into public.field_props (field_id, prop_key, prop_value) values
  ('cj.tab.fiches',  'tab_key',          'fiches'),
  ('cj.tab.fiches',  'sub_preview_kind', 'psyedu'),
  ('cj.tab.fiches',  'icon_name',        'BookOpen'),
  ('cj.tab.journal', 'tab_key',          'journal'),
  ('cj.tab.journal', 'sub_preview_kind', 'column_form'),
  ('cj.tab.journal', 'icon_name',        'Heart'),
  -- column_form config
  ('cj.cfg',         'engagement_event_type', 'SAVE_CRAVING_ENTRY'),
  -- intensité slider 0-10
  ('cj.col1.h',      'color',         '#7C3AED'),
  ('cj.col1.h',      'step_number',   '1'),
  ('cj.col1.slider', 'key',           'intensity'),
  ('cj.col1.slider', 'min',           '0'),
  ('cj.col1.slider', 'max',           '10'),
  ('cj.col1.slider', 'step',          '1'),
  ('cj.col1.slider', 'color',         '#7C3AED'),
  -- déclencheur
  ('cj.col2.h',      'color',         '#0891B2'),
  ('cj.col2.h',      'step_number',   '2'),
  ('cj.col2.text',   'key',           'trigger'),
  ('cj.col2.text',   'multiline',     '1'),
  ('cj.col2.text',   'min_height',    '60'),
  -- émotion
  ('cj.col3.h',      'color',         '#1D4ED8'),
  ('cj.col3.h',      'step_number',   '3'),
  ('cj.col3.text',   'key',           'emotion'),
  ('cj.col3.text',   'multiline',     '0'),
  -- pensée auto
  ('cj.col4.h',      'color',         '#DB2777'),
  ('cj.col4.h',      'step_number',   '4'),
  ('cj.col4.text',   'key',           'thought'),
  ('cj.col4.text',   'multiline',     '1'),
  ('cj.col4.text',   'min_height',    '60'),
  -- stratégie
  ('cj.col5.h',      'color',         '#059669'),
  ('cj.col5.h',      'step_number',   '5'),
  ('cj.col5.text',   'key',           'coping'),
  ('cj.col5.text',   'multiline',     '1'),
  ('cj.col5.text',   'min_height',    '60');


-- ────────────────────────────────────────────────────────────
-- 5) chronobiology_tracker — tabs : Fiches + Journal + Mois
-- ────────────────────────────────────────────────────────────

insert into public.module_content_fields
  (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order)
values
  -- tab Fiches → psyedu
  ('chrono.tab.fiches', 'chronobiology_tracker', null, null, 'tab',
   'modules.chrono_bio.tab_fiches', 10),

  -- tab Journal → column_form (5 column_time_field optionnels)
  ('chrono.tab.journal', 'chronobiology_tracker', null, null, 'tab',
   'modules.chrono_bio.tab_journal', 20),

  -- tab Mois → chrono_month
  ('chrono.tab.month', 'chronobiology_tracker', null, null, 'tab',
   'modules.chrono_bio.view_month', 30),

  -- column_form config + labels (enfants du tab.journal)
  ('chrono.cfg',         'chronobiology_tracker', null, 'chrono.tab.journal', 'column_form_config',           null, 0),
  ('chrono.new_btn',     'chronobiology_tracker', null, 'chrono.tab.journal', 'column_form_new_btn_label',
   'modules.chrono_bio.add_today', 1),
  ('chrono.empty_title', 'chronobiology_tracker', null, 'chrono.tab.journal', 'column_form_empty_title',
   'modules.chrono_bio.history_label', 2),
  ('chrono.empty_text',  'chronobiology_tracker', null, 'chrono.tab.journal', 'column_form_empty_text',
   'modules.chrono_bio.empty_history', 3),

  -- 1 colonne avec 5 column_time_field
  ('chrono.col.h',       'chronobiology_tracker', 'chrono.anchors', 'chrono.tab.journal', 'column_header',
   'modules.chrono_bio.section_anchors', 10),
  ('chrono.col.wake',    'chronobiology_tracker', 'chrono.anchors', 'chrono.col.h',       'column_time_field',
   'modules.chrono_bio.wake_time', 11),
  ('chrono.col.first',   'chronobiology_tracker', 'chrono.anchors', 'chrono.col.h',       'column_time_field',
   'modules.chrono_bio.first_meal', 12),
  ('chrono.col.activity','chronobiology_tracker', 'chrono.anchors', 'chrono.col.h',       'column_time_field',
   'modules.chrono_bio.main_activity', 13),
  ('chrono.col.last',    'chronobiology_tracker', 'chrono.anchors', 'chrono.col.h',       'column_time_field',
   'modules.chrono_bio.last_meal', 14),
  ('chrono.col.bed',     'chronobiology_tracker', 'chrono.anchors', 'chrono.col.h',       'column_time_field',
   'modules.chrono_bio.bedtime', 15);

insert into public.field_props (field_id, prop_key, prop_value) values
  ('chrono.tab.fiches',  'tab_key',          'fiches'),
  ('chrono.tab.fiches',  'sub_preview_kind', 'psyedu'),
  ('chrono.tab.fiches',  'icon_name',        'BookOpen'),
  ('chrono.tab.journal', 'tab_key',          'journal'),
  ('chrono.tab.journal', 'sub_preview_kind', 'column_form'),
  ('chrono.tab.journal', 'icon_name',        'Clock'),
  ('chrono.tab.month',   'tab_key',          'month'),
  ('chrono.tab.month',   'sub_preview_kind', 'chrono_month'),
  ('chrono.tab.month',   'icon_name',        'Sun'),
  -- column header
  ('chrono.col.h',       'color',            '#3B82F6'),
  ('chrono.col.h',       'step_number',      '1'),
  -- 5 ancrages : tous optionnels
  ('chrono.col.wake',    'key',              'wake_time'),
  ('chrono.col.wake',    'optional',         '1'),
  ('chrono.col.first',   'key',              'first_meal'),
  ('chrono.col.first',   'optional',         '1'),
  ('chrono.col.activity','key',              'main_activity'),
  ('chrono.col.activity','optional',         '1'),
  ('chrono.col.last',    'key',              'last_meal'),
  ('chrono.col.last',    'optional',         '1'),
  ('chrono.col.bed',     'key',              'bedtime'),
  ('chrono.col.bed',     'optional',         '1');
