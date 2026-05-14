-- ============================================================
-- PSYTOOL — Données de référence (seed) PostgreSQL / Supabase
--
-- Ce fichier contient UNIQUEMENT les données de seed du modèle :
--   catégories, modules, champs de contenu, propriétés, layouts.
--
-- Pré-requis : `supabase/schema.sql` doit être exécuté en premier.
--
-- Ce script est idempotent :
--   - INSERT ... ON CONFLICT DO NOTHING / DO UPDATE
--   - UPDATE conditionnel par WHERE
--   - DELETE + INSERT pour les layouts qui rebâtissent leur contenu
--
-- Peut être relancé à n'importe quel stade (BDD vierge, partielle, à jour).
-- ============================================================


-- ============================================================
-- SEED : module_categories
-- ============================================================

insert into public.module_categories (id, sort_order) values
  ('safety',     1),
  ('iatrogenic', 2),
  ('lifestyle',  3),
  ('emotion',    4),
  ('cognitive',  5),
  ('anxiety',    6),
  ('addiction',  7),
  ('motivation', 8)
on conflict (id) do nothing;


-- ============================================================
-- SEED : modules (référentiel + ordonnancement + couleurs/icônes)
-- ============================================================

insert into public.modules (id, category_id, preview_kind, sort_order, is_invite_excluded) values
  ('crisis_plan',             'safety',      'steps',       1,  false),
  ('therapeutic_commitment',  'safety',      'coming_soon', 2,  false),
  ('distress_tolerance',      'safety',      'coming_soon', 3,  false),
  ('medication_side_effects', 'iatrogenic',  'fields',      4,  false),
  ('medication_adherence',    'iatrogenic',  'fields',      5,  false),
  ('psychoeducation',         'iatrogenic',  'cards',       6,  true),
  ('sleep_diary',             'lifestyle',   'fields',      7,  false),
  ('diet_weight_psycho',      'lifestyle',   'coming_soon', 8,  false),
  ('chronobiology_tracker',   'lifestyle',   'coming_soon', 9,  false),
  ('mood_tracker',            'emotion',     'fields',      10, false),
  ('emotion_wheel',           'emotion',     'coming_soon', 11, false),
  ('behavioral_activation',   'emotion',     'fields',      12, false),
  ('beck_columns',            'cognitive',   'steps',       13, false),
  ('cognitive_distortions',   'cognitive',   'coming_soon', 14, false),
  ('grounding',               'cognitive',   'coming_soon', 15, false),
  ('rim',                     'cognitive',   'coming_soon', 16, true),
  ('fear_thermometer',        'anxiety',     'fields',      17, false),
  ('exposure_hierarchy',      'anxiety',     'coming_soon', 18, false),
  ('breathing_techniques',    'anxiety',     'fields',      19, false),
  ('cognitive_saturation',    'anxiety',     'coming_soon', 20, false),
  ('craving_journal',         'addiction',   'coming_soon', 21, false),
  ('decisional_balance',      'addiction',   'grid2x2',     22, false),
  ('motivational_balance',    'motivation',  'tabbed',      23, false)
on conflict (id) do nothing;

-- Icônes / couleurs : appliqué uniquement sur les rangs où icon est vide
-- (n'écrase pas les modifs faites depuis la BDD).
update public.modules set
  icon = case id
    when 'crisis_plan'             then 'shield'
    when 'therapeutic_commitment'  then 'handshake'
    when 'distress_tolerance'      then 'zap'
    when 'medication_side_effects' then 'pill'
    when 'medication_adherence'    then 'clipboard-list'
    when 'psychoeducation'         then 'book-open'
    when 'sleep_diary'             then 'moon'
    when 'diet_weight_psycho'      then 'apple'
    when 'chronobiology_tracker'   then 'clock'
    when 'mood_tracker'            then 'smile'
    when 'emotion_wheel'           then 'target'
    when 'behavioral_activation'   then 'activity'
    when 'beck_columns'            then 'brain'
    when 'cognitive_distortions'   then 'search'
    when 'grounding'               then 'leaf'
    when 'rim'                     then 'waves'
    when 'fear_thermometer'        then 'thermometer'
    when 'exposure_hierarchy'      then 'trending-up'
    when 'breathing_techniques'    then 'wind'
    when 'cognitive_saturation'    then 'refresh-cw'
    when 'craving_journal'         then 'bookmark'
    when 'decisional_balance'      then 'scale'
    when 'motivational_balance'    then 'trending-up'
    else ''
  end,
  mobile_icon = case id
    when 'crisis_plan'             then 'lifebuoy'
    when 'therapeutic_commitment'  then 'handshake-outline'
    when 'distress_tolerance'      then 'shield-half-full'
    when 'medication_side_effects' then 'pill'
    when 'medication_adherence'    then 'calendar-check-outline'
    when 'psychoeducation'         then 'book-open-page-variant'
    when 'sleep_diary'             then 'weather-night'
    when 'diet_weight_psycho'      then 'food-apple-outline'
    when 'chronobiology_tracker'   then 'clock-outline'
    when 'mood_tracker'            then 'emoticon-outline'
    when 'emotion_wheel'           then 'palette'
    when 'behavioral_activation'   then 'run-fast'
    when 'beck_columns'            then 'brain'
    when 'cognitive_distortions'   then 'head-cog-outline'
    when 'grounding'               then 'hand-heart-outline'
    when 'rim'                     then 'waves'
    when 'fear_thermometer'        then 'thermometer'
    when 'exposure_hierarchy'      then 'stairs-up'
    when 'breathing_techniques'    then 'lungs'
    when 'cognitive_saturation'    then 'chat-processing-outline'
    when 'craving_journal'         then 'lightning-bolt-outline'
    when 'decisional_balance'      then 'scale-balance'
    when 'motivational_balance'    then 'trending-up'
    else ''
  end,
  color = case id
    when 'crisis_plan'             then '#FF4D6D'
    when 'therapeutic_commitment'  then '#FF4D6D'
    when 'distress_tolerance'      then '#FF4D6D'
    when 'medication_side_effects' then '#8B5CF6'
    when 'medication_adherence'    then '#8B5CF6'
    when 'psychoeducation'         then '#8B5CF6'
    when 'sleep_diary'             then '#06B6D4'
    when 'diet_weight_psycho'      then '#06B6D4'
    when 'chronobiology_tracker'   then '#06B6D4'
    when 'mood_tracker'            then '#F97316'
    when 'emotion_wheel'           then '#F97316'
    when 'behavioral_activation'   then '#F97316'
    when 'beck_columns'            then '#10B981'
    when 'cognitive_distortions'   then '#10B981'
    when 'grounding'               then '#10B981'
    when 'rim'                     then '#10B981'
    when 'fear_thermometer'        then '#F59E0B'
    when 'exposure_hierarchy'      then '#F59E0B'
    when 'breathing_techniques'    then '#F59E0B'
    when 'cognitive_saturation'    then '#F59E0B'
    when 'craving_journal'         then '#EC4899'
    when 'decisional_balance'      then '#EC4899'
    when 'motivational_balance'    then '#0EA5E9'
    else '#6366F1'
  end
where icon = '';


-- ============================================================
-- SEED : modules d'évaluations cliniques (échelles génériques)
-- preview_kind = 'questionnaire' → ScaleEntryScreen / ScaleHistoryScreen
-- ============================================================

insert into public.module_categories (id, sort_order)
values ('assessments', 8)
on conflict (id) do nothing;

insert into public.modules (id, category_id, preview_kind, sort_order, is_invite_excluded, icon, mobile_icon, color) values
  ('phq9',    'assessments', 'questionnaire', 23, false, 'clipboard-list', 'clipboard-text-outline', '#6366F1'),
  ('gad7',    'assessments', 'questionnaire', 24, false, 'clipboard-list', 'clipboard-text-outline', '#6366F1'),
  ('bsl23',   'assessments', 'questionnaire', 25, false, 'clipboard-list', 'clipboard-text-outline', '#6366F1'),
  ('snap_iv', 'assessments', 'questionnaire', 26, false, 'clipboard-list', 'clipboard-text-outline', '#6366F1'),
  ('asrs6',   'assessments', 'questionnaire', 27, false, 'clipboard-list', 'clipboard-text-outline', '#6366F1'),
  ('asrs18',  'assessments', 'questionnaire', 28, false, 'clipboard-list', 'clipboard-text-outline', '#6366F1')
on conflict (id) do update set preview_kind = excluded.preview_kind;

-- ── PHQ-9 ─────────────────────────────────────────────────────────────────────
insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order) values
  ('phq9.instr1', 'phq9', 'scale_instruction', 'modules.phq9.instructions_1', 0),
  ('phq9.instr2', 'phq9', 'scale_instruction', 'modules.phq9.instructions_2', 1),
  ('phq9.opt0',   'phq9', 'scale_option',       'modules.phq9.opt_0',          10),
  ('phq9.opt1',   'phq9', 'scale_option',       'modules.phq9.opt_1',          11),
  ('phq9.opt2',   'phq9', 'scale_option',       'modules.phq9.opt_2',          12),
  ('phq9.opt3',   'phq9', 'scale_option',       'modules.phq9.opt_3',          13),
  ('phq9.q1',     'phq9', 'scale_question',     'modules.phq9.q1',             100),
  ('phq9.q2',     'phq9', 'scale_question',     'modules.phq9.q2',             101),
  ('phq9.q3',     'phq9', 'scale_question',     'modules.phq9.q3',             102),
  ('phq9.q4',     'phq9', 'scale_question',     'modules.phq9.q4',             103),
  ('phq9.q5',     'phq9', 'scale_question',     'modules.phq9.q5',             104),
  ('phq9.q6',     'phq9', 'scale_question',     'modules.phq9.q6',             105),
  ('phq9.q7',     'phq9', 'scale_question',     'modules.phq9.q7',             106),
  ('phq9.q8',     'phq9', 'scale_question',     'modules.phq9.q8',             107),
  ('phq9.q9',     'phq9', 'scale_question',     'modules.phq9.q9',             108),
  ('phq9.footer', 'phq9', 'footer_note',         'modules.phq9.footer',         999)
on conflict (id) do nothing;

insert into public.field_props (field_id, prop_key, prop_value) values
  ('phq9.opt0', 'value', '0'), ('phq9.opt1', 'value', '1'),
  ('phq9.opt2', 'value', '2'), ('phq9.opt3', 'value', '3')
on conflict (field_id, prop_key) do nothing;

-- ── GAD-7 ─────────────────────────────────────────────────────────────────────
insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order) values
  ('gad7.instr1', 'gad7', 'scale_instruction', 'modules.gad7.instructions_1', 0),
  ('gad7.instr2', 'gad7', 'scale_instruction', 'modules.gad7.instructions_2', 1),
  ('gad7.opt0',   'gad7', 'scale_option',       'modules.gad7.opt_0',          10),
  ('gad7.opt1',   'gad7', 'scale_option',       'modules.gad7.opt_1',          11),
  ('gad7.opt2',   'gad7', 'scale_option',       'modules.gad7.opt_2',          12),
  ('gad7.opt3',   'gad7', 'scale_option',       'modules.gad7.opt_3',          13),
  ('gad7.q1',     'gad7', 'scale_question',     'modules.gad7.q1',             100),
  ('gad7.q2',     'gad7', 'scale_question',     'modules.gad7.q2',             101),
  ('gad7.q3',     'gad7', 'scale_question',     'modules.gad7.q3',             102),
  ('gad7.q4',     'gad7', 'scale_question',     'modules.gad7.q4',             103),
  ('gad7.q5',     'gad7', 'scale_question',     'modules.gad7.q5',             104),
  ('gad7.q6',     'gad7', 'scale_question',     'modules.gad7.q6',             105),
  ('gad7.q7',     'gad7', 'scale_question',     'modules.gad7.q7',             106),
  ('gad7.footer', 'gad7', 'footer_note',         'modules.gad7.footer',         999)
on conflict (id) do nothing;

insert into public.field_props (field_id, prop_key, prop_value) values
  ('gad7.opt0', 'value', '0'), ('gad7.opt1', 'value', '1'),
  ('gad7.opt2', 'value', '2'), ('gad7.opt3', 'value', '3')
on conflict (field_id, prop_key) do nothing;

-- ── BSL-23 ────────────────────────────────────────────────────────────────────
insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order) values
  ('bsl23.instr1', 'bsl23', 'scale_instruction', 'modules.bsl23.instructions_1', 0),
  ('bsl23.instr2', 'bsl23', 'scale_instruction', 'modules.bsl23.instructions_2', 1),
  ('bsl23.opt0',   'bsl23', 'scale_option',       'modules.bsl23.opt_0',          10),
  ('bsl23.opt1',   'bsl23', 'scale_option',       'modules.bsl23.opt_1',          11),
  ('bsl23.opt2',   'bsl23', 'scale_option',       'modules.bsl23.opt_2',          12),
  ('bsl23.opt3',   'bsl23', 'scale_option',       'modules.bsl23.opt_3',          13),
  ('bsl23.opt4',   'bsl23', 'scale_option',       'modules.bsl23.opt_4',          14),
  ('bsl23.leg0',   'bsl23', 'scale_legend_item',  'modules.bsl23.legend_0',       20),
  ('bsl23.leg1',   'bsl23', 'scale_legend_item',  'modules.bsl23.legend_1',       21),
  ('bsl23.leg2',   'bsl23', 'scale_legend_item',  'modules.bsl23.legend_2',       22),
  ('bsl23.leg3',   'bsl23', 'scale_legend_item',  'modules.bsl23.legend_3',       23),
  ('bsl23.leg4',   'bsl23', 'scale_legend_item',  'modules.bsl23.legend_4',       24),
  ('bsl23.q1',     'bsl23', 'scale_question',     'modules.bsl23.q1',             100),
  ('bsl23.q2',     'bsl23', 'scale_question',     'modules.bsl23.q2',             101),
  ('bsl23.q3',     'bsl23', 'scale_question',     'modules.bsl23.q3',             102),
  ('bsl23.q4',     'bsl23', 'scale_question',     'modules.bsl23.q4',             103),
  ('bsl23.q5',     'bsl23', 'scale_question',     'modules.bsl23.q5',             104),
  ('bsl23.q6',     'bsl23', 'scale_question',     'modules.bsl23.q6',             105),
  ('bsl23.q7',     'bsl23', 'scale_question',     'modules.bsl23.q7',             106),
  ('bsl23.q8',     'bsl23', 'scale_question',     'modules.bsl23.q8',             107),
  ('bsl23.q9',     'bsl23', 'scale_question',     'modules.bsl23.q9',             108),
  ('bsl23.q10',    'bsl23', 'scale_question',     'modules.bsl23.q10',            109),
  ('bsl23.q11',    'bsl23', 'scale_question',     'modules.bsl23.q11',            110),
  ('bsl23.q12',    'bsl23', 'scale_question',     'modules.bsl23.q12',            111),
  ('bsl23.q13',    'bsl23', 'scale_question',     'modules.bsl23.q13',            112),
  ('bsl23.q14',    'bsl23', 'scale_question',     'modules.bsl23.q14',            113),
  ('bsl23.q15',    'bsl23', 'scale_question',     'modules.bsl23.q15',            114),
  ('bsl23.q16',    'bsl23', 'scale_question',     'modules.bsl23.q16',            115),
  ('bsl23.q17',    'bsl23', 'scale_question',     'modules.bsl23.q17',            116),
  ('bsl23.q18',    'bsl23', 'scale_question',     'modules.bsl23.q18',            117),
  ('bsl23.q19',    'bsl23', 'scale_question',     'modules.bsl23.q19',            118),
  ('bsl23.q20',    'bsl23', 'scale_question',     'modules.bsl23.q20',            119),
  ('bsl23.q21',    'bsl23', 'scale_question',     'modules.bsl23.q21',            120),
  ('bsl23.q22',    'bsl23', 'scale_question',     'modules.bsl23.q22',            121),
  ('bsl23.q23',    'bsl23', 'scale_question',     'modules.bsl23.q23',            122),
  ('bsl23.footer', 'bsl23', 'footer_note',         'modules.bsl23.footer',         999)
on conflict (id) do nothing;

insert into public.field_props (field_id, prop_key, prop_value) values
  ('bsl23.opt0', 'value', '0'), ('bsl23.opt1', 'value', '1'), ('bsl23.opt2', 'value', '2'),
  ('bsl23.opt3', 'value', '3'), ('bsl23.opt4', 'value', '4'),
  ('bsl23.leg0', 'value', '0'), ('bsl23.leg1', 'value', '1'), ('bsl23.leg2', 'value', '2'),
  ('bsl23.leg3', 'value', '3'), ('bsl23.leg4', 'value', '4')
on conflict (field_id, prop_key) do nothing;

-- ── SNAP-IV ───────────────────────────────────────────────────────────────────
insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order) values
  ('snap_iv.instr1',  'snap_iv', 'scale_instruction', 'modules.snap_iv.instructions_1',        0),
  ('snap_iv.instr2',  'snap_iv', 'scale_instruction', 'modules.snap_iv.instructions_2',        1),
  ('snap_iv.opt0',    'snap_iv', 'scale_option',       'modules.snap_iv.opt_0',                 10),
  ('snap_iv.opt1',    'snap_iv', 'scale_option',       'modules.snap_iv.opt_1',                 11),
  ('snap_iv.opt2',    'snap_iv', 'scale_option',       'modules.snap_iv.opt_2',                 12),
  ('snap_iv.opt3',    'snap_iv', 'scale_option',       'modules.snap_iv.opt_3',                 13),
  ('snap_iv.warn',    'snap_iv', 'scale_warning',      'modules.snap_iv.warning',               30),
  ('snap_iv.sec_i',   'snap_iv', 'scale_section',      'modules.snap_iv.section_inattention',   100),
  ('snap_iv.q1',      'snap_iv', 'scale_question',     'modules.snap_iv.q1',                    101),
  ('snap_iv.q2',      'snap_iv', 'scale_question',     'modules.snap_iv.q2',                    102),
  ('snap_iv.q3',      'snap_iv', 'scale_question',     'modules.snap_iv.q3',                    103),
  ('snap_iv.q4',      'snap_iv', 'scale_question',     'modules.snap_iv.q4',                    104),
  ('snap_iv.q5',      'snap_iv', 'scale_question',     'modules.snap_iv.q5',                    105),
  ('snap_iv.q6',      'snap_iv', 'scale_question',     'modules.snap_iv.q6',                    106),
  ('snap_iv.q7',      'snap_iv', 'scale_question',     'modules.snap_iv.q7',                    107),
  ('snap_iv.q8',      'snap_iv', 'scale_question',     'modules.snap_iv.q8',                    108),
  ('snap_iv.q9',      'snap_iv', 'scale_question',     'modules.snap_iv.q9',                    109),
  ('snap_iv.sec_hi',  'snap_iv', 'scale_section',      'modules.snap_iv.section_hyperactivite', 200),
  ('snap_iv.q10',     'snap_iv', 'scale_question',     'modules.snap_iv.q10',                   201),
  ('snap_iv.q11',     'snap_iv', 'scale_question',     'modules.snap_iv.q11',                   202),
  ('snap_iv.q12',     'snap_iv', 'scale_question',     'modules.snap_iv.q12',                   203),
  ('snap_iv.q13',     'snap_iv', 'scale_question',     'modules.snap_iv.q13',                   204),
  ('snap_iv.q14',     'snap_iv', 'scale_question',     'modules.snap_iv.q14',                   205),
  ('snap_iv.q15',     'snap_iv', 'scale_question',     'modules.snap_iv.q15',                   206),
  ('snap_iv.q16',     'snap_iv', 'scale_question',     'modules.snap_iv.q16',                   207),
  ('snap_iv.q17',     'snap_iv', 'scale_question',     'modules.snap_iv.q17',                   208),
  ('snap_iv.q18',     'snap_iv', 'scale_question',     'modules.snap_iv.q18',                   209),
  ('snap_iv.sec_tod', 'snap_iv', 'scale_section',      'modules.snap_iv.section_tod',           300),
  ('snap_iv.q19',     'snap_iv', 'scale_question',     'modules.snap_iv.q19',                   301),
  ('snap_iv.q20',     'snap_iv', 'scale_question',     'modules.snap_iv.q20',                   302),
  ('snap_iv.q21',     'snap_iv', 'scale_question',     'modules.snap_iv.q21',                   303),
  ('snap_iv.q22',     'snap_iv', 'scale_question',     'modules.snap_iv.q22',                   304),
  ('snap_iv.q23',     'snap_iv', 'scale_question',     'modules.snap_iv.q23',                   305),
  ('snap_iv.q24',     'snap_iv', 'scale_question',     'modules.snap_iv.q24',                   306),
  ('snap_iv.q25',     'snap_iv', 'scale_question',     'modules.snap_iv.q25',                   307),
  ('snap_iv.q26',     'snap_iv', 'scale_question',     'modules.snap_iv.q26',                   308),
  ('snap_iv.footer',  'snap_iv', 'footer_note',         'modules.snap_iv.footer',                999)
on conflict (id) do nothing;

insert into public.field_props (field_id, prop_key, prop_value) values
  ('snap_iv.opt0', 'value', '0'), ('snap_iv.opt1', 'value', '1'),
  ('snap_iv.opt2', 'value', '2'), ('snap_iv.opt3', 'value', '3')
on conflict (field_id, prop_key) do nothing;

-- ── ASRS-6 ────────────────────────────────────────────────────────────────────
insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order) values
  ('asrs6.instr1', 'asrs6', 'scale_instruction', 'modules.asrs6.instructions_1', 0),
  ('asrs6.instr2', 'asrs6', 'scale_instruction', 'modules.asrs6.instructions_2', 1),
  ('asrs6.opt0',   'asrs6', 'scale_option',       'modules.asrs6.opt_0',          10),
  ('asrs6.opt1',   'asrs6', 'scale_option',       'modules.asrs6.opt_1',          11),
  ('asrs6.opt2',   'asrs6', 'scale_option',       'modules.asrs6.opt_2',          12),
  ('asrs6.opt3',   'asrs6', 'scale_option',       'modules.asrs6.opt_3',          13),
  ('asrs6.opt4',   'asrs6', 'scale_option',       'modules.asrs6.opt_4',          14),
  ('asrs6.q1',     'asrs6', 'scale_question',     'modules.asrs6.q1',             100),
  ('asrs6.q2',     'asrs6', 'scale_question',     'modules.asrs6.q2',             101),
  ('asrs6.q3',     'asrs6', 'scale_question',     'modules.asrs6.q3',             102),
  ('asrs6.q4',     'asrs6', 'scale_question',     'modules.asrs6.q4',             103),
  ('asrs6.q5',     'asrs6', 'scale_question',     'modules.asrs6.q5',             104),
  ('asrs6.q6',     'asrs6', 'scale_question',     'modules.asrs6.q6',             105),
  ('asrs6.footer', 'asrs6', 'footer_note',         'modules.asrs6.footer',         999)
on conflict (id) do nothing;

insert into public.field_props (field_id, prop_key, prop_value) values
  ('asrs6.opt0', 'value', '0'), ('asrs6.opt1', 'value', '1'), ('asrs6.opt2', 'value', '2'),
  ('asrs6.opt3', 'value', '3'), ('asrs6.opt4', 'value', '4')
on conflict (field_id, prop_key) do nothing;

-- ── ASRS-18 ───────────────────────────────────────────────────────────────────
insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order) values
  ('asrs18.instr1', 'asrs18', 'scale_instruction', 'modules.asrs18.instructions_1', 0),
  ('asrs18.instr2', 'asrs18', 'scale_instruction', 'modules.asrs18.instructions_2', 1),
  ('asrs18.opt0',   'asrs18', 'scale_option',       'modules.asrs18.opt_0',          10),
  ('asrs18.opt1',   'asrs18', 'scale_option',       'modules.asrs18.opt_1',          11),
  ('asrs18.opt2',   'asrs18', 'scale_option',       'modules.asrs18.opt_2',          12),
  ('asrs18.opt3',   'asrs18', 'scale_option',       'modules.asrs18.opt_3',          13),
  ('asrs18.opt4',   'asrs18', 'scale_option',       'modules.asrs18.opt_4',          14),
  ('asrs18.sec_a',  'asrs18', 'scale_section',      'modules.asrs18.section_part_a', 100),
  ('asrs18.q1',     'asrs18', 'scale_question',     'modules.asrs18.q1',             101),
  ('asrs18.q2',     'asrs18', 'scale_question',     'modules.asrs18.q2',             102),
  ('asrs18.q3',     'asrs18', 'scale_question',     'modules.asrs18.q3',             103),
  ('asrs18.q4',     'asrs18', 'scale_question',     'modules.asrs18.q4',             104),
  ('asrs18.q5',     'asrs18', 'scale_question',     'modules.asrs18.q5',             105),
  ('asrs18.q6',     'asrs18', 'scale_question',     'modules.asrs18.q6',             106),
  ('asrs18.sec_b',  'asrs18', 'scale_section',      'modules.asrs18.section_part_b', 200),
  ('asrs18.q7',     'asrs18', 'scale_question',     'modules.asrs18.q7',             201),
  ('asrs18.q8',     'asrs18', 'scale_question',     'modules.asrs18.q8',             202),
  ('asrs18.q9',     'asrs18', 'scale_question',     'modules.asrs18.q9',             203),
  ('asrs18.q10',    'asrs18', 'scale_question',     'modules.asrs18.q10',            204),
  ('asrs18.q11',    'asrs18', 'scale_question',     'modules.asrs18.q11',            205),
  ('asrs18.q12',    'asrs18', 'scale_question',     'modules.asrs18.q12',            206),
  ('asrs18.q13',    'asrs18', 'scale_question',     'modules.asrs18.q13',            207),
  ('asrs18.q14',    'asrs18', 'scale_question',     'modules.asrs18.q14',            208),
  ('asrs18.q15',    'asrs18', 'scale_question',     'modules.asrs18.q15',            209),
  ('asrs18.q16',    'asrs18', 'scale_question',     'modules.asrs18.q16',            210),
  ('asrs18.q17',    'asrs18', 'scale_question',     'modules.asrs18.q17',            211),
  ('asrs18.q18',    'asrs18', 'scale_question',     'modules.asrs18.q18',            212),
  ('asrs18.footer', 'asrs18', 'footer_note',         'modules.asrs18.footer',         999)
on conflict (id) do nothing;

insert into public.field_props (field_id, prop_key, prop_value) values
  ('asrs18.opt0', 'value', '0'), ('asrs18.opt1', 'value', '1'), ('asrs18.opt2', 'value', '2'),
  ('asrs18.opt3', 'value', '3'), ('asrs18.opt4', 'value', '4')
on conflict (field_id, prop_key) do nothing;


-- ============================================================
-- LAYOUT : medication_adherence → daily_checkin
-- preview_kind = 'daily_checkin' → DailyCheckinLayout
-- 1 saisie / jour, UPSERT sur (module_id, date) en local SQLite,
-- signal logEvent('SAVE_MEDICATION_ADHERENCE') côté Supabase.
-- ============================================================

update public.modules set preview_kind = 'daily_checkin' where id = 'medication_adherence';

insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order) values
  ('madh.cfg',                'medication_adherence', 'daily_checkin_config',         null,                                              0),
  ('madh.tab_today',          'medication_adherence', 'daily_tab_today_label',         'modules.medication_adherence.tab_today',          5),
  ('madh.tab_history',        'medication_adherence', 'daily_tab_history_label',       'modules.medication_adherence.tab_history',        6),
  ('madh.today_label',        'medication_adherence', 'daily_today_label',             'modules.medication_adherence.today_label',        10),
  ('madh.already_saved',      'medication_adherence', 'daily_already_saved_label',     'modules.medication_adherence.already_saved',      11),
  ('madh.question',           'medication_adherence', 'daily_question',                'modules.medication_adherence.intro',               20),
  ('madh.opt_taken',          'medication_adherence', 'daily_status_option',           'modules.medication_adherence.status_taken',       30),
  ('madh.opt_partial',        'medication_adherence', 'daily_status_option',           'modules.medication_adherence.status_partial',     31),
  ('madh.opt_missed',         'medication_adherence', 'daily_status_option',           'modules.medication_adherence.status_missed',      32),
  ('madh.notes_label',        'medication_adherence', 'daily_notes_label',             'common.notes_optional',                            40),
  ('madh.notes_placeholder',  'medication_adherence', 'daily_notes_placeholder',       'modules.medication_adherence.notes_placeholder',  41),
  ('madh.save_label',         'medication_adherence', 'daily_save_label',              'modules.medication_adherence.save',                50),
  ('madh.update_label',       'medication_adherence', 'daily_update_label',            'common.update',                                    51),
  ('madh.history_empty',      'medication_adherence', 'daily_history_empty_text',      'modules.medication_adherence.empty_history',      60),
  ('madh.missing_title',      'medication_adherence', 'daily_status_missing_title',    'modules.medication_adherence.status_missing',     70),
  ('madh.missing_msg',        'medication_adherence', 'daily_status_missing_msg',      'modules.medication_adherence.status_missing_msg', 71),
  ('madh.delete_title',       'medication_adherence', 'daily_delete_title',            'modules.medication_adherence.delete_entry_title', 72),
  ('madh.saved_message',      'medication_adherence', 'daily_saved_message',           'modules.medication_adherence.saved_message',      73)
on conflict (id) do nothing;

insert into public.field_props (field_id, prop_key, prop_value) values
  ('madh.cfg',          'engagement_event_type', 'SAVE_MEDICATION_ADHERENCE'),
  ('madh.opt_taken',    'value',    'taken'),
  ('madh.opt_taken',    'icon',     'check-circle-outline'),
  ('madh.opt_taken',    'color',    '#10B981'),
  ('madh.opt_taken',    'bg_color', '#ECFDF5'),
  ('madh.opt_partial',  'value',    'partial'),
  ('madh.opt_partial',  'icon',     'circle-half-full'),
  ('madh.opt_partial',  'color',    '#F59E0B'),
  ('madh.opt_partial',  'bg_color', '#FFFBEB'),
  ('madh.opt_missed',   'value',    'missed'),
  ('madh.opt_missed',   'icon',     'circle-outline'),
  ('madh.opt_missed',   'color',    '#6B7280'),
  ('madh.opt_missed',   'bg_color', '#F3F4F6')
on conflict (field_id, prop_key) do nothing;


-- ============================================================
-- LAYOUT : beck_columns → column_form
-- preview_kind = 'column_form' → ColumnFormLayout
-- N enregistrements / module dans `form_entries` (JSON values).
-- 5 colonnes TCC + signal logEvent('SAVE_BECK_THOUGHT_RECORD').
-- ============================================================

update public.modules set preview_kind = 'column_form' where id = 'beck_columns';

insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order) values
  ('beck.cfg',              'beck_columns', 'column_form_config',           null,                                            0),
  ('beck.new_btn',          'beck_columns', 'column_form_new_btn_label',     'modules.beck_columns.new_thought',              1),
  ('beck.save_label',       'beck_columns', 'column_form_save_label',        'modules.beck_columns.save',                     2),
  ('beck.empty_title',      'beck_columns', 'column_form_empty_title',       'modules.beck_columns.empty_title',              3),
  ('beck.empty_text',       'beck_columns', 'column_form_empty_text',        'modules.beck_columns.intro',                    4),
  ('beck.delete_title',     'beck_columns', 'column_form_delete_title',      'modules.beck_columns.delete_record_title',      5),
  ('beck.validation_title', 'beck_columns', 'column_form_validation_title',  'modules.beck_columns.empty_alert_title',        6),
  ('beck.validation_msg',   'beck_columns', 'column_form_validation_msg',    'modules.beck_columns.empty_alert_msg',          7)
on conflict (id) do nothing;

insert into public.module_content_fields (id, module_id, field_type, text_code, section_id, sort_order) values
  ('beck.col1.h', 'beck_columns', 'column_header', 'modules.beck_columns.entry_col_1_title', 'beck.col_situation', 10),
  ('beck.col2.h', 'beck_columns', 'column_header', 'modules.beck_columns.entry_col_2_title', 'beck.col_emotion',   20),
  ('beck.col3.h', 'beck_columns', 'column_header', 'modules.beck_columns.entry_col_3_title', 'beck.col_thought',   30),
  ('beck.col4.h', 'beck_columns', 'column_header', 'modules.beck_columns.entry_col_4_title', 'beck.col_rational',  40),
  ('beck.col5.h', 'beck_columns', 'column_header', 'modules.beck_columns.entry_col_5_title', 'beck.col_outcome',   50)
on conflict (id) do nothing;

insert into public.module_content_fields (id, module_id, field_type, text_code, section_id, parent_field_id, sort_order) values
  ('beck.col1.text',   'beck_columns', 'column_text_field',   'modules.beck_columns.entry_col_1_placeholder', 'beck.col_situation', 'beck.col1.h', 11),
  ('beck.col2.text',   'beck_columns', 'column_text_field',   'modules.beck_columns.entry_col_2_placeholder', 'beck.col_emotion',   'beck.col2.h', 21),
  ('beck.col2.slider', 'beck_columns', 'column_slider_field', 'modules.beck_columns.entry_col_2_intensity',   'beck.col_emotion',   'beck.col2.h', 22),
  ('beck.col3.text',   'beck_columns', 'column_text_field',   'modules.beck_columns.entry_col_3_placeholder', 'beck.col_thought',   'beck.col3.h', 31),
  ('beck.col3.slider', 'beck_columns', 'column_slider_field', 'modules.beck_columns.entry_col_3_belief',      'beck.col_thought',   'beck.col3.h', 32),
  ('beck.col4.text',   'beck_columns', 'column_text_field',   'modules.beck_columns.entry_col_4_placeholder', 'beck.col_rational',  'beck.col4.h', 41),
  ('beck.col5.text',   'beck_columns', 'column_text_field',   'modules.beck_columns.entry_col_5_placeholder', 'beck.col_outcome',   'beck.col5.h', 51),
  ('beck.col5.intens', 'beck_columns', 'column_slider_field', 'modules.beck_columns.entry_col_5_intensity',   'beck.col_outcome',   'beck.col5.h', 52),
  ('beck.col5.belief', 'beck_columns', 'column_slider_field', 'modules.beck_columns.entry_col_5_belief',      'beck.col_outcome',   'beck.col5.h', 53)
on conflict (id) do nothing;

insert into public.field_props (field_id, prop_key, prop_value) values
  ('beck.cfg', 'engagement_event_type', 'SAVE_BECK_THOUGHT_RECORD'),
  ('beck.cfg', 'required_keys_any',     'situation,automatic_thought'),
  ('beck.col1.h', 'color',       '#0EA5E9'),
  ('beck.col1.h', 'step_number', '1'),
  ('beck.col1.h', 'hint_code',   'modules.beck_columns.entry_col_1_hint'),
  ('beck.col2.h', 'color',       '#8B5CF6'),
  ('beck.col2.h', 'step_number', '2'),
  ('beck.col2.h', 'hint_code',   'modules.beck_columns.entry_col_2_hint'),
  ('beck.col3.h', 'color',       '#EF4444'),
  ('beck.col3.h', 'step_number', '3'),
  ('beck.col3.h', 'hint_code',   'modules.beck_columns.entry_col_3_hint'),
  ('beck.col4.h', 'color',       '#059669'),
  ('beck.col4.h', 'step_number', '4'),
  ('beck.col4.h', 'hint_code',   'modules.beck_columns.entry_col_4_hint'),
  ('beck.col5.h', 'color',       '#D97706'),
  ('beck.col5.h', 'step_number', '5'),
  ('beck.col5.h', 'hint_code',   'modules.beck_columns.entry_col_5_hint'),
  ('beck.col1.text', 'key',        'situation'),
  ('beck.col1.text', 'multiline',  '1'),
  ('beck.col1.text', 'min_height', '72'),
  ('beck.col2.text', 'key',        'emotion'),
  ('beck.col2.text', 'multiline',  '0'),
  ('beck.col3.text', 'key',        'automatic_thought'),
  ('beck.col3.text', 'multiline',  '1'),
  ('beck.col3.text', 'min_height', '72'),
  ('beck.col4.text', 'key',        'rational_response'),
  ('beck.col4.text', 'multiline',  '1'),
  ('beck.col4.text', 'min_height', '88'),
  ('beck.col5.text', 'key',        'outcome_emotion'),
  ('beck.col5.text', 'multiline',  '0'),
  ('beck.col2.slider', 'key',   'emotion_intensity'),
  ('beck.col2.slider', 'min',   '0'),
  ('beck.col2.slider', 'max',   '100'),
  ('beck.col2.slider', 'step',  '10'),
  ('beck.col2.slider', 'color', '#8B5CF6'),
  ('beck.col3.slider', 'key',   'thought_belief'),
  ('beck.col3.slider', 'min',   '0'),
  ('beck.col3.slider', 'max',   '100'),
  ('beck.col3.slider', 'step',  '10'),
  ('beck.col3.slider', 'color', '#EF4444'),
  ('beck.col5.intens', 'key',   'outcome_intensity'),
  ('beck.col5.intens', 'min',   '0'),
  ('beck.col5.intens', 'max',   '100'),
  ('beck.col5.intens', 'step',  '10'),
  ('beck.col5.intens', 'color', '#D97706'),
  ('beck.col5.belief', 'key',   'outcome_belief'),
  ('beck.col5.belief', 'min',   '0'),
  ('beck.col5.belief', 'max',   '100'),
  ('beck.col5.belief', 'step',  '10'),
  ('beck.col5.belief', 'color', '#D97706')
on conflict (field_id, prop_key) do nothing;


-- ============================================================
-- LAYOUT : emotion_wheel — Roue des émotions (Plutchik 1980)
-- preview_kind = 'tree_selector' → TreeSelectorLayout
-- Arbre 3 niveaux : 8 primaires × 3 secondaires × 3 spécifiques = 72 feuilles
-- ============================================================

update public.modules set preview_kind = 'tree_selector' where id = 'emotion_wheel';

insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order) values
  ('ew.cfg',                   'emotion_wheel', 'tree_selector_config',              null,                                                  0),
  ('ew.intro',                 'emotion_wheel', 'tree_selector_intro',               'modules.emotion_wheel.intro',                         1),
  ('ew.step1.title',           'emotion_wheel', 'tree_selector_step_1_title',        'modules.emotion_wheel.step_primary_title',            2),
  ('ew.step1.hint',            'emotion_wheel', 'tree_selector_step_1_hint',         'modules.emotion_wheel.step_primary_hint',             3),
  ('ew.step2.hint',            'emotion_wheel', 'tree_selector_step_2_hint',         'modules.emotion_wheel.step_secondary_hint',           4),
  ('ew.step3.title',           'emotion_wheel', 'tree_selector_step_3_title',        'modules.emotion_wheel.step_specific_title',           5),
  ('ew.step3.hint',            'emotion_wheel', 'tree_selector_step_3_hint',         'modules.emotion_wheel.step_specific_hint',            6),
  ('ew.intensity.title',       'emotion_wheel', 'tree_selector_intensity_title',     'modules.emotion_wheel.step_intensity_title',          7),
  ('ew.intensity.hint',        'emotion_wheel', 'tree_selector_intensity_hint',      'modules.emotion_wheel.step_intensity_hint',           8),
  ('ew.notes.title',           'emotion_wheel', 'tree_selector_notes_title',         'modules.emotion_wheel.step_notes_title',              9),
  ('ew.notes.hint',            'emotion_wheel', 'tree_selector_notes_hint',          'modules.emotion_wheel.step_notes_hint',              10),
  ('ew.notes.placeholder',     'emotion_wheel', 'tree_selector_notes_placeholder',   'modules.emotion_wheel.notes_free_placeholder',       11),
  ('ew.continue_btn',          'emotion_wheel', 'tree_selector_continue_btn',        'modules.emotion_wheel.continue',                     12),
  ('ew.save_btn',              'emotion_wheel', 'tree_selector_save_btn',            'modules.emotion_wheel.save',                         13),
  ('ew.new_btn',               'emotion_wheel', 'tree_selector_new_btn',             'modules.emotion_wheel.identify_btn',                 14),
  ('ew.history_label',         'emotion_wheel', 'tree_selector_history_label',       'modules.emotion_wheel.history_label',                15),
  ('ew.empty_title',           'emotion_wheel', 'tree_selector_empty_title',         'modules.emotion_wheel.empty_title',                  16),
  ('ew.empty_text',            'emotion_wheel', 'tree_selector_empty_text',          'modules.emotion_wheel.empty_text',                   17),
  ('ew.delete_title',          'emotion_wheel', 'tree_selector_delete_title',        'modules.emotion_wheel.delete_entry_title',           18)
on conflict (id) do nothing;

-- Niveau 1 — émotions primaires (8)
insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order) values
  ('ew.joy',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy',          100),
  ('ew.trust',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust',        110),
  ('ew.fear',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear',         120),
  ('ew.surprise',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise',     130),
  ('ew.sadness',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness',      140),
  ('ew.disgust',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust',      150),
  ('ew.anger',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger',        160),
  ('ew.anticipation', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation', 170)
on conflict (id) do nothing;

-- Niveau 2 — émotions secondaires (24)
insert into public.module_content_fields (id, module_id, field_type, text_code, parent_field_id, sort_order) values
  ('ew.joy.serenity',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__serenity',          'ew.joy',          1),
  ('ew.joy.joy_2',             'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__joy_2',             'ew.joy',          2),
  ('ew.joy.ecstasy',           'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__ecstasy',           'ew.joy',          3),
  ('ew.trust.acceptance',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__acceptance',      'ew.trust',        1),
  ('ew.trust.trust_2',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__trust_2',         'ew.trust',        2),
  ('ew.trust.admiration',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__admiration',      'ew.trust',        3),
  ('ew.fear.apprehension',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__apprehension',     'ew.fear',         1),
  ('ew.fear.fear_2',           'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__fear_2',           'ew.fear',         2),
  ('ew.fear.terror',           'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__terror',           'ew.fear',         3),
  ('ew.surprise.distraction',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__distraction',  'ew.surprise',     1),
  ('ew.surprise.surprise_2',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__surprise_2',   'ew.surprise',     2),
  ('ew.surprise.amazement',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__amazement',    'ew.surprise',     3),
  ('ew.sadness.pensiveness',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__pensiveness',   'ew.sadness',      1),
  ('ew.sadness.sadness_2',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__sadness_2',     'ew.sadness',      2),
  ('ew.sadness.grief',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__grief',         'ew.sadness',      3),
  ('ew.disgust.boredom',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__boredom',       'ew.disgust',      1),
  ('ew.disgust.disgust_2',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__disgust_2',     'ew.disgust',      2),
  ('ew.disgust.loathing',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__loathing',      'ew.disgust',      3),
  ('ew.anger.annoyance',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__annoyance',       'ew.anger',        1),
  ('ew.anger.anger_2',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__anger_2',         'ew.anger',        2),
  ('ew.anger.rage',            'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__rage',            'ew.anger',        3),
  ('ew.anticipation.interest',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__interest',         'ew.anticipation', 1),
  ('ew.anticipation.anticipation_2',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__anticipation_2',   'ew.anticipation', 2),
  ('ew.anticipation.vigilance',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__vigilance',        'ew.anticipation', 3)
on conflict (id) do nothing;

-- Niveau 3 — émotions spécifiques (72)
insert into public.module_content_fields (id, module_id, field_type, text_code, parent_field_id, sort_order) values
  ('ew.joy.serenity.calm',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__serenity__calm',         'ew.joy.serenity',     1),
  ('ew.joy.serenity.peaceful',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__serenity__peaceful',     'ew.joy.serenity',     2),
  ('ew.joy.serenity.content',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__serenity__content',      'ew.joy.serenity',     3),
  ('ew.joy.joy_2.happy',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__joy_2__happy',           'ew.joy.joy_2',        1),
  ('ew.joy.joy_2.cheerful',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__joy_2__cheerful',        'ew.joy.joy_2',        2),
  ('ew.joy.joy_2.amused',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__joy_2__amused',          'ew.joy.joy_2',        3),
  ('ew.joy.ecstasy.elated',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__ecstasy__elated',        'ew.joy.ecstasy',      1),
  ('ew.joy.ecstasy.euphoric',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__ecstasy__euphoric',      'ew.joy.ecstasy',      2),
  ('ew.joy.ecstasy.overjoyed',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__ecstasy__overjoyed',     'ew.joy.ecstasy',      3),
  ('ew.trust.acceptance.open',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__acceptance__open',          'ew.trust.acceptance', 1),
  ('ew.trust.acceptance.tolerant',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__acceptance__tolerant',      'ew.trust.acceptance', 2),
  ('ew.trust.acceptance.receptive',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__acceptance__receptive',     'ew.trust.acceptance', 3),
  ('ew.trust.trust_2.secure',           'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__trust_2__secure',           'ew.trust.trust_2',    1),
  ('ew.trust.trust_2.confident',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__trust_2__confident',        'ew.trust.trust_2',    2),
  ('ew.trust.trust_2.assured',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__trust_2__assured',          'ew.trust.trust_2',    3),
  ('ew.trust.admiration.admiring',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__admiration__admiring',      'ew.trust.admiration', 1),
  ('ew.trust.admiration.grateful',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__admiration__grateful',      'ew.trust.admiration', 2),
  ('ew.trust.admiration.reverent',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.trust__admiration__reverent',      'ew.trust.admiration', 3),
  ('ew.fear.apprehension.uneasy',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__apprehension__uneasy',       'ew.fear.apprehension', 1),
  ('ew.fear.apprehension.worried',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__apprehension__worried',      'ew.fear.apprehension', 2),
  ('ew.fear.apprehension.nervous',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__apprehension__nervous',      'ew.fear.apprehension', 3),
  ('ew.fear.fear_2.scared',             'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__fear_2__scared',             'ew.fear.fear_2',       1),
  ('ew.fear.fear_2.anxious',            'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__fear_2__anxious',            'ew.fear.fear_2',       2),
  ('ew.fear.fear_2.threatened',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__fear_2__threatened',         'ew.fear.fear_2',       3),
  ('ew.fear.terror.panicked',           'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__terror__panicked',           'ew.fear.terror',       1),
  ('ew.fear.terror.horrified',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__terror__horrified',          'ew.fear.terror',       2),
  ('ew.fear.terror.overwhelmed',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__terror__overwhelmed',        'ew.fear.terror',       3),
  ('ew.surprise.distraction.confused',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__distraction__confused',  'ew.surprise.distraction', 1),
  ('ew.surprise.distraction.uncertain', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__distraction__uncertain', 'ew.surprise.distraction', 2),
  ('ew.surprise.distraction.perplexed', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__distraction__perplexed', 'ew.surprise.distraction', 3),
  ('ew.surprise.surprise_2.surprised',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__surprise_2__surprised',  'ew.surprise.surprise_2',  1),
  ('ew.surprise.surprise_2.startled',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__surprise_2__startled',   'ew.surprise.surprise_2',  2),
  ('ew.surprise.surprise_2.astonished', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__surprise_2__astonished', 'ew.surprise.surprise_2',  3),
  ('ew.surprise.amazement.amazed',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__amazement__amazed',      'ew.surprise.amazement',   1),
  ('ew.surprise.amazement.awed',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__amazement__awed',        'ew.surprise.amazement',   2),
  ('ew.surprise.amazement.dumbfounded', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.surprise__amazement__dumbfounded', 'ew.surprise.amazement',   3),
  ('ew.sadness.pensiveness.pensive',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__pensiveness__pensive',    'ew.sadness.pensiveness', 1),
  ('ew.sadness.pensiveness.nostalgic',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__pensiveness__nostalgic',  'ew.sadness.pensiveness', 2),
  ('ew.sadness.pensiveness.wistful',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__pensiveness__wistful',    'ew.sadness.pensiveness', 3),
  ('ew.sadness.sadness_2.sad',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__sadness_2__sad',          'ew.sadness.sadness_2',   1),
  ('ew.sadness.sadness_2.sorrowful',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__sadness_2__sorrowful',    'ew.sadness.sadness_2',   2),
  ('ew.sadness.sadness_2.dejected',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__sadness_2__dejected',     'ew.sadness.sadness_2',   3),
  ('ew.sadness.grief.hopeless',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__grief__hopeless',         'ew.sadness.grief',       1),
  ('ew.sadness.grief.despairing',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__grief__despairing',       'ew.sadness.grief',       2),
  ('ew.sadness.grief.anguished',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__grief__anguished',        'ew.sadness.grief',       3),
  ('ew.disgust.boredom.bored',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__boredom__bored',          'ew.disgust.boredom',     1),
  ('ew.disgust.boredom.indifferent',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__boredom__indifferent',    'ew.disgust.boredom',     2),
  ('ew.disgust.boredom.apathetic',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__boredom__apathetic',      'ew.disgust.boredom',     3),
  ('ew.disgust.disgust_2.disgusted',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__disgust_2__disgusted',    'ew.disgust.disgust_2',   1),
  ('ew.disgust.disgust_2.revolted',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__disgust_2__revolted',     'ew.disgust.disgust_2',   2),
  ('ew.disgust.disgust_2.repulsed',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__disgust_2__repulsed',     'ew.disgust.disgust_2',   3),
  ('ew.disgust.loathing.loathing',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__loathing__loathing',      'ew.disgust.loathing',    1),
  ('ew.disgust.loathing.contemptuous',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__loathing__contemptuous',  'ew.disgust.loathing',    2),
  ('ew.disgust.loathing.hateful',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__loathing__hateful',       'ew.disgust.loathing',    3),
  ('ew.anger.annoyance.annoyed',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__annoyance__annoyed',        'ew.anger.annoyance',     1),
  ('ew.anger.annoyance.irritated',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__annoyance__irritated',      'ew.anger.annoyance',     2),
  ('ew.anger.annoyance.impatient',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__annoyance__impatient',      'ew.anger.annoyance',     3),
  ('ew.anger.anger_2.angry',            'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__anger_2__angry',            'ew.anger.anger_2',       1),
  ('ew.anger.anger_2.frustrated',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__anger_2__frustrated',       'ew.anger.anger_2',       2),
  ('ew.anger.anger_2.resentful',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__anger_2__resentful',        'ew.anger.anger_2',       3),
  ('ew.anger.rage.furious',             'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__rage__furious',             'ew.anger.rage',          1),
  ('ew.anger.rage.outraged',            'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__rage__outraged',            'ew.anger.rage',          2),
  ('ew.anger.rage.enraged',             'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__rage__enraged',             'ew.anger.rage',          3),
  ('ew.anticipation.interest.curious',                'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__interest__curious',                 'ew.anticipation.interest',         1),
  ('ew.anticipation.interest.interested',             'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__interest__interested',              'ew.anticipation.interest',         2),
  ('ew.anticipation.interest.attentive',              'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__interest__attentive',               'ew.anticipation.interest',         3),
  ('ew.anticipation.anticipation_2.expectant',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__anticipation_2__expectant',         'ew.anticipation.anticipation_2',   1),
  ('ew.anticipation.anticipation_2.hopeful',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__anticipation_2__hopeful',           'ew.anticipation.anticipation_2',   2),
  ('ew.anticipation.anticipation_2.eager',            'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__anticipation_2__eager',             'ew.anticipation.anticipation_2',   3),
  ('ew.anticipation.vigilance.alert',                 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__vigilance__alert',                  'ew.anticipation.vigilance',        1),
  ('ew.anticipation.vigilance.cautious',              'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__vigilance__cautious',               'ew.anticipation.vigilance',        2),
  ('ew.anticipation.vigilance.watchful',              'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anticipation__vigilance__watchful',               'ew.anticipation.vigilance',        3)
on conflict (id) do nothing;

insert into public.field_props (field_id, prop_key, prop_value) values
  ('ew.cfg', 'enable_intensity', '1'),
  ('ew.cfg', 'intensity_min',    '1'),
  ('ew.cfg', 'intensity_max',    '10'),
  ('ew.cfg', 'enable_notes',     '1'),
  ('ew.joy',          'color', '#F59E0B'),
  ('ew.joy',          'icon',  'emoticon-happy-outline'),
  ('ew.trust',        'color', '#10B981'),
  ('ew.trust',        'icon',  'shield-heart-outline'),
  ('ew.fear',         'color', '#6EE7B7'),
  ('ew.fear',         'icon',  'alert-circle-outline'),
  ('ew.surprise',     'color', '#06B6D4'),
  ('ew.surprise',     'icon',  'emoticon-excited-outline'),
  ('ew.sadness',      'color', '#3B82F6'),
  ('ew.sadness',      'icon',  'emoticon-sad-outline'),
  ('ew.disgust',      'color', '#8B5CF6'),
  ('ew.disgust',      'icon',  'emoticon-sick-outline'),
  ('ew.anger',        'color', '#EF4444'),
  ('ew.anger',        'icon',  'emoticon-angry-outline'),
  ('ew.anticipation', 'color', '#F97316'),
  ('ew.anticipation', 'icon',  'clock-fast')
on conflict (field_id, prop_key) do nothing;


-- ============================================================
-- LAYOUT : sleep_diary → sleep_journal
-- preview_kind = 'sleep_journal' → SleepJournalLayout
-- 3 modes : list | entry | month
-- ============================================================

-- Nettoyage des anciens props 'fields' (sleep.field_*) puis reset des champs
delete from public.field_props
where field_id in ('sleep.field_1','sleep.field_2','sleep.field_3','sleep.field_4',
                   'sleep.field_5','sleep.field_6','sleep.field_7','sleep.field_8');
delete from public.module_content_fields where module_id = 'sleep_diary';

update public.modules set preview_kind = 'sleep_journal' where id = 'sleep_diary';

insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order) values
  ('sj.cfg',                   'sleep_diary', 'sleep_journal_config',                   null,                                       0),
  ('sj.cta_title',             'sleep_diary', 'sleep_journal_cta_title',                'modules.sleep_diary.cta_title',            1),
  ('sj.monthly_button',        'sleep_diary', 'sleep_journal_monthly_button_label',     'modules.sleep_diary.monthly_button',       2),
  ('sj.list_header',           'sleep_diary', 'sleep_journal_list_header',              'modules.sleep_diary.list_header',          3),
  ('sj.incomplete',            'sleep_diary', 'sleep_journal_incomplete_label',         'modules.sleep_diary.incomplete',           4),
  ('sj.empty_day',             'sleep_diary', 'sleep_journal_empty_day_label',          'modules.sleep_diary.empty_day',            5),
  ('sj.section_schedule',      'sleep_diary', 'sleep_journal_section_schedule_title',   'modules.sleep_diary.section_schedule',     6),
  ('sj.section_awakenings',    'sleep_diary', 'sleep_journal_section_awakenings_title', 'modules.sleep_diary.section_awakenings',   7),
  ('sj.section_nightmares',    'sleep_diary', 'sleep_journal_section_nightmares_title', 'modules.sleep_diary.section_nightmares',   8),
  ('sj.section_quality',       'sleep_diary', 'sleep_journal_section_quality_title',    'modules.sleep_diary.section_quality',      9),
  ('sj.section_notes',         'sleep_diary', 'sleep_journal_section_notes_title',      'modules.sleep_diary.notes_label',         10),
  ('sj.bedtime_label',         'sleep_diary', 'sleep_journal_bedtime_label',            'modules.sleep_diary.bedtime_label',       11),
  ('sj.wake_time_label',       'sleep_diary', 'sleep_journal_wake_time_label',          'modules.sleep_diary.wake_time_label',     12),
  ('sj.onset_label',           'sleep_diary', 'sleep_journal_onset_label',              'modules.sleep_diary.onset_label',         13),
  ('sj.awakenings_label',      'sleep_diary', 'sleep_journal_awakenings_label',         'modules.sleep_diary.awakenings_label',    14),
  ('sj.awakenings_dur_label',  'sleep_diary', 'sleep_journal_awakenings_duration_label','modules.sleep_diary.awakenings_duration_label', 15),
  ('sj.nightmares_label',      'sleep_diary', 'sleep_journal_nightmares_label',         'modules.sleep_diary.nightmares_label',    16),
  ('sj.quality_label',         'sleep_diary', 'sleep_journal_quality_label',            'modules.sleep_diary.quality_label',       17),
  ('sj.quality_missing_title', 'sleep_diary', 'sleep_journal_quality_missing_title',    'modules.sleep_diary.quality_missing',     18),
  ('sj.quality_missing_msg',   'sleep_diary', 'sleep_journal_quality_missing_msg',      'modules.sleep_diary.quality_missing_msg', 19),
  ('sj.efficiency_label',      'sleep_diary', 'sleep_journal_efficiency_label',         'modules.sleep_diary.sleep_efficiency',    20),
  ('sj.date_label',            'sleep_diary', 'sleep_journal_date_label',               'modules.sleep_diary.date_label',          21),
  ('sj.save_label',            'sleep_diary', 'sleep_journal_save_label',               'modules.sleep_diary.save_night',          22),
  ('sj.update_label',          'sleep_diary', 'sleep_journal_update_label',             'modules.sleep_diary.update_entry',        23),
  ('sj.delete_label',          'sleep_diary', 'sleep_journal_delete_label',             'modules.sleep_diary.delete_entry',        24),
  ('sj.delete_title',          'sleep_diary', 'sleep_journal_delete_title',             'modules.sleep_diary.delete_entry',        25),
  ('sj.notes_placeholder',     'sleep_diary', 'sleep_journal_notes_placeholder',        'modules.sleep_diary.notes_placeholder',   26),
  ('sj.month_summary',         'sleep_diary', 'sleep_journal_month_summary_title',      'modules.sleep_diary.month_summary',       27),
  ('sj.legend_title',          'sleep_diary', 'sleep_journal_legend_title',             'modules.sleep_diary.legend',              28),
  ('sj.legend_good',           'sleep_diary', 'sleep_journal_legend_good_label',        'modules.sleep_diary.legend_good',         29),
  ('sj.legend_average',        'sleep_diary', 'sleep_journal_legend_average_label',     'modules.sleep_diary.legend_average',      30),
  ('sj.legend_bad',            'sleep_diary', 'sleep_journal_legend_bad_label',         'modules.sleep_diary.legend_bad',          31),
  ('sj.legend_empty',          'sleep_diary', 'sleep_journal_legend_empty_label',       'modules.sleep_diary.legend_empty',        32),
  ('sj.legend_nightmare',      'sleep_diary', 'sleep_journal_legend_nightmare_label',   'modules.sleep_diary.legend_nightmare',    33),
  ('sj.stat_avg_duration',     'sleep_diary', 'sleep_journal_stat_avg_duration_label',  'modules.sleep_diary.stat_avg_duration',   34),
  ('sj.stat_avg_awakenings',   'sleep_diary', 'sleep_journal_stat_avg_awakenings_label','modules.sleep_diary.stat_avg_awakenings', 35),
  ('sj.stat_nights_filled',    'sleep_diary', 'sleep_journal_stat_nights_filled_label', 'modules.sleep_diary.stat_nights_filled',  36),
  ('sj.stat_nightmares',       'sleep_diary', 'sleep_journal_stat_nightmares_label',    'modules.sleep_diary.stat_nightmares',     37),
  ('sj.minutes_unit',          'sleep_diary', 'sleep_journal_minutes_unit',             'modules.sleep_diary.minutes_unit',        38),
  ('sj.tap_to_modify',         'sleep_diary', 'sleep_journal_tap_to_modify_hint',       'modules.sleep_diary.tap_to_modify',       39),
  ('sj.confirm_label',         'sleep_diary', 'sleep_journal_confirm_label',            'modules.sleep_diary.confirm_label',       40),
  ('sj.back_label',            'sleep_diary', 'sleep_journal_back_label',               'modules.sleep_diary.back_btn',            41),
  ('sj.quality_label_1',       'sleep_diary', 'sleep_journal_quality_label_1',          'modules.sleep_diary.quality_very_bad',    42),
  ('sj.quality_label_2',       'sleep_diary', 'sleep_journal_quality_label_2',          'modules.sleep_diary.quality_bad',         43),
  ('sj.quality_label_3',       'sleep_diary', 'sleep_journal_quality_label_3',          'modules.sleep_diary.quality_average',     44),
  ('sj.quality_label_4',       'sleep_diary', 'sleep_journal_quality_label_4',          'modules.sleep_diary.quality_good',        45),
  ('sj.quality_label_5',       'sleep_diary', 'sleep_journal_quality_label_5',          'modules.sleep_diary.quality_excellent',   46)
on conflict (id) do nothing;

insert into public.field_props (field_id, prop_key, prop_value) values
  ('sj.cfg', 'history_days',                '14'),
  ('sj.cfg', 'awakenings_max',              '20'),
  ('sj.cfg', 'onset_max_minutes',           '180'),
  ('sj.cfg', 'awak_duration_max_minutes',   '300'),
  ('sj.cfg', 'efficiency_good',             '85'),
  ('sj.cfg', 'efficiency_warning',          '70'),
  ('sj.cfg', 'quality_max',                 '5'),
  ('sj.cfg', 'quality_good_threshold',      '4'),
  ('sj.cfg', 'quality_avg_threshold',       '3')
on conflict (field_id, prop_key) do nothing;


-- ============================================================
-- LAYOUT : behavioral_activation → activity_log
-- preview_kind = 'activity_log' → ActivityLogLayout
-- 3 modes : list | entry | month
-- ============================================================

delete from public.field_props
where field_id in ('ba.field_1','ba.field_2','ba.field_3','ba.field_4','ba.field_5','ba.field_6');
delete from public.module_content_fields where module_id = 'behavioral_activation';

update public.modules set preview_kind = 'activity_log' where id = 'behavioral_activation';

insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order) values
  ('al.cfg',                'behavioral_activation', 'activity_log_config',                  null,                                                  0),
  ('al.tab_list',           'behavioral_activation', 'activity_log_tab_list_label',          'modules.behavioral_activation.tab_list',              1),
  ('al.tab_month',          'behavioral_activation', 'activity_log_tab_month_label',         'modules.behavioral_activation.tab_month',             2),
  ('al.add_btn',            'behavioral_activation', 'activity_log_add_btn',                 'modules.behavioral_activation.add_btn',               3),
  ('al.empty_title',        'behavioral_activation', 'activity_log_empty_title',             'modules.behavioral_activation.empty_title',           4),
  ('al.empty_text',         'behavioral_activation', 'activity_log_empty_text',              'modules.behavioral_activation.empty_text',            5),
  ('al.section_activity',   'behavioral_activation', 'activity_log_section_activity_title',  'modules.behavioral_activation.section_activity',      10),
  ('al.section_evaluation', 'behavioral_activation', 'activity_log_section_evaluation_title','modules.behavioral_activation.section_evaluation',    11),
  ('al.section_notes',      'behavioral_activation', 'activity_log_section_notes_title',     'modules.behavioral_activation.section_notes',         12),
  ('al.activity_placeholder','behavioral_activation','activity_log_activity_placeholder',    'modules.behavioral_activation.activity_placeholder',  13),
  ('al.pleasure_label',     'behavioral_activation', 'activity_log_pleasure_label',          'modules.behavioral_activation.pleasure_label',        14),
  ('al.pleasure_sublabel',  'behavioral_activation', 'activity_log_pleasure_sublabel',       'modules.behavioral_activation.pleasure_sublabel',     15),
  ('al.mastery_label',      'behavioral_activation', 'activity_log_mastery_label',           'modules.behavioral_activation.mastery_label',         16),
  ('al.mastery_sublabel',   'behavioral_activation', 'activity_log_mastery_sublabel',        'modules.behavioral_activation.mastery_sublabel',      17),
  ('al.done_label',         'behavioral_activation', 'activity_log_done_label',              'modules.behavioral_activation.done_label',            18),
  ('al.mark_done',          'behavioral_activation', 'activity_log_mark_done_label',         'modules.behavioral_activation.mark_done',             19),
  ('al.mark_undone',        'behavioral_activation', 'activity_log_mark_undone_label',       'modules.behavioral_activation.mark_undone',           20),
  ('al.notes_placeholder',  'behavioral_activation', 'activity_log_notes_placeholder',       'common.notes_placeholder',                            21),
  ('al.date_label',         'behavioral_activation', 'activity_log_date_label',              'modules.behavioral_activation.date_label',            22),
  ('al.date_confirm',       'behavioral_activation', 'activity_log_date_confirm_label',      'modules.behavioral_activation.date_confirm',          23),
  ('al.save_label',         'behavioral_activation', 'activity_log_save_label',              'modules.behavioral_activation.save',                  30),
  ('al.update_label',       'behavioral_activation', 'activity_log_update_label',            'common.update',                                       31),
  ('al.delete_label',       'behavioral_activation', 'activity_log_delete_label',            'common.delete',                                       32),
  ('al.delete_title',       'behavioral_activation', 'activity_log_delete_title',            'modules.behavioral_activation.delete_activity_title', 33),
  ('al.name_missing_title', 'behavioral_activation', 'activity_log_name_missing_title',      'modules.behavioral_activation.name_missing',          34),
  ('al.name_missing_msg',   'behavioral_activation', 'activity_log_name_missing_msg',        'modules.behavioral_activation.name_missing_msg',      35),
  ('al.legend_done',        'behavioral_activation', 'activity_log_legend_done_label',       'modules.behavioral_activation.legend_done',           40),
  ('al.legend_planned',     'behavioral_activation', 'activity_log_legend_planned_label',    'modules.behavioral_activation.legend_planned',        41),
  ('al.month_hint_tap',     'behavioral_activation', 'activity_log_month_hint_tap',          'modules.behavioral_activation.month_hint_tap',        42),
  ('al.month_hint_empty',   'behavioral_activation', 'activity_log_month_hint_empty',        'modules.behavioral_activation.month_hint_empty',      43),
  ('al.back_label',         'behavioral_activation', 'activity_log_back_label',              'modules.behavioral_activation.back_btn',              44),
  ('al.sug_walk',           'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_walk',       100),
  ('al.sug_groceries',      'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_groceries',  101),
  ('al.sug_gym',            'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_gym',        102),
  ('al.sug_bike',           'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_bike',       103),
  ('al.sug_yoga',           'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_yoga',       104),
  ('al.sug_meditation',     'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_meditation', 105),
  ('al.sug_reading',        'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_reading',    106),
  ('al.sug_cooking',        'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_cooking',    107),
  ('al.sug_call_friend',    'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_call_friend',108),
  ('al.sug_cafe',           'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_cafe',       109),
  ('al.sug_gardening',      'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_gardening',  110),
  ('al.sug_music',          'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_music',      111),
  ('al.sug_movie',          'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_movie',      112),
  ('al.sug_bath',           'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_bath',       113),
  ('al.sug_cleaning',       'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_cleaning',   114),
  ('al.sug_drawing',        'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_drawing',    115),
  ('al.sug_board_game',     'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_board_game', 116),
  ('al.sug_journal',        'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_journal',    117),
  ('al.sug_swimming',       'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_swimming',   118),
  ('al.sug_running',        'behavioral_activation', 'activity_log_suggestion',              'modules.behavioral_activation.suggestion_running',    119)
on conflict (id) do nothing;

insert into public.field_props (field_id, prop_key, prop_value) values
  ('al.cfg', 'engagement_event_type', 'SAVE_BEHAVIORAL_ACTIVATION'),
  ('al.cfg', 'pleasure_min',          '0'),
  ('al.cfg', 'pleasure_max',          '10'),
  ('al.cfg', 'pleasure_step',         '1'),
  ('al.cfg', 'mastery_min',           '0'),
  ('al.cfg', 'mastery_max',           '10'),
  ('al.cfg', 'mastery_step',          '1'),
  ('al.cfg', 'pleasure_color',        '#059669'),
  ('al.cfg', 'mastery_color',         '#4F46E5'),
  ('al.cfg', 'dot_done_color',        '#10B981'),
  ('al.cfg', 'dot_planned_color',     '#3B82F6'),
  ('al.cfg', 'locale',                'fr-FR')
on conflict (field_id, prop_key) do nothing;


-- ============================================================
-- LAYOUT : fear_thermometer → exposure_tracker
-- preview_kind = 'exposure_tracker' → ExposureTrackerLayout
-- 3 modes : list (avec tabs Saisies / Situations) | entry
-- ============================================================

delete from public.field_props
where field_id in ('ft.field_1','ft.field_2','ft.field_3','ft.field_4','ft.field_5');
delete from public.module_content_fields where module_id = 'fear_thermometer';

update public.modules set preview_kind = 'exposure_tracker' where id = 'fear_thermometer';

insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order) values
  ('et.cfg',                   'fear_thermometer', 'exposure_tracker_config',                   null,                                                  0),
  ('et.tab_entries',           'fear_thermometer', 'exposure_tracker_tab_entries_label',        'modules.fear_thermometer.tab_entries',                1),
  ('et.tab_situations',        'fear_thermometer', 'exposure_tracker_tab_situations_label',     'modules.fear_thermometer.tab_situations',             2),
  ('et.add_btn',               'fear_thermometer', 'exposure_tracker_add_btn',                  'modules.fear_thermometer.new_entry',                  3),
  ('et.empty_title',           'fear_thermometer', 'exposure_tracker_empty_title',              'modules.fear_thermometer.empty_title',                4),
  ('et.empty_text',            'fear_thermometer', 'exposure_tracker_empty_text',               'modules.fear_thermometer.empty_text',                 5),
  ('et.section_trigger',       'fear_thermometer', 'exposure_tracker_section_trigger_title',    'modules.fear_thermometer.section_trigger',            10),
  ('et.section_before',        'fear_thermometer', 'exposure_tracker_section_before_title',     'modules.fear_thermometer.section_before',             11),
  ('et.section_strategies',    'fear_thermometer', 'exposure_tracker_section_strategies_title', 'modules.fear_thermometer.section_strategies',         12),
  ('et.section_after',         'fear_thermometer', 'exposure_tracker_section_after_title',      'modules.fear_thermometer.section_after',              13),
  ('et.section_notes',         'fear_thermometer', 'exposure_tracker_section_notes_title',      'modules.fear_thermometer.section_notes',              14),
  ('et.sit_mode_catalogue',    'fear_thermometer', 'exposure_tracker_situation_mode_catalogue', 'modules.fear_thermometer.situation_mode_catalogue',   20),
  ('et.sit_mode_free',         'fear_thermometer', 'exposure_tracker_situation_mode_free',      'modules.fear_thermometer.situation_mode_free',        21),
  ('et.sit_free_ph',           'fear_thermometer', 'exposure_tracker_situation_free_placeholder','modules.fear_thermometer.situation_free_placeholder',22),
  ('et.sit_cat_empty',         'fear_thermometer', 'exposure_tracker_situation_catalogue_empty','modules.fear_thermometer.situation_catalogue_empty',  23),
  ('et.suds_before_label',     'fear_thermometer', 'exposure_tracker_suds_before_label',        'modules.fear_thermometer.suds_before',                30),
  ('et.suds_before_hint',      'fear_thermometer', 'exposure_tracker_suds_before_hint',         'modules.fear_thermometer.suds_hint_before',           31),
  ('et.suds_after_label',      'fear_thermometer', 'exposure_tracker_suds_after_label',         'modules.fear_thermometer.suds_after',                 32),
  ('et.suds_after_hint',       'fear_thermometer', 'exposure_tracker_suds_after_hint',          'modules.fear_thermometer.suds_hint_after',            33),
  ('et.suds_skip_null',        'fear_thermometer', 'exposure_tracker_suds_skip_null',           'modules.fear_thermometer.suds_skip_null',             34),
  ('et.suds_skip_later',       'fear_thermometer', 'exposure_tracker_suds_skip_later',          'modules.fear_thermometer.suds_skip_later',            35),
  ('et.strategies_hint',       'fear_thermometer', 'exposure_tracker_strategies_hint',          'modules.fear_thermometer.strategies_hint',            40),
  ('et.strategy_custom_ph',    'fear_thermometer', 'exposure_tracker_strategy_custom_placeholder','modules.fear_thermometer.strategy_custom_placeholder',41),
  ('et.notes_placeholder',     'fear_thermometer', 'exposure_tracker_notes_placeholder',        'modules.fear_thermometer.notes_placeholder',          50),
  ('et.save_label',            'fear_thermometer', 'exposure_tracker_save_label',               'modules.fear_thermometer.save',                       60),
  ('et.update_label',          'fear_thermometer', 'exposure_tracker_update_label',             'common.update',                                       61),
  ('et.delete_label',          'fear_thermometer', 'exposure_tracker_delete_label',             'common.delete',                                       62),
  ('et.back_label',            'fear_thermometer', 'exposure_tracker_back_label',               'common.back',                                         63),
  ('et.sit_missing_title',     'fear_thermometer', 'exposure_tracker_situation_missing_title',  'modules.fear_thermometer.situation_missing',          70),
  ('et.sit_missing_msg',       'fear_thermometer', 'exposure_tracker_situation_missing_msg',    'modules.fear_thermometer.situation_missing_msg',      71),
  ('et.delete_entry_title',    'fear_thermometer', 'exposure_tracker_delete_entry_title',       'modules.fear_thermometer.delete_entry_title',         72),
  ('et.sit_delete_title',      'fear_thermometer', 'exposure_tracker_situation_delete_title',   'modules.fear_thermometer.delete_situation_title',     73),
  ('et.panel_title',           'fear_thermometer', 'exposure_tracker_situations_panel_title',   'modules.fear_thermometer.situations_title',           80),
  ('et.panel_hint',            'fear_thermometer', 'exposure_tracker_situations_panel_hint',    'modules.fear_thermometer.situations_hint',            81),
  ('et.sit_placeholder',       'fear_thermometer', 'exposure_tracker_situation_placeholder',    'modules.fear_thermometer.situation_placeholder',      82),
  ('et.sit_empty',             'fear_thermometer', 'exposure_tracker_situation_empty',          'modules.fear_thermometer.situation_empty',            83),
  ('et.strategy_breathing',    'fear_thermometer', 'exposure_tracker_strategy',                 'modules.fear_thermometer.strategy_breathing',         100),
  ('et.strategy_grounding',    'fear_thermometer', 'exposure_tracker_strategy',                 'modules.fear_thermometer.strategy_grounding',         101),
  ('et.strategy_movement',     'fear_thermometer', 'exposure_tracker_strategy',                 'modules.fear_thermometer.strategy_movement',          102),
  ('et.strategy_exposure',     'fear_thermometer', 'exposure_tracker_strategy',                 'modules.fear_thermometer.strategy_exposure',          103),
  ('et.strategy_distraction',  'fear_thermometer', 'exposure_tracker_strategy',                 'modules.fear_thermometer.strategy_distraction',       104),
  ('et.strategy_contact',      'fear_thermometer', 'exposure_tracker_strategy',                 'modules.fear_thermometer.strategy_contact',           105)
on conflict (id) do nothing;

insert into public.field_props (field_id, prop_key, prop_value) values
  ('et.cfg', 'engagement_event_type', 'SAVE_FEAR_ENTRY'),
  ('et.cfg', 'suds_min',              '0'),
  ('et.cfg', 'suds_max',              '100'),
  ('et.cfg', 'suds_step',             '10'),
  ('et.cfg', 'suds_default_before',   '50'),
  ('et.cfg', 'suds_before_color',     '#EF4444'),
  ('et.cfg', 'suds_after_color',      '#059669')
on conflict (field_id, prop_key) do nothing;


-- ============================================================
-- LAYOUT : decisional_balance → decision_grid
-- preview_kind = 'decision_grid' → DecisionGridLayout
-- Grille 2×2 + items pondérés (1–5 étoiles) + jauge motivation.
-- ============================================================

delete from public.field_props where field_id in (
  'db.cfg','db.q1.h','db.q2.h','db.q3.h','db.q4.h',
  'db.target_label','db.target_placeholder','db.save_label','db.saved_message',
  'db.gauge_title','db.gauge_change_label','db.gauge_status_label',
  'db.add_label','db.arg_placeholder','db.weight_label','db.delete_title'
);
delete from public.module_content_fields where module_id = 'decisional_balance';

update public.modules set preview_kind = 'decision_grid' where id = 'decisional_balance';

insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order) values
  ('db.cfg',                 'decisional_balance', 'decision_grid_config',              null,                                                  0),
  ('db.target_label',        'decisional_balance', 'decision_grid_target_label',        'modules.decisional_balance.behavior_label',           1),
  ('db.target_placeholder',  'decisional_balance', 'decision_grid_target_placeholder',  'modules.decisional_balance.behavior_placeholder',     2),
  ('db.save_label',          'decisional_balance', 'decision_grid_save_label',          'modules.decisional_balance.save',                     3),
  ('db.saved_message',       'decisional_balance', 'decision_grid_saved_message',       'modules.decisional_balance.saved_message',            4),
  ('db.gauge_title',         'decisional_balance', 'decision_grid_gauge_title',         'modules.decisional_balance.gauge_title',              5),
  ('db.gauge_change_label',  'decisional_balance', 'decision_grid_gauge_change_label',  'modules.decisional_balance.gauge_label_change',       6),
  ('db.gauge_status_label',  'decisional_balance', 'decision_grid_gauge_status_label',  'modules.decisional_balance.gauge_label_status',       7),
  ('db.add_label',           'decisional_balance', 'decision_grid_add_label',           'modules.decisional_balance.add_trigger',              8),
  ('db.arg_placeholder',     'decisional_balance', 'decision_grid_arg_placeholder',     'modules.decisional_balance.arg_placeholder',          9),
  ('db.weight_label',        'decisional_balance', 'decision_grid_weight_label',        'modules.decisional_balance.weight_label',             10)
on conflict (id) do nothing;

insert into public.module_content_fields (id, module_id, field_type, text_code, section_id, sort_order) values
  ('db.q1.h', 'decisional_balance', 'column_header', 'modules.decisional_balance.quadrant_pros_change_title',  'pros_change',     10),
  ('db.q2.h', 'decisional_balance', 'column_header', 'modules.decisional_balance.quadrant_cons_change_title',  'cons_change',     20),
  ('db.q3.h', 'decisional_balance', 'column_header', 'modules.decisional_balance.quadrant_pros_status_title',  'pros_status_quo', 30),
  ('db.q4.h', 'decisional_balance', 'column_header', 'modules.decisional_balance.quadrant_cons_status_title',  'cons_status_quo', 40)
on conflict (id) do nothing;

insert into public.field_props (field_id, prop_key, prop_value) values
  ('db.cfg', 'engagement_event_type', 'UPDATE_DECISIONAL_BALANCE'),
  ('db.cfg', 'target_behavior_key',   'target_behavior'),
  ('db.cfg', 'weight_min',            '1'),
  ('db.cfg', 'weight_max',            '5'),
  ('db.cfg', 'weight_default',        '3'),
  ('db.cfg', 'gauge_fill_color',      '#EC4899'),
  ('db.q1.h', 'color',         '#059669'),
  ('db.q1.h', 'bg_color',      '#ECFDF5'),
  ('db.q1.h', 'icon',          'thumb-up-outline'),
  ('db.q1.h', 'subtitle_code', 'modules.decisional_balance.quadrant_pros_change_subtitle'),
  ('db.q1.h', 'gauge_role',    'change'),
  ('db.q2.h', 'color',         '#EA580C'),
  ('db.q2.h', 'bg_color',      '#FFF7ED'),
  ('db.q2.h', 'icon',          'thumb-down-outline'),
  ('db.q2.h', 'subtitle_code', 'modules.decisional_balance.quadrant_cons_change_subtitle'),
  ('db.q3.h', 'color',         '#2563EB'),
  ('db.q3.h', 'bg_color',      '#EFF6FF'),
  ('db.q3.h', 'icon',          'shield-check-outline'),
  ('db.q3.h', 'subtitle_code', 'modules.decisional_balance.quadrant_pros_status_subtitle'),
  ('db.q3.h', 'gauge_role',    'status_quo'),
  ('db.q4.h', 'color',         '#9333EA'),
  ('db.q4.h', 'bg_color',      '#FDF4FF'),
  ('db.q4.h', 'icon',          'alert-outline'),
  ('db.q4.h', 'subtitle_code', 'modules.decisional_balance.quadrant_cons_status_subtitle')
on conflict (field_id, prop_key) do nothing;


-- ============================================================
-- MIGRATION DATA : remplacer les icônes emoji par des noms lucide-react
-- (no-op si déjà appliqué — fonctionne en aval de tout INSERT précédent)
-- ============================================================

update public.field_props
set prop_value = case prop_value
  when '🌙'   then 'moon'
  when '😴'   then 'moon'
  when '☀️'  then 'sun'
  when '⭐'   then 'star'
  when '🔔'   then 'bell'
  when '⏱️'  then 'timer'
  when '⏳'   then 'hourglass'
  when '📅'   then 'calendar'
  when '📝'   then 'pen-line'
  when '✅'   then 'check-circle'
  when '🏃'   then 'activity'
  when '🌡️' then 'thermometer'
  when '📍'   then 'map-pin'
  when '🛠️' then 'wrench'
  when '○'    then 'circle'
  when '◑'    then 'circle-dashed'
  when '💙'   then 'heart'
  when '💓'   then 'heart'
  when '🔵'   then 'circle'
  when '🟠'   then 'circle'
  when '🟢'   then 'circle'
  when '🟣'   then 'circle'
  when '💧'   then 'droplet'
  when '🤝'   then 'handshake'
  when '🤢'   then 'alert-triangle'
  when '⚡'   then 'zap'
  when '🌿'   then 'leaf'
  when '😊'   then 'smile'
  when '😨'   then 'frown'
  else prop_value
end
where prop_key = 'icon';


-- ============================================================
-- BACKFILL : modules et contenus historiques (extraction depuis prod)
-- ============================================================
-- Sections produites par d'anciennes migrations remote (`add_module_content_schema`,
-- `nsi_module_fields`, `rim_patient_scenario_migration`, `crisis_plan_editable_steps`,
-- `mood_tracker_questionnaire_fields`, etc.) jamais réintégrées au seed.

-- ── Modules additionnels (échelles cliniques) ────────────────────────────────
insert into public.modules (id, category_id, preview_kind, sort_order, is_invite_excluded, icon, mobile_icon, color) values
  ('epds',  'assessments', 'questionnaire', 28, false, '', 'heart-pulse',            '#EC4899'),
  ('nsi',   'assessments', 'questionnaire', 60, false, '', 'weather-night',          '#7C3AED'),
  ('rcads', 'assessments', 'questionnaire', 70, false, '', 'clipboard-text-outline', '#6366F1')
on conflict (id) do nothing;

-- ── preview_kind ajustés en remote (pas d'override si déjà migré ailleurs) ───
update public.modules set preview_kind = 'editable_steps'    where id = 'crisis_plan'             and preview_kind = 'steps';
update public.modules set preview_kind = 'questionnaire'     where id = 'medication_side_effects' and preview_kind = 'fields';
update public.modules set preview_kind = 'questionnaire'     where id = 'mood_tracker'            and preview_kind = 'fields';
update public.modules set preview_kind = 'patient_scenario'  where id = 'rim'                     and preview_kind = 'coming_soon';
update public.modules set preview_kind = 'guided_exercise'   where id = 'grounding'               and preview_kind = 'coming_soon';
update public.modules set preview_kind = 'guided_exercise'   where id = 'cognitive_saturation'    and preview_kind = 'coming_soon';


-- ── module_content_fields : crisis_plan (editable_steps) ─────────────────────
insert into public.module_content_fields (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order) values
  ('crisis_plan.label', 'crisis_plan', NULL, NULL, 'module_label', 'module.crisis_plan.label', 0),
  ('crisis_plan.description', 'crisis_plan', NULL, NULL, 'module_description', 'module.crisis_plan.description', 1),
  ('crisis_plan.step_1.title', 'crisis_plan', 'step_1', NULL, 'step_title', 'modules.crisis_plan.step_1_title', 10),
  ('crisis_plan.step_1.hint', 'crisis_plan', 'step_1', NULL, 'step_hint', 'modules.crisis_plan.step_1_hint', 11),
  ('crisis_plan.step_2.title', 'crisis_plan', 'step_2', NULL, 'step_title', 'modules.crisis_plan.step_2_title', 20),
  ('crisis_plan.step_2.hint', 'crisis_plan', 'step_2', NULL, 'step_hint', 'modules.crisis_plan.step_2_hint', 21),
  ('crisis_plan.step_3.title', 'crisis_plan', 'step_3', NULL, 'step_title', 'modules.crisis_plan.step_3_title', 30),
  ('crisis_plan.step_3.hint', 'crisis_plan', 'step_3', NULL, 'step_hint', 'modules.crisis_plan.step_3_hint', 31),
  ('crisis_plan.step_4.title', 'crisis_plan', 'step_4', NULL, 'step_title', 'modules.crisis_plan.step_4_title', 40),
  ('crisis_plan.step_4.hint', 'crisis_plan', 'step_4', NULL, 'step_hint', 'modules.crisis_plan.step_4_hint', 41),
  ('crisis_plan.step_5.title', 'crisis_plan', 'step_5', NULL, 'step_title', 'modules.crisis_plan.step_5_title', 50),
  ('crisis_plan.step_5.hint', 'crisis_plan', 'step_5', NULL, 'step_hint', 'modules.crisis_plan.step_5_hint', 51),
  ('crisis_plan.step_6.title', 'crisis_plan', 'step_6', NULL, 'step_title', 'modules.crisis_plan.step_6_title', 60),
  ('crisis_plan.step_6.hint', 'crisis_plan', 'step_6', NULL, 'step_hint', 'modules.crisis_plan.step_6_hint', 61),
  ('crisis_plan.footer', 'crisis_plan', NULL, NULL, 'footer_note', 'module.crisis_plan.footer', 99),
  ('crisis_plan.emergency_15', 'crisis_plan', NULL, NULL, 'exercise_safety', 'modules.crisis_plan.emergency_samu', 130),
  ('crisis_plan.emergency_3114', 'crisis_plan', NULL, NULL, 'exercise_safety', 'modules.crisis_plan.emergency_3114', 140)
on conflict (id) do nothing;

-- ── module_content_fields : EPDS ─────────────────────────────────────────────
insert into public.module_content_fields (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order) values
  ('epds.instr1', 'epds', NULL, NULL, 'scale_instruction', 'modules.epds.instructions', 0),
  ('epds.q1', 'epds', NULL, NULL, 'scale_question', 'modules.epds.q1', 100),
  ('epds.q2', 'epds', NULL, NULL, 'scale_question', 'modules.epds.q2', 101),
  ('epds.q3', 'epds', NULL, NULL, 'scale_question', 'modules.epds.q3', 102),
  ('epds.q4', 'epds', NULL, NULL, 'scale_question', 'modules.epds.q4', 103),
  ('epds.q5', 'epds', NULL, NULL, 'scale_question', 'modules.epds.q5', 104),
  ('epds.q6', 'epds', NULL, NULL, 'scale_question', 'modules.epds.q6', 105),
  ('epds.q7', 'epds', NULL, NULL, 'scale_question', 'modules.epds.q7', 106),
  ('epds.q8', 'epds', NULL, NULL, 'scale_question', 'modules.epds.q8', 107),
  ('epds.q9', 'epds', NULL, NULL, 'scale_question', 'modules.epds.q9', 108),
  ('epds.q10', 'epds', NULL, NULL, 'scale_question', 'modules.epds.q10', 109),
  ('epds.footer', 'epds', NULL, NULL, 'footer_note', 'modules.epds.footer', 999)
on conflict (id) do nothing;

-- EPDS : options par question (parent_field_id = id de la question)
insert into public.module_content_fields (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order) values
  ('epds.q1.opt0', 'epds', NULL, 'epds.q1', 'scale_option', 'modules.epds.q1_opt0', 0),
  ('epds.q1.opt1', 'epds', NULL, 'epds.q1', 'scale_option', 'modules.epds.q1_opt1', 1),
  ('epds.q1.opt2', 'epds', NULL, 'epds.q1', 'scale_option', 'modules.epds.q1_opt2', 2),
  ('epds.q1.opt3', 'epds', NULL, 'epds.q1', 'scale_option', 'modules.epds.q1_opt3', 3),
  ('epds.q2.opt0', 'epds', NULL, 'epds.q2', 'scale_option', 'modules.epds.q2_opt0', 0),
  ('epds.q2.opt1', 'epds', NULL, 'epds.q2', 'scale_option', 'modules.epds.q2_opt1', 1),
  ('epds.q2.opt2', 'epds', NULL, 'epds.q2', 'scale_option', 'modules.epds.q2_opt2', 2),
  ('epds.q2.opt3', 'epds', NULL, 'epds.q2', 'scale_option', 'modules.epds.q2_opt3', 3),
  ('epds.q3.opt0', 'epds', NULL, 'epds.q3', 'scale_option', 'modules.epds.q3_opt0', 0),
  ('epds.q3.opt1', 'epds', NULL, 'epds.q3', 'scale_option', 'modules.epds.q3_opt1', 1),
  ('epds.q3.opt2', 'epds', NULL, 'epds.q3', 'scale_option', 'modules.epds.q3_opt2', 2),
  ('epds.q3.opt3', 'epds', NULL, 'epds.q3', 'scale_option', 'modules.epds.q3_opt3', 3),
  ('epds.q4.opt0', 'epds', NULL, 'epds.q4', 'scale_option', 'modules.epds.q4_opt0', 0),
  ('epds.q4.opt1', 'epds', NULL, 'epds.q4', 'scale_option', 'modules.epds.q4_opt1', 1),
  ('epds.q4.opt2', 'epds', NULL, 'epds.q4', 'scale_option', 'modules.epds.q4_opt2', 2),
  ('epds.q4.opt3', 'epds', NULL, 'epds.q4', 'scale_option', 'modules.epds.q4_opt3', 3),
  ('epds.q5.opt0', 'epds', NULL, 'epds.q5', 'scale_option', 'modules.epds.q5_opt0', 0),
  ('epds.q5.opt1', 'epds', NULL, 'epds.q5', 'scale_option', 'modules.epds.q5_opt1', 1),
  ('epds.q5.opt2', 'epds', NULL, 'epds.q5', 'scale_option', 'modules.epds.q5_opt2', 2),
  ('epds.q5.opt3', 'epds', NULL, 'epds.q5', 'scale_option', 'modules.epds.q5_opt3', 3),
  ('epds.q6.opt0', 'epds', NULL, 'epds.q6', 'scale_option', 'modules.epds.q6_opt0', 0),
  ('epds.q6.opt1', 'epds', NULL, 'epds.q6', 'scale_option', 'modules.epds.q6_opt1', 1),
  ('epds.q6.opt2', 'epds', NULL, 'epds.q6', 'scale_option', 'modules.epds.q6_opt2', 2),
  ('epds.q6.opt3', 'epds', NULL, 'epds.q6', 'scale_option', 'modules.epds.q6_opt3', 3),
  ('epds.q7.opt0', 'epds', NULL, 'epds.q7', 'scale_option', 'modules.epds.q7_opt0', 0),
  ('epds.q7.opt1', 'epds', NULL, 'epds.q7', 'scale_option', 'modules.epds.q7_opt1', 1),
  ('epds.q7.opt2', 'epds', NULL, 'epds.q7', 'scale_option', 'modules.epds.q7_opt2', 2),
  ('epds.q7.opt3', 'epds', NULL, 'epds.q7', 'scale_option', 'modules.epds.q7_opt3', 3),
  ('epds.q8.opt0', 'epds', NULL, 'epds.q8', 'scale_option', 'modules.epds.q8_opt0', 0),
  ('epds.q8.opt1', 'epds', NULL, 'epds.q8', 'scale_option', 'modules.epds.q8_opt1', 1),
  ('epds.q8.opt2', 'epds', NULL, 'epds.q8', 'scale_option', 'modules.epds.q8_opt2', 2),
  ('epds.q8.opt3', 'epds', NULL, 'epds.q8', 'scale_option', 'modules.epds.q8_opt3', 3),
  ('epds.q9.opt0', 'epds', NULL, 'epds.q9', 'scale_option', 'modules.epds.q9_opt0', 0),
  ('epds.q9.opt1', 'epds', NULL, 'epds.q9', 'scale_option', 'modules.epds.q9_opt1', 1),
  ('epds.q9.opt2', 'epds', NULL, 'epds.q9', 'scale_option', 'modules.epds.q9_opt2', 2),
  ('epds.q9.opt3', 'epds', NULL, 'epds.q9', 'scale_option', 'modules.epds.q9_opt3', 3),
  ('epds.q10.opt0', 'epds', NULL, 'epds.q10', 'scale_option', 'modules.epds.q10_opt0', 0),
  ('epds.q10.opt1', 'epds', NULL, 'epds.q10', 'scale_option', 'modules.epds.q10_opt1', 1),
  ('epds.q10.opt2', 'epds', NULL, 'epds.q10', 'scale_option', 'modules.epds.q10_opt2', 2),
  ('epds.q10.opt3', 'epds', NULL, 'epds.q10', 'scale_option', 'modules.epds.q10_opt3', 3)
on conflict (id) do nothing;

-- ── module_content_fields : grounding (guided_exercise) ──────────────────────
insert into public.module_content_fields (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order) values
  ('gr.label', 'grounding', NULL, NULL, 'module_label', 'module.grounding.label', 0),
  ('gr.desc', 'grounding', NULL, NULL, 'module_description', 'module.grounding.description', 1),
  ('gr.title', 'grounding', NULL, NULL, 'exercise_title', 'modules.grounding.technique_title', 2),
  ('gr.intro1', 'grounding', NULL, NULL, 'exercise_intro', 'modules.grounding.intro_text_1', 3),
  ('gr.intro2', 'grounding', NULL, NULL, 'exercise_intro', 'modules.grounding.intro_text_2', 4),
  ('gr.start_btn', 'grounding', NULL, NULL, 'exercise_start_btn', 'modules.grounding.start_btn', 5),
  ('gr.next_btn', 'grounding', NULL, NULL, 'exercise_next_btn', 'modules.grounding.next_step', 6),
  ('gr.finish_btn', 'grounding', NULL, NULL, 'exercise_finish_btn', 'modules.grounding.finish', 7),
  ('gr.stop_btn', 'grounding', NULL, NULL, 'exercise_stop_btn', 'modules.grounding.stop_btn', 8),
  ('gr.done_text', 'grounding', NULL, NULL, 'exercise_done_text', 'modules.grounding.done_text', 9),
  ('gr.safety_title', 'grounding', NULL, NULL, 'exercise_safety_title', 'modules.grounding.safety_title', 10),
  ('gr.safety_3114', 'grounding', NULL, NULL, 'exercise_safety', 'modules.grounding.safety_3114', 11),
  ('gr.safety_15', 'grounding', NULL, NULL, 'exercise_safety', 'modules.grounding.safety_15', 12),
  ('gr.footer', 'grounding', NULL, NULL, 'footer_note', 'modules.grounding.clinical_note', 13),
  ('gr.see.title', 'grounding', 'gr.sec_see', NULL, 'step_title', 'modules.grounding.step_see_sense', 101),
  ('gr.see.instr', 'grounding', 'gr.sec_see', NULL, 'step_hint', 'modules.grounding.step_see_instruction', 102),
  ('gr.see.tip', 'grounding', 'gr.sec_see', NULL, 'step_hint', 'modules.grounding.step_see_tip', 103),
  ('gr.touch.title', 'grounding', 'gr.sec_touch', NULL, 'step_title', 'modules.grounding.step_touch_sense', 201),
  ('gr.touch.instr', 'grounding', 'gr.sec_touch', NULL, 'step_hint', 'modules.grounding.step_touch_instruction', 202),
  ('gr.touch.tip', 'grounding', 'gr.sec_touch', NULL, 'step_hint', 'modules.grounding.step_touch_tip', 203),
  ('gr.hear.title', 'grounding', 'gr.sec_hear', NULL, 'step_title', 'modules.grounding.step_hear_sense', 301),
  ('gr.hear.instr', 'grounding', 'gr.sec_hear', NULL, 'step_hint', 'modules.grounding.step_hear_instruction', 302),
  ('gr.hear.tip', 'grounding', 'gr.sec_hear', NULL, 'step_hint', 'modules.grounding.step_hear_tip', 303),
  ('gr.smell.title', 'grounding', 'gr.sec_smell', NULL, 'step_title', 'modules.grounding.step_smell_sense', 401),
  ('gr.smell.instr', 'grounding', 'gr.sec_smell', NULL, 'step_hint', 'modules.grounding.step_smell_instruction', 402),
  ('gr.smell.tip', 'grounding', 'gr.sec_smell', NULL, 'step_hint', 'modules.grounding.step_smell_tip', 403),
  ('gr.taste.title', 'grounding', 'gr.sec_taste', NULL, 'step_title', 'modules.grounding.step_taste_sense', 501),
  ('gr.taste.instr', 'grounding', 'gr.sec_taste', NULL, 'step_hint', 'modules.grounding.step_taste_instruction', 502),
  ('gr.taste.tip', 'grounding', 'gr.sec_taste', NULL, 'step_hint', 'modules.grounding.step_taste_tip', 503)
on conflict (id) do nothing;

-- ── module_content_fields : NSI ──────────────────────────────────────────────
insert into public.module_content_fields (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order) values
  ('nsi.instruction', 'nsi', NULL, NULL, 'scale_instruction', 'modules.nsi.instructions', 1),
  ('nsi.opt0', 'nsi', NULL, NULL, 'scale_option', 'modules.nsi.opt_0', 10),
  ('nsi.opt1', 'nsi', NULL, NULL, 'scale_option', 'modules.nsi.opt_1', 11),
  ('nsi.opt2', 'nsi', NULL, NULL, 'scale_option', 'modules.nsi.opt_2', 12),
  ('nsi.opt3', 'nsi', NULL, NULL, 'scale_option', 'modules.nsi.opt_3', 13),
  ('nsi.opt4', 'nsi', NULL, NULL, 'scale_option', 'modules.nsi.opt_4', 14),
  ('nsi.opt5', 'nsi', NULL, NULL, 'scale_option', 'modules.nsi.opt_5', 15),
  ('nsi.q1', 'nsi', NULL, NULL, 'scale_question', 'modules.nsi.q1', 20),
  ('nsi.q2', 'nsi', NULL, NULL, 'scale_question', 'modules.nsi.q2', 21),
  ('nsi.q3', 'nsi', NULL, NULL, 'scale_question', 'modules.nsi.q3', 22),
  ('nsi.q4', 'nsi', NULL, NULL, 'scale_question', 'modules.nsi.q4', 23),
  ('nsi.q5', 'nsi', NULL, NULL, 'scale_question', 'modules.nsi.q5', 24),
  ('nsi.q6', 'nsi', NULL, NULL, 'scale_question', 'modules.nsi.q6', 25),
  ('nsi.q7', 'nsi', NULL, NULL, 'scale_question', 'modules.nsi.q7', 26),
  ('nsi.q8', 'nsi', NULL, NULL, 'scale_question', 'modules.nsi.q8', 27),
  ('nsi.q9', 'nsi', NULL, NULL, 'scale_question', 'modules.nsi.q9', 28),
  ('nsi.pct_recurrent', 'nsi', NULL, NULL, 'scale_number_input', 'modules.nsi.pct_question', 30),
  ('nsi.theme_1', 'nsi', NULL, NULL, 'scale_text_input', 'modules.nsi.themes_question', 31),
  ('nsi.theme_2', 'nsi', NULL, NULL, 'scale_text_input', '', 32),
  ('nsi.theme_3', 'nsi', NULL, NULL, 'scale_text_input', '', 33),
  ('nsi.footer', 'nsi', NULL, NULL, 'footer_note', 'modules.nsi.footer', 99)
on conflict (id) do nothing;

-- ── module_content_fields : RCADS ────────────────────────────────────────────
insert into public.module_content_fields (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order) values
  ('rcads.instr', 'rcads', NULL, NULL, 'scale_instruction', 'modules.rcads.instructions', 0),
  ('rcads.opt0', 'rcads', NULL, NULL, 'scale_option', 'modules.rcads.opt_0', 10),
  ('rcads.opt1', 'rcads', NULL, NULL, 'scale_option', 'modules.rcads.opt_1', 11),
  ('rcads.opt2', 'rcads', NULL, NULL, 'scale_option', 'modules.rcads.opt_2', 12),
  ('rcads.opt3', 'rcads', NULL, NULL, 'scale_option', 'modules.rcads.opt_3', 13),
  ('rcads.q1', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q1', 101),
  ('rcads.q2', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q2', 102),
  ('rcads.q3', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q3', 103),
  ('rcads.q4', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q4', 104),
  ('rcads.q5', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q5', 105),
  ('rcads.q6', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q6', 106),
  ('rcads.q7', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q7', 107),
  ('rcads.q8', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q8', 108),
  ('rcads.q9', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q9', 109),
  ('rcads.q10', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q10', 110),
  ('rcads.q11', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q11', 111),
  ('rcads.q12', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q12', 112),
  ('rcads.q13', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q13', 113),
  ('rcads.q14', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q14', 114),
  ('rcads.q15', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q15', 115),
  ('rcads.q16', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q16', 116),
  ('rcads.q17', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q17', 117),
  ('rcads.q18', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q18', 118),
  ('rcads.q19', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q19', 119),
  ('rcads.q20', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q20', 120),
  ('rcads.q21', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q21', 121),
  ('rcads.q22', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q22', 122),
  ('rcads.q23', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q23', 123),
  ('rcads.q24', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q24', 124),
  ('rcads.q25', 'rcads', NULL, NULL, 'scale_question', 'modules.rcads.q25', 125),
  ('rcads.footer', 'rcads', NULL, NULL, 'footer_note', 'modules.rcads.footer', 999)
on conflict (id) do nothing;

-- ── module_content_fields : RIM (patient_scenario) ───────────────────────────
insert into public.module_content_fields (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order) values
  ('rim.disclaimer', 'rim', NULL, NULL, 'rim_disclaimer', 'modules.rim.disclaimer', 10),
  ('rim.step_1', 'rim', NULL, NULL, 'rim_step', 'modules.rim.protocol_step_1', 20),
  ('rim.step_2', 'rim', NULL, NULL, 'rim_step', 'modules.rim.protocol_step_2', 30),
  ('rim.step_3', 'rim', NULL, NULL, 'rim_step', 'modules.rim.protocol_step_3', 40),
  ('rim.step_4', 'rim', NULL, NULL, 'rim_step', 'modules.rim.protocol_step_4', 50),
  ('rim.step_5', 'rim', NULL, NULL, 'rim_step', 'modules.rim.protocol_step_5', 60),
  ('rim.sound_rain', 'rim', NULL, NULL, 'ambient_sound', 'modules.rim.sound_rain', 70),
  ('rim.sound_waves', 'rim', NULL, NULL, 'ambient_sound', 'modules.rim.sound_waves', 80),
  ('rim.sound_forest', 'rim', NULL, NULL, 'ambient_sound', 'modules.rim.sound_forest', 90),
  ('rim.sound_wind', 'rim', NULL, NULL, 'ambient_sound', 'modules.rim.sound_wind', 100),
  ('rim.sound_stream', 'rim', NULL, NULL, 'ambient_sound', 'modules.rim.sound_stream', 110),
  ('rim.safety_title', 'rim', NULL, NULL, 'exercise_safety_title', 'modules.rim.safety_title', 120),
  ('rim.safety_3114', 'rim', NULL, NULL, 'exercise_safety', 'modules.rim.safety_3114', 130),
  ('rim.safety_15', 'rim', NULL, NULL, 'exercise_safety', 'modules.rim.safety_15', 140)
on conflict (id) do nothing;

-- ── module_content_fields : mood_tracker (questionnaire avec sliders) ────────
insert into public.module_content_fields (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order) values
  ('mood_tracker.instruction', 'mood_tracker', NULL, NULL, 'scale_instruction', 'modules.mood_tracker.instructions', 10),
  ('mood_tracker.q_mood', 'mood_tracker', NULL, NULL, 'scale_slider_question', 'modules.mood_tracker.dim_mood', 20),
  ('mood_tracker.q_energy', 'mood_tracker', NULL, NULL, 'scale_slider_question', 'modules.mood_tracker.dim_energy', 30),
  ('mood_tracker.q_anxiety', 'mood_tracker', NULL, NULL, 'scale_slider_question', 'modules.mood_tracker.dim_anxiety', 40),
  ('mood_tracker.q_pleasure', 'mood_tracker', NULL, NULL, 'scale_slider_question', 'modules.mood_tracker.dim_pleasure', 50),
  ('mood_tracker.notes', 'mood_tracker', NULL, NULL, 'scale_text_input', 'modules.mood_tracker.notes_label', 60),
  ('mood_tracker.footer', 'mood_tracker', NULL, NULL, 'footer_note', 'modules.mood_tracker.footer', 99)
on conflict (id) do nothing;

-- ── module_content_fields : medication_side_effects (questionnaire) ──────────
insert into public.module_content_fields (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order) values
  ('mse.instr1', 'medication_side_effects', NULL, NULL, 'scale_instruction', 'modules.medication_side_effects.scale_info', 0),
  ('mse.opt0', 'medication_side_effects', NULL, NULL, 'scale_option', 'modules.medication_side_effects.scale_absent', 10),
  ('mse.opt1', 'medication_side_effects', NULL, NULL, 'scale_option', 'modules.medication_side_effects.scale_mild', 11),
  ('mse.opt2', 'medication_side_effects', NULL, NULL, 'scale_option', 'modules.medication_side_effects.scale_moderate', 12),
  ('mse.opt3', 'medication_side_effects', NULL, NULL, 'scale_option', 'modules.medication_side_effects.scale_severe', 13),
  ('mse.q1', 'medication_side_effects', NULL, NULL, 'scale_question', 'modules.medication_side_effects.effect_sedation_label', 100),
  ('mse.q2', 'medication_side_effects', NULL, NULL, 'scale_question', 'modules.medication_side_effects.effect_akathisia_label', 101),
  ('mse.q3', 'medication_side_effects', NULL, NULL, 'scale_question', 'modules.medication_side_effects.effect_tremors_label', 102),
  ('mse.q4', 'medication_side_effects', NULL, NULL, 'scale_question', 'modules.medication_side_effects.effect_dry_mouth_label', 103),
  ('mse.q5', 'medication_side_effects', NULL, NULL, 'scale_question', 'modules.medication_side_effects.effect_sleep_label', 104),
  ('mse.q6', 'medication_side_effects', NULL, NULL, 'scale_question', 'modules.medication_side_effects.effect_nausea_label', 105),
  ('mse.footer', 'medication_side_effects', NULL, NULL, 'footer_note', 'modules.medication_side_effects.footer', 999)
on conflict (id) do nothing;

-- ── module_content_fields : breathing_techniques (fields) ────────────────────
insert into public.module_content_fields (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order) values
  ('bt.label', 'breathing_techniques', NULL, NULL, 'module_label', 'module.breathing_techniques.label', 0),
  ('bt.description', 'breathing_techniques', NULL, NULL, 'module_description', 'module.breathing_techniques.description', 1),
  ('bt.field_1', 'breathing_techniques', NULL, NULL, 'field_row', 'module.breathing_techniques.field_1.label', 10),
  ('bt.field_2', 'breathing_techniques', NULL, NULL, 'field_row', 'module.breathing_techniques.field_2.label', 20),
  ('bt.field_3', 'breathing_techniques', NULL, NULL, 'field_row', 'module.breathing_techniques.field_3.label', 30),
  ('bt.field_4', 'breathing_techniques', NULL, NULL, 'field_row', 'module.breathing_techniques.field_4.label', 40),
  ('bt.field_5', 'breathing_techniques', NULL, NULL, 'field_row', 'module.breathing_techniques.field_5.label', 50),
  ('bt.field_6', 'breathing_techniques', NULL, NULL, 'field_row', 'module.breathing_techniques.field_6.label', 60),
  ('bt.footer', 'breathing_techniques', NULL, NULL, 'footer_note', 'module.breathing_techniques.footer', 99)
on conflict (id) do nothing;

-- ── module_content_fields : modules "coming_soon" (placeholders) ─────────────
insert into public.module_content_fields (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order) values
  ('chro.label',         'chronobiology_tracker',  NULL, NULL, 'module_label',       'module.chronobiology_tracker.label', 0),
  ('chro.desc',          'chronobiology_tracker',  NULL, NULL, 'module_description', 'module.chronobiology_tracker.description', 1),
  ('chro.soon',          'chronobiology_tracker',  NULL, NULL, 'coming_soon',        NULL, 99),
  ('cd.label',           'cognitive_distortions',  NULL, NULL, 'module_label',       'module.cognitive_distortions.label', 0),
  ('cd.desc',            'cognitive_distortions',  NULL, NULL, 'module_description', 'module.cognitive_distortions.description', 1),
  ('cd.soon',            'cognitive_distortions',  NULL, NULL, 'coming_soon',        NULL, 99),
  ('cs.label',           'cognitive_saturation',   NULL, NULL, 'module_label',       'module.cognitive_saturation.label', 0),
  ('cs.desc',            'cognitive_saturation',   NULL, NULL, 'module_description', 'module.cognitive_saturation.description', 1),
  ('cs.soon',            'cognitive_saturation',   NULL, NULL, 'coming_soon',        NULL, 99),
  ('cj.label',           'craving_journal',        NULL, NULL, 'module_label',       'module.craving_journal.label', 0),
  ('cj.desc',            'craving_journal',        NULL, NULL, 'module_description', 'module.craving_journal.description', 1),
  ('cj.soon',            'craving_journal',        NULL, NULL, 'coming_soon',        NULL, 99),
  ('dwp.label',          'diet_weight_psycho',     NULL, NULL, 'module_label',       'module.diet_weight_psycho.label', 0),
  ('dwp.desc',           'diet_weight_psycho',     NULL, NULL, 'module_description', 'module.diet_weight_psycho.description', 1),
  ('dwp.soon',           'diet_weight_psycho',     NULL, NULL, 'coming_soon',        NULL, 99),
  ('dt.label',           'distress_tolerance',     NULL, NULL, 'module_label',       'module.distress_tolerance.label', 0),
  ('dt.desc',            'distress_tolerance',     NULL, NULL, 'module_description', 'module.distress_tolerance.description', 1),
  ('dt.soon',            'distress_tolerance',     NULL, NULL, 'coming_soon',        NULL, 99),
  ('eh.label',           'exposure_hierarchy',     NULL, NULL, 'module_label',       'module.exposure_hierarchy.label', 0),
  ('eh.desc',            'exposure_hierarchy',     NULL, NULL, 'module_description', 'module.exposure_hierarchy.description', 1),
  ('eh.soon',            'exposure_hierarchy',     NULL, NULL, 'coming_soon',        NULL, 99),
  ('tc.label',           'therapeutic_commitment', NULL, NULL, 'module_label',       'module.therapeutic_commitment.label', 0),
  ('tc.desc',            'therapeutic_commitment', NULL, NULL, 'module_description', 'module.therapeutic_commitment.description', 1),
  ('tc.soon',            'therapeutic_commitment', NULL, NULL, 'coming_soon',        NULL, 99),
  ('mb.label',           'motivational_balance',   NULL, NULL, 'module_label',       'module.motivational_balance.label', 0),
  ('mb.desc',            'motivational_balance',   NULL, NULL, 'module_description', 'module.motivational_balance.description', 1)
on conflict (id) do nothing;


-- ── module_content_fields : psychoeducation — parents (cards + sections) ─────
insert into public.module_content_fields (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order) values
  ('psych.label', 'psychoeducation', NULL, NULL, 'module_label', 'module.psychoeducation.label', 0),
  ('app_card.title', 'psychoeducation', 'card_medication_appetite_01', NULL, 'card_title', 'card.appetite_01.title', 1),
  ('cbt_card.title', 'psychoeducation', 'card_cbt_01', NULL, 'card_title', 'card.cbt_01.title', 1),
  ('gr_card.title', 'psychoeducation', 'card_grounding_01', NULL, 'card_title', 'card.grounding_01.title', 1),
  ('lith_card.title', 'psychoeducation', 'card_medication_lithium_01', NULL, 'card_title', 'card.lithium_01.title', 1),
  ('psych.description', 'psychoeducation', NULL, NULL, 'module_description', 'module.psychoeducation.description', 1),
  ('sleep_card.title', 'psychoeducation', 'card_sleep_01', NULL, 'card_title', 'card.sleep_01.title', 1),
  ('app_card.summary', 'psychoeducation', 'card_medication_appetite_01', NULL, 'card_summary', 'card.appetite_01.summary', 2),
  ('cbt_card.summary', 'psychoeducation', 'card_cbt_01', NULL, 'card_summary', 'card.cbt_01.summary', 2),
  ('gr_card.summary', 'psychoeducation', 'card_grounding_01', NULL, 'card_summary', 'card.grounding_01.summary', 2),
  ('lith_card.summary', 'psychoeducation', 'card_medication_lithium_01', NULL, 'card_summary', 'card.lithium_01.summary', 2),
  ('sleep_card.summary', 'psychoeducation', 'card_sleep_01', NULL, 'card_summary', 'card.sleep_01.summary', 2),
  ('app_card.h_main', 'psychoeducation', 'card_medication_appetite_01', NULL, 'card_heading_2', 'card.appetite_01.h_main', 3),
  ('cbt_card.h_main', 'psychoeducation', 'card_cbt_01', NULL, 'card_heading_2', 'card.cbt_01.h_main', 3),
  ('gr_card.h_main', 'psychoeducation', 'card_grounding_01', NULL, 'card_heading_2', 'card.grounding_01.h_main', 3),
  ('lith_card.h_main', 'psychoeducation', 'card_medication_lithium_01', NULL, 'card_heading_2', 'card.lithium_01.h_main', 3),
  ('sleep_card.intro', 'psychoeducation', 'card_sleep_01', NULL, 'card_paragraph', 'card.sleep_01.intro', 3),
  ('app_card.intro', 'psychoeducation', 'card_medication_appetite_01', NULL, 'card_paragraph', NULL, 4),
  ('cbt_card.intro', 'psychoeducation', 'card_cbt_01', NULL, 'card_paragraph', 'card.cbt_01.intro', 4),
  ('gr_card.intro_1', 'psychoeducation', 'card_grounding_01', NULL, 'card_paragraph', NULL, 4),
  ('app_card.def_1', 'psychoeducation', 'card_medication_appetite_01', NULL, 'card_definition', 'card.appetite_01.def_1.term', 10),
  ('cbt_card.h_10', 'psychoeducation', 'card_cbt_01', NULL, 'card_heading_3', 'card.cbt_01.h_10', 10),
  ('gr_card.h_quand', 'psychoeducation', 'card_grounding_01', NULL, 'card_heading_3', 'card.grounding_01.h_quand', 10),
  ('lith_card.h_3regles', 'psychoeducation', 'card_medication_lithium_01', NULL, 'card_heading_3', 'card.lithium_01.h_3regles', 10),
  ('sleep_card.h_horaires', 'psychoeducation', 'card_sleep_01', NULL, 'card_heading_3', 'card.sleep_01.h_horaires', 10),
  ('cbt_card.d1.heading', 'psychoeducation', 'card_cbt_01', NULL, 'card_heading_4', 'card.cbt_01.d1.heading', 11),
  ('gr_card.li_q1', 'psychoeducation', 'card_grounding_01', NULL, 'card_list_item', 'card.grounding_01.li_q1', 11),
  ('lith_card.li_r1', 'psychoeducation', 'card_medication_lithium_01', NULL, 'card_numbered_item', 'card.lithium_01.li_r1', 11),
  ('sleep_card.p_horaires', 'psychoeducation', 'card_sleep_01', NULL, 'card_paragraph_bold', 'card.sleep_01.p_horaires', 11),
  ('cbt_card.d1.body', 'psychoeducation', 'card_cbt_01', NULL, 'card_paragraph', 'card.cbt_01.d1.body', 12),
  ('gr_card.li_q2', 'psychoeducation', 'card_grounding_01', NULL, 'card_list_item', 'card.grounding_01.li_q2', 12),
  ('lith_card.li_r2', 'psychoeducation', 'card_medication_lithium_01', NULL, 'card_numbered_item', 'card.lithium_01.li_r2', 12),
  ('cbt_card.d1.example', 'psychoeducation', 'card_cbt_01', NULL, 'card_italic_note', 'card.cbt_01.d1.example', 13),
  ('gr_card.li_q3', 'psychoeducation', 'card_grounding_01', NULL, 'card_list_item', 'card.grounding_01.li_q3', 13),
  ('lith_card.li_r3', 'psychoeducation', 'card_medication_lithium_01', NULL, 'card_numbered_item', 'card.lithium_01.li_r3', 13),
  ('gr_card.li_q4', 'psychoeducation', 'card_grounding_01', NULL, 'card_list_item', 'card.grounding_01.li_q4', 14),
  ('gr_card.divider_1', 'psychoeducation', 'card_grounding_01', NULL, 'card_divider', NULL, 19),
  ('app_card.def_2', 'psychoeducation', 'card_medication_appetite_01', NULL, 'card_definition', 'card.appetite_01.def_2.term', 20),
  ('cbt_card.d2.heading', 'psychoeducation', 'card_cbt_01', NULL, 'card_heading_4', 'card.cbt_01.d2.heading', 20),
  ('gr_card.h_comment', 'psychoeducation', 'card_grounding_01', NULL, 'card_heading_3', 'card.grounding_01.h_comment', 20),
  ('lith_card.h_eviter', 'psychoeducation', 'card_medication_lithium_01', NULL, 'card_heading_3', 'card.lithium_01.h_eviter', 20),
  ('sleep_card.h_lumiere', 'psychoeducation', 'card_sleep_01', NULL, 'card_heading_3', 'card.sleep_01.h_lumiere', 20),
  ('cbt_card.d2.body', 'psychoeducation', 'card_cbt_01', NULL, 'card_paragraph', 'card.cbt_01.d2.body', 21),
  ('gr_card.p_inspir', 'psychoeducation', 'card_grounding_01', NULL, 'card_paragraph_bold', 'card.grounding_01.p_inspir', 21),
  ('lith_card.li_e1', 'psychoeducation', 'card_medication_lithium_01', NULL, 'card_list_item', 'card.lithium_01.li_e1', 21),
  ('sleep_card.li_lumiere_1', 'psychoeducation', 'card_sleep_01', NULL, 'card_list_item', NULL, 21),
  ('cbt_card.d2.example', 'psychoeducation', 'card_cbt_01', NULL, 'card_italic_note', 'card.cbt_01.d2.example', 22),
  ('lith_card.li_e2', 'psychoeducation', 'card_medication_lithium_01', NULL, 'card_list_item', 'card.lithium_01.li_e2', 22),
  ('sleep_card.li_lumiere_2', 'psychoeducation', 'card_sleep_01', NULL, 'card_list_item', NULL, 22),
  ('sleep_card.li_lumiere_3', 'psychoeducation', 'card_sleep_01', NULL, 'card_list_item', 'card.sleep_01.li_lumiere_3', 23),
  ('lith_card.divider', 'psychoeducation', 'card_medication_lithium_01', NULL, 'card_divider', NULL, 29),
  ('app_card.def_3', 'psychoeducation', 'card_medication_appetite_01', NULL, 'card_definition', 'card.appetite_01.def_3.term', 30),
  ('cbt_card.d3.heading', 'psychoeducation', 'card_cbt_01', NULL, 'card_heading_4', 'card.cbt_01.d3.heading', 30),
  ('gr_card.h_5', 'psychoeducation', 'card_grounding_01', NULL, 'card_heading_4', 'card.grounding_01.h_5', 30),
  ('lith_card.callout', 'psychoeducation', 'card_medication_lithium_01', NULL, 'card_callout', 'card.lithium_01.callout', 30),
  ('sleep_card.h_temp', 'psychoeducation', 'card_sleep_01', NULL, 'card_heading_3', 'card.sleep_01.h_temp', 30),
  ('cbt_card.d3.body', 'psychoeducation', 'card_cbt_01', NULL, 'card_paragraph', 'card.cbt_01.d3.body', 31),
  ('gr_card.p_5', 'psychoeducation', 'card_grounding_01', NULL, 'card_paragraph', 'card.grounding_01.p_5', 31),
  ('sleep_card.p_temp', 'psychoeducation', 'card_sleep_01', NULL, 'card_paragraph', NULL, 31),
  ('lith_card.divider_2', 'psychoeducation', 'card_medication_lithium_01', NULL, 'card_divider', NULL, 39),
  ('app_card.def_4', 'psychoeducation', 'card_medication_appetite_01', NULL, 'card_definition', 'card.appetite_01.def_4.term', 40),
  ('cbt_card.d4.heading', 'psychoeducation', 'card_cbt_01', NULL, 'card_heading_4', 'card.cbt_01.d4.heading', 40),
  ('gr_card.h_4', 'psychoeducation', 'card_grounding_01', NULL, 'card_heading_4', 'card.grounding_01.h_4', 40),
  ('lith_card.note', 'psychoeducation', 'card_medication_lithium_01', NULL, 'card_italic_note', 'card.lithium_01.note', 40),
  ('sleep_card.h_alim', 'psychoeducation', 'card_sleep_01', NULL, 'card_heading_3', 'card.sleep_01.h_alim', 40),
  ('cbt_card.d4.body', 'psychoeducation', 'card_cbt_01', NULL, 'card_paragraph', 'card.cbt_01.d4.body', 41),
  ('gr_card.p_4', 'psychoeducation', 'card_grounding_01', NULL, 'card_paragraph', 'card.grounding_01.p_4', 41),
  ('sleep_card.li_alim_1', 'psychoeducation', 'card_sleep_01', NULL, 'card_list_item', NULL, 41),
  ('sleep_card.li_alim_2', 'psychoeducation', 'card_sleep_01', NULL, 'card_list_item', NULL, 42),
  ('sleep_card.li_alim_3', 'psychoeducation', 'card_sleep_01', NULL, 'card_list_item', 'card.sleep_01.li_alim_3', 43),
  ('app_card.callout', 'psychoeducation', 'card_medication_appetite_01', NULL, 'card_callout', 'card.appetite_01.callout', 50),
  ('cbt_card.d5.heading', 'psychoeducation', 'card_cbt_01', NULL, 'card_heading_4', 'card.cbt_01.d5.heading', 50),
  ('gr_card.h_3', 'psychoeducation', 'card_grounding_01', NULL, 'card_heading_4', 'card.grounding_01.h_3', 50),
  ('sleep_card.h_sport', 'psychoeducation', 'card_sleep_01', NULL, 'card_heading_3', 'card.sleep_01.h_sport', 50),
  ('cbt_card.d5.body', 'psychoeducation', 'card_cbt_01', NULL, 'card_paragraph', 'card.cbt_01.d5.body', 51),
  ('gr_card.p_3', 'psychoeducation', 'card_grounding_01', NULL, 'card_paragraph', 'card.grounding_01.p_3', 51),
  ('sleep_card.p_sport', 'psychoeducation', 'card_sleep_01', NULL, 'card_paragraph', NULL, 51),
  ('cbt_card.d6.heading', 'psychoeducation', 'card_cbt_01', NULL, 'card_heading_4', 'card.cbt_01.d6.heading', 60),
  ('gr_card.h_2', 'psychoeducation', 'card_grounding_01', NULL, 'card_heading_4', 'card.grounding_01.h_2', 60),
  ('sleep_card.h_lit', 'psychoeducation', 'card_sleep_01', NULL, 'card_heading_3', 'card.sleep_01.h_lit', 60),
  ('cbt_card.d6.body', 'psychoeducation', 'card_cbt_01', NULL, 'card_paragraph', 'card.cbt_01.d6.body', 61),
  ('gr_card.p_2', 'psychoeducation', 'card_grounding_01', NULL, 'card_paragraph', 'card.grounding_01.p_2', 61),
  ('sleep_card.p_lit', 'psychoeducation', 'card_sleep_01', NULL, 'card_paragraph', 'card.sleep_01.p_lit', 61),
  ('cbt_card.d7.heading', 'psychoeducation', 'card_cbt_01', NULL, 'card_heading_4', 'card.cbt_01.d7.heading', 70),
  ('gr_card.h_1', 'psychoeducation', 'card_grounding_01', NULL, 'card_heading_4', 'card.grounding_01.h_1', 70),
  ('sleep_card.h_rituel', 'psychoeducation', 'card_sleep_01', NULL, 'card_heading_3', 'card.sleep_01.h_rituel', 70),
  ('cbt_card.d7.body', 'psychoeducation', 'card_cbt_01', NULL, 'card_paragraph', 'card.cbt_01.d7.body', 71),
  ('gr_card.p_1', 'psychoeducation', 'card_grounding_01', NULL, 'card_paragraph', 'card.grounding_01.p_1', 71),
  ('sleep_card.p_rituel', 'psychoeducation', 'card_sleep_01', NULL, 'card_paragraph', 'card.sleep_01.p_rituel', 71),
  ('gr_card.divider_2', 'psychoeducation', 'card_grounding_01', NULL, 'card_divider', NULL, 79),
  ('cbt_card.d8.heading', 'psychoeducation', 'card_cbt_01', NULL, 'card_heading_4', 'card.cbt_01.d8.heading', 80),
  ('gr_card.p_retenir_1', 'psychoeducation', 'card_grounding_01', NULL, 'card_paragraph_bold', 'card.grounding_01.p_retenir_1', 80),
  ('sleep_card.h_insomnie', 'psychoeducation', 'card_sleep_01', NULL, 'card_heading_3', 'card.sleep_01.h_insomnie', 80),
  ('cbt_card.d8.body', 'psychoeducation', 'card_cbt_01', NULL, 'card_paragraph', 'card.cbt_01.d8.body', 81),
  ('gr_card.h_retenir', 'psychoeducation', 'card_grounding_01', NULL, 'card_heading_3', 'card.grounding_01.h_retenir', 81),
  ('sleep_card.p_insomnie', 'psychoeducation', 'card_sleep_01', NULL, 'card_paragraph', NULL, 81),
  ('gr_card.li_r1', 'psychoeducation', 'card_grounding_01', NULL, 'card_list_item', 'card.grounding_01.li_r1', 82),
  ('gr_card.li_r2', 'psychoeducation', 'card_grounding_01', NULL, 'card_list_item', NULL, 83),
  ('gr_card.li_r3', 'psychoeducation', 'card_grounding_01', NULL, 'card_list_item', 'card.grounding_01.li_r3', 84),
  ('cbt_card.d9.heading', 'psychoeducation', 'card_cbt_01', NULL, 'card_heading_4', 'card.cbt_01.d9.heading', 90),
  ('gr_card.divider_3', 'psychoeducation', 'card_grounding_01', NULL, 'card_divider', NULL, 90),
  ('sleep_card.h_sieste', 'psychoeducation', 'card_sleep_01', NULL, 'card_heading_3', 'card.sleep_01.h_sieste', 90),
  ('cbt_card.d9.body', 'psychoeducation', 'card_cbt_01', NULL, 'card_paragraph', 'card.cbt_01.d9.body', 91),
  ('gr_card.note', 'psychoeducation', 'card_grounding_01', NULL, 'card_italic_note', 'card.grounding_01.note', 91),
  ('sleep_card.p_sieste', 'psychoeducation', 'card_sleep_01', NULL, 'card_paragraph', NULL, 91),
  ('cbt_card.d10.heading', 'psychoeducation', 'card_cbt_01', NULL, 'card_heading_4', 'card.cbt_01.d10.heading', 100),
  ('sleep_card.h_agenda', 'psychoeducation', 'card_sleep_01', NULL, 'card_heading_3', 'card.sleep_01.h_agenda', 100),
  ('cbt_card.d10.body', 'psychoeducation', 'card_cbt_01', NULL, 'card_paragraph', 'card.cbt_01.d10.body', 101),
  ('sleep_card.p_agenda', 'psychoeducation', 'card_sleep_01', NULL, 'card_paragraph', 'card.sleep_01.p_agenda', 101),
  ('cbt_card.divider_1', 'psychoeducation', 'card_cbt_01', NULL, 'card_divider', NULL, 109),
  ('cbt_card.h_comment', 'psychoeducation', 'card_cbt_01', NULL, 'card_heading_3', 'card.cbt_01.h_comment', 110),
  ('sleep_card.divider', 'psychoeducation', 'card_sleep_01', NULL, 'card_divider', NULL, 110),
  ('cbt_card.li_c1', 'psychoeducation', 'card_cbt_01', NULL, 'card_numbered_item', 'card.cbt_01.li_c1', 111),
  ('sleep_card.note', 'psychoeducation', 'card_sleep_01', NULL, 'card_italic_note', 'card.sleep_01.note', 111),
  ('cbt_card.li_c2', 'psychoeducation', 'card_cbt_01', NULL, 'card_numbered_item', 'card.cbt_01.li_c2', 112),
  ('cbt_card.li_c3', 'psychoeducation', 'card_cbt_01', NULL, 'card_numbered_item', 'card.cbt_01.li_c3', 113),
  ('cbt_card.divider_2', 'psychoeducation', 'card_cbt_01', NULL, 'card_divider', NULL, 119),
  ('cbt_card.note', 'psychoeducation', 'card_cbt_01', NULL, 'card_italic_note', 'card.cbt_01.note', 120)
on conflict (id) do nothing;

-- ── module_content_fields : psychoeducation — children (inline spans) ────────
-- Doivent venir APRÈS les parents (FK parent_field_id).
insert into public.module_content_fields (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order) values
  ('app_card.intro_s1', 'psychoeducation', 'card_medication_appetite_01', 'app_card.intro', 'card_inline_text', 'card.appetite_01.intro_s1', 1),
  ('app_card.intro_s2', 'psychoeducation', 'card_medication_appetite_01', 'app_card.intro', 'card_inline_bold', 'card.appetite_01.intro_s2', 2),
  ('app_card.intro_s3', 'psychoeducation', 'card_medication_appetite_01', 'app_card.intro', 'card_inline_text', 'card.appetite_01.intro_s3', 3),
  ('gr_card.intro_1_s1', 'psychoeducation', 'card_grounding_01', 'gr_card.intro_1', 'card_inline_text', 'card.grounding_01.intro_1_s1', 1),
  ('gr_card.intro_1_s2', 'psychoeducation', 'card_grounding_01', 'gr_card.intro_1', 'card_inline_bold', 'card.grounding_01.intro_1_s2', 2),
  ('gr_card.intro_1_s3', 'psychoeducation', 'card_grounding_01', 'gr_card.intro_1', 'card_inline_text', 'card.grounding_01.intro_1_s3', 3),
  ('gr_card.li_r2_s1', 'psychoeducation', 'card_grounding_01', 'gr_card.li_r2', 'card_inline_text', 'card.grounding_01.li_r2_s1', 1),
  ('gr_card.li_r2_s2', 'psychoeducation', 'card_grounding_01', 'gr_card.li_r2', 'card_inline_bold', 'card.grounding_01.li_r2_s2', 2),
  ('gr_card.li_r2_s3', 'psychoeducation', 'card_grounding_01', 'gr_card.li_r2', 'card_inline_text', 'card.grounding_01.li_r2_s3', 3),
  ('sleep_card.li_a1_seg1', 'psychoeducation', 'card_sleep_01', 'sleep_card.li_alim_1', 'card_inline_text', 'card.sleep_01.li_a1_seg1', 1),
  ('sleep_card.li_a1_seg2', 'psychoeducation', 'card_sleep_01', 'sleep_card.li_alim_1', 'card_inline_bold', 'card.sleep_01.li_a1_seg2', 2),
  ('sleep_card.li_a1_seg3', 'psychoeducation', 'card_sleep_01', 'sleep_card.li_alim_1', 'card_inline_text', 'card.sleep_01.li_a1_seg3', 3),
  ('sleep_card.li_a2_seg1', 'psychoeducation', 'card_sleep_01', 'sleep_card.li_alim_2', 'card_inline_text', 'card.sleep_01.li_a2_seg1', 1),
  ('sleep_card.li_a2_seg2', 'psychoeducation', 'card_sleep_01', 'sleep_card.li_alim_2', 'card_inline_bold', 'card.sleep_01.li_a2_seg2', 2),
  ('sleep_card.li_a2_seg3', 'psychoeducation', 'card_sleep_01', 'sleep_card.li_alim_2', 'card_inline_text', 'card.sleep_01.li_a2_seg3', 3),
  ('sleep_card.li_l1_seg1', 'psychoeducation', 'card_sleep_01', 'sleep_card.li_lumiere_1', 'card_inline_text', 'card.sleep_01.li_l1_seg1', 1),
  ('sleep_card.li_l1_seg2', 'psychoeducation', 'card_sleep_01', 'sleep_card.li_lumiere_1', 'card_inline_bold', 'card.sleep_01.li_l1_seg2', 2),
  ('sleep_card.li_l1_seg3', 'psychoeducation', 'card_sleep_01', 'sleep_card.li_lumiere_1', 'card_inline_text', 'card.sleep_01.li_l1_seg3', 3),
  ('sleep_card.li_l2_seg1', 'psychoeducation', 'card_sleep_01', 'sleep_card.li_lumiere_2', 'card_inline_text', 'card.sleep_01.li_l2_seg1', 1),
  ('sleep_card.li_l2_seg2', 'psychoeducation', 'card_sleep_01', 'sleep_card.li_lumiere_2', 'card_inline_bold', 'card.sleep_01.li_l2_seg2', 2),
  ('sleep_card.li_l2_seg3', 'psychoeducation', 'card_sleep_01', 'sleep_card.li_lumiere_2', 'card_inline_text', 'card.sleep_01.li_l2_seg3', 3),
  ('sleep_card.p_ins_seg1', 'psychoeducation', 'card_sleep_01', 'sleep_card.p_insomnie', 'card_inline_text', 'card.sleep_01.p_ins_seg1', 1),
  ('sleep_card.p_ins_seg2', 'psychoeducation', 'card_sleep_01', 'sleep_card.p_insomnie', 'card_inline_bold', 'card.sleep_01.p_ins_seg2', 2),
  ('sleep_card.p_ins_seg3', 'psychoeducation', 'card_sleep_01', 'sleep_card.p_insomnie', 'card_inline_text', 'card.sleep_01.p_ins_seg3', 3),
  ('sleep_card.p_sie_seg1', 'psychoeducation', 'card_sleep_01', 'sleep_card.p_sieste', 'card_inline_text', 'card.sleep_01.p_sie_seg1', 1),
  ('sleep_card.p_sie_seg2', 'psychoeducation', 'card_sleep_01', 'sleep_card.p_sieste', 'card_inline_bold', 'card.sleep_01.p_sie_seg2', 2),
  ('sleep_card.p_sie_seg3', 'psychoeducation', 'card_sleep_01', 'sleep_card.p_sieste', 'card_inline_text', 'card.sleep_01.p_sie_seg3', 3),
  ('sleep_card.p_sport_seg1', 'psychoeducation', 'card_sleep_01', 'sleep_card.p_sport', 'card_inline_text', 'card.sleep_01.p_sport_seg1', 1),
  ('sleep_card.p_sport_seg2', 'psychoeducation', 'card_sleep_01', 'sleep_card.p_sport', 'card_inline_bold', 'card.sleep_01.p_sport_seg2', 2),
  ('sleep_card.p_sport_seg3', 'psychoeducation', 'card_sleep_01', 'sleep_card.p_sport', 'card_inline_text', 'card.sleep_01.p_sport_seg3', 3),
  ('sleep_card.p_temp_seg1', 'psychoeducation', 'card_sleep_01', 'sleep_card.p_temp', 'card_inline_text', 'card.sleep_01.p_temp_seg1', 1),
  ('sleep_card.p_temp_seg2', 'psychoeducation', 'card_sleep_01', 'sleep_card.p_temp', 'card_inline_bold', 'card.sleep_01.p_temp_seg2', 2),
  ('sleep_card.p_temp_seg3', 'psychoeducation', 'card_sleep_01', 'sleep_card.p_temp', 'card_inline_text', 'card.sleep_01.p_temp_seg3', 3)
on conflict (id) do nothing;


-- ============================================================
-- BACKFILL : field_props (extraction depuis prod)
-- ============================================================

-- breathing_techniques : icônes + détails
insert into public.field_props (field_id, prop_key, prop_value) values
  ('bt.field_1', 'detail_code', 'module.breathing_techniques.field_1.detail'),
  ('bt.field_1', 'icon', 'heart'),
  ('bt.field_2', 'detail_code', 'module.breathing_techniques.field_2.detail'),
  ('bt.field_2', 'icon', 'circle'),
  ('bt.field_3', 'detail_code', 'module.breathing_techniques.field_3.detail'),
  ('bt.field_3', 'icon', 'circle'),
  ('bt.field_4', 'detail_code', 'module.breathing_techniques.field_4.detail'),
  ('bt.field_4', 'icon', 'circle'),
  ('bt.field_5', 'detail_code', 'module.breathing_techniques.field_5.detail'),
  ('bt.field_5', 'icon', 'circle'),
  ('bt.field_6', 'detail_code', 'module.breathing_techniques.field_6.detail'),
  ('bt.field_6', 'icon', 'calendar')
on conflict (field_id, prop_key) do nothing;

-- crisis_plan : couleurs/icônes par étape + boutons urgence
insert into public.field_props (field_id, prop_key, prop_value) values
  ('crisis_plan.emergency_15', 'bgColor', '#0D9488'),
  ('crisis_plan.emergency_15', 'label_code', 'modules.crisis_plan.emergency_samu_label'),
  ('crisis_plan.emergency_15', 'phone', '15'),
  ('crisis_plan.emergency_3114', 'bgColor', '#7C3AED'),
  ('crisis_plan.emergency_3114', 'label_code', 'modules.crisis_plan.emergency_3114_label'),
  ('crisis_plan.emergency_3114', 'phone', '3114'),
  ('crisis_plan.step_1.hint', 'color', '#D97706'),
  ('crisis_plan.step_1.hint', 'step_number', '1'),
  ('crisis_plan.step_1.title', 'bgColor', '#FFFBEB'),
  ('crisis_plan.step_1.title', 'color', '#D97706'),
  ('crisis_plan.step_1.title', 'icon', 'alert-circle-outline'),
  ('crisis_plan.step_1.title', 'step_number', '1'),
  ('crisis_plan.step_2.hint', 'color', '#059669'),
  ('crisis_plan.step_2.hint', 'step_number', '2'),
  ('crisis_plan.step_2.title', 'bgColor', '#ECFDF5'),
  ('crisis_plan.step_2.title', 'color', '#059669'),
  ('crisis_plan.step_2.title', 'icon', 'heart-pulse'),
  ('crisis_plan.step_2.title', 'step_number', '2'),
  ('crisis_plan.step_3.hint', 'color', '#4F46E5'),
  ('crisis_plan.step_3.hint', 'step_number', '3'),
  ('crisis_plan.step_3.title', 'bgColor', '#EEF2FF'),
  ('crisis_plan.step_3.title', 'color', '#4F46E5'),
  ('crisis_plan.step_3.title', 'icon', 'account-group-outline'),
  ('crisis_plan.step_3.title', 'step_number', '3'),
  ('crisis_plan.step_4.hint', 'color', '#9333EA'),
  ('crisis_plan.step_4.hint', 'step_number', '4'),
  ('crisis_plan.step_4.title', 'bgColor', '#FDF4FF'),
  ('crisis_plan.step_4.title', 'color', '#9333EA'),
  ('crisis_plan.step_4.title', 'icon', 'account-heart-outline'),
  ('crisis_plan.step_4.title', 'step_number', '4'),
  ('crisis_plan.step_5.hint', 'color', '#1D4ED8'),
  ('crisis_plan.step_5.hint', 'step_number', '5'),
  ('crisis_plan.step_5.title', 'bgColor', '#EFF6FF'),
  ('crisis_plan.step_5.title', 'color', '#1D4ED8'),
  ('crisis_plan.step_5.title', 'icon', 'hospital-box-outline'),
  ('crisis_plan.step_5.title', 'step_number', '5'),
  ('crisis_plan.step_6.hint', 'color', '#15803D'),
  ('crisis_plan.step_6.hint', 'step_number', '6'),
  ('crisis_plan.step_6.title', 'bgColor', '#F0FDF4'),
  ('crisis_plan.step_6.title', 'color', '#15803D'),
  ('crisis_plan.step_6.title', 'icon', 'shield-home-outline'),
  ('crisis_plan.step_6.title', 'step_number', '6')
on conflict (field_id, prop_key) do nothing;

-- EPDS : valeurs (certaines questions sont à scoring inversé : opt0=3 ... opt3=0)
insert into public.field_props (field_id, prop_key, prop_value) values
  ('epds.q1.opt0', 'value', '0'), ('epds.q1.opt1', 'value', '1'), ('epds.q1.opt2', 'value', '2'), ('epds.q1.opt3', 'value', '3'),
  ('epds.q2.opt0', 'value', '0'), ('epds.q2.opt1', 'value', '1'), ('epds.q2.opt2', 'value', '2'), ('epds.q2.opt3', 'value', '3'),
  ('epds.q3.opt0', 'value', '3'), ('epds.q3.opt1', 'value', '2'), ('epds.q3.opt2', 'value', '1'), ('epds.q3.opt3', 'value', '0'),
  ('epds.q4.opt0', 'value', '0'), ('epds.q4.opt1', 'value', '1'), ('epds.q4.opt2', 'value', '2'), ('epds.q4.opt3', 'value', '3'),
  ('epds.q5.opt0', 'value', '3'), ('epds.q5.opt1', 'value', '2'), ('epds.q5.opt2', 'value', '1'), ('epds.q5.opt3', 'value', '0'),
  ('epds.q6.opt0', 'value', '3'), ('epds.q6.opt1', 'value', '2'), ('epds.q6.opt2', 'value', '1'), ('epds.q6.opt3', 'value', '0'),
  ('epds.q7.opt0', 'value', '3'), ('epds.q7.opt1', 'value', '2'), ('epds.q7.opt2', 'value', '1'), ('epds.q7.opt3', 'value', '0'),
  ('epds.q8.opt0', 'value', '3'), ('epds.q8.opt1', 'value', '2'), ('epds.q8.opt2', 'value', '1'), ('epds.q8.opt3', 'value', '0'),
  ('epds.q9.opt0', 'value', '3'), ('epds.q9.opt1', 'value', '2'), ('epds.q9.opt2', 'value', '1'), ('epds.q9.opt3', 'value', '0'),
  ('epds.q10.opt0', 'value', '3'), ('epds.q10.opt1', 'value', '2'), ('epds.q10.opt2', 'value', '1'), ('epds.q10.opt3', 'value', '0')
on conflict (field_id, prop_key) do nothing;

-- grounding : couleurs/icônes par sens
insert into public.field_props (field_id, prop_key, prop_value) values
  ('gr.hear.title', 'color', '#059669'),
  ('gr.hear.title', 'icon', 'ear-hearing'),
  ('gr.hear.title', 'step_number', '3'),
  ('gr.safety_15', 'icon', 'ambulance'),
  ('gr.safety_15', 'phone', '15'),
  ('gr.safety_3114', 'icon', 'phone'),
  ('gr.safety_3114', 'phone', '3114'),
  ('gr.see.title', 'color', '#7C3AED'),
  ('gr.see.title', 'icon', 'eye-outline'),
  ('gr.see.title', 'step_number', '5'),
  ('gr.smell.title', 'color', '#D97706'),
  ('gr.smell.title', 'icon', 'flower-tulip-outline'),
  ('gr.smell.title', 'step_number', '2'),
  ('gr.taste.title', 'color', '#DC2626'),
  ('gr.taste.title', 'icon', 'food-variant'),
  ('gr.taste.title', 'step_number', '1'),
  ('gr.touch.title', 'color', '#2563EB'),
  ('gr.touch.title', 'icon', 'hand-back-left-outline'),
  ('gr.touch.title', 'step_number', '4')
on conflict (field_id, prop_key) do nothing;

-- medication_side_effects : valeurs des options
insert into public.field_props (field_id, prop_key, prop_value) values
  ('mse.opt0', 'value', '0'),
  ('mse.opt1', 'value', '1'),
  ('mse.opt2', 'value', '2'),
  ('mse.opt3', 'value', '3')
on conflict (field_id, prop_key) do nothing;

-- mood_tracker : sliders 1-10 + couleurs/icônes/hints par dimension
insert into public.field_props (field_id, prop_key, prop_value) values
  ('mood_tracker.notes', 'placeholder_code', 'modules.mood_tracker.notes_placeholder'),
  ('mood_tracker.notes', 'subscale_key', 'notes'),
  ('mood_tracker.q_anxiety', 'color', '#EF4444'),
  ('mood_tracker.q_anxiety', 'high_hint_code', 'modules.mood_tracker.dim_anxiety_high'),
  ('mood_tracker.q_anxiety', 'icon', 'pulse'),
  ('mood_tracker.q_anxiety', 'low_hint_code', 'modules.mood_tracker.dim_anxiety_low'),
  ('mood_tracker.q_anxiety', 'max', '10'),
  ('mood_tracker.q_anxiety', 'min', '1'),
  ('mood_tracker.q_energy', 'color', '#F59E0B'),
  ('mood_tracker.q_energy', 'high_hint_code', 'modules.mood_tracker.dim_energy_high'),
  ('mood_tracker.q_energy', 'icon', 'lightning-bolt-outline'),
  ('mood_tracker.q_energy', 'low_hint_code', 'modules.mood_tracker.dim_energy_low'),
  ('mood_tracker.q_energy', 'max', '10'),
  ('mood_tracker.q_energy', 'min', '1'),
  ('mood_tracker.q_mood', 'color', '#8B5CF6'),
  ('mood_tracker.q_mood', 'high_hint_code', 'modules.mood_tracker.dim_mood_high'),
  ('mood_tracker.q_mood', 'icon', 'emoticon-outline'),
  ('mood_tracker.q_mood', 'low_hint_code', 'modules.mood_tracker.dim_mood_low'),
  ('mood_tracker.q_mood', 'max', '10'),
  ('mood_tracker.q_mood', 'min', '1'),
  ('mood_tracker.q_pleasure', 'color', '#059669'),
  ('mood_tracker.q_pleasure', 'high_hint_code', 'modules.mood_tracker.dim_pleasure_high'),
  ('mood_tracker.q_pleasure', 'icon', 'heart-outline'),
  ('mood_tracker.q_pleasure', 'low_hint_code', 'modules.mood_tracker.dim_pleasure_low'),
  ('mood_tracker.q_pleasure', 'max', '10'),
  ('mood_tracker.q_pleasure', 'min', '1')
on conflict (field_id, prop_key) do nothing;

-- NSI : valeurs options + champs spécifiques
insert into public.field_props (field_id, prop_key, prop_value) values
  ('nsi.opt0', 'value', '0'),
  ('nsi.opt1', 'value', '1'),
  ('nsi.opt2', 'value', '2'),
  ('nsi.opt3', 'value', '3'),
  ('nsi.opt4', 'value', '4'),
  ('nsi.opt5', 'value', '5'),
  ('nsi.pct_recurrent', 'max', '100'),
  ('nsi.pct_recurrent', 'min', '0'),
  ('nsi.pct_recurrent', 'subscale_key', 'pct_recurrent'),
  ('nsi.pct_recurrent', 'unit', '%'),
  ('nsi.theme_1', 'placeholder_code', 'modules.nsi.theme_placeholder_1'),
  ('nsi.theme_1', 'subscale_key', 'theme_1'),
  ('nsi.theme_2', 'placeholder_code', 'modules.nsi.theme_placeholder_2'),
  ('nsi.theme_2', 'subscale_key', 'theme_2'),
  ('nsi.theme_3', 'placeholder_code', 'modules.nsi.theme_placeholder_3'),
  ('nsi.theme_3', 'subscale_key', 'theme_3')
on conflict (field_id, prop_key) do nothing;

-- psychoeducation : variantes callout + numérotations + définitions
insert into public.field_props (field_id, prop_key, prop_value) values
  ('app_card.callout', 'variant', 'warning'),
  ('app_card.def_1', 'definition_text_code', 'card.appetite_01.def_1.body'),
  ('app_card.def_2', 'definition_text_code', 'card.appetite_01.def_2.body'),
  ('app_card.def_3', 'definition_text_code', 'card.appetite_01.def_3.body'),
  ('app_card.def_4', 'definition_text_code', 'card.appetite_01.def_4.body'),
  ('cbt_card.li_c1', 'item_number', '1'),
  ('cbt_card.li_c2', 'item_number', '2'),
  ('cbt_card.li_c3', 'item_number', '3'),
  ('lith_card.callout', 'variant', 'warning'),
  ('lith_card.li_r1', 'item_number', '1'),
  ('lith_card.li_r2', 'item_number', '2'),
  ('lith_card.li_r3', 'item_number', '3')
on conflict (field_id, prop_key) do nothing;

-- RCADS : valeurs des options
insert into public.field_props (field_id, prop_key, prop_value) values
  ('rcads.opt0', 'value', '0'),
  ('rcads.opt1', 'value', '1'),
  ('rcads.opt2', 'value', '2'),
  ('rcads.opt3', 'value', '3')
on conflict (field_id, prop_key) do nothing;

-- RIM : numérotation steps + sons ambiants (clés/icônes/disponibilité)
insert into public.field_props (field_id, prop_key, prop_value) values
  ('rim.safety_15', 'icon', 'ambulance'),
  ('rim.safety_15', 'phone', '15'),
  ('rim.safety_3114', 'icon', 'phone'),
  ('rim.safety_3114', 'phone', '3114'),
  ('rim.sound_forest', 'available', 'false'),
  ('rim.sound_forest', 'icon', 'tree'),
  ('rim.sound_forest', 'key', 'foret'),
  ('rim.sound_rain', 'available', 'false'),
  ('rim.sound_rain', 'icon', 'weather-rainy'),
  ('rim.sound_rain', 'key', 'pluie'),
  ('rim.sound_stream', 'available', 'false'),
  ('rim.sound_stream', 'icon', 'water'),
  ('rim.sound_stream', 'key', 'ruisseau'),
  ('rim.sound_waves', 'available', 'false'),
  ('rim.sound_waves', 'icon', 'waves'),
  ('rim.sound_waves', 'key', 'vagues'),
  ('rim.sound_wind', 'available', 'false'),
  ('rim.sound_wind', 'icon', 'weather-windy'),
  ('rim.sound_wind', 'key', 'vent'),
  ('rim.step_1', 'step_number', '1'),
  ('rim.step_2', 'step_number', '2'),
  ('rim.step_3', 'step_number', '3'),
  ('rim.step_4', 'step_number', '4'),
  ('rim.step_5', 'step_number', '5')
on conflict (field_id, prop_key) do nothing;


-- ============================================================
-- SEED CONDITIONNEL : widget_type props pour modules 'fields' historiques
-- ============================================================
-- Les module_content_fields parents (sleep.field_*, mood.field_*, mse.field_*,
-- madh.field_*, ba.field_*, ft.field_*, bt.field_*) ont été créés par une
-- migration historique (`add_module_content_schema`) absente de ce fichier.
-- Le filtre WHERE EXISTS rend l'INSERT inoffensif sur une BDD vierge :
-- les props ne sont insérés que si la ligne parente existe déjà.
-- (Plusieurs de ces parents ont d'ailleurs été supprimés plus haut par les
-- migrations de layout — sleep_journal, activity_log, exposure_tracker.)

insert into public.field_props (field_id, prop_key, prop_value)
select v.field_id, 'widget_type', v.widget
from (values
  -- sleep_diary
  ('sleep.field_1', 'time'),
  ('sleep.field_2', 'time'),
  ('sleep.field_3', 'slider:0:120:min'),
  ('sleep.field_4', 'slider:0:10'),
  ('sleep.field_5', 'slider:0:120:min'),
  ('sleep.field_6', 'stars:5'),
  ('sleep.field_7', 'boolean'),
  ('sleep.field_8', 'textarea'),
  -- mood_tracker
  ('mood.field_1', 'slider:1:10'),
  ('mood.field_2', 'slider:1:10'),
  ('mood.field_3', 'slider:1:10'),
  ('mood.field_4', 'slider:1:10'),
  ('mood.field_5', 'textarea'),
  -- medication_side_effects
  ('mse.field_1', 'slider:0:3'),
  ('mse.field_2', 'slider:0:3'),
  ('mse.field_3', 'slider:0:3'),
  ('mse.field_4', 'slider:0:3'),
  ('mse.field_5', 'slider:0:3'),
  ('mse.field_6', 'slider:0:3'),
  ('mse.field_7', 'textarea'),
  -- medication_adherence
  ('madh.field_1', 'radio:ok'),
  ('madh.field_2', 'radio:partial'),
  ('madh.field_3', 'radio:miss'),
  ('madh.field_4', 'textarea'),
  ('madh.field_5', 'info'),
  -- behavioral_activation
  ('ba.field_1', 'date'),
  ('ba.field_2', 'text'),
  ('ba.field_3', 'checkbox'),
  ('ba.field_4', 'slider:0:10'),
  ('ba.field_5', 'slider:0:10'),
  ('ba.field_6', 'textarea'),
  -- fear_thermometer
  ('ft.field_1', 'text'),
  ('ft.field_2', 'slider:0:10'),
  ('ft.field_3', 'text'),
  ('ft.field_4', 'slider:0:10'),
  ('ft.field_5', 'textarea'),
  -- breathing_techniques
  ('bt.field_1', 'info'),
  ('bt.field_2', 'info'),
  ('bt.field_3', 'info'),
  ('bt.field_4', 'info'),
  ('bt.field_5', 'info'),
  ('bt.field_6', 'text')
) as v(field_id, widget)
where exists (select 1 from public.module_content_fields where id = v.field_id)
on conflict (field_id, prop_key) do nothing;

-- ============================================================
-- 5 modules issus de la branche `remodeling-fiches-ETP`, migrés vers le
-- ModuleRenderer data-driven :
--
--   - diet_weight_psycho       → preview_kind='psyedu'
--   - distress_tolerance       → preview_kind='tabbed'  (psyedu + cards)
--   - chronobiology_tracker    → preview_kind='tabbed'  (psyedu + column_form
--                                                         + chrono_month)
--   - craving_journal          → preview_kind='tabbed'  (psyedu + column_form)
--   - exposure_hierarchy       → preview_kind='exposure_hierarchy'
--
-- Pour le contenu psyedu (psyedu_topics + psyedu_blocks), exécuter aussi
-- les sub-seeds : psyedu_seed.sql, chrono_seed.sql, craving_seed.sql,
-- distress_tolerance_seed.sql.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- UPDATE preview_kind sur les 5 modules
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

-- Cards de l'onglet "En crise" — 5 techniques DBT (TIPP, ACCEPTS,
-- self_soothing, IMPROVE, pros_cons). Chaque carte = une section_id avec
-- card_title + card_summary + 1-3 card_paragraph(s) en body.
-- Tous parent_field_id = 'dt.tab.crisis' (rendu via le sub-layout cards
-- de l'onglet "En crise").

insert into public.module_content_fields
  (id, module_id, section_id, parent_field_id, field_type, text_code, sort_order)
values
  -- TIPP
  ('dt.crisis.tipp.title',   'distress_tolerance', 'tipp', 'dt.tab.crisis', 'card_title',
   'modules.distress_tolerance.crisis.tipp.title', 1),
  ('dt.crisis.tipp.summary', 'distress_tolerance', 'tipp', 'dt.tab.crisis', 'card_summary',
   'modules.distress_tolerance.crisis.tipp.summary', 2),
  ('dt.crisis.tipp.body1',   'distress_tolerance', 'tipp', 'dt.tab.crisis', 'card_paragraph',
   'modules.distress_tolerance.crisis.tipp.body1', 3),
  ('dt.crisis.tipp.body2',   'distress_tolerance', 'tipp', 'dt.tab.crisis', 'card_paragraph',
   'modules.distress_tolerance.crisis.tipp.body2', 4),

  -- ACCEPTS
  ('dt.crisis.accepts.title',   'distress_tolerance', 'accepts', 'dt.tab.crisis', 'card_title',
   'modules.distress_tolerance.crisis.accepts.title', 1),
  ('dt.crisis.accepts.summary', 'distress_tolerance', 'accepts', 'dt.tab.crisis', 'card_summary',
   'modules.distress_tolerance.crisis.accepts.summary', 2),
  ('dt.crisis.accepts.body1',   'distress_tolerance', 'accepts', 'dt.tab.crisis', 'card_paragraph',
   'modules.distress_tolerance.crisis.accepts.body1', 3),
  ('dt.crisis.accepts.body2',   'distress_tolerance', 'accepts', 'dt.tab.crisis', 'card_paragraph',
   'modules.distress_tolerance.crisis.accepts.body2', 4),

  -- Self-soothing
  ('dt.crisis.soothing.title',   'distress_tolerance', 'soothing', 'dt.tab.crisis', 'card_title',
   'modules.distress_tolerance.crisis.soothing.title', 1),
  ('dt.crisis.soothing.summary', 'distress_tolerance', 'soothing', 'dt.tab.crisis', 'card_summary',
   'modules.distress_tolerance.crisis.soothing.summary', 2),
  ('dt.crisis.soothing.body1',   'distress_tolerance', 'soothing', 'dt.tab.crisis', 'card_paragraph',
   'modules.distress_tolerance.crisis.soothing.body1', 3),
  ('dt.crisis.soothing.body2',   'distress_tolerance', 'soothing', 'dt.tab.crisis', 'card_paragraph',
   'modules.distress_tolerance.crisis.soothing.body2', 4),

  -- IMPROVE
  ('dt.crisis.improve.title',   'distress_tolerance', 'improve', 'dt.tab.crisis', 'card_title',
   'modules.distress_tolerance.crisis.improve.title', 1),
  ('dt.crisis.improve.summary', 'distress_tolerance', 'improve', 'dt.tab.crisis', 'card_summary',
   'modules.distress_tolerance.crisis.improve.summary', 2),
  ('dt.crisis.improve.body1',   'distress_tolerance', 'improve', 'dt.tab.crisis', 'card_paragraph',
   'modules.distress_tolerance.crisis.improve.body1', 3),
  ('dt.crisis.improve.body2',   'distress_tolerance', 'improve', 'dt.tab.crisis', 'card_paragraph',
   'modules.distress_tolerance.crisis.improve.body2', 4),

  -- Pros & Cons
  ('dt.crisis.proscons.title',   'distress_tolerance', 'proscons', 'dt.tab.crisis', 'card_title',
   'modules.distress_tolerance.crisis.proscons.title', 1),
  ('dt.crisis.proscons.summary', 'distress_tolerance', 'proscons', 'dt.tab.crisis', 'card_summary',
   'modules.distress_tolerance.crisis.proscons.summary', 2),
  ('dt.crisis.proscons.body1',   'distress_tolerance', 'proscons', 'dt.tab.crisis', 'card_paragraph',
   'modules.distress_tolerance.crisis.proscons.body1', 3),
  ('dt.crisis.proscons.body2',   'distress_tolerance', 'proscons', 'dt.tab.crisis', 'card_paragraph',
   'modules.distress_tolerance.crisis.proscons.body2', 4);


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
