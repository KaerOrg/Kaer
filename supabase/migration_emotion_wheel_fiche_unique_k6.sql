-- Migration ponctuelle : fiche unique du module « Nommer ce que je ressens ».
-- Ticket #254 (K-6).
--
-- Idempotente et ré-exécutable : miroir du bloc `ew.cfg` de `seed.sql`.
--
--   1. échelle d'intensité de 1-10 à **1-5**. Motif décisif : 10 cibles tactiles de
--      44 px ne tiennent pas sur la largeur d'un téléphone. S'y ajoute le fait que
--      l'écart 6 contre 7 sur 10 n'est pas fiable d'un jour à l'autre chez un même
--      patient, et que dans ce module la précision est portée par le MOT, pas par le
--      chiffre (règle QUOI / COMBIEN) ;
--   2. libellés de la fiche unique : titre, ancrages d'échelle, chip et champ du
--      contexte libre.
--
-- LES SAISIES DÉJÀ EN BASE NE SONT PAS RECALCULÉES. Transformer un 7/10 en 3,5/5
-- fabriquerait une valeur que le patient n'a jamais donnée : la règle d'or dit que
-- l'app enregistre et restitue, elle n'interprète pas. Le comptage du 2026-07-28 a
-- montré 7 saisies, toutes sur le compte de test, aucun patient réel : il n'y a donc
-- aucune cohabitation d'échelles à gérer. Si ce n'était plus vrai au moment de
-- déployer, il faudrait estampiller l'échelle sur chaque entrée plutôt que convertir.
--
-- Les ancrages « à peine » / « au maximum » BORNENT l'échelle, ils ne qualifient
-- aucune valeur : aucun seuil, aucune couleur de gravité (MDR 2017/745).

insert into public.field_props (field_id, prop_key, prop_value) values
  ('ew.cfg', 'intensity_min',             '1'),
  ('ew.cfg', 'intensity_max',             '5'),
  ('ew.cfg', 'entry_title',               'modules.emotion_wheel.entry_title'),
  ('ew.cfg', 'intensity_anchor_min',      'modules.emotion_wheel.intensity_anchor_min'),
  ('ew.cfg', 'intensity_anchor_max',      'modules.emotion_wheel.intensity_anchor_max'),
  ('ew.cfg', 'context_other_btn',         'modules.emotion_wheel.context_other_btn'),
  ('ew.cfg', 'context_other_placeholder', 'modules.emotion_wheel.context_other_placeholder')
on conflict (field_id, prop_key) do update set prop_value = excluded.prop_value;

-- L'indice d'intensité (« De 1 à 10. ») n'est plus affiché : les ancrages aux bornes
-- le remplacent. Prop retirée plutôt que vidée, pour ne pas laisser de config morte.
delete from public.field_props where field_id = 'ew.cfg' and prop_key = 'intensity_hint';
