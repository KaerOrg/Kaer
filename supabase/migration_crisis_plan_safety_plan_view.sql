-- ============================================================
-- MIGRATION : crisis_plan — vue de consultation « Je suis en crise » (#114 phase 2)
-- À coller dans Supabase Studio, ou appliquée via MCP. Idempotente, ré-exécutable.
-- Source de vérité : supabase/seed.sql (déjà mis à jour). Aucun changement de schéma.
-- ============================================================

-- 1. Layout par défaut : la vue de consultation (safety_plan) remplace l'écran
--    d'édition (editable_steps), désormais atteint via la roue crantée côté patient.
update public.modules
   set preview_kind = 'safety_plan'
 where id = 'crisis_plan'
   and preview_kind in ('steps', 'editable_steps');

-- 2. Retrait des fields de l'ancien mode urgence, fusionné dans la vue de consultation :
--    - crisis_urgency_entry (bandeau qui ouvrait l'écran plein urgence, supprimé)
--    - crisis_urgency_contacts (widget contacts step4/5, désormais rendu dans les 6 étapes)
--    Les field_props associés partent en cascade (field_props.field_id ON DELETE CASCADE).
delete from public.module_content_fields
 where id in ('crisis_plan.urgency_banner', 'crisis_plan.urgency_contacts');
