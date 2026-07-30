-- Migration ponctuelle : écran de première ouverture. Ticket #250 (K-2).
--
-- Idempotente et ré-exécutable : miroir du bloc `ew.cfg` de `seed.sql`.
--
-- Écran PLEIN affiché une seule fois, jamais revu ensuite. Ce n'est volontairement
-- pas une modale : une modale se balaie par réflexe, et ce contenu dit au patient ce
-- que deviennent ses notes.
--
-- « J'ai compris » est un ACCUSÉ DE LECTURE, pas un consentement : aucun objet de
-- consentement (version, retrait, révocation) n'est créé, rien n'est journalisé, et
-- l'état « déjà vu » reste LOCAL à l'appareil (`module_settings`, non synchronisé).
-- Fabriquer un consentement obligerait à le gérer ensuite, pour une information qui
-- n'en demande pas. Le même contenu reste consultable dans la fiche ⓘ (#251).
--
-- Aucune donnée patient n'est touchée : sept props de config s'ajoutent.

insert into public.field_props (field_id, prop_key, prop_value) values
  ('ew.cfg', 'welcome_title',   'modules.emotion_wheel.welcome_title'),
  ('ew.cfg', 'welcome_intro',   'modules.emotion_wheel.welcome_intro'),
  ('ew.cfg', 'welcome_point_1', 'modules.emotion_wheel.welcome_point_1'),
  ('ew.cfg', 'welcome_point_2', 'modules.emotion_wheel.welcome_point_2'),
  ('ew.cfg', 'welcome_crisis',  'modules.emotion_wheel.welcome_crisis'),
  ('ew.cfg', 'welcome_ack_btn', 'modules.emotion_wheel.welcome_ack_btn'),
  ('ew.cfg', 'welcome_footer',  'modules.emotion_wheel.welcome_footer')
on conflict (field_id, prop_key) do update set prop_value = excluded.prop_value;
