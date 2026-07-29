-- Migration ponctuelle : passe de rédaction et d'accessibilité du module
-- « Nommer ce que je ressens » (ex roue des émotions). Ticket #258 (K-10).
--
-- Idempotente et ré-exécutable : miroir exact du bloc `ew.cfg` de `seed.sql`.
-- Deux gestes de config, le reste de K-10 vivant dans les locales et le code :
--   1. nouvelle prop `validate_here_keep` : ligne secondaire du bouton
--      « Je ne sais pas » (« on garde « Peur » »), qui remplace le libellé
--      concaténé « Valider à ce niveau : Effroi » ;
--   2. réordonnancement des chips de contexte sur l'ordre de la maquette
--      (Travail, Famille, Argent, Santé, Relation, Moi, Autre). Les codes i18n
--      ne changent pas : une entrée déjà saisie garde son contexte.
--
-- Aucune donnée patient n'est touchée.

insert into public.field_props (field_id, prop_key, prop_value) values
  ('ew.cfg', 'validate_here_keep', 'modules.emotion_wheel.validate_here_keep'),
  ('ew.cfg', 'context_opt_1',      'modules.emotion_wheel.context.work'),
  ('ew.cfg', 'context_opt_2',      'modules.emotion_wheel.context.family'),
  ('ew.cfg', 'context_opt_3',      'modules.emotion_wheel.context.money'),
  ('ew.cfg', 'context_opt_4',      'modules.emotion_wheel.context.health'),
  ('ew.cfg', 'context_opt_5',      'modules.emotion_wheel.context.relationship'),
  ('ew.cfg', 'context_opt_6',      'modules.emotion_wheel.context.self'),
  ('ew.cfg', 'context_opt_7',      'modules.emotion_wheel.context.other'),
  ('ew.cfg', 'context_icon_1',     'briefcase-outline'),
  ('ew.cfg', 'context_icon_2',     'home-heart'),
  ('ew.cfg', 'context_icon_3',     'cash'),
  ('ew.cfg', 'context_icon_4',     'heart-pulse'),
  ('ew.cfg', 'context_icon_5',     'heart-outline'),
  ('ew.cfg', 'context_icon_6',     'account-outline'),
  ('ew.cfg', 'context_icon_7',     'dots-horizontal')
on conflict (field_id, prop_key) do update set prop_value = excluded.prop_value;
