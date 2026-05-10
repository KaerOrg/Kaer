-- Migration : séparer les fiches hygiène de vie en 3 modules distincts
-- À appliquer UNE SEULE FOIS sur la base de production Supabase

update public.psyedu_topics
set module_key = 'psyedu_sleep'
where topic_key = 'sleep_chrono' and module_key = 'diet_weight_psycho';

update public.psyedu_topics
set module_key = 'psyedu_nutrition'
where topic_key = 'nutrition_brain' and module_key = 'diet_weight_psycho';

update public.psyedu_topics
set module_key = 'psyedu_activity'
where topic_key = 'gentle_activity' and module_key = 'diet_weight_psycho';
