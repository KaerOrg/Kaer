-- Migration ponctuelle : accueil du module et fiche ⓘ. Ticket #251 (K-3).
--
-- Idempotente et ré-exécutable : miroir du bloc `ew.cfg` de `seed.sql`.
--
-- L'accueil poussait l'historique sous la ligne de flottaison, entre un bandeau de
-- psychoéducation permanent et un pavé de disclaimer en pied. Les deux passent dans
-- la fiche ⓘ, atteignable par une icône dans l'en-tête : un contenu permanent qu'on
-- ne lit plus ne protège personne, alors qu'un contenu à un tap reste consultable
-- quand la question se pose.
--
-- La section « sources » de la fiche est alimentée par le champ `footer_note`
-- existant (`ew.footer`) : aucune duplication de la citation bibliographique.
--
-- Aucune donnée patient n'est touchée.

insert into public.field_props (field_id, prop_key, prop_value) values
  ('ew.cfg', 'info_title',         'modules.emotion_wheel.info_title'),
  ('ew.cfg', 'info_title_1',       'modules.emotion_wheel.info_purpose_title'),
  ('ew.cfg', 'info_body_1',        'modules.emotion_wheel.info_purpose_body'),
  ('ew.cfg', 'info_title_2',       'modules.emotion_wheel.info_privacy_title'),
  ('ew.cfg', 'info_body_2',        'modules.emotion_wheel.info_privacy_body'),
  ('ew.cfg', 'info_title_3',       'modules.emotion_wheel.info_crisis_title'),
  ('ew.cfg', 'info_body_3',        'modules.emotion_wheel.info_crisis_body'),
  ('ew.cfg', 'info_sources_title', 'modules.emotion_wheel.info_sources_title')
on conflict (field_id, prop_key) do update set prop_value = excluded.prop_value;

-- L'intro n'est plus rendue en bandeau permanent sur l'accueil. La prop est retirée
-- plutôt que laissée : sa présence laisserait croire qu'un écran l'affiche encore.
delete from public.field_props where field_id = 'ew.cfg' and prop_key = 'intro';
