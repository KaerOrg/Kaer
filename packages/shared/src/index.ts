// Types partagés entre l'app web (praticien) et l'app mobile (patient)

export type UserRole = 'practitioner' | 'patient'

export type ModuleType =
  | 'sleep_diary'
  | 'beck_columns'
  | 'fear_thermometer'
  | 'emotion_wheel'
  | 'crisis_plan'
  | 'rim'
  | 'cognitive_saturation'
  | 'psychoeducation'

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
