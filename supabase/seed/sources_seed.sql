-- ============================================================
-- SEED : module_sources
-- Sources et recommandations par module thérapeutique
-- Idempotent : ON CONFLICT (id) DO UPDATE
-- ============================================================
-- RÈGLE DE RIGUEUR :
--   - Études : vérifiées via PubMed (PMID + abstract lu)
--   - Guidelines : URL vérifiée + contenu lu via WebFetch
--   - evidence_grade : uniquement si explicitement formulé dans le document source
--   - Aucun grade inventé ou extrapolé depuis le type d'étude
-- ============================================================

-- ── crisis_plan ─────────────────────────────────────────────────────────────
-- Protocole Stanley & Brown — Safety Planning Intervention (SPI)
-- Sources vérifiées : PMID 29998307, PMID 41212557, NICE NG225 section 1.11.7, HAS 2021

insert into public.module_sources
  (id, module_id, label, source_type, url, evidence_grade, description, sort_order)
values

  -- 1. Stanley & Brown 2018 — JAMA Psychiatry (cohorte, n=1 640, 9 urgences VA)
  --    PMID 29998307 — doi:10.1001/jamapsychiatry.2018.1776 (vérifié PubMed, abstract lu)
  --    evidence_grade : null — grade non applicable à une étude individuelle
  (
    '11111111-0001-0001-0001-000000000001',
    'crisis_plan',
    'Stanley & Brown — Safety Planning Intervention + suivi téléphonique (JAMA Psychiatry, 2018)',
    'cohort_study',
    'https://doi.org/10.1001/jamapsychiatry.2018.1776',
    null,
    '45 % de comportements suicidaires en moins ; doublement de l''engagement au traitement (n=1 640, 9 services d''urgences VA)',
    1
  ),

  -- 2. Weinstock et al. 2025 — JAMA Network Open (ECR, n=655)
  --    PMID 41212557 — doi:10.1001/jamanetworkopen.2025.43156 (vérifié PubMed, abstract lu)
  --    evidence_grade : null — grade non applicable à une étude individuelle
  (
    '11111111-0001-0001-0001-000000000002',
    'crisis_plan',
    'Weinstock et al. — SPI vs soins standard : essai randomisé contrôlé (JAMA Network Open, 2025)',
    'rct',
    'https://doi.org/10.1001/jamanetworkopen.2025.43156',
    null,
    '42 % de réduction des événements suicidaires, 55 % moins de tentatives de suicide (ECR, n=655)',
    2
  ),

  -- 3. NICE NG225 (2022) — section 1.11.7 vérifiée via WebFetch
  --    Texte exact : « Consider developing a safety plan in partnership with people who have self-harmed »
  --    NICE n'utilise pas de grades A/B/C — evidence_grade : null
  (
    '11111111-0001-0001-0001-000000000003',
    'crisis_plan',
    'NICE NG225 — Self-harm: assessment, management and preventing recurrence (2022)',
    'guideline',
    'https://www.nice.org.uk/guidance/ng225/chapter/Recommendations',
    null,
    'Recommandation 1.11.7 : co-construire un plan de sécurité avec la personne — signaux d''alerte, stratégies d''adaptation, contacts de crise',
    3
  ),

  -- 4. HAS 2021 — Idées et conduites suicidaires chez l'enfant et l'adolescent
  --    Section dédiée « Plan de sécurité » vérifiée dans la table des matières (WebFetch)
  --    Grade : non lisible depuis la page HTML — à compléter après lecture du PDF complet
  (
    '11111111-0001-0001-0001-000000000005',
    'crisis_plan',
    'HAS — Idées et conduites suicidaires chez l''enfant et l''adolescent (2021)',
    'guideline',
    'https://www.has-sante.fr/jcms/p_3288864/fr/idees-et-conduites-suicidaires-chez-l-enfant-et-l-adolescent-prevention-reperage-evaluation-et-prise-en-charge',
    null,
    'Section dédiée au plan de sécurité — spécifique aux moins de 18 ans ; grade à compléter après lecture du PDF',
    4
  )

-- ── distress_tolerance ──────────────────────────────────────────────────────
-- DBT — Dialectical Behavior Therapy (Linehan)
-- Sources niveau 1 (efficacité DBT) : PMID 16818865, PMID 25806661, PMID 35088687, NICE CG78 section 1.3.4.5
-- Sources niveau 2 (mécanismes physiologiques fiches) : PMID 8677286, PMID 28819746, PMID 33897457
-- Correction contenu fiche TIPP : "brûle l'adrénaline" → "décharge l'activation sympathique" (psyedu.json)

,

  -- 1. Linehan 2006 — Arch Gen Psychiatry (RCT, n=101, suivi 2 ans)
  --    PMID 16818865 — doi:10.1001/archpsyc.63.7.757 (vérifié PubMed, abstract lu)
  (
    '22222222-0001-0001-0001-000000000001',
    'distress_tolerance',
    'Linehan et al. — DBT vs thérapie par experts : essai randomisé 2 ans (Archives of General Psychiatry, 2006)',
    'rct',
    'https://doi.org/10.1001/archpsyc.63.7.757',
    null,
    'DBT associée à 2× moins de tentatives de suicide, moins d''hospitalisations et de passages aux urgences vs thérapie par experts (n=101, suivi 2 ans)',
    1
  ),

  -- 2. Linehan 2015 — JAMA Psychiatry (RCT analyse de composante, n=99)
  --    PMID 25806661 — doi:10.1001/jamapsychiatry.2014.3039 (vérifié PubMed, abstract lu)
  (
    '22222222-0001-0001-0001-000000000002',
    'distress_tolerance',
    'Linehan et al. — Analyse de la composante skills training DBT (JAMA Psychiatry, 2015)',
    'rct',
    'https://doi.org/10.1001/jamapsychiatry.2014.3039',
    null,
    'Les interventions incluant l''entraînement aux compétences DBT (dont tolérance à la détresse) sont plus efficaces que la DBT sans skills training sur les comportements auto-agressifs et la dépression (n=99)',
    2
  ),

  -- 3. Stoffers-Winterling 2022 — Br J Psychiatry (méta-analyse 31 ECR, n=1870)
  --    PMID 35088687 — doi:10.1192/bjp.2021.204 (vérifié PubMed, abstract lu)
  (
    '22222222-0001-0001-0001-000000000003',
    'distress_tolerance',
    'Stoffers-Winterling et al. — Méta-analyse des psychothérapies pour le TPB (Br J Psychiatry, 2022)',
    'meta_analysis',
    'https://doi.org/10.1192/bjp.2021.204',
    null,
    'DBT : effets significatifs sur l''automutilation (SMD -0,54) et le fonctionnement psychosocial (SMD -0,51) ; preuves de qualité modérée pour le skills training DBT (31 ECR, n=1 870)',
    3
  ),

  -- 4. NICE CG78 section 1.3.4.5 — vérifiée via WebFetch
  --    Texte exact : "consider a comprehensive dialectical behaviour therapy programme"
  --    NICE n'utilise pas de grades A/B/C
  (
    '22222222-0001-0001-0001-000000000004',
    'distress_tolerance',
    'NICE CG78 — Trouble de personnalité borderline : reconnaissance et prise en charge',
    'guideline',
    'https://www.nice.org.uk/guidance/cg78/chapter/1-guidance',
    null,
    'Recommandation 1.3.4.5 : envisager un programme complet de DBT pour les personnes avec TPB dont la priorité est la réduction des conduites auto-agressives répétées',
    4
  ),

  -- 5. Sakakibara & Hayano 1996 — Psychosomatic Medicine (ECR, n=30)
  --    PMID 8677286 — doi:10.1097/00006842-199601000-00006 (vérifié PubMed, abstract lu)
  --    Supporte la technique P (respiration rythmée) de TIPP
  --    Respiration lente (8 cpm) préserve le tonus parasympathique en situation de menace
  (
    '22222222-0001-0001-0001-000000000005',
    'distress_tolerance',
    'Sakakibara & Hayano — Respiration lente et réponse parasympathique au stress (Psychosomatic Medicine, 1996)',
    'rct',
    'https://doi.org/10.1097/00006842-199601000-00006',
    null,
    'La respiration ralentie (8 cycles/min) préserve significativement le tonus parasympathique cardiaque lors d''une exposition à une menace vs respiration normale ou rapide — base physiologique de la technique P (respiration) de TIPP (ECR, n=30)',
    5
  ),

  -- 6. Gordon, McDowell & Herring 2017 — Sports Medicine (méta-analyse, 16 ECR, n=922)
  --    PMID 28819746 — doi:10.1007/s40279-017-0769-0 (vérifié PubMed, abstract lu)
  --    Supporte la technique I (exercice intense) de TIPP
  (
    '22222222-0001-0001-0001-000000000006',
    'distress_tolerance',
    'Gordon, McDowell & Herring — Exercice physique et réduction de l''anxiété (Sports Medicine, 2017)',
    'meta_analysis',
    'https://doi.org/10.1007/s40279-017-0769-0',
    null,
    'L''exercice physique réduit significativement les symptômes d''anxiété (Δ=0,31 ; IC 95% 0,17-0,44) ; effets plus importants chez les sujets sains (Δ=0,50) — base empirique de la technique I (exercice intense) de TIPP (méta-analyse, 16 ECR, n=922)',
    6
  ),

  -- 7. Lundell et al. 2021 — Frontiers in Physiology
  --    PMID 33897457 — doi:10.3389/fphys.2021.649319 (vérifié PubMed, abstract lu)
  --    Supporte la technique T (température) de TIPP — mécanisme du diving reflex
  (
    '22222222-0001-0001-0001-000000000007',
    'distress_tolerance',
    'Lundell et al. — Réflexe de plongée et activation parasympathique en eau froide (Frontiers in Physiology, 2021)',
    'cohort_study',
    'https://doi.org/10.3389/fphys.2021.649319',
    null,
    'L''immersion faciale en eau froide active le réflexe trigémino-cardiaque (diving reflex) et provoque une activation initiale forte du système nerveux parasympathique — mécanisme physiologique sous-tendant la technique T (température) de TIPP (n=26)',
    7
  )

-- ── medication_side_effects ─────────────────────────────────────────────────
-- Thermomètre de tolérance aux psychotropes
-- Sources vérifiées : PMID 2887090, NICE CG178 sections 1.1.2.5 + 1.3.6.4, NICE QS102 QS6

,

  -- 1. Lingjaerde et al. 1987 — Acta Psychiatrica Scandinavica (UKU scale)
  --    PMID 2887090 — doi:10.1111/j.1600-0447.1987.tb10566.x (vérifié PubMed, notice lu)
  --    Développement de l'échelle UKU + étude transversale sur patients sous neuroleptiques
  (
    '33333333-0001-0001-0001-000000000001',
    'medication_side_effects',
    'Lingjaerde et al. — The UKU Side Effect Rating Scale (Acta Psychiatrica Scandinavica, 1987)',
    'expert_opinion',
    'https://doi.org/10.1111/j.1600-0447.1987.tb10566.x',
    null,
    'Développement et validation de l''échelle UKU — référence internationale pour l''évaluation systématique des effets secondaires des psychotropes (neuroleptiques, antidépresseurs, lithium, benzodiazépines) ; étude transversale sur patients traités par neuroleptiques',
    1
  ),

  -- 2. NICE CG178 (2014) — Psychosis and Schizophrenia in Adults
  --    Sections 1.1.2.5 et 1.3.6.4 vérifiées via WebFetch
  --    1.1.2.5 : "Routinely monitor weight, and cardiovascular and metabolic indicators of morbidity"
  --    1.3.6.4 : surveiller les effets secondaires (poids hebdo 6 sem, puis 12 sem, 1 an, annuellement)
  (
    '33333333-0001-0001-0001-000000000002',
    'medication_side_effects',
    'NICE CG178 — Psychosis and Schizophrenia in Adults: Prevention and Management (2014)',
    'guideline',
    'https://www.nice.org.uk/guidance/cg178/chapter/Recommendations',
    null,
    'Recommandation 1.1.2.5 : surveillance systématique du poids, des indicateurs cardiovasculaires et métaboliques. Recommandation 1.3.6.4 : surveiller les effets secondaires du traitement (poids : hebdomadaire les 6 premières semaines, puis à 12 semaines, 1 an, puis annuellement)',
    2
  ),

  -- 3. NICE QS102 Quality Statement 6 (2015) — Psychosis and Schizophrenia in Children and Young People
  --    Texte exact vérifié via WebFetch : "have their treatment monitored for side effects"
  (
    '33333333-0001-0001-0001-000000000003',
    'medication_side_effects',
    'NICE QS102 — Standard de qualité 6 : surveillance des effets secondaires des antipsychotiques (2015)',
    'guideline',
    'https://www.nice.org.uk/guidance/qs102/chapter/quality-statement-6-monitoring-for-side-effects-of-antipsychotic-medication',
    null,
    'Standard de qualité 6 : les enfants et jeunes avec trouble bipolaire, psychose ou schizophrénie traités par antipsychotiques doivent bénéficier d''une surveillance des effets secondaires du traitement',
    3
  )

-- ── psychoeducation ─────────────────────────────────────────────────────────
-- Psychoéducation (module générique)
-- Sources vérifiées : PMID 21678337, PMID 12695318, PMID 34653393, PMID 33052390, NICE CG185 rec 1.7.3-1.7.4

,

  -- 1. Xia et al. 2011 — Cochrane (revue systématique + méta-analyse, 44 ECR, n=5 142, schizophrénie)
  --    PMID 21678337 — doi:10.1002/14651858.CD002831.pub2 (vérifié PubMed, abstract lu)
  (
    '44444444-0001-0001-0001-000000000001',
    'psychoeducation',
    'Xia et al. — Psychoeducation for schizophrenia : revue Cochrane (Cochrane Database Syst Rev, 2011)',
    'meta_analysis',
    'https://doi.org/10.1002/14651858.CD002831.pub2',
    null,
    '48 % de réduction de la non-observance (RR 0,52), 30 % de réduction des rechutes (RR 0,70), moins de réadmissions hospitalières ; amélioration du fonctionnement social et de la satisfaction vis-à-vis des soins (44 ECR, n=5 142)',
    1
  ),

  -- 2. Colom et al. 2003 — Archives of General Psychiatry (ECR, n=120, bipolaire I & II)
  --    PMID 12695318 — doi:10.1001/archpsyc.60.4.402 (vérifié PubMed, abstract lu)
  (
    '44444444-0001-0001-0001-000000000002',
    'psychoeducation',
    'Colom et al. — Psychoéducation de groupe pour le trouble bipolaire : essai randomisé (Arch Gen Psychiatry, 2003)',
    'rct',
    'https://doi.org/10.1001/archpsyc.60.4.402',
    null,
    'La psychoéducation de groupe réduit significativement le nombre de rechutes (toutes polarités), allonge le temps avant récidive et diminue les hospitalisations vs groupe contrôle non structuré (n=120, bipolaire I & II en rémission)',
    2
  ),

  -- 3. Bighelli et al. 2021 — Lancet Psychiatry (méta-analyse en réseau, 72 ECR, n=10 364, schizophrénie)
  --    PMID 34653393 — doi:10.1016/S2215-0366(21)00243-1 (vérifié PubMed, abstract lu)
  (
    '44444444-0001-0001-0001-000000000003',
    'psychoeducation',
    'Bighelli et al. — Interventions psychosociales pour la prévention des rechutes dans la schizophrénie (Lancet Psychiatry, 2021)',
    'meta_analysis',
    'https://doi.org/10.1016/S2215-0366(21)00243-1',
    null,
    'Psychoéducation familiale (OR 0,56) et individuelle/de groupe (OR 0,63) réduisent les rechutes vs traitement habituel — preuves de qualité modérée à faible (méta-analyse en réseau, 72 ECR, n=10 364)',
    3
  ),

  -- 4. Miklowitz et al. 2021 — JAMA Psychiatry (méta-analyse en réseau, 39 ECR, n=3 863, bipolaire)
  --    PMID 33052390 — doi:10.1001/jamapsychiatry.2020.2993 (vérifié PubMed, abstract lu)
  (
    '44444444-0001-0001-0001-000000000004',
    'psychoeducation',
    'Miklowitz et al. — Psychothérapies adjuvantes pour le trouble bipolaire (JAMA Psychiatry, 2021)',
    'meta_analysis',
    'https://doi.org/10.1001/jamapsychiatry.2020.2993',
    null,
    'La psychoéducation en format familial ou de groupe réduit significativement les récidives vs format individuel (OR 0,12) ; effets positifs sur les symptômes dépressifs avec la TCC (SMD -0,32) (39 ECR, n=3 863, trouble bipolaire)',
    4
  ),

  -- 5. NICE CG185 (2014) — Bipolar Disorder : Assessment and Management
  --    Recommandations 1.7.3 + 1.7.4 vérifiées via WebFetch
  --    1.7.3 : "Offer a structured psychological intervention ... which has been designed for bipolar disorder
  --             and has a published evidence-based manual"
  --    1.7.4 : "provide information about bipolar disorder; ... include self-monitoring of mood,
  --             thoughts and behaviour; address relapse risk ... develop plans for relapse management"
  --    NICE n'utilise pas de grades A/B/C
  (
    '44444444-0001-0001-0001-000000000005',
    'psychoeducation',
    'NICE CG185 — Trouble bipolaire : évaluation et prise en charge (2014)',
    'guideline',
    'https://www.nice.org.uk/guidance/cg185/chapter/Recommendations',
    null,
    'Recommandation 1.7.3 : proposer une intervention psychologique structurée (individuelle, de groupe ou familiale) avec manuel basé sur les preuves pour prévenir les rechutes. Recommandation 1.7.4 : l''intervention doit inclure information sur le trouble, impact des pensées sur l''humeur, auto-surveillance, prévention des rechutes',
    5
  )

-- ── diet_weight_psycho ──────────────────────────────────────────────────────
-- Alimentation et psychotropes
-- Sources niveau 1 (efficacité psychoéducation médicaments + nutrition) :
--   PMID 22009159, PMID 10926053, PMID 33080250, PMID 27900734, PMID 31460832, PMID 12086747
-- Vérifications PubMed : tous abstracts lus
-- Sources niveau 2 (exactitude contenu fiches) : mêmes sources (chaque fiche sourcée par molécule/mécanisme)
-- Aucune erreur factuelle détectée dans les fiches psyedu (mécanismes H1/5-HT2C, dopamine/noradrénaline MPH,
--   compétition rénale lithium/sodium, profils valproate/lamotrigine, paroxétine prise de poids, axe microbiote-cerveau)

,

  -- 1. De Hert et al. 2011 — Nature Reviews Endocrinology
  --    PMID 22009159 — doi:10.1038/nrendo.2011.156 (vérifié PubMed, abstract lu)
  --    Revue systématique des effets métaboliques des antipsychotiques (profils comparatifs par molécule)
  (
    '55555555-0001-0001-0001-000000000001',
    'diet_weight_psycho',
    'De Hert et al. — Effets métaboliques et cardiovasculaires des antipsychotiques (Nature Reviews Endocrinology, 2011)',
    'systematic_review',
    'https://doi.org/10.1038/nrendo.2011.156',
    null,
    'Revue systématique des effets métaboliques des antipsychotiques (prise de poids, diabète de type 2, dyslipidémie, syndrome métabolique) — mécanismes H1/5-HT2C détaillés, profils comparatifs par molécule, recommandations de surveillance',
    1
  ),

  -- 2. Fava M 2000 — J Clin Psychiatry
  --    PMID 10926053 (vérifié PubMed, abstract lu)
  --    Revue sur la prise de poids associée aux antidépresseurs — paroxétine en tête, fluoxétine neutre à court terme
  (
    '55555555-0001-0001-0001-000000000002',
    'diet_weight_psycho',
    'Fava M — Prise de poids et antidépresseurs (Journal of Clinical Psychiatry, 2000)',
    'expert_opinion',
    'https://pubmed.ncbi.nlm.nih.gov/10926053/',
    null,
    'Revue comparative de la prise de poids sous antidépresseurs — paroxétine associée à la prise de poids la plus marquée parmi les ISRS ; fluoxétine et sertraline neutres à court terme ; effet classe des ATC et IMAO',
    2
  ),

  -- 3. Carucci et al. 2020 — Neuroscience & Biobehavioral Reviews
  --    PMID 33080250 — doi:10.1016/j.neubiorev.2020.09.031 (vérifié PubMed, abstract lu)
  --    Méta-analyse : méthylphénidate et croissance staturo-pondérale chez l''enfant/adolescent
  (
    '55555555-0001-0001-0001-000000000003',
    'diet_weight_psycho',
    'Carucci et al. — Méthylphénidate et croissance chez l''enfant et l''adolescent : méta-analyse (Neurosci Biobehav Rev, 2020)',
    'meta_analysis',
    'https://doi.org/10.1016/j.neubiorev.2020.09.031',
    null,
    'Méta-analyse : retard statural modéré en traitement prolongé par méthylphénidate ; récupération partielle possible après arrêt ou vacances thérapeutiques — surveillance de la courbe de croissance recommandée',
    3
  ),

  -- 4. Gitlin M 2016 — International Journal of Bipolar Disorders
  --    PMID 27900734 — doi:10.1186/s40345-016-0068-y (vérifié PubMed, abstract lu)
  --    Revue complète des effets indésirables du lithium et de leur gestion pratique
  (
    '55555555-0001-0001-0001-000000000004',
    'diet_weight_psycho',
    'Gitlin M — Effets indésirables du lithium et leur prise en charge (Int J Bipolar Disord, 2016)',
    'expert_opinion',
    'https://doi.org/10.1186/s40345-016-0068-y',
    null,
    'Revue complète des effets indésirables du lithium — polydipsie/polyurie (compétition rénale avec le sodium), hypothyroïdie, tremblements fins, effets rénaux à long terme ; stratégies de tolérance et de gestion au quotidien',
    4
  ),

  -- 5. Cryan et al. 2019 — Physiological Reviews
  --    PMID 31460832 — doi:10.1152/physrev.00018.2018 (vérifié PubMed, abstract lu)
  --    Revue exhaustive de l''axe microbiote-intestin-cerveau (> 500 références)
  (
    '55555555-0001-0001-0001-000000000005',
    'diet_weight_psycho',
    'Cryan et al. — L''axe microbiote-intestin-cerveau (Physiological Reviews, 2019)',
    'systematic_review',
    'https://doi.org/10.1152/physrev.00018.2018',
    null,
    'Revue exhaustive de l''axe microbiote-intestin-cerveau — 95 % de la sérotonine corporelle produite dans l''intestin, communication bidirectionnelle vagale et immunitaire, influence sur l''humeur, l''anxiété et les comportements (> 500 références)',
    5
  ),

  -- 6. Cotman & Berchtold 2002 — Trends in Neurosciences
  --    PMID 12086747 — doi:10.1016/s0166-2236(02)02143-4 (vérifié PubMed, abstract lu)
  --    Exercice physique, BDNF et neuroplasticité hippocampique
  (
    '55555555-0001-0001-0001-000000000006',
    'diet_weight_psycho',
    'Cotman & Berchtold — Exercice physique et neuroplasticité : le rôle du BDNF (Trends in Neurosciences, 2002)',
    'expert_opinion',
    'https://doi.org/10.1016/s0166-2236(02)02143-4',
    null,
    'L''exercice aérobique augmente le BDNF dans l''hippocampe et améliore l''apprentissage et la résistance au stress — base neurobiologique de l''effet bénéfique de l''activité physique sur la santé mentale',
    6
  )

-- ── chronobiology_tracker ───────────────────────────────────────────────────
-- Régularité chronobiologique
-- Sources niveau 1 (efficacité de l'intervention) :
--   PMID 16143731 (IPSRT ECR bipolaire), PMID 40814280 (régularité sommeil + dépression)
--   PMID 16436934 (Wirz-Justice 2006 — chronothérapeutiques)
-- Sources niveau 2 (mécanismes des fiches) :
--   PMID 14294139, PMID 22578422, PMID 6581756, PMID 19955752, PMID 21284980
--   PMID 27327128, PMID 2299336, PMID 7185792
-- Corrections psyedu.json appliquées :
--   (1) "Phillips A.J.K. et al. (2024)" → "Li DR et al. (2025)" (auteur/année erronés pour PMID 40814280)
--   (2) "Prog Brain Res" → "Endocr Dev" (revue erronée pour Leproult & Van Cauter 2010)
-- Wirz-Justice 2013 Chronotherapeutics (Karger book) : réel, non indexé PubMed

,

  -- 1. Frank et al. 2005 — Arch Gen Psychiatry (ECR, n=175, bipolaire I)
  --    PMID 16143731 — doi:10.1001/archpsyc.62.9.996 (vérifié PubMed, abstract lu)
  --    Base scientifique principale de l'IPSRT (régulation des rythmes sociaux)
  (
    '66666666-0001-0001-0001-000000000001',
    'chronobiology_tracker',
    'Frank et al. — IPSRT pour le trouble bipolaire I : résultats à 2 ans (Arch Gen Psychiatry, 2005)',
    'rct',
    'https://doi.org/10.1001/archpsyc.62.9.996',
    null,
    'L''IPSRT en phase aiguë allonge significativement le temps avant rechute affective (p=0,01) — la régularisation des rythmes sociaux pendant le traitement est associée à moins de rechutes en phase de maintenance (ECR, n=175, bipolaire I)',
    1
  ),

  -- 2. Li DR et al. 2025 — Psychological Medicine (cohorte, n=79 666, UK Biobank)
  --    PMID 40814280 — doi:10.1017/S0033291725101281 (vérifié PubMed, abstract lu)
  --    Note : incorrectement attribué à "Phillips AJK 2024" dans psyedu.json — corrigé
  (
    '66666666-0001-0001-0001-000000000002',
    'chronobiology_tracker',
    'Li DR et al. — Régularité du sommeil et risque de dépression et d''anxiété (Psychological Medicine, 2025)',
    'cohort_study',
    'https://doi.org/10.1017/S0033291725101281',
    null,
    'Régularité du sommeil associée à 38 % moins de risque de dépression (HR 0,62) et 33 % moins d''anxiété (HR 0,67), indépendamment de la durée de sommeil — régularité identifiée comme cible prioritaire (n=79 666, UK Biobank)',
    2
  ),

  -- 3. Wirz-Justice 2006 — Int Clin Psychopharmacol (revue, perturbations rythmes + chronothérapeutiques)
  --    PMID 16436934 — doi:10.1097/01.yic.0000195660.37267.cf (vérifié PubMed, abstract lu)
  (
    '66666666-0001-0001-0001-000000000003',
    'chronobiology_tracker',
    'Wirz-Justice A. — Perturbations des rythmes biologiques dans les troubles de l''humeur (Int Clin Psychopharmacol, 2006)',
    'expert_opinion',
    'https://doi.org/10.1097/01.yic.0000195660.37267.cf',
    null,
    'Revue des bases chronobiologiques des troubles de l''humeur — luminothérapie (SAD, dépression non saisonnière), privation de sommeil thérapeutique, zeitgebers, mélatonine — panorama des chronothérapeutiques validés en psychiatrie',
    3
  ),

  -- 4. Aschoff J. 1965 — Science (article fondateur, PMID 14294139)
  --    doi:10.1126/science.148.3676.1427 (vérifié PubMed)
  --    Description originale des rythmes circadiens chez l''homme (isolement temporel)
  (
    '66666666-0001-0001-0001-000000000004',
    'chronobiology_tracker',
    'Aschoff J. — Circadian Rhythms in Man (Science, 1965)',
    'expert_opinion',
    'https://doi.org/10.1126/science.148.3676.1427',
    null,
    'Article fondateur décrivant les rythmes circadiens chez l''homme en condition d''isolement temporel — démonstration de la périodicité interne d''environ 24h pour la température corporelle, le cycle veille-sommeil et les fonctions excrétoires (Science vol. 148)',
    4
  ),

  -- 5. Roenneberg et al. 2012 — Current Biology (n > 65 000, social jetlag + BMI)
  --    PMID 22578422 — doi:10.1016/j.cub.2012.03.038 (vérifié PubMed, abstract lu)
  (
    '66666666-0001-0001-0001-000000000005',
    'chronobiology_tracker',
    'Roenneberg et al. — Social jetlag et obésité (Current Biology, 2012)',
    'cohort_study',
    'https://doi.org/10.1016/j.cub.2012.03.038',
    null,
    'Grande étude épidémiologique : le social jetlag (décalage entre horloge biologique et horloge sociale) est associé à un IMC plus élevé — « vivre contre l''horloge » contribue à l''épidémie d''obésité ; plaide pour une meilleure adéquation entre rythmes biologiques et contraintes sociales (n > 65 000)',
    5
  ),

  -- 6. Rosenthal et al. 1984 — Arch Gen Psychiatry (ECR, n=11, SAD + light therapy)
  --    PMID 6581756 — doi:10.1001/archpsyc.1984.01790120076010 (vérifié PubMed, abstract lu)
  --    Article fondateur de la luminothérapie pour le trouble affectif saisonnier
  (
    '66666666-0001-0001-0001-000000000006',
    'chronobiology_tracker',
    'Rosenthal et al. — Trouble affectif saisonnier et premières données sur la luminothérapie (Arch Gen Psychiatry, 1984)',
    'rct',
    'https://doi.org/10.1001/archpsyc.1984.01790120076010',
    null,
    'Description originale du SAD (29 patients bipolaires II/I en dépression saisonnière : hypersomnie, hyperphagie, gloutonnerie glucidique) et premières données suggérant un effet antidépresseur de l''extension de la photopériode par lumière artificielle intense (n=11)',
    6
  ),

  -- 7. Leproult & Van Cauter 2010 — Endocr Dev (revue, PMID 19955752)
  --    doi:10.1159/000262524 (vérifié PubMed, abstract lu)
  --    Note : incorrectement attribué à "Prog Brain Res" dans psyedu.json — corrigé → "Endocr Dev"
  (
    '66666666-0001-0001-0001-000000000007',
    'chronobiology_tracker',
    'Leproult & Van Cauter — Rôle du sommeil et de son manque sur la libération hormonale (Endocr Dev, 2010)',
    'expert_opinion',
    'https://doi.org/10.1159/000262524',
    null,
    'Restriction de sommeil → diminution de la tolérance au glucose et de la sensibilité à l''insuline, élévation du cortisol vespéral, ghréline augmentée, leptine diminuée — revue des données épidémiologiques et expérimentales liant court sommeil chronique et risque d''obésité',
    7
  ),

  -- 8. Asher & Schibler 2011 — Cell Metabolism (revue mécanistique, PMID 21284980)
  --    doi:10.1016/j.cmet.2011.01.006 (vérifié PubMed, abstract lu)
  (
    '66666666-0001-0001-0001-000000000008',
    'chronobiology_tracker',
    'Asher & Schibler — Interactions entre horloge circadienne et cycles métaboliques (Cell Metabolism, 2011)',
    'expert_opinion',
    'https://doi.org/10.1016/j.cmet.2011.01.006',
    null,
    'Revue mécanistique du couplage entre l''horloge circadienne moléculaire et les cycles métaboliques — rôle de NAD/SIRT1, AMPK, récepteurs nucléaires — base cellulaire de l''importance des ancrages horaires des repas pour la synchronisation des horloges périphériques',
    8
  ),

  -- 9. Pot GK et al. 2016 — Proc Nutr Soc (revue + 2 ECR, PMID 27327128)
  --    doi:10.1017/S0029665116000239 (vérifié PubMed, abstract lu)
  (
    '66666666-0001-0001-0001-000000000009',
    'chronobiology_tracker',
    'Pot GK et al. — Irrégularité des repas et conséquences cardiométaboliques (Proc Nutr Soc, 2016)',
    'expert_opinion',
    'https://doi.org/10.1017/S0029665116000239',
    null,
    'Revue narrative + 2 ECR : repas réguliers pendant 2 semaines vs irréguliers → insuline postprandiale plus basse, LDL-cholestérol réduit chez femmes obèses et minces — irrégularité des repas associée à syndrome métabolique dans les études observationnelles',
    9
  ),

  -- 10. Monk TH et al. 1990 — J Nerv Ment Dis (PMID 2299336)
  --    doi:10.1097/00005053-199002000-00007 (vérifié PubMed, abstract lu)
  --    Développement et validation du Social Rhythm Metric (SRM) — outil de l''IPSRT
  (
    '66666666-0001-0001-0001-000000000010',
    'chronobiology_tracker',
    'Monk et al. — Le Social Rhythm Metric : quantifier les rythmes sociaux quotidiens (J Nerv Ment Dis, 1990)',
    'expert_opinion',
    'https://doi.org/10.1097/00005053-199002000-00007',
    null,
    'Développement et validation du Social Rhythm Metric (SRM) sur 50 sujets sains — outil permettant de quantifier les zeitgebers sociaux quotidiens (activités régulières + contacts sociaux) ; base instrumentale de l''IPSRT',
    10
  ),

  -- 11. Borbély AA 1982 — Hum Neurobiol (PMID 7185792)
  --    Modèle à 2 processus de régulation du sommeil — fondement théorique de l''importance du lever fixe
  --    Pas de DOI disponible dans PubMed
  (
    '66666666-0001-0001-0001-000000000011',
    'chronobiology_tracker',
    'Borbély AA — Modèle à deux processus de régulation du sommeil (Human Neurobiology, 1982)',
    'expert_opinion',
    'https://pubmed.ncbi.nlm.nih.gov/7185792/',
    null,
    'Modèle fondateur à 2 processus : processus homéostatique S (pression de sommeil par accumulation d''adénosine pendant l''éveil) + processus circadien C (oscillateur interne indépendant) — fondement théorique de l''importance d''un lever fixe pour stabiliser les deux processus simultanément',
    11
  )

-- ── craving_journal ─────────────────────────────────────────────────────────
-- Journal de craving (TCC addictologie)
-- Sources niveau 1 (efficacité de l'approche TCC + MBRP pour les addictions) :
--   PMID 19515291 (Magill & Ray 2009 méta-analyse CBT), PMID 24647726 (Bowen 2014 MBRP ECR)
-- Sources niveau 2 (mécanismes des fiches) :
--   PMID 27475769 (Koob & Volkow 2016 — neurobiologie addiction, dopamine, craving)
-- Livres cités dans les fiches (réels, non indexés PubMed) :
--   Marlatt GA & Gordon JR (1985) — Relapse Prevention, Guilford Press (AVE, urge surfing)
--   Beck AT et al. (1993) — Cognitive Therapy of Substance Abuse, Guilford Press (A-B-C)
--   Bowen S, Chawla N & Marlatt GA (2011) — MBRP Manual, Guilford Press (urge surfing MBRP)
-- Aucune erreur factuelle détectée dans les fiches (dopamine/circuit récompense, AVE, urge surfing, HALT)

,

  -- 1. Magill & Ray 2009 — J Stud Alcohol Drugs (méta-analyse, 53 ECR)
  --    PMID 19515291 — doi:10.15288/jsad.2009.70.516 (vérifié PubMed, abstract lu)
  (
    '77777777-0001-0001-0001-000000000001',
    'craving_journal',
    'Magill & Ray — TCC pour les troubles liés à l''alcool et aux drogues : méta-analyse de 53 ECR (J Stud Alcohol Drugs, 2009)',
    'meta_analysis',
    'https://doi.org/10.15288/jsad.2009.70.516',
    null,
    'La TCC produit un effet significatif sur les troubles liés aux substances (g=0,154, p<0,005) — effets les plus marqués pour le cannabis (g=0,513) et comparée à l''absence de traitement (g=0,796) ; effet maintenu à 6 mois (53 ECR, adultes alcool et drogues illicites)',
    1
  ),

  -- 2. Bowen et al. 2014 — JAMA Psychiatry (ECR, n=286, MBRP vs RP vs TAU)
  --    PMID 24647726 — doi:10.1001/jamapsychiatry.2013.4546 (vérifié PubMed, abstract lu)
  --    Soutient l''efficacité de l''urge surfing et de la pleine conscience pour les cravings
  (
    '77777777-0001-0001-0001-000000000002',
    'craving_journal',
    'Bowen et al. — Efficacité relative du MBRP, de la prévention des rechutes standard et du TAU (JAMA Psychiatry, 2014)',
    'rct',
    'https://doi.org/10.1001/jamapsychiatry.2013.4546',
    null,
    'À 12 mois, le MBRP réduit significativement les jours de consommation de drogues et la consommation excessive d''alcool vs RP et TAU — les pratiques de pleine conscience (dont l''urge surfing) soutiendraient les résultats à long terme en améliorant la tolérance aux cravings (ECR, n=286)',
    2
  ),

  -- 3. Koob & Volkow 2016 — Lancet Psychiatry (revue, neurobiologie addiction)
  --    PMID 27475769 — doi:10.1016/S2215-0366(16)00104-8 (vérifié PubMed, abstract lu)
  --    Base neurobiologique des fiches : dopamine, circuit de la récompense, craving
  (
    '77777777-0001-0001-0001-000000000003',
    'craving_journal',
    'Koob & Volkow — Neurobiologie de l''addiction : analyse des circuits neuronaux (Lancet Psychiatry, 2016)',
    'expert_opinion',
    'https://doi.org/10.1016/S2215-0366(16)00104-8',
    null,
    'Revue complète des circuits neuronaux de l''addiction — rôle de la dopamine dans la saillance incitative et la formation des habitudes, déficit du système récompense en sevrage, dérégulation préfrontale dans le craving/anticipation — base neurobiologique des fiches psychoéducatives sur le craving',
    3
  )

-- ── motivational_balance ────────────────────────────────────────────────────
-- Balance motivationnelle (Entretien Motivationnel)
-- Sources niveau 1 (efficacité de l''Entretien Motivationnel) :
--   PMID 14516234 (Burke et al. 2003 — méta-analyse EM, 30 ECR)
-- Sources niveau 2 (mécanismes des fiches) :
--   PMID 6863699 (Prochaska & DiClemente 1983 — TTM/stades du changement)
--   PMID 11392867 (Ryan & Deci 2000 — Self-Determination Theory)
--   PMID 14516235 (Amrhein et al. 2003 — discours-changement/commitment language)
-- Livre cité dans les fiches (réel, non indexé PubMed) :
--   Miller WR & Rollnick S (2013) — Motivational Interviewing, 3rd ed. Guilford Press
-- Observations mineures (pas d''erreurs factuelles) :
--   Ordre auteurs "Deci EL & Ryan RM" → publication est "Ryan RM & Deci EL" (non corrigé, identifiable)
--   Titre Amrhein paraphrasé : "meaning of client language" vs titre réel "commitment language predicts drug use" (non corrigé)

,

  -- 1. Burke et al. 2003 — J Consult Clin Psychol (méta-analyse, 30 ECR adaptations EM)
  --    PMID 14516234 — doi:10.1037/0022-006X.71.5.843 (vérifié PubMed, abstract lu)
  (
    '88888888-0001-0001-0001-000000000001',
    'motivational_balance',
    'Burke et al. — Efficacité de l''entretien motivationnel : méta-analyse d''essais contrôlés (J Consult Clin Psychol, 2003)',
    'meta_analysis',
    'https://doi.org/10.1037/0022-006X.71.5.843',
    null,
    'Les adaptations de l''EM équivalentes aux autres traitements actifs ; effets modérés vs placebo/absence de traitement (d=0,25–0,57) pour l''alcool, les drogues et les comportements liés à l''alimentation/exercice — 51 % de taux d''amélioration, 56 % de réduction de la consommation d''alcool (méta-analyse, 30 ECR)',
    1
  ),

  -- 2. Prochaska & DiClemente 1983 — J Consult Clin Psychol (PMID 6863699)
  --    doi:10.1037//0022-006x.51.3.390 (vérifié PubMed)
  --    Article fondateur du modèle transthéorique (TTM) — stades du changement
  (
    '88888888-0001-0001-0001-000000000002',
    'motivational_balance',
    'Prochaska & DiClemente — Stades et processus de changement (J Consult Clin Psychol, 1983)',
    'expert_opinion',
    'https://doi.org/10.1037//0022-006x.51.3.390',
    null,
    'Article fondateur du modèle transthéorique du changement (TTM) — description des stades (pré-contemplation, contemplation, préparation, action, maintien) et des processus de changement à partir d''une étude sur l''arrêt du tabac — base du « roue de Prochaska » utilisée dans l''EM',
    2
  ),

  -- 3. Ryan & Deci 2000 — American Psychologist (PMID 11392867)
  --    doi:10.1037//0003-066x.55.1.68 (vérifié PubMed, abstract lu)
  --    Théorie de l''autodétermination — motivation autonome vs contrôlée
  (
    '88888888-0001-0001-0001-000000000003',
    'motivational_balance',
    'Ryan & Deci — Théorie de l''autodétermination et motivation intrinsèque (American Psychologist, 2000)',
    'expert_opinion',
    'https://doi.org/10.1037//0003-066x.55.1.68',
    null,
    'La SDT postule 3 besoins psychologiques fondamentaux (compétence, autonomie, lien) — leur satisfaction favorise la motivation intrinsèque, l''auto-régulation et le bien-être ; base théorique du lien entre valeurs personnelles et changement durable en EM',
    3
  ),

  -- 4. Amrhein et al. 2003 — J Consult Clin Psychol (PMID 14516235, n=84)
  --    doi:10.1037/0022-006X.71.5.862 (vérifié PubMed, abstract lu)
  --    Discours-changement : le langage d''engagement prédit les résultats sur les drogues
  (
    '88888888-0001-0001-0001-000000000004',
    'motivational_balance',
    'Amrhein et al. — Le discours-changement lors de l''EM prédit les résultats sur la consommation (J Consult Clin Psychol, 2003)',
    'cohort_study',
    'https://doi.org/10.1037/0022-006X.71.5.862',
    null,
    'L''intensité du langage d''engagement (commitment strength) lors d''un entretien motivationnel prédit significativement l''abstinence à 12 mois — le discours-changement mobilisateur (engagement, activation) est la voie par laquelle désir, capacité et raisons influencent le comportement (n=84 usagers de drogues)',
    4
  ),

-- ── fear_thermometer ─────────────────────────────────────────────────────────
-- Thermomètre de la peur — outil SUDS dans la thérapie d'exposition (TCC)
-- Sources vérifiées :
--   PMID 18410984 — Wolitzky-Taylor et al. 2008 — méta-analyse 33 ECR phobies spécifiques (vérifié PubMed, abstract lu)
--   PMID 2871574  — Foa & Kozak 1986 — théorie du traitement émotionnel de la peur (vérifié PubMed, abstract lu)
--   PMID 24864005 — Craske et al. 2014 — modèle d'apprentissage inhibiteur (vérifié PubMed, abstract lu)
--   NICE CG159 (2013, revu 2024) — recommande l'exposition graduée en TCC pour les troubles anxieux
--     URL vérifiée : https://www.nice.org.uk/guidance/cg159/chapter/Recommendations
--     Texte exact : « graduated exposure to feared social situations, both within treatment sessions and as homework »

  -- 1. Wolitzky-Taylor et al. 2008 — Clinical Psychology Review (méta-analyse, 33 ECR)
  --    PMID 18410984 — doi:10.1016/j.cpr.2008.02.007 (vérifié PubMed, abstract lu)
  --    evidence_grade : null — grade non applicable à une étude individuelle
  (
    '99999999-0001-0001-0001-000000000001',
    'fear_thermometer',
    'Wolitzky-Taylor et al. — Traitements psychologiques des phobies spécifiques : méta-analyse (Clin Psychol Rev, 2008)',
    'meta_analysis',
    'https://doi.org/10.1016/j.cpr.2008.02.007',
    null,
    'Méta-analyse de 33 ECR : l''exposition in vivo produit des effets larges supérieurs au groupe contrôle ; l''exposition in vivo est plus efficace que l''exposition par imagerie à l''issue du traitement',
    1
  ),

  -- 2. Foa & Kozak 1986 — Psychological Bulletin (article théorique fondateur)
  --    PMID 2871574 — pas de DOI dans PubMed (vérifié PubMed, abstract lu)
  --    evidence_grade : null — article théorique, non un ECR
  (
    '99999999-0001-0001-0001-000000000002',
    'fear_thermometer',
    'Foa & Kozak — Traitement émotionnel de la peur : exposition à l''information corrective (Psychol Bull, 1986)',
    'expert_opinion',
    'https://pubmed.ncbi.nlm.nih.gov/2871574/',
    null,
    'Cadre théorique fondateur de la thérapie d''exposition : habituation, traitement émotionnel et intégration d''informations incompatibles avec la peur. Base conceptuelle du thermomètre SUDS',
    2
  ),

  -- 3. Craske et al. 2014 — Behaviour Research and Therapy (revue théorique)
  --    PMID 24864005 — doi:10.1016/j.brat.2014.04.006 (vérifié PubMed, abstract lu)
  --    evidence_grade : null — article de synthèse, non un ECR
  (
    '99999999-0001-0001-0001-000000000003',
    'fear_thermometer',
    'Craske et al. — Maximiser la thérapie d''exposition : approche par apprentissage inhibiteur (Behav Res Ther, 2014)',
    'systematic_review',
    'https://doi.org/10.1016/j.brat.2014.04.006',
    null,
    'Modèle d''apprentissage inhibiteur : la violation d''expectative, l''extinction approfondie et le récupération variée optimisent les résultats de l''exposition — actualisation du modèle d''habituation de Foa & Kozak',
    3
  ),

  -- 4. NICE CG159 (2013, revu 2024) — Trouble anxiété sociale
  --    URL vérifiée : https://www.nice.org.uk/guidance/cg159/chapter/Recommendations
  --    Texte : « graduated exposure to feared social situations, both within treatment sessions and as homework »
  --    NICE n'utilise pas de grades A/B/C — evidence_grade : null
  (
    '99999999-0001-0001-0001-000000000004',
    'fear_thermometer',
    'NICE CG159 — Trouble d''anxiété sociale : reconnaissance, évaluation et traitement (2013, revu 2024)',
    'guideline',
    'https://www.nice.org.uk/guidance/cg159/chapter/Recommendations',
    null,
    'Recommande la TCC avec exposition graduée aux situations redoutées, aussi bien en séance qu''en tâches entre séances ; deux modèles validés : Clark & Wells (14 séances) et Heimberg (15 séances)',
    4
  )

on conflict (id) do update set
  label          = excluded.label,
  source_type    = excluded.source_type,
  url            = excluded.url,
  evidence_grade = excluded.evidence_grade,
  description    = excluded.description,
  sort_order     = excluded.sort_order;
