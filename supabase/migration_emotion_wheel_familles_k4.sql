-- Migration ponctuelle : écran de choix de la famille du module
-- « Nommer ce que je ressens ». Ticket #252 (K-4).
--
-- Idempotente et ré-exécutable : miroir du bloc `ew.*` de `seed.sql`.
--
--   1. teintes de famille pastellisées. Les valeurs saturées d'origine échouaient
--      WCAG AA sur fond clair (Joie #F59E0B ≈ 2:1, Force #F97316 ≈ 3:1). Elles ne
--      portent plus de texte depuis K-10 : filet d'accent, fond très pâle, icône ;
--   2. suppression des emojis de famille. Un emoji est déjà une interprétation :
--      il montre un visage qui a décidé ce qu'est l'émotion, à un patient à qui
--      l'on demande précisément de trouver la sienne. Son rendu varie en plus
--      selon l'OS et sa version. Un DELETE est nécessaire : un seed en
--      ON CONFLICT DO UPDATE n'efface pas une ligne retirée du fichier ;
--   3. ligne de définition sous chaque titre de famille (`def`) ;
--   4. libellés de la sortie « Je ne sais pas trop » (`skip_btn`, `stop_hint`).
--
-- Aucune donnée patient n'est touchée. Les entrées déjà saisies conservent leur
-- chemin : seules les props d'affichage des nœuds changent.

-- 1) 2) 3) Props des 8 familles
insert into public.field_props (field_id, prop_key, prop_value) values
  ('ew.joy',            'color', '#EFC98A'), ('ew.joy',            'def', 'modules.emotion_wheel.node_def.joy'),
  ('ew.sadness',        'color', '#9CBEEA'), ('ew.sadness',        'def', 'modules.emotion_wheel.node_def.sadness'),
  ('ew.anger',          'color', '#E5A3A3'), ('ew.anger',          'def', 'modules.emotion_wheel.node_def.anger'),
  ('ew.fear',           'color', '#AC9BDE'), ('ew.fear',           'def', 'modules.emotion_wheel.node_def.fear'),
  ('ew.disgust',        'color', '#AFBE8B'), ('ew.disgust',        'def', 'modules.emotion_wheel.node_def.disgust'),
  ('ew.self_conscious', 'color', '#CDA6B6'), ('ew.self_conscious', 'def', 'modules.emotion_wheel.node_def.self_conscious'),
  ('ew.powerful',       'color', '#F0B48D'), ('ew.powerful',       'def', 'modules.emotion_wheel.node_def.powerful'),
  ('ew.peaceful',       'color', '#8ACFC6'), ('ew.peaceful',       'def', 'modules.emotion_wheel.node_def.peaceful')
on conflict (field_id, prop_key) do update set prop_value = excluded.prop_value;

-- 2) Retrait des emojis (toutes profondeurs du module, par sécurité)
delete from public.field_props
where prop_key = 'emoji'
  and field_id in (
    select id from public.module_content_fields where module_id = 'emotion_wheel'
  );

-- 4) Libellés de la sortie « Je ne sais pas trop »
insert into public.field_props (field_id, prop_key, prop_value) values
  ('ew.cfg', 'skip_btn',  'modules.emotion_wheel.skip_btn'),
  ('ew.cfg', 'stop_hint', 'modules.emotion_wheel.stop_hint')
on conflict (field_id, prop_key) do update set prop_value = excluded.prop_value;
