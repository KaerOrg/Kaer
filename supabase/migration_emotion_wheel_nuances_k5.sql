-- Migration ponctuelle : écran des nuances du module « Nommer ce que je ressens ».
-- Ticket #253 (K-5).
--
-- Idempotente et ré-exécutable : miroir du bloc `ew.*` de `seed.sql`.
--
--   1. définition de chacune des 37 nuances (`def`), affichée sous son nom. Sans
--      elle, le patient choisit au jugé entre des mots que la spec distingue
--      finement : la granularité devient de façade et la donnée inexploitable ;
--   2. élagage du niveau 3, de 74 à 42 nœuds. Une paire de mots ne se justifie que
--      si elle sépare DEUX DIMENSIONS (tête/corps, moi/l'autre, état/mouvement),
--      jamais deux degrés : « écœuré » et « révulsé » ne diffèrent que par
--      l'intensité, et c'est le curseur qui la porte. Les 16 nuances réduites à un
--      seul mot n'ont plus aucun nœud de niveau 3 : leur mot conservé vit dans
--      leur définition, et le patient valide directement sur la nuance.
--
-- IMPORTANT : les clés i18n des mots retirés RESTENT dans les locales. Une entrée
-- déjà saisie qui pointe vers l'un d'eux garde son libellé, résolu depuis le
-- `text_code` de son chemin persisté. Aucune donnée patient n'est touchée, aucune
-- entrée n'est perdue : elle est simplement rétrogradée sur sa nuance dans l'arbre.

-- 1) Définitions des 37 nuances
insert into public.field_props (field_id, prop_key, prop_value) values
  ('ew.joy.plaisir',                'def', 'modules.emotion_wheel.node_def.joy__plaisir'),
  ('ew.joy.enthousiasme',           'def', 'modules.emotion_wheel.node_def.joy__enthousiasme'),
  ('ew.joy.amour',                  'def', 'modules.emotion_wheel.node_def.joy__amour'),
  ('ew.joy.emerveillement',         'def', 'modules.emotion_wheel.node_def.joy__emerveillement'),
  ('ew.joy.gratitude',              'def', 'modules.emotion_wheel.node_def.joy__gratitude'),
  ('ew.sadness.abattement',         'def', 'modules.emotion_wheel.node_def.sadness__abattement'),
  ('ew.sadness.solitude',           'def', 'modules.emotion_wheel.node_def.sadness__solitude'),
  ('ew.sadness.chagrin',            'def', 'modules.emotion_wheel.node_def.sadness__chagrin'),
  ('ew.sadness.vide',               'def', 'modules.emotion_wheel.node_def.sadness__vide'),
  ('ew.sadness.nostalgie',          'def', 'modules.emotion_wheel.node_def.sadness__nostalgie'),
  ('ew.anger.irritation',           'def', 'modules.emotion_wheel.node_def.anger__irritation'),
  ('ew.anger.frustration',          'def', 'modules.emotion_wheel.node_def.anger__frustration'),
  ('ew.anger.hostilite',            'def', 'modules.emotion_wheel.node_def.anger__hostilite'),
  ('ew.anger.indignation',          'def', 'modules.emotion_wheel.node_def.anger__indignation'),
  ('ew.anger.susceptibilite',       'def', 'modules.emotion_wheel.node_def.anger__susceptibilite'),
  ('ew.fear.anxiete',               'def', 'modules.emotion_wheel.node_def.fear__anxiete'),
  ('ew.fear.insecurite',            'def', 'modules.emotion_wheel.node_def.fear__insecurite'),
  ('ew.fear.effroi',                'def', 'modules.emotion_wheel.node_def.fear__effroi'),
  ('ew.fear.mefiance',              'def', 'modules.emotion_wheel.node_def.fear__mefiance'),
  ('ew.fear.impuissance',           'def', 'modules.emotion_wheel.node_def.fear__impuissance'),
  ('ew.disgust.repulsion',          'def', 'modules.emotion_wheel.node_def.disgust__repulsion'),
  ('ew.disgust.mepris',             'def', 'modules.emotion_wheel.node_def.disgust__mepris'),
  ('ew.disgust.desapprobation',     'def', 'modules.emotion_wheel.node_def.disgust__desapprobation'),
  ('ew.self_conscious.honte',       'def', 'modules.emotion_wheel.node_def.self_conscious__honte'),
  ('ew.self_conscious.culpabilite', 'def', 'modules.emotion_wheel.node_def.self_conscious__culpabilite'),
  ('ew.self_conscious.gene',        'def', 'modules.emotion_wheel.node_def.self_conscious__gene'),
  ('ew.self_conscious.devalorisation', 'def', 'modules.emotion_wheel.node_def.self_conscious__devalorisation'),
  ('ew.powerful.confiance',         'def', 'modules.emotion_wheel.node_def.powerful__confiance'),
  ('ew.powerful.fierte',            'def', 'modules.emotion_wheel.node_def.powerful__fierte'),
  ('ew.powerful.courage',           'def', 'modules.emotion_wheel.node_def.powerful__courage'),
  ('ew.powerful.espoir',            'def', 'modules.emotion_wheel.node_def.powerful__espoir'),
  ('ew.powerful.valorisation',      'def', 'modules.emotion_wheel.node_def.powerful__valorisation'),
  ('ew.peaceful.calme',             'def', 'modules.emotion_wheel.node_def.peaceful__calme'),
  ('ew.peaceful.serenite',          'def', 'modules.emotion_wheel.node_def.peaceful__serenite'),
  ('ew.peaceful.securite',          'def', 'modules.emotion_wheel.node_def.peaceful__securite'),
  ('ew.peaceful.comprehension',     'def', 'modules.emotion_wheel.node_def.peaceful__comprehension'),
  ('ew.peaceful.acceptation',       'def', 'modules.emotion_wheel.node_def.peaceful__acceptation')
on conflict (field_id, prop_key) do update set prop_value = excluded.prop_value;

-- 2) Élagage du niveau 3 : les 32 nœuds des 16 nuances qui ne portent plus de mots.
--    `field_props` suit par cascade (FK on delete cascade sur field_id).
delete from public.module_content_fields where id in (
  'ew.joy.plaisir.rejoui',                   'ew.joy.plaisir.ravi',
  'ew.sadness.solitude.seul',                'ew.sadness.solitude.isole',
  'ew.anger.irritation.agace',               'ew.anger.irritation.contrarie',
  'ew.anger.indignation.revolte',            'ew.anger.indignation.outre',
  'ew.anger.susceptibilite.vexe',            'ew.anger.susceptibilite.froisse',
  'ew.fear.insecurite.vulnerable',           'ew.fear.insecurite.fragile',
  'ew.fear.effroi.effraye',                  'ew.fear.effroi.alarme',
  'ew.disgust.repulsion.ecoeure',            'ew.disgust.repulsion.revulse',
  'ew.disgust.mepris.dedaigneux',            'ew.disgust.mepris.meprisant',
  'ew.self_conscious.culpabilite.coupable',  'ew.self_conscious.culpabilite.remords',
  'ew.self_conscious.gene.gene',             'ew.self_conscious.gene.malaise',
  'ew.powerful.confiance.assure',            'ew.powerful.confiance.sur',
  'ew.powerful.espoir.optimiste',            'ew.powerful.espoir.confiant',
  'ew.powerful.valorisation.respecte',       'ew.powerful.valorisation.reconnu',
  'ew.peaceful.serenite.serein',             'ew.peaceful.serenite.enpaix',
  'ew.peaceful.acceptation.reconcilie',      'ew.peaceful.acceptation.libere'
);
