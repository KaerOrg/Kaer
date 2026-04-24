export type ModuleType =
  // Sécurité & Gestion de Crise
  | 'crisis_plan'
  | 'therapeutic_commitment'
  | 'distress_tolerance'
  // Surveillance Iatrogénique & Somatique
  | 'medication_side_effects'
  | 'medication_adherence'
  | 'psychoeducation'
  // Hygiène de Vie & Rythmes Biologiques
  | 'sleep_diary'
  | 'diet_weight_psycho'
  | 'chronobiology_tracker'
  // Régulation Émotionnelle & Humeur
  | 'mood_tracker'
  | 'emotion_wheel'
  | 'behavioral_activation'
  // Restructuration Cognitive
  | 'beck_columns'
  | 'cognitive_distortions'
  | 'grounding'
  | 'rim'
  // Anxiété, Phobies & TOC
  | 'fear_thermometer'
  | 'exposure_hierarchy'
  | 'breathing_techniques'
  | 'cognitive_saturation'
  // Addictologie & Impulsivité
  | 'craving_journal'
  | 'decisional_balance'
  // Échelles & Questionnaires cliniques
  | 'phq9'
  | 'gad7'
  | 'epds'
  | 'rcads'
  | 'bsl23'
  | 'cape42'
  | 'audit'

export interface Database {
  public: {
    Tables: {
      practitioners: {
        Row: {
          id: string
          email: string
          name: string
          professional_title: string | null
          language_preference: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          professional_title?: string | null
          language_preference?: string
        }
        Update: {
          name?: string
          professional_title?: string | null
          language_preference?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      practitioner_patients: {
        Row: {
          id: string
          practitioner_id: string
          patient_id: string
          patient_alias: string | null
          created_at: string
        }
        Insert: {
          practitioner_id: string
          patient_id: string
          patient_alias?: string | null
        }
        Update: {
          patient_alias?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          id: string
          practitioner_id: string
          patient_email: string
          token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          practitioner_id: string
          patient_email: string
          token: string
          expires_at: string
        }
        Update: {
          accepted_at?: string | null
        }
        Relationships: []
      }
      patient_modules: {
        Row: {
          id: string
          patient_id: string
          practitioner_id: string
          module_type: ModuleType
          config: Record<string, unknown>
          unlocked_at: string
        }
        Insert: {
          patient_id: string
          practitioner_id: string
          module_type: ModuleType
          config?: Record<string, unknown>
        }
        Update: {
          config?: Record<string, unknown>
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Types pratiques pour l'app
export interface Practitioner {
  id: string
  email: string
  name: string
  professional_title: string | null
  language_preference: string
}

export interface PatientSummary {
  id: string
  email: string
  patient_alias: string | null
  modules: PatientModule[]
}

export interface PatientModule {
  id: string
  patient_id: string
  practitioner_id: string
  module_type: ModuleType
  config: Record<string, unknown>
  unlocked_at: string
}

export const MODULE_LABELS: Record<ModuleType, string> = {
  // Sécurité & Gestion de Crise
  crisis_plan: 'Plan de crise',
  therapeutic_commitment: 'Contrat d\'engagement thérapeutique',
  distress_tolerance: 'Boîte à outils de tolérance à la détresse',
  // Surveillance Iatrogénique & Somatique
  medication_side_effects: 'Thermomètre de tolérance aux psychotropes',
  medication_adherence: 'Module Observance',
  psychoeducation: 'Psychoéducation',
  // Hygiène de Vie & Rythmes Biologiques
  sleep_diary: 'Agenda du sommeil',
  diet_weight_psycho: 'Psychoéducation diététique & poids',
  chronobiology_tracker: 'Traqueur de régularité chronobiologique',
  // Régulation Émotionnelle & Humeur
  mood_tracker: 'Thermomètre de l\'humeur & énergie',
  emotion_wheel: 'Roue des émotions',
  behavioral_activation: 'Journal d\'activation comportementale',
  // Restructuration Cognitive
  beck_columns: 'Colonnes de Beck',
  cognitive_distortions: 'Détecteur de distorsions cognitives',
  grounding: 'Techniques d\'ancrage',
  rim: 'RIM – Imagerie mentale',
  // Anxiété, Phobies & TOC
  fear_thermometer: 'Thermomètre de la peur',
  exposure_hierarchy: 'Hiérarchie d\'exposition',
  breathing_techniques: 'Techniques de respiration',
  cognitive_saturation: 'Saturation cognitive',
  // Addictologie & Impulsivité
  craving_journal: 'Journal de craving',
  decisional_balance: 'Balance décisionnelle',
  // Échelles & Questionnaires cliniques
  phq9: 'PHQ-9 — Dépression',
  gad7: 'GAD-7 — Anxiété généralisée',
  epds: 'EPDS — Dépression périnatale',
  rcads: 'RCADS — Anxiété & dépression (enfant/ado)',
  bsl23: 'BSL-23 — Symptômes borderline',
  cape42: 'CAPE-42 — Expériences psychotiques',
  audit: "AUDIT — Consommation d'alcool",
}

export const MODULE_DESCRIPTIONS: Record<ModuleType, string> = {
  // Sécurité & Gestion de Crise
  crisis_plan: 'Plan d\'action personnalisé pour les moments difficiles (Stanley & Brown).',
  therapeutic_commitment: 'Alliance thérapeutique : engagement à utiliser les ressources avant tout passage à l\'acte.',
  distress_tolerance: 'Cartes d\'actions physiologiques d\'urgence inspirées de la TCD pour casser une crise aiguë.',
  // Surveillance Iatrogénique & Somatique
  medication_side_effects: 'Jauges d\'auto-évaluation (0-3) : sédation, akathisie, tremblements, sécheresse buccale.',
  medication_adherence: 'Auto-rapport hebdomadaire d\'observance du traitement médicamenteux.',
  psychoeducation: 'Cartes de savoir thérapeutique : sommeil, ancrage, distorsions, interactions médicamenteuses.',
  // Hygiène de Vie & Rythmes Biologiques
  sleep_diary: 'Suivi quotidien du sommeil : heure de coucher, lever, efficacité.',
  diet_weight_psycho: 'Comprendre et gérer les fringales et la prise de poids sous antipsychotiques.',
  chronobiology_tracker: 'Suivi des zeitgebers : heure de lever, coucher, premier repas — essentiel pour les troubles bipolaires.',
  // Régulation Émotionnelle & Humeur
  mood_tracker: 'Suivi quotidien de l\'humeur et du niveau d\'énergie sur une échelle visuelle.',
  emotion_wheel: 'Explorer et nommer ses émotions avec précision pour lutter contre l\'alexithymie.',
  behavioral_activation: 'Planification d\'activités notées selon le Plaisir (0-10) et la Maîtrise (0-10).',
  // Restructuration Cognitive
  beck_columns: 'Journal des pensées : Situation, Émotion, Pensée automatique, Pensée alternative.',
  cognitive_distortions: 'Cartes éducatives sur les pièges de la pensée (tout-ou-rien, surgénéralisation, lecture de pensée…)',
  grounding: 'Exercice 5-4-3-2-1 pour revenir au présent en cas de dissociation ou de rumination sévère.',
  rim: 'Technique de retraitement par l\'imagerie mentale.',
  // Anxiété, Phobies & TOC
  fear_thermometer: 'Mesurer et visualiser son niveau d\'anxiété (SUDs, 0-100).',
  exposure_hierarchy: 'Constructeur de paliers d\'exposition graduelle pour phobies et TOC.',
  breathing_techniques: 'Guide visuel de respiration carrée et cohérence cardiaque avec compteur local.',
  cognitive_saturation: 'Exercice de répétition rapide pour interrompre les ruminations.',
  // Addictologie & Impulsivité
  craving_journal: 'Noter l\'intensité de l\'envie (0-10), le déclencheur et la stratégie d\'évitement utilisée.',
  decisional_balance: 'Outil d\'entretien motivationnel : avantages/inconvénients à consommer vs. à arrêter.',
  // Échelles & Questionnaires cliniques
  phq9: 'Questionnaire de dépistage et mesure de la sévérité de la dépression en 9 items.',
  gad7: 'Évaluation rapide en 7 items du trouble anxieux généralisé.',
  epds: 'Dépistage de la dépression périnatale (ante et post-partum). Recommandé par la HAS.',
  rcads: "Mesure des symptômes anxieux et dépressifs chez l'enfant et l'adolescent (8-18 ans).",
  bsl23: 'Mesure de la sévérité des symptômes du trouble de personnalité borderline.',
  cape42: 'Évaluation des expériences psychotiques subcliniques positives, négatives et dépressives.',
  audit: "Dépistage OMS de la consommation d'alcool problématique en 10 items.",
}

// Métadonnées des cartes disponibles (contenu Markdown côté mobile uniquement)
export interface PsychoCardMeta {
  id: string
  title: string
  description: string
}

export const PSYCHO_CARD_CATALOG: PsychoCardMeta[] = [
  {
    id: 'card_sleep_01',
    title: "Règles d'hygiène du sommeil",
    description: '10 conseils pour améliorer la qualité du sommeil',
  },
  {
    id: 'card_grounding_01',
    title: "Technique d'ancrage 5-4-3-2-1",
    description: "Revenir au moment présent en cas d'anxiété ou de dissociation",
  },
  {
    id: 'card_cbt_01',
    title: 'Identifier les distorsions cognitives',
    description: 'Reconnaître les pièges de la pensée automatique (TCC)',
  },
  {
    id: 'card_medication_appetite_01',
    title: 'Traitements et Appétit : Reprendre le contrôle',
    description: 'Comprendre et gérer la faim liée aux traitements',
  },
  {
    id: 'card_medication_lithium_01',
    title: 'Lithium : Hydratation et règles de sécurité',
    description: 'Les 3 règles essentielles pour rester en sécurité sous Lithium',
  },
]

// Entrée d'observance pour une carte (miroir du type côté mobile et shared)
export interface PsychoeducationCardEntry {
  card_id: string
  is_read: boolean
  unlocked_at: string // ISO 8601
}
