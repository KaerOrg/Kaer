export type ModuleType =
  // Sécurité & Gestion de Crise
  | 'crisis_plan'
  | 'therapeutic_commitment'
  | 'distress_tolerance'
  // Surveillance Iatrogénique & Somatique
  | 'medication_side_effects'
  | 'medication_adherence'
  // Hygiène de Vie & Rythmes Biologiques
  | 'sleep_diary'
  | 'psyedu_sleep'
  | 'psyedu_nutrition'
  | 'psyedu_activity'
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
  | 'snap_iv'
  | 'asrs6'
  | 'asrs18'

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
      cssrs_screen_assessments: {
        Row: {
          id: string
          patient_id: string
          practitioner_id: string
          ideation_answers: Array<{ value: number; description: string }>
          intensite_ideation: {
            frequence: number | null
            duree: number | null
            maitrise: number | null
            dissuasifs: number | null
            causes: number | null
          } | null
          behavior_answers: Array<{ value: number; description: string }>
          nssi: number | null
          nb_tentatives_averees: number | null
          nb_tentatives_interrompues: number | null
          nb_tentatives_avortees: number | null
          comportement_observe: number | null
          suicide_reussi: number | null
          date_tentative_plus_letale: string | null
          letalite_observee: number | null
          letalite_potentielle: number | null
          ideation_level: number
          behavior_count: number
          assessed_at: string
        }
        Insert: {
          patient_id: string
          practitioner_id: string
          ideation_answers: Array<{ value: number; description: string }>
          intensite_ideation?: {
            frequence: number | null
            duree: number | null
            maitrise: number | null
            dissuasifs: number | null
            causes: number | null
          } | null
          behavior_answers: Array<{ value: number; description: string }>
          nssi?: number | null
          nb_tentatives_averees?: number | null
          nb_tentatives_interrompues?: number | null
          nb_tentatives_avortees?: number | null
          comportement_observe?: number | null
          suicide_reussi?: number | null
          date_tentative_plus_letale?: string | null
          letalite_observee?: number | null
          letalite_potentielle?: number | null
          ideation_level: number
          behavior_count: number
          assessed_at?: string
        }
        Update: Record<string, never>
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
  // Hygiène de Vie & Rythmes Biologiques
  sleep_diary: 'Agenda du sommeil',
  psyedu_sleep: 'Sommeil & récupération',
  psyedu_nutrition: 'Alimentation & cerveau',
  psyedu_activity: 'Activité physique douce',
  diet_weight_psycho: 'Psychotropes & alimentation',
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
  snap_iv: 'SNAP-IV — Dépistage TDAH (enfant/ado)',
  asrs6: 'ASRS v1.1 — Dépistage',
  asrs18: 'ASRS v1.1 — Bilan Complet',
}

export const MODULE_DESCRIPTIONS: Record<ModuleType, string> = {
  // Sécurité & Gestion de Crise
  crisis_plan: 'Plan d\'action personnalisé pour les moments difficiles (Stanley & Brown).',
  therapeutic_commitment: 'Alliance thérapeutique : engagement à utiliser les ressources avant tout passage à l\'acte.',
  distress_tolerance: 'Cartes d\'actions physiologiques d\'urgence inspirées de la TCD pour casser une crise aiguë.',
  // Surveillance Iatrogénique & Somatique
  medication_side_effects: 'Jauges d\'auto-évaluation (0-3) : sédation, akathisie, tremblements, sécheresse buccale.',
  medication_adherence: 'Auto-rapport hebdomadaire d\'observance du traitement médicamenteux.',
  // Hygiène de Vie & Rythmes Biologiques
  sleep_diary: 'Suivi quotidien du sommeil : heure de coucher, lever, efficacité.',
  psyedu_sleep: 'Fiches psychoéducatives sur le sommeil, la chronobiologie et la récupération psychiatrique.',
  psyedu_nutrition: 'Fiches psychoéducatives sur l\'axe intestin-cerveau, le microbiote et une alimentation équilibrée.',
  psyedu_activity: 'Fiches psychoéducatives sur l\'activité physique douce, le BDNF, les endorphines et le NEAT.',
  diet_weight_psycho: 'Fiches psychoéducatives sur les interactions entre psychotropes et alimentation : antipsychotiques, méthylphénidate, ISRS, thymorégulateurs.',
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
  snap_iv: 'Grille comportementale de dépistage du TDAH en 26 items — 3 sous-scores : Inattention, Hyperactivité-Impulsivité, Opposition-Défiance. À compléter par un parent ou un enseignant.',
  asrs6: 'Auto-questionnaire de dépistage du TDAH adulte en 6 items (Partie A de l\'ASRS v1.1). Score total 0–24. Validé par l\'OMS.',
  asrs18: 'Auto-questionnaire de bilan complet du TDAH adulte en 18 items (Parties A + B de l\'ASRS v1.1). Score total 0–72.',
}

