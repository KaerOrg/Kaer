// Types partagés entre l'app web (praticien) et l'app mobile (patient)

export { colors, spacing, radius, fontSize } from './theme'

export type UserRole = 'practitioner' | 'patient'

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

export interface Module {
  id: string
  type: ModuleType
  name: string
  description: string
  unlockedAt: string
  config?: ModuleConfig
}

// Entrée d'observance pour une carte de psychoéducation
export interface PsychoeducationCardEntry {
  card_id: string
  is_read: boolean
  unlocked_at: string // ISO 8601
}

export interface ModuleConfig {
  // Agenda du sommeil
  sleepDiary?: {
    notificationTime?: string // ex: "21:00"
  }
  // Thermomètre de la peur
  fearThermometer?: {
    maxLevel?: number
    customLabels?: string[]
  }
  // Psychoéducation — liste des cartes débloquées avec suivi de lecture
  psychoeducation?: {
    unlocked_cards: PsychoeducationCardEntry[]
  }
}

export interface PatientModule {
  id: string
  patientId: string
  moduleType: ModuleType
  unlockedAt: string
  config: ModuleConfig
}
