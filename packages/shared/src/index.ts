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

export interface Module {
  id: string
  type: ModuleType
  name: string
  description: string
  unlockedAt: string
  config?: ModuleConfig
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
}

export interface PatientModule {
  id: string
  patientId: string
  moduleType: ModuleType
  unlockedAt: string
  config: ModuleConfig
}
