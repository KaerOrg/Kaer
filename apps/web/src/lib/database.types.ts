export type ModuleType =
  | 'sleep_diary'
  | 'beck_columns'
  | 'fear_thermometer'
  | 'emotion_wheel'
  | 'crisis_plan'
  | 'rim'
  | 'cognitive_saturation'

export interface Database {
  public: {
    Tables: {
      practitioners: {
        Row: {
          id: string
          email: string
          name: string
          professional_title: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          professional_title?: string | null
        }
        Update: {
          name?: string
          professional_title?: string | null
        }
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
      }
    }
  }
}

// Types pratiques pour l'app
export interface Practitioner {
  id: string
  email: string
  name: string
  professional_title: string | null
}

export interface PatientSummary {
  id: string
  email: string
  patient_alias: string | null
  modules: PatientModule[]
}

export interface PatientModule {
  id: string
  module_type: ModuleType
  config: Record<string, unknown>
  unlocked_at: string
}

export const MODULE_LABELS: Record<ModuleType, string> = {
  sleep_diary: 'Agenda du sommeil',
  beck_columns: 'Colonnes de Beck',
  fear_thermometer: 'Thermomètre de la peur',
  emotion_wheel: 'Roue des émotions',
  crisis_plan: 'Plan de crise',
  rim: 'RIM – Imagerie mentale',
  cognitive_saturation: 'Saturation cognitive',
}

export const MODULE_DESCRIPTIONS: Record<ModuleType, string> = {
  sleep_diary: 'Suivi quotidien du sommeil : heure de coucher, lever, qualité.',
  beck_columns: 'Identifier et restructurer les pensées automatiques négatives.',
  fear_thermometer: 'Mesurer et visualiser son niveau d\'anxiété sur une échelle.',
  emotion_wheel: 'Explorer et nommer ses émotions avec précision.',
  crisis_plan: 'Plan d\'action personnalisé pour les moments difficiles.',
  rim: 'Technique de retraitement par l\'imagerie mentale.',
  cognitive_saturation: 'Exercice de répétition rapide pour interrompre les ruminations.',
}
