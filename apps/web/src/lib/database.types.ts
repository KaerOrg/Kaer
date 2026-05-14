export type ModuleType = string

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
          patient_first_name: string | null
          patient_last_name: string | null
          patient_birth_date: string | null
          patient_sex: string | null
          created_at: string
        }
        Insert: {
          practitioner_id: string
          patient_id: string
          patient_alias?: string | null
          patient_first_name?: string | null
          patient_last_name?: string | null
          patient_birth_date?: string | null
          patient_sex?: string | null
        }
        Update: {
          patient_alias?: string | null
          patient_first_name?: string | null
          patient_last_name?: string | null
          patient_birth_date?: string | null
          patient_sex?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          id: string
          practitioner_id: string
          patient_email: string
          patient_first_name: string | null
          patient_last_name: string | null
          patient_birth_date: string | null
          patient_sex: string | null
          teen_mode: boolean
          pre_selected_modules: string[]
          token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          practitioner_id: string
          patient_email: string
          patient_first_name?: string | null
          patient_last_name?: string | null
          patient_birth_date?: string | null
          patient_sex?: string | null
          teen_mode?: boolean
          pre_selected_modules?: string[]
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
      module_categories: {
        Row: {
          id: string
          sort_order: number
        }
        Insert: {
          id: string
          sort_order: number
        }
        Update: {
          sort_order?: number
        }
        Relationships: []
      }
      modules: {
        Row: {
          id: string
          category_id: string
          preview_kind: string
          sort_order: number
          is_invite_excluded: boolean
          icon: string
          mobile_icon: string
          color: string
        }
        Insert: {
          id: string
          category_id: string
          preview_kind?: string
          sort_order?: number
          is_invite_excluded?: boolean
          icon?: string
          mobile_icon?: string
          color?: string
        }
        Update: {
          preview_kind?: string
          sort_order?: number
          is_invite_excluded?: boolean
          icon?: string
          mobile_icon?: string
          color?: string
        }
        Relationships: []
      }
      module_content_fields: {
        Row: {
          id: string
          module_id: string
          section_id: string | null
          parent_field_id: string | null
          field_type: string
          text_code: string | null
          sort_order: number
        }
        Insert: {
          id: string
          module_id: string
          section_id?: string | null
          parent_field_id?: string | null
          field_type: string
          text_code?: string | null
          sort_order?: number
        }
        Update: {
          field_type?: string
          text_code?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      field_props: {
        Row: {
          field_id: string
          prop_key: string
          prop_value: string
        }
        Insert: {
          field_id: string
          prop_key: string
          prop_value: string
        }
        Update: {
          prop_value?: string
        }
        Relationships: []
      }
      practitioner_module_settings: {
        Row: {
          practitioner_id: string
          enabled_modules: ModuleType[]
          updated_at: string
        }
        Insert: {
          practitioner_id: string
          enabled_modules: ModuleType[]
          updated_at?: string
        }
        Update: {
          enabled_modules?: ModuleType[]
          updated_at?: string
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
  address: string | null
  phone: string | null
}

export interface PatientSummary {
  id: string
  email: string
  patient_alias: string | null
  patient_first_name: string | null
  patient_last_name: string | null
  patient_birth_date: string | null
  patient_sex: string | null
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

export interface PractitionerModuleSettings {
  practitioner_id: string
  enabled_modules: ModuleType[]
  updated_at: string
}


export interface PsychoeducationCardEntry {
  card_id: string
  is_read: boolean
  unlocked_at: string
}
