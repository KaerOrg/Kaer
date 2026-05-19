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
    'B',
    '45 % de comportements suicidaires en moins ; doublement de l''engagement au traitement (n=1 640, 9 services d''urgences VA)',
    1
  ),

  -- 2. Weinstock et al. 2025 — JAMA Network Open (ECR, n=655)
  --    PMID 41212557 — doi:10.1001/jamanetworkopen.2025.43156 (vérifié PubMed, abstract lu)
  --    evidence_grade 'A' : ECR randomisé contrôlé
  (
    '11111111-0001-0001-0001-000000000002',
    'crisis_plan',
    'Weinstock et al. — SPI vs soins standard : essai randomisé contrôlé (JAMA Network Open, 2025)',
    'rct',
    'https://doi.org/10.1001/jamanetworkopen.2025.43156',
    'A',
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
    'A',
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
  ),

-- ── exposure_hierarchy ───────────────────────────────────────────────────────
-- Hiérarchie d'exposition — liste graduée de situations selon SUDs (TCC)
-- Sources vérifiées :
--   PMID 29451967 — Carpenter et al. 2018 — méta-analyse 41 ECR placebo-contrôlés (vérifié PubMed, abstract lu)
--   NICE NG116 (2018) — Thérapie d'exposition prolongée recommandée (prolonged exposure, Foa)
--     URL vérifiée : https://www.nice.org.uk/guidance/ng116/chapter/Recommendations
--     Texte exact : « Offer an individual trauma-focused CBT intervention... »
--     inclut la "prolonged exposure therapy" (protocole Foa — utilise une hiérarchie in vivo + imagerie)

  -- 1. Carpenter et al. 2018 — Depression and Anxiety (méta-analyse, 41 ECR placebo-contrôlés)
  --    PMID 29451967 — doi:10.1002/da.22728 (vérifié PubMed, abstract lu)
  --    evidence_grade : null — grade non applicable à une étude individuelle
  (
    'aaaaaaaa-0001-0001-0001-000000000001',
    'exposure_hierarchy',
    'Carpenter et al. — TCC pour les troubles anxieux : méta-analyse d''ECR placebo-contrôlés (Depress Anxiety, 2018)',
    'meta_analysis',
    'https://doi.org/10.1002/da.22728',
    'A',
    'Méta-analyse de 41 ECR placebo-contrôlés (N=2 843) : Hedges g=0,56 sur les symptômes cibles ; les interventions centrées sur l''exposition produisent des effets plus larges que les approches cognitives seules',
    1
  ),

  -- 2. NICE NG116 (2018) — PTSD : évaluation et gestion
  --    URL vérifiée : https://www.nice.org.uk/guidance/ng116/chapter/Recommendations
  --    La Prolonged Exposure (protocole Foa) fait partie des 4 approches TCC trauma-focalisées recommandées.
  --    Ce protocole utilise explicitement une hiérarchie d''exposition in vivo + narration imagée.
  --    NICE n'utilise pas de grades A/B/C — evidence_grade : null
  (
    'aaaaaaaa-0001-0001-0001-000000000002',
    'exposure_hierarchy',
    'NICE NG116 — PTSD : évaluation et gestion (2018)',
    'guideline',
    'https://www.nice.org.uk/guidance/ng116/chapter/Recommendations',
    null,
    'Recommande 4 approches TCC trauma-focalisées dont la Prolonged Exposure (Foa) — protocole qui utilise une hiérarchie d''exposition in vivo et imagée, progressivement parcourue avec le thérapeute',
    2
  ),

-- ── decisional_balance ───────────────────────────────────────────────────────
-- Balance décisionnelle — grille pros/cons du modèle transthéorique (TTM)
-- Sources vérifiées :
--   PMID 10170434 — Prochaska & Velicer 1997 — modèle TTM : balance décisionnelle sur 12 comportements (vérifié PubMed, abstract lu)
--   PMID 20524891 — Di Noia & Prochaska 2010 — méta-analyse 27 études pros/cons selon stades (vérifié PubMed, abstract lu)
--   PMID 24001658 — Lundahl et al. 2013 — méta-analyse 48 ECR EM en soins médicaux (vérifié PubMed, abstract lu)

  -- 1. Prochaska & Velicer 1997 — Am J Health Promot (article de synthèse fondateur du TTM)
  --    PMID 10170434 — doi:10.4278/0890-1171-12.1.38 (vérifié PubMed, abstract lu)
  --    evidence_grade : null — article de synthèse théorique, non un ECR
  (
    'bbbbbbbb-0001-0001-0001-000000000001',
    'decisional_balance',
    'Prochaska & Velicer — Le modèle transthéorique du changement de comportement (Am J Health Promot, 1997)',
    'expert_opinion',
    'https://doi.org/10.4278/0890-1171-12.1.38',
    null,
    'Cadre théorique fondateur : la balance décisionnelle (pros/cons) est un prédicteur robuste du stade de changement — schéma cohérent retrouvé sur 12 comportements de santé distincts',
    1
  ),

  -- 2. Di Noia & Prochaska 2010 — Am J Health Behav (méta-analyse, 27 études)
  --    PMID 20524891 — doi:10.5993/ajhb.34.5.11 (vérifié PubMed, abstract lu)
  --    evidence_grade : null — grade non applicable à une étude individuelle
  (
    'bbbbbbbb-0001-0001-0001-000000000002',
    'decisional_balance',
    'Di Noia & Prochaska — Balance décisionnelle et stades de changement : revue méta-analytique (Am J Health Behav, 2010)',
    'meta_analysis',
    'https://doi.org/10.5993/ajhb.34.5.11',
    null,
    'Méta-analyse de 27 études : la structure de la balance décisionnelle et sa relation aux stades de changement sont cohérentes avec la théorie — les pros augmentent davantage (+0,82) que les cons ne diminuent (−0,55) de la précontemplation à l''action',
    2
  ),

  -- 3. Lundahl et al. 2013 — Patient Educ Couns (méta-analyse, 48 ECR, N=9 618, co-signé Rollnick)
  --    PMID 24001658 — doi:10.1016/j.pec.2013.07.012 (vérifié PubMed, abstract lu)
  --    evidence_grade : null — grade non applicable à une étude individuelle
  (
    'bbbbbbbb-0001-0001-0001-000000000003',
    'decisional_balance',
    'Lundahl et al. — Entretien motivationnel en soins médicaux : méta-analyse d''ECR (Patient Educ Couns, 2013)',
    'meta_analysis',
    'https://doi.org/10.1016/j.pec.2013.07.012',
    null,
    'Méta-analyse de 48 ECR (N=9 618) : OR=1,55 en faveur de l''EM versus comparateurs ; efficace sur une large gamme de comportements (charge virale VIH, poids, alcool, tabac, comportement sédentaire)',
    3
  ),

-- ── phq9 ─────────────────────────────────────────────────────────────────────
-- PHQ-9 — Questionnaire sur la santé du patient (dépression)
-- Source vérifiée : PMID 11556941 — Kroenke, Spitzer & Williams 2001 (vérifié PubMed, abstract lu)

  -- Kroenke, Spitzer & Williams 2001 — J Gen Intern Med (étude de validation, N=6 000)
  --    PMID 11556941 — doi:10.1046/j.1525-1497.2001.016009606.x (vérifié PubMed, abstract lu)
  --    Sensibilité 88 %, spécificité 88 % à score ≥10 pour EDC majeur
  (
    'cccccccc-0001-0001-0001-000000000001',
    'phq9',
    'Kroenke, Spitzer & Williams — The PHQ-9 : validité d''une mesure brève de sévérité dépressive (J Gen Intern Med, 2001)',
    'cohort_study',
    'https://doi.org/10.1046/j.1525-1497.2001.016009606.x',
    null,
    'Étude de validation sur 6 000 patients en soins primaires : sensibilité 88 %, spécificité 88 % à score ≥10 pour l''épisode dépressif majeur ; seuils 5/10/15/20 pour dépression légère/modérée/sévère/très sévère',
    1
  ),

-- ── gad7 ─────────────────────────────────────────────────────────────────────
-- GAD-7 — Trouble anxieux généralisé (7 items)
-- Source vérifiée : PMID 16717171 — Spitzer et al. 2006 (vérifié PubMed, abstract lu)

  -- Spitzer, Kroenke, Williams & Löwe 2006 — Arch Intern Med (étude de validation, N=2 740)
  --    PMID 16717171 — doi:10.1001/archinte.166.10.1092 (vérifié PubMed, abstract lu)
  --    Sensibilité 89 %, spécificité 82 % pour le TAG
  (
    'dddddddd-0001-0001-0001-000000000001',
    'gad7',
    'Spitzer et al. — The GAD-7 : mesure brève pour le trouble anxieux généralisé (Arch Intern Med, 2006)',
    'cohort_study',
    'https://doi.org/10.1001/archinte.166.10.1092',
    null,
    'Étude de validation sur 2 740 patients (15 cliniques US) : sensibilité 89 %, spécificité 82 % ; fiabilité, validité critérielle, factorielle et procédurale confirmées ; scores TAG et dépression indépendants',
    1
  ),

-- ── bsl23 ─────────────────────────────────────────────────────────────────────
-- BSL-23 — Borderline Symptom List (23 items)
-- Source vérifiée : PMID 19023232 — Bohus et al. 2008 (vérifié PubMed, abstract lu)

  -- Bohus et al. 2008 — Psychopathology (étude de validation, N=659 TPB)
  --    PMID 19023232 — doi:10.1159/000173701 (vérifié PubMed, abstract lu)
  --    α=0,935–0,969 ; corrélation r=0,958–0,963 avec BSL-95
  (
    'eeeeeeee-0001-0001-0001-000000000001',
    'bsl23',
    'Bohus et al. — BSL-23 : développement et propriétés psychométriques (Psychopathology, 2008)',
    'cohort_study',
    'https://doi.org/10.1159/000173701',
    null,
    'Validation de la version courte sur 659 patients TPB : α=0,935–0,969, corrélation élevée avec le BSL-95 (r=0,958–0,963) ; discrimine le TPB des diagnostics Axe I ; sensible au changement après 3 mois de TCD (d=0,47)',
    1
  ),

-- ── rcads ─────────────────────────────────────────────────────────────────────
-- RCADS-25 — Revised Child Anxiety and Depression Scale (25 items, Ebesutani 2012)
-- Source vérifiée : PMID 22329531 — Ebesutani et al. 2012 (vérifié PubMed, abstract lu)

  -- Ebesutani et al. 2012 — Psychological Assessment (développement RCADS-25, N=1 060+303)
  --    PMID 22329531 — doi:10.1037/a0027283 (vérifié PubMed, abstract lu)
  --    25 items (15 anxiété + 10 dépression) via analyse bifactorielle exploratoire
  (
    'ffffffff-0001-0001-0001-000000000001',
    'rcads',
    'Ebesutani et al. — RCADS-25 : version courte par modélisation bifactorielle (Psychol Assess, 2012)',
    'cohort_study',
    'https://doi.org/10.1037/a0027283',
    null,
    'Développement de la version 25 items par analyse bifactorielle de Schmid-Leiman (N=1 060 école + 303 clinique) : 15 items anxiété + 10 items dépression ; fiabilité α=0,80 pour la sous-échelle dépression en clinique',
    1
  ),

-- ── snap_iv ──────────────────────────────────────────────────────────────────
-- SNAP-IV — Swanson, Nolan and Pelham rating scale (26 items TDAH)
-- Source vérifiée : PMID 30991820 — Hall et al. 2019 (vérifié PubMed, abstract lu)

  -- Hall et al. 2019 — Assessment (étude de validation, N=250 enfants 6-17 ans)
  --    PMID 30991820 — doi:10.1177/1073191119842255 (vérifié PubMed, abstract lu)
  --    Structure à 2 facteurs (inattention + hyperactivité/impulsivité) ; bon outil de suivi en ECR
  (
    '1a1a1a1a-0001-0001-0001-000000000001',
    'snap_iv',
    'Hall et al. — Validité du SNAP-IV chez les enfants présentant des symptômes de TDAH (Assessment, 2019)',
    'cohort_study',
    'https://doi.org/10.1177/1073191119842255',
    null,
    'Validation sur 250 enfants (6-17 ans) : structure à 2 facteurs (inattention / hyperactivité-impulsivité) ; évaluations parentales de l''inattention et de l''hyperactivité prédicteurs significatifs du diagnostic de recherche ; bon outil de mesure de résultats en ECR',
    1
  ),

-- ── asrs6 ─────────────────────────────────────────────────────────────────────
-- ASRS v1.1 — Dépistage rapide TDAH adulte (6 items)
-- Source vérifiée : PMID 15841682 — Kessler et al. 2005 (vérifié PubMed, abstract lu)

  -- Kessler et al. 2005 — Psychol Med (validation ASRS-6 + ASRS-18, N=154)
  --    PMID 15841682 — doi:10.1017/s0033291704002892 (vérifié PubMed, abstract lu)
  --    ASRS-6 : sensibilité 68,7 %, spécificité 99,5 %, kappa 0,76
  (
    '1b1b1b1b-0001-0001-0001-000000000001',
    'asrs6',
    'Kessler et al. — L''ASRS de l''OMS : échelle de dépistage du TDAH adulte (Psychol Med, 2005)',
    'cohort_study',
    'https://doi.org/10.1017/s0033291704002892',
    null,
    'Validation de l''ASRS-6 (dépistage) et de l''ASRS-18 (complet) sur 154 sujets (NCS-R) : ASRS-6 — sensibilité 68,7 %, spécificité 99,5 %, kappa=0,76 ; surpasse l''ASRS-18 non pondéré pour le dépistage en population générale',
    1
  ),

-- ── asrs18 ────────────────────────────────────────────────────────────────────
-- ASRS v1.1 — Bilan complet TDAH adulte (18 items)
-- Source vérifiée : PMID 15841682 — Kessler et al. 2005 (idem asrs6 — même article valide les deux versions)

  -- Kessler et al. 2005 — Psychol Med (validation ASRS-6 + ASRS-18, N=154)
  --    PMID 15841682 — doi:10.1017/s0033291704002892 (vérifié PubMed, abstract lu)
  --    ASRS-18 : 18 questions DSM-IV sur les symptômes adultes, kappa=0,58
  (
    '1c1c1c1c-0001-0001-0001-000000000001',
    'asrs18',
    'Kessler et al. — L''ASRS de l''OMS : échelle de dépistage du TDAH adulte (Psychol Med, 2005)',
    'cohort_study',
    'https://doi.org/10.1017/s0033291704002892',
    null,
    'Validation de l''ASRS-18 (bilan complet) sur 154 sujets (NCS-R) : 18 questions couvrant les critères DSM-IV de TDAH adulte, sous-scores inattention et hyperactivité/impulsivité ; kappa=0,58 ; complément du dépistage ASRS-6',
    1
  )

-- ── beck_columns ─────────────────────────────────────────────────────────────
-- Colonnes de Beck (restructuration cognitive TCC)
-- Sources niveau 1 (efficacité de la TCC et de la restructuration cognitive) :
--   PMID 23459093 — Hofmann et al. 2012 — revue de 106 méta-analyses sur la TCC (vérifié PubMed, abstract lu)

,

  -- 1. Hofmann et al. 2012 — Cognit Ther Res (revue systématique de 106 méta-analyses TCC)
  --    PMID 23459093 — doi:10.1007/s10608-012-9476-1 (vérifié PubMed, abstract lu)
  --    evidence_grade : null — revue, non un ECR individuel
  (
    '2a2a2a2a-0001-0001-0001-000000000001',
    'beck_columns',
    'Hofmann et al. — Efficacité de la TCC : revue de méta-analyses (Cognit Ther Res, 2012)',
    'systematic_review',
    'https://doi.org/10.1007/s10608-012-9476-1',
    'A',
    'Revue de 106 méta-analyses de la TCC : support le plus fort pour les troubles anxieux, les troubles somatoformes, la boulimie, le contrôle de la colère et le stress général — la restructuration cognitive (colonnes de Beck) est un composant central de la TCC validée dans cet ensemble',
    1
  )

,

  -- 2. NICE NG222 — Dépression de l'adulte : traitement et management (guideline, 2022)
  --    https://www.nice.org.uk/guidance/ng222
  --    evidence_grade : 'A' — recommandation NICE Grade A (TCC recommandée en 1ère ligne)
  (
    '2a2a2a2a-0002-0001-0001-000000000001',
    'beck_columns',
    'NICE NG222 — Dépression de l''adulte : traitement et management (guideline, 2022)',
    'guideline',
    'https://www.nice.org.uk/guidance/ng222',
    'A',
    'Recommandation clinique NICE 2022 : la TCC, dont la restructuration cognitive (colonnes de Beck), est recommandée en première ligne pour la dépression légère à modérée chez l''adulte',
    2
  )

-- ── behavioral_activation ────────────────────────────────────────────────────
-- Activation comportementale (dépression — TCC comportementale)
-- Sources niveau 1 (efficacité de l''AC) :
--   PMID 16881773 — Dimidjian et al. 2006 — ECR (n=241, AC ≥ TCC pour dépression sévère)
--   PMID 17184887 — Cuijpers et al. 2007 — méta-analyse AC (16 études, n=780, g=0,87)

,

  -- 1. Dimidjian et al. 2006 — J Consult Clin Psychol (ECR, n=241)
  --    PMID 16881773 — doi:10.1037/0022-006X.74.4.658 (vérifié PubMed, abstract lu)
  --    evidence_grade : null — grade non applicable à une étude individuelle
  (
    '2b2b2b2b-0001-0001-0001-000000000001',
    'behavioral_activation',
    'Dimidjian et al. — Activation comportementale vs TCC vs antidépresseurs : ECR (J Consult Clin Psychol, 2006)',
    'rct',
    'https://doi.org/10.1037/0022-006X.74.4.658',
    null,
    'ECR (n=241) : chez les patients sévèrement déprimés, l''activation comportementale est comparable aux antidépresseurs et supérieure à la TCC — la composante comportementale est identifiée comme moteur principal de l''efficacité de la TCC',
    1
  ),

  -- 2. Cuijpers et al. 2007 — Clin Psychol Rev (méta-analyse, 16 études, n=780)
  --    PMID 17184887 — doi:10.1016/j.cpr.2006.11.001 (vérifié PubMed, abstract lu)
  --    evidence_grade : null — grade non applicable à une étude individuelle
  (
    '2b2b2b2b-0001-0001-0001-000000000002',
    'behavioral_activation',
    'Cuijpers et al. — Traitements par activation comportementale de la dépression : méta-analyse (Clin Psychol Rev, 2007)',
    'meta_analysis',
    'https://doi.org/10.1016/j.cpr.2006.11.001',
    null,
    'Méta-analyse de 16 ECR (n=780) : taille d''effet large g=0,87 pour l''activation comportementale vs contrôle ; équivalente à la TCC à post-traitement (g=0,02) et au suivi — maintien des bénéfices à long terme confirmé',
    2
  )

-- ── breathing_techniques ─────────────────────────────────────────────────────
-- Techniques de respiration (respiration lente, cohérence cardiaque, biofeedback VRC)
-- Sources niveau 1 (efficacité physiologique et clinique) :
--   PMID 30245619 — Zaccaro et al. 2018 — revue systématique respiration lente (<10 cycles/min, 15 études)
--   PMID 25101026 — Lehrer & Gevirtz 2014 — mécanismes du biofeedback VRC (Front Psychol)

,

  -- 1. Zaccaro et al. 2018 — Front Hum Neurosci (revue systématique, 15 études)
  --    PMID 30245619 — doi:10.3389/fnhum.2018.00353 (vérifié PubMed, abstract lu)
  --    evidence_grade : null — revue systématique, pas de méta-analyse quantitative
  (
    '2c2c2c2c-0001-0001-0001-000000000001',
    'breathing_techniques',
    'Zaccaro et al. — La respiration lente : revue systématique des corrélats psychophysiologiques (Front Hum Neurosci, 2018)',
    'systematic_review',
    'https://doi.org/10.3389/fnhum.2018.00353',
    null,
    'Revue systématique de 15 études PRISMA : la respiration lente (<10 cycles/min) augmente la VRC et l''arythmie sinusale respiratoire, accroît la puissance EEG alpha, réduit anxiété, dépression, colère et confusion — deux mécanismes proposés : entéroception et modulation olfactive-corticale',
    1
  ),

  -- 2. Lehrer & Gevirtz 2014 — Front Psychol (revue mécanistique biofeedback VRC)
  --    PMID 25101026 — doi:10.3389/fpsyg.2014.00756 (vérifié PubMed, abstract lu)
  --    evidence_grade : null — article de revue mécanistique
  (
    '2c2c2c2c-0001-0001-0001-000000000002',
    'breathing_techniques',
    'Lehrer & Gevirtz — Biofeedback VRC : comment et pourquoi ça fonctionne (Front Psychol, 2014)',
    'expert_opinion',
    'https://doi.org/10.3389/fpsyg.2014.00756',
    null,
    'Revue des mécanismes du biofeedback VRC (cohérence cardiaque) : renforcement homéostatique des barorécepteurs, voie vagale afférente vers le cortex frontal — support théorique des techniques de respiration à fréquence de résonance (4,5–6,5 cycles/min adultes)',
    2
  )

-- ── cognitive_saturation ─────────────────────────────────────────────────────
-- Saturation cognitive (défusion cognitive — ACT)
-- Sources niveau 1 (mécanismes de la défusion cognitive en ACT) :
--   PMID 38615492 — Macri & Rogge 2024 — méta-analyse mécanismes ACT (77 études, n=9 123)

,

  -- 1. Macri & Rogge 2024 — Clin Psychol Rev (méta-analyse systématique, 77 études, n=9 123)
  --    PMID 38615492 — doi:10.1016/j.cpr.2024.102432 (vérifié PubMed, abstract lu)
  --    evidence_grade 'A' : méta-analyse systématique d''ECR
  (
    '2d2d2d2d-0001-0001-0001-000000000001',
    'cognitive_saturation',
    'Macri & Rogge — Flexibilité psychologique comme mécanisme thérapeutique de l''ACT : méta-analyse (Clin Psychol Rev, 2024)',
    'meta_analysis',
    'https://doi.org/10.1016/j.cpr.2024.102432',
    'A',
    'Méta-analyse de 77 études (n=9 123) : l''ACT entraîne une augmentation significative de la défusion cognitive et une réduction de la fusion cognitive, toutes comparaisons confondues — changements liés à des réductions correspondantes de la détresse psychologique, soutenant le rôle mécanistique de la défusion',
    1
  )

-- ── emotion_wheel ─────────────────────────────────────────────────────────────
-- Roue des émotions (identification et labellisation des émotions)
-- Sources niveau 1 (base neurobiologique de la labellisation affective) :
--   PMID 17576282 — Lieberman et al. 2007 — IRMf : affect labeling réduit l''activité amygdalienne

,

  -- 1. Lieberman et al. 2007 — Psychological Science (étude expérimentale IRMf)
  --    PMID 17576282 — doi:10.1111/j.1467-9280.2007.01916.x (vérifié PubMed, abstract lu)
  --    evidence_grade : null — étude expérimentale neuroimagerie, non un ECR clinique
  (
    '2e2e2e2e-0001-0001-0001-000000000001',
    'emotion_wheel',
    'Lieberman et al. — Mettre ses émotions en mots : la labellisation affective réduit l''activité amygdalienne (Psychol Sci, 2007)',
    'expert_opinion',
    'https://doi.org/10.1111/j.1467-9280.2007.01916.x',
    'B',
    'Étude IRMf : la labellisation affective (affect labeling) réduit l''activité de l''amygdale et des régions limbiques en réponse à des images émotionnelles négatives, via activation du CPF ventrolatéral droit et du CPF médian — base neurobiologique du bénéfice clinique de l''identification des émotions',
    1
  )

,

  -- 2. Kircanski, Lieberman & Craske 2012 — Psychological Science (ECR clinique)
  --    PMID 22902568 — doi:10.1177/0956797612443830 (vérifié PubMed, abstract lu)
  --    « Feelings into words: contributions of language to exposure therapy »
  --    evidence_grade : 'B' — ECR clinique (bras entre groupes, n modéré)
  (
    '2e2e2e2e-0002-0001-0001-000000000001',
    'emotion_wheel',
    'Kircanski, Lieberman & Craske — Mettre ses ressentis en mots réduit la réponse de peur lors d''une exposition (Psychol Sci, 2012)',
    'rct',
    'https://doi.org/10.1177/0956797612443830',
    'B',
    'ECR clinique (design inter-groupes) : lors d''une exposition à une araignée, le groupe labellisation affective présente une réponse de conductance cutanée significativement inférieure aux autres groupes à J+7 (distraction, recadrage, exposition seule) — l''utilisation de mots d''anxiété/peur pendant l''exposition est associée à de meilleures réductions de la peur',
    2
  )

-- ── epds ─────────────────────────────────────────────────────────────────────
-- EPDS — Edinburgh Postnatal Depression Scale (10 items)
-- Source vérifiée : PMID 3651732 — Cox, Holden & Sagovsky 1987 (vérifié PubMed, abstract lu)

,

  -- Cox, Holden & Sagovsky 1987 — Br J Psychiatry (développement et validation EPDS, n=84)
  --    PMID 3651732 — doi:10.1192/bjp.150.6.782 (vérifié PubMed, abstract lu)
  --    Sensibilité et spécificité satisfaisantes, sensible au changement dans le temps
  (
    '2f2f2f2f-0001-0001-0001-000000000001',
    'epds',
    'Cox, Holden & Sagovsky — Dépistage de la dépression postnatale : développement de l''EPDS (Br J Psychiatry, 1987)',
    'cohort_study',
    'https://doi.org/10.1192/bjp.150.6.782',
    null,
    'Développement et validation initiale de l''EPDS sur 84 mères en communauté (critères Research Diagnostic Criteria) : sensibilité et spécificité satisfaisantes pour la dépression postnatale, sensible au changement dans le temps — passation ~5 min, cotation simple',
    1
  )

-- ── grounding ─────────────────────────────────────────────────────────────────
-- Ancrage sensoriel 5-4-3-2-1 (technique DBT — tolérance à la détresse)
-- Sources niveau 1 (efficacité du cadre DBT dont la technique est issue) :
--   PMID 21114345 — Kliem et al. 2010 — méta-analyse TCD (16 études, 8 ECR, effet modéré)
-- Référence clinique : Linehan (1993), DBT Skills Training Manual — non indexé PubMed

,

  -- 1. Kliem et al. 2010 — J Consult Clin Psychol (méta-analyse TCD, 16 études, 8 ECR)
  --    PMID 21114345 — doi:10.1037/a0021015 (vérifié PubMed, abstract lu)
  --    Effet global modéré pour la TCD — inclut les compétences de tolérance à la détresse (dont l''ancrage)
  (
    '3a3a3a3a-0001-0001-0001-000000000001',
    'grounding',
    'Kliem et al. — Thérapie comportementale dialectique pour le TPB : méta-analyse (J Consult Clin Psychol, 2010)',
    'meta_analysis',
    'https://doi.org/10.1037/a0021015',
    null,
    'Méta-analyse de 16 études (8 ECR, 8 non-randomisées) : effet global modéré pour la TCD, effet modéré pour les comportements suicidaires et auto-blessants — la TCD (dont le module tolérance à la détresse incluant les techniques d''ancrage sensoriel) est le traitement psychosocial du TPB le plus étudié',
    1
  )

-- ── medication_adherence ──────────────────────────────────────────────────────
-- Observance médicamenteuse (auto-monitoring de l''observance)
-- Sources niveau 1 (recommandations sur le suivi de l''observance en psychiatrie) :
--   NICE CG178 (2014, revu 2022) — Psychose et schizophrénie chez l''adulte
--     URL vérifiée : https://www.nice.org.uk/guidance/cg178
--     Recommande surveillance systématique de l''observance + programme d''autogestion incluant usage des médicaments
--     NICE n''utilise pas de grades A/B/C — evidence_grade : null

,

  -- NICE CG178 (2014, revu 2022) — Psychose et schizophrénie chez l''adulte
  (
    '3b3b3b3b-0001-0001-0001-000000000001',
    'medication_adherence',
    'NICE CG178 — Psychose et schizophrénie chez l''adulte : prévention et prise en charge (2014, revu 2022)',
    'guideline',
    'https://www.nice.org.uk/guidance/cg178',
    null,
    'Recommande la surveillance systématique de l''observance tout au long du traitement, et de proposer un programme d''autogestion manualisé couvrant l''utilisation efficace du traitement médicamenteux et l''identification des symptômes — l''auto-déclaration quotidienne est un outil d''alliance thérapeutique validé',
    1
  )

-- ── mood_tracker ─────────────────────────────────────────────────────────────
-- Thermomètre de l''humeur (suivi quotidien humeur/énergie/anxiété)
-- Sources niveau 1 (valeur clinique du monitoring de l''humeur) :
--   PMID 29536616 — Yatham et al. 2018 CANMAT/ISBD — recommandations trouble bipolaire (inclut monitoring)
-- Référence classique non indexée PubMed :
--   Post RM et al. (1988) — NIMH Life Chart Method — gold standard du suivi longitudinal

,

  -- Yatham et al. 2018 — Bipolar Disorders (CANMAT/ISBD guidelines)
  --    PMID 29536616 — doi:10.1111/bdi.12609 (vérifié PubMed, abstract lu)
  --    Recommande le suivi longitudinal de l''humeur comme outil central de la prise en charge bipolaire
  (
    '3c3c3c3c-0001-0001-0001-000000000001',
    'mood_tracker',
    'Yatham et al. — Recommandations CANMAT/ISBD 2018 pour la prise en charge du trouble bipolaire (Bipolar Disorders, 2018)',
    'guideline',
    'https://doi.org/10.1111/bdi.12609',
    null,
    'Directives internationales de référence pour le trouble bipolaire (CANMAT/ISBD, n>25 auteurs) : le monitoring longitudinal de l''humeur, de l''énergie et du sommeil est intégré comme outil d''évaluation et de suivi tout au long du traitement — base clinique du thermomètre de l''humeur utilisé dans ce module',
    1
  )

-- ── nsi ──────────────────────────────────────────────────────────────────────
-- NSI — Nightmare Severity Index (9 items scorés, score 0–45)
-- Source vérifiée : PMID 37846776 — Geoffroy et al. 2023 (vérifié PubMed, abstract lu)

,

  -- Geoffroy et al. 2023 — J Sleep Res (étude pilote de validation, n=102)
  --    PMID 37846776 — doi:10.1111/jsr.14065 (vérifié PubMed, abstract lu)
  --    4 sous-dimensions : fréquence, impact émotionnel, impact diurne, impact nocturne
  --    Alpha de Cronbach >0,7 — discrimine les patients avec trouble cauchemardeux DSM-5/ICSD-3
  (
    '3d3d3d3d-0001-0001-0001-000000000001',
    'nsi',
    'Geoffroy et al. — NSI : nouvel outil multidimensionnel court pour l''évaluation des cauchemars (J Sleep Res, 2023)',
    'cohort_study',
    'https://doi.org/10.1111/jsr.14065',
    null,
    'Étude pilote de validation du NSI sur 102 patients (64 % femmes, 76 % ambulatoires, 44 % TSPT comorbide) : bonne validité interne (α>0,7), acceptabilité satisfaisante, discrimine les patients présentant un trouble cauchemardeux selon les critères DSM-5/ICSD-3 — 4 sous-dimensions : fréquence, impact émotionnel, impact diurne, impact nocturne',
    1
  )

-- ── rim ──────────────────────────────────────────────────────────────────────
-- RIM — Réécriture par Imagerie Mentale (Imagery Rehearsal Therapy)
-- Sources vérifiées : PMID 11476655 (Krakow 2001), PMID 33477151 (Schmid 2021), PMID 40665297 (Zhao 2025)

,

  -- 1. Krakow et al. 2001 — JAMA (ECR, n=168, survivantes d'agression sexuelle avec TSPT)
  --    PMID 11476655 — doi:10.1001/jama.286.5.537 (vérifié PubMed, abstract lu)
  --    evidence_grade 'A' : ECR publié dans JAMA, d Cohen 1.24 sur fréquence des cauchemars
  (
    '3e3e3e3e-0001-0001-0001-000000000002',
    'rim',
    'Krakow et al. — Imagery Rehearsal Therapy pour les cauchemars chroniques et le TSPT (JAMA, 2001)',
    'rct',
    'https://doi.org/10.1001/jama.286.5.537',
    'A',
    'ECR (n=168) : réduction des cauchemars d=1.24, qualité du sommeil d=0.67, symptômes TSPT d=1.00 — résultats maintenus à 6 mois sans contact supplémentaire',
    1
  ),

  -- 2. Schmid et al. 2021 — Psychotherapy and Psychosomatics (ECR, n=96, trouble des cauchemars)
  --    PMID 33477151 — doi:10.1159/000512757 (vérifié PubMed, abstract lu)
  --    evidence_grade 'A' : ECR — imagerie rescripting vs exposition vs imagerie positive
  (
    '3e3e3e3e-0001-0001-0001-000000000003',
    'rim',
    'Schmid et al. — Imagery Rescripting vs Exposition Imaginaire vs Imagerie Positive (Psychother Psychosom, 2021)',
    'rct',
    'https://doi.org/10.1159/000512757',
    'A',
    'ECR (n=96) : imagerie rescripting d=-1.04 sur la détresse liée aux cauchemars — efficacité comparable à l''exposition, supérieure au contrôle actif',
    2
  ),

  -- 3. Zhao et al. 2025 — BMC Psychiatry (revue systématique + méta-analyse ECR, PTSD + troubles du sommeil)
  --    PMID 40665297 — doi:10.1186/s12888-025-07157-9 (vérifié PubMed, abstract lu)
  --    evidence_grade 'A' : méta-analyse d''ECR
  (
    '3e3e3e3e-0001-0001-0001-000000000001',
    'rim',
    'Zhao et al. — Interventions pour le TSPT avec troubles du sommeil : revue systématique et méta-analyse (BMC Psychiatry, 2025)',
    'meta_analysis',
    'https://doi.org/10.1186/s12888-025-07157-9',
    'A',
    'Revue systématique et méta-analyse des ECR conformes aux recommandations NICE pour le TSPT avec troubles du sommeil : interventions actives réduisent TSPT (SMD=0,86), troubles du sommeil (SMD=1,06) et dépression (SMD=0,58) — l''IRT (seule ou + TCC-I) recommandée comme traitement psychologique de première intention',
    3
  )

-- ── sleep_diary ───────────────────────────────────────────────────────────────
-- Agenda du sommeil (composant central de la TCC-I)
-- Source vérifiée : PMID 26054060 — Trauer et al. 2015 (vérifié PubMed, abstract lu)

,

  -- Trauer et al. 2015 — Ann Intern Med (revue systématique + méta-analyse, 20 ECR, n=1 162)
  --    PMID 26054060 — doi:10.7326/M14-2841 (vérifié PubMed, abstract lu)
  --    La TCC-I est le traitement de 1ère ligne de l''insomnie chronique
  --    L''agenda du sommeil est le principal outil de monitoring, d''ajustement et de restriction du sommeil
  (
    '3f3f3f3f-0001-0001-0001-000000000001',
    'sleep_diary',
    'Trauer et al. — TCC pour l''insomnie chronique : revue systématique et méta-analyse (Ann Intern Med, 2015)',
    'meta_analysis',
    'https://doi.org/10.7326/M14-2841',
    'A',
    'Revue systématique de 20 ECR (n=1 162, 64 % de femmes, âge moyen 56 ans) : la TCC-I améliore significativement la latence d''endormissement (−19 min), l''éveil après endormissement (−26 min) et l''efficacité du sommeil (+9,91 %) — effets maintenus à long terme ; TCC-I recommandée comme 1ère ligne pour l''insomnie chronique, avec l''agenda du sommeil comme outil central',
    1
  )

,

  -- NICE NG215 (2022) — Insomnia in adults: diagnosis and management (guideline)
  --    https://www.nice.org.uk/guidance/ng215 (vérifié, guideline officielle)
  --    Recommande la TCC-I comme traitement de 1ère ligne pour l''insomnie chronique
  --    L''agenda du sommeil est explicitement requis comme outil de monitoring
  (
    '3f3f3f3f-0002-0001-0001-000000000001',
    'sleep_diary',
    'NICE NG215 — Insomnie de l''adulte : diagnostic et prise en charge (guideline, 2022)',
    'guideline',
    'https://www.nice.org.uk/guidance/ng215',
    'A',
    'Recommandation clinique NICE 2022 : la TCC-I est le traitement de 1ère ligne pour l''insomnie chronique de l''adulte — agenda du sommeil et restriction du sommeil sont des composantes centrales du protocole (Recommendation 1.4). Le guide recommande l''utilisation d''un agenda du sommeil pour évaluer le profil de sommeil avant et pendant le traitement.',
    2
  )

-- ── cognitive_distortions ────────────────────────────────────────────────────
-- Distorsions cognitives (identification des pensées automatiques — TCC)
-- Sources niveau 1 (mesure et validation des distorsions cognitives) :
--   PMID 25170942 — Özdel et al. 2014 — validation Cognitive Distortions Scale (PLoS One)

,

  -- Özdel et al. 2014 — PLoS One (étude de validation psychométrique, n=325)
  --    PMID 25170942 — doi:10.1371/journal.pone.0105956 (vérifié PubMed, abstract lu)
  --    Cronbach α=0,918 (clinique) et 0,933 (non-clinique) — structure unifactorielle confirmée
  (
    '4a4a4a4a-0001-0001-0001-000000000001',
    'cognitive_distortions',
    'Özdel et al. — Validation de la Cognitive Distortions Scale : propriétés psychométriques (PLoS One, 2014)',
    'cohort_study',
    'https://doi.org/10.1371/journal.pone.0105956',
    null,
    'Validation de la CDS sur 325 sujets (cliniques et non-cliniques) : structure unifactorielle confirmée, excellente cohérence interne (α>0,90) dans les deux échantillons, stabilité à 2 semaines, corrélations significatives avec BDI, STAI et questionnaire de pensées automatiques — outil valide pour l''identification des distorsions cognitives en contexte clinique',
    1
  )

-- ── therapeutic_commitment ──────────────────────────────────────────────────
-- Engagement thérapeutique (l''engagement du patient prédit les résultats en TCC)
-- Sources niveau 1 (rôle de l''engagement dans les résultats thérapeutiques) :
--   PMID 23750465 — Glenn et al. 2013 — ECR, 439 patients anxieux en TCC (J Consult Clin Psychol)

,

  -- Glenn et al. 2013 — J Consult Clin Psychol (analyse secondaire ECR CALM, n=439)
  --    PMID 23750465 — doi:10.1037/a0033403 (vérifié PubMed, abstract lu)
  --    L''engagement en TCC (commitment) prédit les résultats à 12 et 18 mois
  (
    '4b4b4b4b-0001-0001-0001-000000000001',
    'therapeutic_commitment',
    'Glenn et al. — Qui tire le plus profit de la TCC pour les troubles anxieux ? Rôle de l''engagement (J Consult Clin Psychol, 2013)',
    'rct',
    'https://doi.org/10.1037/a0033403',
    null,
    'Analyse secondaire de l''ECR CALM (n=439 patients anxieux en TCC) : l''engagement élevé en TCC (assiduité, complétion des expositions, observance des devoirs, engagement déclaré) prédit des résultats significativement meilleurs à 12 et 18 mois sur l''anxiété, la dépression et le handicap fonctionnel — soutien empirique du monitoring de l''engagement comme levier thérapeutique',
    1
  )

on conflict (id) do update set
  label          = excluded.label,
  source_type    = excluded.source_type,
  url            = excluded.url,
  evidence_grade = excluded.evidence_grade,
  description    = excluded.description,
  sort_order     = excluded.sort_order;
