-- Migration ponctuelle : refonte roue des emotions (Willcox v2).
-- A executer UNE FOIS dans Supabase Studio > SQL Editor (idempotent, re-executable).
-- Miroir du bloc emotion_wheel de seed.sql. Spec : docs/spec/refonte-roue-emotions.md

-- ============================================================
-- MODULE : emotion_wheel — Roue des émotions (refonte Willcox v2)
-- preview_kind = 'tree_selector' → TreeSelectorLayout
-- Spec : docs/spec/refonte-roue-emotions.md
--
-- Taxonomie Willcox (Feeling Wheel, 1982) adaptée cliniquement :
--   8 familles × nuances qualitatives × mots précis = 8 / 37 / 74.
--   Les sous-niveaux sont QUALITATIFS (jamais des paliers d'intensité) :
--   l'intensité est portée par le curseur séparé (axe COMBIEN).
-- Profondeur libre : le patient peut valider à n'importe quel niveau.
-- Conformité MDR 2017/745 : aucun seuil, aucune interprétation. Les couleurs
--   et emojis codent l'identité de famille, jamais une gravité clinique.
--
-- Idempotent : purge complète des fields/props emotion_wheel puis ré-insertion.
-- ============================================================

-- 0) Purge de l'ancienne taxonomie (Plutchik) et de toute config précédente
delete from public.field_props
  where field_id in (select id from public.module_content_fields where module_id = 'emotion_wheel');
delete from public.module_content_fields where module_id = 'emotion_wheel';

-- 1) Module
update public.modules set preview_kind = 'tree_selector' where id = 'emotion_wheel';

-- 2) Config du sélecteur d'arbre
insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order) values
  ('ew.cfg', 'emotion_wheel', 'tree_selector_config', null, 0)
on conflict (id) do nothing;

insert into public.field_props (field_id, prop_key, prop_value) values
  ('ew.cfg', 'enable_intensity',      '1'),
  ('ew.cfg', 'enable_notes',          '1'),
  ('ew.cfg', 'enable_context',        '1'),
  ('ew.cfg', 'enable_early_validate', '1'),
  ('ew.cfg', 'intensity_min',         '1'),
  ('ew.cfg', 'intensity_max',         '10'),
  ('ew.cfg', 'intro',                 'modules.emotion_wheel.intro'),
  ('ew.cfg', 'new_btn',               'modules.emotion_wheel.new_btn'),
  ('ew.cfg', 'step_1_title',          'modules.emotion_wheel.step_1_title'),
  ('ew.cfg', 'step_1_hint',           'modules.emotion_wheel.step_1_hint'),
  ('ew.cfg', 'step_2_hint',           'modules.emotion_wheel.step_2_hint'),
  ('ew.cfg', 'step_3_hint',           'modules.emotion_wheel.step_3_hint'),
  ('ew.cfg', 'history_label',         'modules.emotion_wheel.history_label'),
  ('ew.cfg', 'empty_title',           'modules.emotion_wheel.empty_title'),
  ('ew.cfg', 'empty_text',            'modules.emotion_wheel.empty_text'),
  ('ew.cfg', 'validate_here_btn',     'modules.emotion_wheel.validate_here_btn'),
  ('ew.cfg', 'intensity_title',       'modules.emotion_wheel.intensity_title'),
  ('ew.cfg', 'intensity_hint',        'modules.emotion_wheel.intensity_hint'),
  ('ew.cfg', 'continue_btn',          'modules.emotion_wheel.continue_btn'),
  ('ew.cfg', 'context_title',         'modules.emotion_wheel.context_title'),
  ('ew.cfg', 'context_hint',          'modules.emotion_wheel.context_hint'),
  ('ew.cfg', 'notes_title',           'modules.emotion_wheel.notes_title'),
  ('ew.cfg', 'notes_hint',            'modules.emotion_wheel.notes_hint'),
  ('ew.cfg', 'notes_placeholder',     'modules.emotion_wheel.notes_placeholder'),
  ('ew.cfg', 'save_btn',              'modules.emotion_wheel.save_btn'),
  -- Options de contexte (chips neutres) — clés indexées lues par collectIndexed
  ('ew.cfg', 'context_opt_1',         'modules.emotion_wheel.context.work'),
  ('ew.cfg', 'context_opt_2',         'modules.emotion_wheel.context.family'),
  ('ew.cfg', 'context_opt_3',         'modules.emotion_wheel.context.relationship'),
  ('ew.cfg', 'context_opt_4',         'modules.emotion_wheel.context.health'),
  ('ew.cfg', 'context_opt_5',         'modules.emotion_wheel.context.money'),
  ('ew.cfg', 'context_opt_6',         'modules.emotion_wheel.context.self'),
  ('ew.cfg', 'context_opt_7',         'modules.emotion_wheel.context.other'),
  ('ew.cfg', 'context_icon_1',        'briefcase-outline'),
  ('ew.cfg', 'context_icon_2',        'home-heart'),
  ('ew.cfg', 'context_icon_3',        'heart-outline'),
  ('ew.cfg', 'context_icon_4',        'heart-pulse'),
  ('ew.cfg', 'context_icon_5',        'cash'),
  ('ew.cfg', 'context_icon_6',        'account-outline'),
  ('ew.cfg', 'context_icon_7',        'dots-horizontal')
on conflict (field_id, prop_key) do update set prop_value = excluded.prop_value;

-- 3) Note de bas de page (sources)
insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order) values
  ('ew.footer', 'emotion_wheel', 'footer_note', 'modules.emotion_wheel.footer', 999)
on conflict (id) do nothing;

-- 4) Niveau 1 — familles (8)
insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order) values
  ('ew.joy',            'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy',            100),
  ('ew.sadness',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness',        110),
  ('ew.anger',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger',          120),
  ('ew.fear',           'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear',           130),
  ('ew.disgust',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust',        140),
  ('ew.self_conscious', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.self_conscious', 150),
  ('ew.powerful',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.powerful',       160),
  ('ew.peaceful',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.peaceful',       170)
on conflict (id) do nothing;

insert into public.field_props (field_id, prop_key, prop_value) values
  ('ew.joy',            'color', '#F59E0B'), ('ew.joy',            'emoji', '😊'), ('ew.joy',            'icon', 'emoticon-happy-outline'),
  ('ew.sadness',        'color', '#3B82F6'), ('ew.sadness',        'emoji', '😢'), ('ew.sadness',        'icon', 'emoticon-sad-outline'),
  ('ew.anger',          'color', '#EF4444'), ('ew.anger',          'emoji', '😠'), ('ew.anger',          'icon', 'emoticon-angry-outline'),
  ('ew.fear',           'color', '#8B5CF6'), ('ew.fear',           'emoji', '😨'), ('ew.fear',           'icon', 'emoticon-frown-outline'),
  ('ew.disgust',        'color', '#6B8E23'), ('ew.disgust',        'emoji', '🤢'), ('ew.disgust',        'icon', 'emoticon-sick-outline'),
  ('ew.self_conscious', 'color', '#B0728A'), ('ew.self_conscious', 'emoji', '😳'), ('ew.self_conscious', 'icon', 'emoticon-confused-outline'),
  ('ew.powerful',       'color', '#F97316'), ('ew.powerful',       'emoji', '💪'), ('ew.powerful',       'icon', 'arm-flex-outline'),
  ('ew.peaceful',       'color', '#14B8A6'), ('ew.peaceful',       'emoji', '🧘'), ('ew.peaceful',       'icon', 'meditation')
on conflict (field_id, prop_key) do update set prop_value = excluded.prop_value;

-- 5) Niveau 2 — nuances (37)
insert into public.module_content_fields (id, module_id, field_type, text_code, parent_field_id, sort_order) values
  -- Joie
  ('ew.joy.plaisir',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__plaisir',          'ew.joy', 1),
  ('ew.joy.enthousiasme',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__enthousiasme',     'ew.joy', 2),
  ('ew.joy.amour',            'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__amour',            'ew.joy', 3),
  ('ew.joy.emerveillement',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__emerveillement',   'ew.joy', 4),
  ('ew.joy.gratitude',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__gratitude',        'ew.joy', 5),
  -- Tristesse
  ('ew.sadness.abattement',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__abattement',   'ew.sadness', 1),
  ('ew.sadness.solitude',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__solitude',     'ew.sadness', 2),
  ('ew.sadness.chagrin',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__chagrin',      'ew.sadness', 3),
  ('ew.sadness.vide',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__vide',         'ew.sadness', 4),
  ('ew.sadness.nostalgie',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__nostalgie',    'ew.sadness', 5),
  -- Colère
  ('ew.anger.irritation',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__irritation',     'ew.anger', 1),
  ('ew.anger.frustration',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__frustration',    'ew.anger', 2),
  ('ew.anger.hostilite',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__hostilite',      'ew.anger', 3),
  ('ew.anger.indignation',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__indignation',    'ew.anger', 4),
  ('ew.anger.susceptibilite', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__susceptibilite', 'ew.anger', 5),
  -- Peur
  ('ew.fear.anxiete',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__anxiete',         'ew.fear', 1),
  ('ew.fear.insecurite',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__insecurite',      'ew.fear', 2),
  ('ew.fear.effroi',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__effroi',          'ew.fear', 3),
  ('ew.fear.mefiance',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__mefiance',        'ew.fear', 4),
  ('ew.fear.impuissance',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__impuissance',     'ew.fear', 5),
  -- Dégoût
  ('ew.disgust.repulsion',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__repulsion',    'ew.disgust', 1),
  ('ew.disgust.mepris',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__mepris',       'ew.disgust', 2),
  ('ew.disgust.desapprobation','emotion_wheel','tree_node', 'modules.emotion_wheel.node.disgust__desapprobation','ew.disgust', 3),
  -- Honte et culpabilité
  ('ew.self_conscious.honte',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.self_conscious__honte',         'ew.self_conscious', 1),
  ('ew.self_conscious.culpabilite',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.self_conscious__culpabilite',   'ew.self_conscious', 2),
  ('ew.self_conscious.gene',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.self_conscious__gene',          'ew.self_conscious', 3),
  ('ew.self_conscious.devalorisation','emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.self_conscious__devalorisation','ew.self_conscious', 4),
  -- Force
  ('ew.powerful.confiance',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.powerful__confiance',   'ew.powerful', 1),
  ('ew.powerful.fierte',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.powerful__fierte',      'ew.powerful', 2),
  ('ew.powerful.courage',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.powerful__courage',     'ew.powerful', 3),
  ('ew.powerful.espoir',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.powerful__espoir',      'ew.powerful', 4),
  ('ew.powerful.valorisation','emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.powerful__valorisation','ew.powerful', 5),
  -- Apaisement
  ('ew.peaceful.calme',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.peaceful__calme',         'ew.peaceful', 1),
  ('ew.peaceful.serenite',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.peaceful__serenite',      'ew.peaceful', 2),
  ('ew.peaceful.securite',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.peaceful__securite',      'ew.peaceful', 3),
  ('ew.peaceful.comprehension', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.peaceful__comprehension', 'ew.peaceful', 4),
  ('ew.peaceful.acceptation',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.peaceful__acceptation',   'ew.peaceful', 5)
on conflict (id) do nothing;

-- 6) Niveau 3 — mots précis (74)
insert into public.module_content_fields (id, module_id, field_type, text_code, parent_field_id, sort_order) values
  -- Joie
  ('ew.joy.plaisir.rejoui',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__plaisir__rejoui',         'ew.joy.plaisir', 1),
  ('ew.joy.plaisir.ravi',           'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__plaisir__ravi',           'ew.joy.plaisir', 2),
  ('ew.joy.enthousiasme.enjoue',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__enthousiasme__enjoue',    'ew.joy.enthousiasme', 1),
  ('ew.joy.enthousiasme.stimule',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__enthousiasme__stimule',   'ew.joy.enthousiasme', 2),
  ('ew.joy.amour.affectueux',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__amour__affectueux',       'ew.joy.amour', 1),
  ('ew.joy.amour.attache',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__amour__attache',          'ew.joy.amour', 2),
  ('ew.joy.emerveillement.ebloui',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__emerveillement__ebloui',  'ew.joy.emerveillement', 1),
  ('ew.joy.emerveillement.inspire', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__emerveillement__inspire', 'ew.joy.emerveillement', 2),
  ('ew.joy.gratitude.reconnaissant','emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__gratitude__reconnaissant','ew.joy.gratitude', 1),
  ('ew.joy.gratitude.touche',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.joy__gratitude__touche',       'ew.joy.gratitude', 2),
  -- Tristesse
  ('ew.sadness.abattement.decourage','emotion_wheel','tree_node', 'modules.emotion_wheel.node.sadness__abattement__decourage','ew.sadness.abattement', 1),
  ('ew.sadness.abattement.accable', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__abattement__accable', 'ew.sadness.abattement', 2),
  ('ew.sadness.solitude.seul',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__solitude__seul',      'ew.sadness.solitude', 1),
  ('ew.sadness.solitude.isole',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__solitude__isole',     'ew.sadness.solitude', 2),
  ('ew.sadness.chagrin.peine',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__chagrin__peine',      'ew.sadness.chagrin', 1),
  ('ew.sadness.chagrin.blesse',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__chagrin__blesse',     'ew.sadness.chagrin', 2),
  ('ew.sadness.vide.eteint',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__vide__eteint',        'ew.sadness.vide', 1),
  ('ew.sadness.vide.vide',          'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__vide__vide',          'ew.sadness.vide', 2),
  ('ew.sadness.nostalgie.melancolique','emotion_wheel','tree_node','modules.emotion_wheel.node.sadness__nostalgie__melancolique','ew.sadness.nostalgie', 1),
  ('ew.sadness.nostalgie.regrets',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.sadness__nostalgie__regrets',  'ew.sadness.nostalgie', 2),
  -- Colère
  ('ew.anger.irritation.agace',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__irritation__agace',     'ew.anger.irritation', 1),
  ('ew.anger.irritation.contrarie', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__irritation__contrarie', 'ew.anger.irritation', 2),
  ('ew.anger.frustration.empeche',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__frustration__empeche',  'ew.anger.frustration', 1),
  ('ew.anger.frustration.decu',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__frustration__decu',     'ew.anger.frustration', 2),
  ('ew.anger.hostilite.rancunier',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__hostilite__rancunier',  'ew.anger.hostilite', 1),
  ('ew.anger.hostilite.amer',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__hostilite__amer',       'ew.anger.hostilite', 2),
  ('ew.anger.indignation.revolte',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__indignation__revolte',  'ew.anger.indignation', 1),
  ('ew.anger.indignation.outre',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__indignation__outre',    'ew.anger.indignation', 2),
  ('ew.anger.susceptibilite.vexe',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.anger__susceptibilite__vexe',  'ew.anger.susceptibilite', 1),
  ('ew.anger.susceptibilite.froisse','emotion_wheel','tree_node', 'modules.emotion_wheel.node.anger__susceptibilite__froisse','ew.anger.susceptibilite', 2),
  -- Peur
  ('ew.fear.anxiete.inquiet',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__anxiete__inquiet',       'ew.fear.anxiete', 1),
  ('ew.fear.anxiete.tendu',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__anxiete__tendu',         'ew.fear.anxiete', 2),
  ('ew.fear.insecurite.vulnerable', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__insecurite__vulnerable', 'ew.fear.insecurite', 1),
  ('ew.fear.insecurite.fragile',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__insecurite__fragile',    'ew.fear.insecurite', 2),
  ('ew.fear.effroi.effraye',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__effroi__effraye',        'ew.fear.effroi', 1),
  ('ew.fear.effroi.alarme',         'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__effroi__alarme',         'ew.fear.effroi', 2),
  ('ew.fear.mefiance.mefiant',      'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__mefiance__mefiant',      'ew.fear.mefiance', 1),
  ('ew.fear.mefiance.gardes',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__mefiance__gardes',       'ew.fear.mefiance', 2),
  ('ew.fear.impuissance.demuni',    'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__impuissance__demuni',    'ew.fear.impuissance', 1),
  ('ew.fear.impuissance.paralyse',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.fear__impuissance__paralyse',  'ew.fear.impuissance', 2),
  -- Dégoût
  ('ew.disgust.repulsion.ecoeure',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__repulsion__ecoeure',  'ew.disgust.repulsion', 1),
  ('ew.disgust.repulsion.revulse',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__repulsion__revulse',  'ew.disgust.repulsion', 2),
  ('ew.disgust.mepris.dedaigneux',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__mepris__dedaigneux',  'ew.disgust.mepris', 1),
  ('ew.disgust.mepris.meprisant',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.disgust__mepris__meprisant',   'ew.disgust.mepris', 2),
  ('ew.disgust.desapprobation.reprobateur','emotion_wheel','tree_node','modules.emotion_wheel.node.disgust__desapprobation__reprobateur','ew.disgust.desapprobation', 1),
  ('ew.disgust.desapprobation.choque',     'emotion_wheel','tree_node','modules.emotion_wheel.node.disgust__desapprobation__choque',     'ew.disgust.desapprobation', 2),
  -- Honte et culpabilité
  ('ew.self_conscious.honte.honteux',      'emotion_wheel','tree_node','modules.emotion_wheel.node.self_conscious__honte__honteux',      'ew.self_conscious.honte', 1),
  ('ew.self_conscious.honte.humilie',      'emotion_wheel','tree_node','modules.emotion_wheel.node.self_conscious__honte__humilie',      'ew.self_conscious.honte', 2),
  ('ew.self_conscious.culpabilite.coupable','emotion_wheel','tree_node','modules.emotion_wheel.node.self_conscious__culpabilite__coupable','ew.self_conscious.culpabilite', 1),
  ('ew.self_conscious.culpabilite.remords','emotion_wheel','tree_node','modules.emotion_wheel.node.self_conscious__culpabilite__remords','ew.self_conscious.culpabilite', 2),
  ('ew.self_conscious.gene.gene',          'emotion_wheel','tree_node','modules.emotion_wheel.node.self_conscious__gene__gene',          'ew.self_conscious.gene', 1),
  ('ew.self_conscious.gene.malaise',       'emotion_wheel','tree_node','modules.emotion_wheel.node.self_conscious__gene__malaise',       'ew.self_conscious.gene', 2),
  ('ew.self_conscious.devalorisation.incapable','emotion_wheel','tree_node','modules.emotion_wheel.node.self_conscious__devalorisation__incapable','ew.self_conscious.devalorisation', 1),
  ('ew.self_conscious.devalorisation.insuffisant','emotion_wheel','tree_node','modules.emotion_wheel.node.self_conscious__devalorisation__insuffisant','ew.self_conscious.devalorisation', 2),
  -- Force
  ('ew.powerful.confiance.assure',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.powerful__confiance__assure',  'ew.powerful.confiance', 1),
  ('ew.powerful.confiance.sur',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.powerful__confiance__sur',     'ew.powerful.confiance', 2),
  ('ew.powerful.fierte.fier',       'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.powerful__fierte__fier',       'ew.powerful.fierte', 1),
  ('ew.powerful.fierte.accompli',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.powerful__fierte__accompli',   'ew.powerful.fierte', 2),
  ('ew.powerful.courage.determine', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.powerful__courage__determine', 'ew.powerful.courage', 1),
  ('ew.powerful.courage.audacieux', 'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.powerful__courage__audacieux', 'ew.powerful.courage', 2),
  ('ew.powerful.espoir.optimiste',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.powerful__espoir__optimiste',  'ew.powerful.espoir', 1),
  ('ew.powerful.espoir.confiant',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.powerful__espoir__confiant',   'ew.powerful.espoir', 2),
  ('ew.powerful.valorisation.respecte','emotion_wheel','tree_node','modules.emotion_wheel.node.powerful__valorisation__respecte','ew.powerful.valorisation', 1),
  ('ew.powerful.valorisation.reconnu','emotion_wheel','tree_node', 'modules.emotion_wheel.node.powerful__valorisation__reconnu','ew.powerful.valorisation', 2),
  -- Apaisement
  ('ew.peaceful.calme.detendu',     'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.peaceful__calme__detendu',     'ew.peaceful.calme', 1),
  ('ew.peaceful.calme.pose',        'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.peaceful__calme__pose',        'ew.peaceful.calme', 2),
  ('ew.peaceful.serenite.serein',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.peaceful__serenite__serein',   'ew.peaceful.serenite', 1),
  ('ew.peaceful.serenite.enpaix',   'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.peaceful__serenite__enpaix',   'ew.peaceful.serenite', 2),
  ('ew.peaceful.securite.rassure',  'emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.peaceful__securite__rassure',  'ew.peaceful.securite', 1),
  ('ew.peaceful.securite.confiance','emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.peaceful__securite__confiance','ew.peaceful.securite', 2),
  ('ew.peaceful.comprehension.compris','emotion_wheel','tree_node','modules.emotion_wheel.node.peaceful__comprehension__compris','ew.peaceful.comprehension', 1),
  ('ew.peaceful.comprehension.ecoute','emotion_wheel','tree_node', 'modules.emotion_wheel.node.peaceful__comprehension__ecoute','ew.peaceful.comprehension', 2),
  ('ew.peaceful.acceptation.reconcilie','emotion_wheel','tree_node','modules.emotion_wheel.node.peaceful__acceptation__reconcilie','ew.peaceful.acceptation', 1),
  ('ew.peaceful.acceptation.libere','emotion_wheel', 'tree_node', 'modules.emotion_wheel.node.peaceful__acceptation__libere','ew.peaceful.acceptation', 2)
on conflict (id) do nothing;
