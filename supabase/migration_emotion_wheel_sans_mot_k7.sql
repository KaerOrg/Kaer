-- Migration ponctuelle : entrée sans émotion nommée. Ticket #255 (K-7).
--
-- Idempotente et ré-exécutable : miroir du bloc `ew.cfg` de `seed.sql`.
--
-- C'est la réponse au défaut n°1 de l'audit : le module revendique l'alexithymie
-- comme indication et ouvre sur « quelle famille d'émotion ? ». Ne pas savoir
-- répondre à cette question EST le trouble, et aucune porte de sortie n'existait.
-- Désormais « Je ne sais pas trop » ouvre la fiche sans émotion sélectionnée : le
-- patient décrit la situation, ce qu'il sait précisément faire.
--
-- Aucune donnée patient n'est touchée : quatre props de config s'ajoutent.

insert into public.field_props (field_id, prop_key, prop_value) values
  ('ew.cfg', 'enable_wordless', '1'),
  ('ew.cfg', 'wordless_title',  'modules.emotion_wheel.wordless_title'),
  ('ew.cfg', 'wordless_hint',   'modules.emotion_wheel.wordless_hint'),
  ('ew.cfg', 'wordless_label',  'modules.emotion_wheel.wordless_label')
on conflict (field_id, prop_key) do update set prop_value = excluded.prop_value;
