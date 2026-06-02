-- ============================================================
-- SEED — scale_meta fields
-- Métadonnées des échelles cliniques dans module_content_fields
-- Source de vérité : remplace l'array statique CLINICAL_SCALES côté web
-- Idempotent : ON CONFLICT DO NOTHING / DO UPDATE
-- ============================================================

-- ── Modules non encore présents en base ─────────────────────────────────────

insert into public.modules (id, category_id, preview_kind, sort_order, is_invite_excluded, icon, mobile_icon, color)
values
  ('cape42', 'assessments', 'coming_soon', 80, false, 'brain',        '',            '#6366F1'),
  ('audit',  'assessments', 'coming_soon', 90, false, 'clipboard-list', '',          '#6366F1'),
  ('cssrs',  'assessments', 'coming_soon', 95, false, 'shield-alert', '',            '#DC2626')
on conflict (id) do nothing;

-- ── Champs scale_meta (1 par échelle) ───────────────────────────────────────
-- sort_order = ordre d'affichage dans l'accordéon "Échelles et questionnaires"
-- text_code  = clé i18n de la description clinique (scales.descriptions.<id>)

insert into public.module_content_fields (id, module_id, field_type, text_code, sort_order)
values
  ('phq9.scale_meta',    'phq9',    'scale_meta', 'scales.descriptions.phq9',    10),
  ('gad7.scale_meta',    'gad7',    'scale_meta', 'scales.descriptions.gad7',    20),
  ('epds.scale_meta',    'epds',    'scale_meta', 'scales.descriptions.epds',    30),
  ('rcads.scale_meta',   'rcads',   'scale_meta', 'scales.descriptions.rcads',   40),
  ('bsl23.scale_meta',   'bsl23',   'scale_meta', 'scales.descriptions.bsl23',   50),
  ('cape42.scale_meta',  'cape42',  'scale_meta', 'scales.descriptions.cape42',  60),
  ('audit.scale_meta',   'audit',   'scale_meta', 'scales.descriptions.audit',   70),
  ('nsi.scale_meta',     'nsi',     'scale_meta', 'scales.descriptions.nsi',     80),
  ('asrs18.scale_meta',  'asrs18',  'scale_meta', 'scales.descriptions.asrs18',  90),
  ('asrs6.scale_meta',   'asrs6',   'scale_meta', 'scales.descriptions.asrs6',   100),
  ('snap_iv.scale_meta', 'snap_iv', 'scale_meta', 'scales.descriptions.snap_iv', 110),
  ('cssrs.scale_meta',   'cssrs',   'scale_meta', 'scales.descriptions.cssrs',   120)
on conflict (id) do nothing;

-- ── Props des champs scale_meta ──────────────────────────────────────────────

insert into public.field_props (field_id, prop_key, prop_value)
values
  -- PHQ-9
  ('phq9.scale_meta', 'evaluation_type',   'auto'),
  ('phq9.scale_meta', 'category',          'Humeur'),
  ('phq9.scale_meta', 'target_ages',       '["adulte","senior"]'),
  ('phq9.scale_meta', 'validated_age_range','18+ ans'),
  ('phq9.scale_meta', 'has_preview',       'true'),
  ('phq9.scale_meta', 'icon_name',         'clipboard-list'),
  ('phq9.scale_meta', 'reference_label',   'NICE NG222 — Dépression adulte : PHQ-9 recommandé pour le suivi régulier (2022). Également recommandé par l''APA Clinical Practice Guidelines.'),
  ('phq9.scale_meta', 'reference_url',     'https://www.nice.org.uk/guidance/ng222'),

  -- GAD-7
  ('gad7.scale_meta', 'evaluation_type',   'auto'),
  ('gad7.scale_meta', 'category',          'Anxiété'),
  ('gad7.scale_meta', 'target_ages',       '["adulte","senior"]'),
  ('gad7.scale_meta', 'validated_age_range','18+ ans'),
  ('gad7.scale_meta', 'has_preview',       'true'),
  ('gad7.scale_meta', 'icon_name',         'clipboard-list'),
  ('gad7.scale_meta', 'reference_label',   'NICE CG113 — Trouble anxieux généralisé et trouble panique adulte : GAD-7 recommandé en première intention.'),
  ('gad7.scale_meta', 'reference_url',     'https://www.nice.org.uk/guidance/cg113'),

  -- EPDS
  ('epds.scale_meta', 'evaluation_type',   'auto'),
  ('epds.scale_meta', 'category',          'Humeur'),
  ('epds.scale_meta', 'target_ages',       '["perinatal"]'),
  ('epds.scale_meta', 'validated_age_range','18+ ans (post-partum)'),
  ('epds.scale_meta', 'has_preview',       'true'),
  ('epds.scale_meta', 'icon_name',         'activity'),
  ('epds.scale_meta', 'reference_label',   'HAS — Repérage, diagnostic et prise en charge des troubles psychiques périnatals. EPDS exigé dans l''entretien postnatal précoce obligatoire depuis juillet 2022.'),
  ('epds.scale_meta', 'reference_url',     'https://www.has-sante.fr/jcms/p_3234406/fr/reperage-diagnostic-et-prise-en-charge-des-troubles-psychiques-perinatals-note-de-cadrage'),

  -- RCADS
  ('rcads.scale_meta', 'evaluation_type',   'auto'),
  ('rcads.scale_meta', 'category',          'Anxiété'),
  ('rcads.scale_meta', 'target_ages',       '["enfant","ado"]'),
  ('rcads.scale_meta', 'validated_age_range','8 - 18 ans'),
  ('rcads.scale_meta', 'has_preview',       'true'),
  ('rcads.scale_meta', 'icon_name',         'clipboard-list'),
  ('rcads.scale_meta', 'reference_label',   'CORC (Child Outcomes Research Consortium) — fiche RCADS. Outil de référence des recommandations NICE pour la santé mentale pédiatrique (CG28/NG134).'),
  ('rcads.scale_meta', 'reference_url',     'https://www.corc.uk.net/outcome-measures-guidance/directory-of-outcome-measures/revised-childrens-anxiety-and-depression-scale-rcads/'),

  -- BSL-23
  ('bsl23.scale_meta', 'evaluation_type',   'auto'),
  ('bsl23.scale_meta', 'category',          'Personnalité'),
  ('bsl23.scale_meta', 'target_ages',       '["adulte"]'),
  ('bsl23.scale_meta', 'validated_age_range','18+ ans'),
  ('bsl23.scale_meta', 'has_preview',       'true'),
  ('bsl23.scale_meta', 'icon_name',         'clipboard-list'),
  ('bsl23.scale_meta', 'reference_label',   'Bohus et al. — Psychopathology, 2009 (validation BSL-23, n=694)'),
  ('bsl23.scale_meta', 'reference_url',     'https://pubmed.ncbi.nlm.nih.gov/19023232/'),

  -- CAPE-42
  ('cape42.scale_meta', 'evaluation_type',   'auto'),
  ('cape42.scale_meta', 'category',          'Psychose'),
  ('cape42.scale_meta', 'target_ages',       '["adulte"]'),
  ('cape42.scale_meta', 'validated_age_range','15+ ans'),
  ('cape42.scale_meta', 'has_preview',       'false'),
  ('cape42.scale_meta', 'icon_name',         'brain'),
  ('cape42.scale_meta', 'reference_label',   'Capra et al. — Front Psychiatry, 2015 (revue systématique des propriétés psychométriques du CAPE)'),
  ('cape42.scale_meta', 'reference_url',     'https://pmc.ncbi.nlm.nih.gov/articles/PMC4681550/'),

  -- AUDIT
  ('audit.scale_meta', 'evaluation_type',   'auto'),
  ('audit.scale_meta', 'category',          'Addictologie'),
  ('audit.scale_meta', 'target_ages',       '["adulte"]'),
  ('audit.scale_meta', 'validated_age_range','18+ ans'),
  ('audit.scale_meta', 'has_preview',       'false'),
  ('audit.scale_meta', 'icon_name',         'clipboard-list'),
  ('audit.scale_meta', 'reference_label',   'OMS — Manuel officiel AUDIT, lignes directrices d''utilisation en soins primaires (2001)'),
  ('audit.scale_meta', 'reference_url',     'https://www.who.int/publications/i/item/WHO-MSD-MSB-01.6a'),

  -- NSI
  ('nsi.scale_meta', 'evaluation_type',   'auto'),
  ('nsi.scale_meta', 'category',          'Sommeil'),
  ('nsi.scale_meta', 'target_ages',       '["adulte"]'),
  ('nsi.scale_meta', 'validated_age_range','18+ ans'),
  ('nsi.scale_meta', 'has_preview',       'true'),
  ('nsi.scale_meta', 'icon_name',         'moon'),
  ('nsi.scale_meta', 'reference_label',   'Geoffroy PA et al. — The nightmare severity index (NSI): A short new multidimensional tool for assessing nightmares. J Sleep Res, 2023. CC BY-NC.'),
  ('nsi.scale_meta', 'reference_url',     'https://www.ghu-paris.fr/fr/actualites/index-de-severite-des-cauchemars'),

  -- ASRS v1.1 Bilan Complet
  ('asrs18.scale_meta', 'evaluation_type',   'auto'),
  ('asrs18.scale_meta', 'category',          'Neurodev'),
  ('asrs18.scale_meta', 'target_ages',       '["adulte"]'),
  ('asrs18.scale_meta', 'validated_age_range','18+ ans'),
  ('asrs18.scale_meta', 'has_preview',       'true'),
  ('asrs18.scale_meta', 'icon_name',         'zap'),
  ('asrs18.scale_meta', 'reference_label',   'Kessler RC et al. — The World Health Organization Adult ADHD Self-Report Scale (ASRS): a short screening scale for use in the general population. Psychol Med 2005;35(2):245-256.'),
  ('asrs18.scale_meta', 'reference_url',     'https://pubmed.ncbi.nlm.nih.gov/15841682/'),

  -- ASRS v1.1 Dépistage
  ('asrs6.scale_meta', 'evaluation_type',   'auto'),
  ('asrs6.scale_meta', 'category',          'Neurodev'),
  ('asrs6.scale_meta', 'target_ages',       '["adulte"]'),
  ('asrs6.scale_meta', 'validated_age_range','18+ ans'),
  ('asrs6.scale_meta', 'has_preview',       'true'),
  ('asrs6.scale_meta', 'icon_name',         'zap'),
  ('asrs6.scale_meta', 'reference_label',   'Kessler RC et al. — The World Health Organization Adult ADHD Self-Report Scale (ASRS): a short screening scale for use in the general population. Psychol Med 2005;35(2):245-256.'),
  ('asrs6.scale_meta', 'reference_url',     'https://pubmed.ncbi.nlm.nih.gov/15841682/'),

  -- SNAP-IV
  ('snap_iv.scale_meta', 'evaluation_type',   'hetero'),
  ('snap_iv.scale_meta', 'category',          'Neurodev'),
  ('snap_iv.scale_meta', 'target_ages',       '["enfant","ado"]'),
  ('snap_iv.scale_meta', 'validated_age_range','6 – 18 ans'),
  ('snap_iv.scale_meta', 'has_preview',       'true'),
  ('snap_iv.scale_meta', 'icon_name',         'zap'),
  ('snap_iv.scale_meta', 'reference_label',   'Swanson JM et al. — Clinical relevance of the primary findings of the MTA: success rates based on severity of ADHD and ODD symptoms at the end of treatment. J Am Acad Child Adolesc Psychiatry, 2001. CADDRA — Lignes directrices canadiennes pour le TDAH (2023).'),
  ('snap_iv.scale_meta', 'reference_url',     'https://www.caddra.ca'),

  -- C-SSRS
  ('cssrs.scale_meta', 'evaluation_type',   'hetero'),
  ('cssrs.scale_meta', 'category',          'Humeur'),
  ('cssrs.scale_meta', 'target_ages',       '["ado","adulte"]'),
  ('cssrs.scale_meta', 'validated_age_range','≥ 12 ans'),
  ('cssrs.scale_meta', 'no_toggle',         'true'),
  ('cssrs.scale_meta', 'has_preview',       'false'),
  ('cssrs.scale_meta', 'icon_name',         'shield-alert'),
  ('cssrs.scale_meta', 'reference_label',   'Posner K et al. — The Columbia–Suicide Severity Rating Scale: Initial Validity and Internal Consistency Findings From Three Multisite Studies With Adolescents and Adults. Am J Psychiatry, 2011.'),
  ('cssrs.scale_meta', 'reference_url',     'https://pubmed.ncbi.nlm.nih.gov/22193671')
on conflict (field_id, prop_key) do update set prop_value = excluded.prop_value;
