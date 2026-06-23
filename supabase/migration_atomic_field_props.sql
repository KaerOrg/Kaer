-- ============================================================
-- MIGRATION : assainir field_props, prop_value atomique (issue #70)
-- À coller dans Supabase Studio, ou appliquée via MCP. Idempotent, non destructif.
-- ============================================================
-- Contexte : `field_props` est une table de config EAV, PK (field_id, prop_key),
-- donc UNE valeur atomique par prop. Plusieurs entrées historiques re-packaient
-- une structure dans une seule string (que le code re-parsait via split/JSON) :
--   widget_type='slider:0:120:min', 'stars:5', 'radio:ok'
--   durations='5,15'  |  required_keys_any='situation,automatic_thought'
--   target_ages='["adulte","senior"]'
-- Cette migration éclate ces valeurs en props frères / clés indexées atomiques,
-- puis supprime les lignes packées. Transformation purement structurelle (MDR :
-- aucun changement d'affichage ni d'interprétation).
-- Idempotente : ré-exécutable sans effet une fois la base assainie.
-- Doc : docs/module-engine.md § « Convention field_props : prop_value atomique ».

-- ── 1. widget_type packé → kind + props frères ───────────────────────────────

-- slider:min:max[:unit]  →  slider_min / slider_max / slider_unit
insert into public.field_props (field_id, prop_key, prop_value)
select field_id, 'slider_min', split_part(prop_value, ':', 2)
from public.field_props
where prop_key = 'widget_type' and prop_value like 'slider:%'
on conflict (field_id, prop_key) do nothing;

insert into public.field_props (field_id, prop_key, prop_value)
select field_id, 'slider_max', split_part(prop_value, ':', 3)
from public.field_props
where prop_key = 'widget_type' and prop_value like 'slider:%'
on conflict (field_id, prop_key) do nothing;

insert into public.field_props (field_id, prop_key, prop_value)
select field_id, 'slider_unit', split_part(prop_value, ':', 4)
from public.field_props
where prop_key = 'widget_type' and prop_value like 'slider:%'
  and split_part(prop_value, ':', 4) <> ''
on conflict (field_id, prop_key) do nothing;

-- stars:N  →  stars_count
insert into public.field_props (field_id, prop_key, prop_value)
select field_id, 'stars_count', split_part(prop_value, ':', 2)
from public.field_props
where prop_key = 'widget_type' and prop_value like 'stars:%'
on conflict (field_id, prop_key) do nothing;

-- radio:variant  →  radio_variant
insert into public.field_props (field_id, prop_key, prop_value)
select field_id, 'radio_variant', split_part(prop_value, ':', 2)
from public.field_props
where prop_key = 'widget_type' and prop_value like 'radio:%'
on conflict (field_id, prop_key) do nothing;

-- widget_type ne porte plus que le kind (texte avant le premier ':')
update public.field_props
set prop_value = split_part(prop_value, ':', 1)
where prop_key = 'widget_type' and prop_value like '%:%';

-- ── 2. durations (CSV) → duration_1, duration_2, … ───────────────────────────

insert into public.field_props (field_id, prop_key, prop_value)
select fp.field_id, 'duration_' || t.ord, trim(t.val)
from public.field_props fp
cross join lateral regexp_split_to_table(fp.prop_value, ',') with ordinality as t(val, ord)
where fp.prop_key = 'durations'
on conflict (field_id, prop_key) do nothing;

delete from public.field_props where prop_key = 'durations';

-- ── 3. required_keys_any (CSV) → required_key_1, required_key_2, … ────────────

insert into public.field_props (field_id, prop_key, prop_value)
select fp.field_id, 'required_key_' || t.ord, trim(t.val)
from public.field_props fp
cross join lateral regexp_split_to_table(fp.prop_value, ',') with ordinality as t(val, ord)
where fp.prop_key = 'required_keys_any'
on conflict (field_id, prop_key) do nothing;

delete from public.field_props where prop_key = 'required_keys_any';

-- ── 4. target_ages (tableau JSON) → target_age_1, target_age_2, … ────────────

insert into public.field_props (field_id, prop_key, prop_value)
select fp.field_id, 'target_age_' || t.ord, t.val
from public.field_props fp
cross join lateral jsonb_array_elements_text(fp.prop_value::jsonb) with ordinality as t(val, ord)
where fp.prop_key = 'target_ages'
on conflict (field_id, prop_key) do nothing;

delete from public.field_props where prop_key = 'target_ages';
