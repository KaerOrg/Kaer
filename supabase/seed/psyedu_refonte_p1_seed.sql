-- ============================================================
-- SEED — Refonte psychoéducation, PHASE 1a (enrichissement métadonnées)
-- Idempotent, additif (aucun DROP/DELETE). Référence par (module_key, topic_key)
-- pour être robuste aux UUID. Spec : docs/spec/refonte-psychoeducation.md
--
-- NB : `reviewed_at` (date de revue clinique) volontairement NON renseigné ici —
-- c'est au clinicien de dater ses revues, pas au code d'affirmer une revue.
-- ============================================================

-- ── 1. Rattachement à un thème ───────────────────────────────────────────────
-- 🟣 Mon traitement : toutes les fiches médicaments
update public.psyedu_topics set theme_id = 'treatment'
  where module_key = 'diet_weight_psycho';
-- 🟢 Hygiène de vie : sommeil, nutrition, activité
update public.psyedu_topics set theme_id = 'lifestyle'
  where module_key in ('psyedu_sleep', 'psyedu_nutrition', 'psyedu_activity');

-- ── 2. Tags des fiches (filtrage de la bibliothèque) ─────────────────────────
insert into public.psyedu_topic_tags (topic_id, tag_id)
select t.id, x.tag_id
from public.psyedu_topics t
join (values
  -- treatment
  ('diet_weight_psycho','general','psychoeducation'),
  ('diet_weight_psycho','general','adult'),
  ('diet_weight_psycho','general','teen'),
  ('diet_weight_psycho','general','senior'),
  ('diet_weight_psycho','antipsychotics','psychoeducation'),
  ('diet_weight_psycho','antipsychotics','psychosis'),
  ('diet_weight_psycho','antipsychotics','bipolar'),
  ('diet_weight_psycho','antipsychotics','adult'),
  ('diet_weight_psycho','antipsychotics','teen'),
  ('diet_weight_psycho','methylphenidate','psychoeducation'),
  ('diet_weight_psycho','methylphenidate','adhd'),
  ('diet_weight_psycho','methylphenidate','child'),
  ('diet_weight_psycho','methylphenidate','teen'),
  ('diet_weight_psycho','methylphenidate','adult'),
  ('diet_weight_psycho','antidepressants','psychoeducation'),
  ('diet_weight_psycho','antidepressants','depression'),
  ('diet_weight_psycho','antidepressants','anxiety'),
  ('diet_weight_psycho','antidepressants','adult'),
  ('diet_weight_psycho','antidepressants','teen'),
  ('diet_weight_psycho','antidepressants','senior'),
  ('diet_weight_psycho','mood_stabilizers','psychoeducation'),
  ('diet_weight_psycho','mood_stabilizers','bipolar'),
  ('diet_weight_psycho','mood_stabilizers','adult'),
  ('diet_weight_psycho','mood_stabilizers','teen'),
  ('diet_weight_psycho','mood_stabilizers','senior'),
  -- lifestyle
  ('psyedu_sleep','sleep_chrono','psychoeducation'),
  ('psyedu_sleep','sleep_chrono','sleep'),
  ('psyedu_sleep','sleep_chrono','adult'),
  ('psyedu_sleep','sleep_chrono','teen'),
  ('psyedu_sleep','sleep_chrono','senior'),
  ('psyedu_sleep','sleep_hygiene_rules','psychoeducation'),
  ('psyedu_sleep','sleep_hygiene_rules','sleep'),
  ('psyedu_sleep','sleep_hygiene_rules','adult'),
  ('psyedu_sleep','sleep_hygiene_rules','teen'),
  ('psyedu_sleep','sleep_hygiene_rules','senior'),
  ('psyedu_nutrition','nutrition_brain','psychoeducation'),
  ('psyedu_nutrition','nutrition_brain','adult'),
  ('psyedu_nutrition','nutrition_brain','teen'),
  ('psyedu_nutrition','nutrition_brain','senior'),
  ('psyedu_activity','gentle_activity','psychoeducation'),
  ('psyedu_activity','gentle_activity','depression'),
  ('psyedu_activity','gentle_activity','adult'),
  ('psyedu_activity','gentle_activity','teen'),
  ('psyedu_activity','gentle_activity','senior')
) as x(module_key, topic_key, tag_id)
  on t.module_key = x.module_key and t.topic_key = x.topic_key
on conflict (topic_id, tag_id) do nothing;

-- ── 3. Liens fiche ↔ outil (réutilisation par les modules interactifs) ────────
insert into public.module_topics (module_id, topic_id, sort_order)
select x.module_id, t.id, x.sort_order
from public.psyedu_topics t
join (values
  -- fiches médicaments réutilisées par les modules de suivi du traitement
  ('medication_adherence','diet_weight_psycho','general',0),
  ('medication_adherence','diet_weight_psycho','antipsychotics',1),
  ('medication_adherence','diet_weight_psycho','methylphenidate',2),
  ('medication_adherence','diet_weight_psycho','antidepressants',3),
  ('medication_adherence','diet_weight_psycho','mood_stabilizers',4),
  ('medication_side_effects','diet_weight_psycho','general',0),
  ('medication_side_effects','diet_weight_psycho','antipsychotics',1),
  ('medication_side_effects','diet_weight_psycho','methylphenidate',2),
  ('medication_side_effects','diet_weight_psycho','antidepressants',3),
  ('medication_side_effects','diet_weight_psycho','mood_stabilizers',4),
  -- fiches sommeil réutilisées par l'agenda du sommeil et la chronobiologie
  ('sleep_diary','psyedu_sleep','sleep_chrono',0),
  ('sleep_diary','psyedu_sleep','sleep_hygiene_rules',1),
  ('chronobiology_tracker','psyedu_sleep','sleep_chrono',0),
  ('chronobiology_tracker','psyedu_sleep','sleep_hygiene_rules',1),
  -- fiche activité réutilisée par l'activation comportementale
  ('behavioral_activation','psyedu_activity','gentle_activity',0)
) as x(module_id, src_module_key, topic_key, sort_order)
  on t.module_key = x.src_module_key and t.topic_key = x.topic_key
on conflict (module_id, topic_id) do nothing;
