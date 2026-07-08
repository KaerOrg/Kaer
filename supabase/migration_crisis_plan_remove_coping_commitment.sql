-- ============================================================
-- MIGRATION : crisis_plan — retrait « Mes cartes SOS » + « Mon engagement » (#114 phase 1)
-- À coller dans Supabase Studio, ou appliquée via MCP. Idempotente, ré-exécutable.
-- Source de vérité : supabase/schema.sql (déjà mis à jour).
-- ============================================================

-- 1. Suppression de la table des « cartes de coping » et de la colonne d'engagement.
--    `cascade` retire aussi ses RLS policies et son trigger d'audit. `if exists`
--    rend l'opération sûre même si la base a déjà été nettoyée.
drop table if exists public.crisis_plan_coping_cards cascade;
alter table public.crisis_plan_configs drop column if exists commitment_phrase;

-- 2. RPC RGPD d'export : re-création sans la clé `crisis_plan_coping_cards`
--    (la table n'existe plus — sinon l'export lèverait « relation does not exist »).
create or replace function public.export_patient_data(p_patient_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_email  text;
  v_result jsonb;
begin
  if not (public.fn_is_admin() or auth.uid() = p_patient_id) then
    raise exception 'export_patient_data: accès refusé';
  end if;

  select email into v_email from public.patients where id = p_patient_id;

  v_result := jsonb_build_object(
    'exported_at', now(),
    'patient_id',  p_patient_id,
    'patient',
      (select to_jsonb(p) from public.patients p where p.id = p_patient_id),
    'practitioner_patients',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.practitioner_patients t where t.patient_id = p_patient_id),
    'patient_modules',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.patient_modules t where t.patient_id = p_patient_id),
    'patient_entries',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.patient_entries t where t.patient_id = p_patient_id),
    'notification_events',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.notification_events t where t.patient_id = p_patient_id),
    'notification_routines',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.notification_routines t where t.patient_id = p_patient_id),
    'notification_logs',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.notification_logs t where t.patient_id = p_patient_id),
    'patient_push_tokens',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.patient_push_tokens t where t.patient_id = p_patient_id),
    'cssrs_screen_assessments',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.cssrs_screen_assessments t where t.patient_id = p_patient_id),
    'crisis_plan_configs',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.crisis_plan_configs t where t.patient_id = p_patient_id),
    'practitioner_patient_notes',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.practitioner_patient_notes t where t.patient_id = p_patient_id),
    'appointments',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.appointments t where t.patient_id = p_patient_id),
    'caseload_entries',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.caseload_entries t where t.patient_id = p_patient_id),
    'caseload_notes',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.caseload_notes t
        where t.entry_id in (select id from public.caseload_entries where patient_id = p_patient_id)),
    'caseload_waits',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.caseload_waits t
        where t.entry_id in (select id from public.caseload_entries where patient_id = p_patient_id)),
    'caseload_actions',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.caseload_actions t
        where t.entry_id in (select id from public.caseload_entries where patient_id = p_patient_id)),
    'invitations',
      (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
         from public.invitations t where v_email is not null and lower(t.patient_email) = lower(v_email))
  );

  perform public.log_data_access('export', 'patients', p_patient_id, p_patient_id,
    jsonb_build_object('scope', 'full'));

  return v_result;
end;
$$;

-- 3. Contenu de module : retrait des deux fields d'aperçu (coping cards + engagement).
--    Aucun field_props associé — suppression directe des content fields.
delete from public.module_content_fields
 where id in ('crisis_plan.coping_cards', 'crisis_plan.commitment');
