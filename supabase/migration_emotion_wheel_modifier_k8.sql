-- Migration ponctuelle : modification d'une entrée. Ticket #256 (K-8).
--
-- Idempotente et ré-exécutable : miroir du bloc `ew.cfg` de `seed.sql`.
--
-- Jusqu'ici une entrée ne pouvait qu'être supprimée : une erreur de saisie obligeait à
-- tout refaire. L'écran de première ouverture (#250) promet pourtant par écrit qu'on
-- peut modifier ; ce ticket rend la promesse vraie.
--
-- Une seule prop de config : le libellé de l'option « Modifier cette entrée » dans la
-- feuille d'actions. Aucune donnée patient n'est touchée.

insert into public.field_props (field_id, prop_key, prop_value) values
  ('ew.cfg', 'edit_entry_btn', 'modules.emotion_wheel.edit_entry_btn')
on conflict (field_id, prop_key) do update set prop_value = excluded.prop_value;
