export type ScaleCategory =
  | 'Humeur'
  | 'Anxiété'
  | 'Sommeil'
  | 'Addictologie'
  | 'Psychose'
  | 'Personnalité'
  | 'Neurodev'

export type TargetAge = 'perinatal' | 'enfant' | 'ado' | 'adulte' | 'senior'

export interface ClinicalScale {
  readonly id: string
  readonly name: string
  readonly fullTitle: string
  readonly category: ScaleCategory
  readonly targetAges: readonly TargetAge[]
  readonly validatedAgeRange: string
  readonly description: string
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
] as const

export const AGE_BADGE_CONFIG: Record<
  TargetAge,
  { label: string; bg: string; text: string }
> = {
  perinatal: { label: 'Périnatal', bg: '#FBCFE8', text: '#9D174D' },
  enfant:    { label: 'Enfant',    bg: '#BFDBFE', text: '#1E40AF' },
  ado:       { label: 'Ado',       bg: '#DDD6FE', text: '#5B21B6' },
  adulte:    { label: 'Adulte',    bg: '#BBF7D0', text: '#15803D' },
  senior:    { label: 'Senior',    bg: '#C7D2FE', text: '#3730A3' },
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
