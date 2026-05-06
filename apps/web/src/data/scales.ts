export type ScaleCategory =
  | 'Humeur'
  | 'Anxiété'
  | 'Sommeil'
  | 'Addictologie'
  | 'Psychose'
  | 'Personnalité'
  | 'Neurodev'
  | 'Trauma'

export type TargetAge = 'perinatal' | 'enfant' | 'ado' | 'adulte' | 'senior'

export interface ClinicalScale {
  readonly id: string
  readonly name: string
  readonly fullTitle: string
  readonly category: ScaleCategory
  readonly targetAges: readonly TargetAge[]
  readonly validatedAgeRange: string
  readonly description: string
  readonly evaluationType: 'auto' | 'hetero'
  readonly reference: {
    readonly label: string
    readonly url: string
  }
}

// Type pour la transmission mobile — category EXCLUE par construction
// (le patient ne doit jamais lire un label nosologique comme "Psychose")
export interface PrescribedScale {
  readonly id: string
  readonly name: string
  readonly fullTitle: string
  readonly validatedAgeRange: string
}

// Ordre chronologique utilisé pour le tri des cartes
export const AGE_ORDER: readonly TargetAge[] = [
  'perinatal',
  'enfant',
  'ado',
  'adulte',
  'senior',
] as const

export const SCALE_CATEGORIES: readonly ScaleCategory[] = [
  'Humeur',
  'Anxiété',
  'Sommeil',
  'Addictologie',
  'Psychose',
  'Personnalité',
  'Neurodev',
  'Trauma',
] as const

export const AGE_BADGE_CONFIG: Record<
  TargetAge,
  { label: string; bg: string; text: string }
> = {
  perinatal: { label: 'Périnatal', bg: '#FBCFE8', text: '#9D174D' },
  enfant:    { label: 'Enfant',    bg: '#BFDBFE', text: '#1E40AF' },
  ado:       { label: 'Ado',       bg: '#DDD6FE', text: '#5B21B6' },
  adulte:    { label: 'Adulte',    bg: '#BBF7D0', text: '#15803D' },
  senior:    { label: 'Senior',    bg: '#FEF08A', text: '#854D0E' },
}

export const CLINICAL_SCALES: readonly ClinicalScale[] = [
  {
    id: 'phq9',
    name: 'PHQ-9',
    fullTitle: 'Patient Health Questionnaire',
    category: 'Humeur',
    targetAges: ['adulte', 'senior'],
    validatedAgeRange: '18+ ans',
    description:
      'Questionnaire de dépistage et de mesure de la sévérité de la dépression en 9 items. Référence mondiale pour le suivi longitudinal.',
    evaluationType: 'auto',
    reference: {
      label: "NICE NG222 — Dépression adulte : PHQ-9 recommandé pour le suivi régulier (2022). Également recommandé par l'APA Clinical Practice Guidelines.",
      url: 'https://www.nice.org.uk/guidance/ng222',
    },
  },
  {
    id: 'gad7',
    name: 'GAD-7',
    fullTitle: 'Generalized Anxiety Disorder 7',
    category: 'Anxiété',
    targetAges: ['adulte', 'senior'],
    validatedAgeRange: '18+ ans',
    description:
      'Évaluation rapide en 7 items du trouble anxieux généralisé. Sensible au changement thérapeutique.',
    evaluationType: 'auto',
    reference: {
      label: 'NICE CG113 — Trouble anxieux généralisé et trouble panique adulte : GAD-7 recommandé en première intention.',
      url: 'https://www.nice.org.uk/guidance/cg113',
    },
  },
  {
    id: 'epds',
    name: 'EPDS',
    fullTitle: 'Edinburgh Postnatal Depression Scale',
    category: 'Humeur',
    targetAges: ['perinatal'],
    validatedAgeRange: '18+ ans (post-partum)',
    description:
      'Dépistage de la dépression périnatale (ante et post-partum). Référence internationale recommandée par la HAS.',
    evaluationType: 'auto',
    reference: {
      label: "HAS — Repérage, diagnostic et prise en charge des troubles psychiques périnatals. EPDS exigé dans l'entretien postnatal précoce obligatoire depuis juillet 2022.",
      url: 'https://www.has-sante.fr/jcms/p_3234406/fr/reperage-diagnostic-et-prise-en-charge-des-troubles-psychiques-perinatals-note-de-cadrage',
    },
  },
  {
    id: 'rcads',
    name: 'RCADS',
    fullTitle: "Revised Children's Anxiety and Depression Scale",
    category: 'Anxiété',
    targetAges: ['enfant', 'ado'],
    validatedAgeRange: '8 - 18 ans',
    description:
      "Mesure des symptômes anxieux et dépressifs chez l'enfant et l'adolescent. Versions auto-rapportée et parentale disponibles.",
    evaluationType: 'auto',
    reference: {
      label: 'CORC (Child Outcomes Research Consortium) — fiche RCADS. Outil de référence des recommandations NICE pour la santé mentale pédiatrique (CG28/NG134).',
      url: 'https://www.corc.uk.net/outcome-measures-guidance/directory-of-outcome-measures/revised-childrens-anxiety-and-depression-scale-rcads/',
    },
  },
  {
    id: 'bsl23',
    name: 'BSL-23',
    fullTitle: 'Borderline Symptom List 23',
    category: 'Personnalité',
    targetAges: ['adulte'],
    validatedAgeRange: '18+ ans',
    description:
      'Mesure de la sévérité des symptômes du trouble de personnalité borderline. Outil de suivi longitudinal en TCD.',
    evaluationType: 'auto',
    reference: {
      label: 'Bohus et al. — Psychopathology, 2009 (validation BSL-23, n=694)',
      url: 'https://pubmed.ncbi.nlm.nih.gov/19023232/',
    },
  },
  {
    id: 'cape42',
    name: 'CAPE-42',
    fullTitle: 'Community Assessment of Psychic Experiences',
    category: 'Psychose',
    targetAges: ['adulte'],
    validatedAgeRange: '15+ ans',
    description:
      'Évaluation des expériences subcliniques positives, négatives et dépressives en population générale et clinique.',
    evaluationType: 'auto',
    reference: {
      label: 'Capra et al. — Front Psychiatry, 2015 (revue systématique des propriétés psychométriques du CAPE)',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4681550/',
    },
  },
  {
    id: 'audit',
    name: 'AUDIT',
    fullTitle: 'Alcohol Use Disorders Identification Test',
    category: 'Addictologie',
    targetAges: ['adulte'],
    validatedAgeRange: '18+ ans',
    description:
      "Dépistage OMS de la consommation d'alcool problématique en 10 items. Recommandé par la HAS pour le repérage précoce.",
    evaluationType: 'auto',
    reference: {
      label: "OMS — Manuel officiel AUDIT, lignes directrices d'utilisation en soins primaires (2001)",
      url: 'https://www.who.int/publications/i/item/WHO-MSD-MSB-01.6a',
    },
  },
  {
    id: 'nsi',
    name: 'NSI',
    fullTitle: 'Nightmare Severity Index',
    category: 'Sommeil',
    targetAges: ['adulte'],
    validatedAgeRange: '18+ ans',
    description:
      "Évaluation multidimensionnelle de la sévérité des cauchemars en 9 items (score 0–45). Mesure la fréquence des réveils, l'intensité émotionnelle et l'impact diurne sur l'humeur, la concentration, la somnolence et le sommeil.",
    evaluationType: 'auto',
    reference: {
      label: "Geoffroy PA et al. — The nightmare severity index (NSI): A short new multidimensional tool for assessing nightmares. J Sleep Res, 2023. CC BY-NC.",
      url: 'https://www.ghu-paris.fr/fr/actualites/index-de-severite-des-cauchemars',
    },
  },
  {
    id: 'asrs18',
    name: 'ASRS v1.1 — Bilan Complet',
    fullTitle: 'Adult ADHD Self-Report Scale v1.1 — Full Assessment (18 items)',
    category: 'Neurodev',
    targetAges: ['adulte'],
    validatedAgeRange: '18+ ans',
    description:
      "Auto-questionnaire de bilan complet du TDAH adulte en 18 items (Parties A + B de l'ASRS v1.1). Score total 0–72, Partie A 0–24, Partie B 0–48. Validé par l'OMS pour une évaluation approfondie en consultation.",
    evaluationType: 'auto',
    reference: {
      label: "Kessler RC et al. — The World Health Organization Adult ADHD Self-Report Scale (ASRS): a short screening scale for use in the general population. Psychol Med 2005;35(2):245-256.",
      url: 'https://pubmed.ncbi.nlm.nih.gov/15841682/',
    },
  },
  {
    id: 'asrs6',
    name: 'ASRS v1.1 — Dépistage',
    fullTitle: 'Adult ADHD Self-Report Scale v1.1 — Screener (6 items)',
    category: 'Neurodev',
    targetAges: ['adulte'],
    validatedAgeRange: '18+ ans',
    description:
      "Auto-questionnaire de dépistage du TDAH adulte en 6 items (Partie A de l'ASRS v1.1). Score total 0–24. Validé par l'OMS et recommandé pour le repérage rapide en consultation.",
    evaluationType: 'auto',
    reference: {
      label: "Kessler RC et al. — The World Health Organization Adult ADHD Self-Report Scale (ASRS): a short screening scale for use in the general population. Psychol Med 2005;35(2):245-256.",
      url: 'https://pubmed.ncbi.nlm.nih.gov/15841682/',
    },
  },
  {
    id: 'snap_iv',
    name: 'SNAP-IV',
    fullTitle: 'Swanson, Nolan and Pelham Rating Scale – version IV',
    category: 'Neurodev',
    targetAges: ['enfant', 'ado'],
    validatedAgeRange: '6 – 18 ans',
    description:
      "Grille comportementale de dépistage du TDAH en 26 items (18 critères DSM-IV TDAH + 8 critères TOD). Trois sous-scores : Inattention (I, 0–27), Hyperactivité-Impulsivité (H/I, 0–27) et Opposition-Défiance (TOD, 0–24). Hétéro-évaluation par le parent ou l'enseignant.",
    evaluationType: 'hetero',
    reference: {
      label: "Swanson JM et al. — Clinical relevance of the primary findings of the MTA: success rates based on severity of ADHD and ODD symptoms at the end of treatment. J Am Acad Child Adolesc Psychiatry, 2001. CADDRA — Lignes directrices canadiennes pour le TDAH (2023).",
      url: 'https://www.caddra.ca',
    },
  },
] as const

export function toPrescribed(scale: ClinicalScale): PrescribedScale {
  return {
    id: scale.id,
    name: scale.name,
    fullTitle: scale.fullTitle,
    validatedAgeRange: scale.validatedAgeRange,
  }
}
