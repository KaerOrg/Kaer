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
          address: string | null
          phone: string | null
          avatar_url: string | null
          auto_confirm_appointments: boolean
          mfa_reminder_dismissed: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          professional_title?: string | null
          language_preference?: string
          address?: string | null
          phone?: string | null
          avatar_url?: string | null
          auto_confirm_appointments?: boolean
          mfa_reminder_dismissed?: boolean
        }
        Update: {
          name?: string
          professional_title?: string | null
          language_preference?: string
          address?: string | null
          phone?: string | null
          avatar_url?: string | null
          auto_confirm_appointments?: boolean
          mfa_reminder_dismissed?: boolean
        }
        Relationships: []
      }
      patients: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string
          last_name?: string
          avatar_url?: string | null
        }
        Update: {
          email?: string
          first_name?: string
          last_name?: string
          avatar_url?: string | null
        }
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
        Relationships: [
          {
            foreignKeyName: 'practitioner_patients_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'patients'
            referencedColumns: ['id']
          },
        ]
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
          icon: string
        }
        Insert: {
          id: string
          sort_order: number
          icon?: string
        }
        Update: {
          sort_order?: number
          icon?: string
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
      patient_push_tokens: {
        Row: {
          id: string
          patient_id: string
          expo_push_token: string
          platform: 'ios' | 'android'
          created_at: string
          updated_at: string
        }
        Insert: {
          patient_id: string
          expo_push_token: string
          platform: 'ios' | 'android'
        }
        Update: {
          expo_push_token?: string
          platform?: 'ios' | 'android'
          updated_at?: string
        }
        Relationships: []
      }
      notification_routines: {
        Row: {
          id: string
          patient_module_id: string
          practitioner_id: string
          patient_id: string
          days_of_week: number[]
          time_of_day: string
          patient_time_override: string | null
          practitioner_note: string | null
          is_active: boolean
          patient_paused: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          patient_module_id: string
          practitioner_id: string
          patient_id: string
          days_of_week: number[]
          time_of_day: string
          patient_time_override?: string | null
          practitioner_note?: string | null
          is_active?: boolean
          patient_paused?: boolean
        }
        Update: {
          days_of_week?: number[]
          time_of_day?: string
          patient_time_override?: string | null
          practitioner_note?: string | null
          is_active?: boolean
          patient_paused?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          id: string
          routine_id: string | null
          patient_id: string | null
          sent_at: string
          status: string
        }
        Insert: {
          routine_id?: string | null
          patient_id?: string | null
          status?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      notification_events: {
        Row: {
          id: string
          patient_id: string
          event_type: string
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          patient_id: string
          event_type: string
          metadata?: Record<string, unknown>
        }
        Update: Record<string, never>
        Relationships: []
      }
      patient_entries: {
        Row: {
          id: string
          patient_id: string
          local_id: string
          module_id: string
          entry_kind: string
          payload: Record<string, unknown>
          client_created_at: string
          synced_at: string
        }
        Insert: {
          patient_id: string
          local_id: string
          module_id: string
          entry_kind: string
          payload?: Record<string, unknown>
          client_created_at: string
        }
        Update: {
          payload?: Record<string, unknown>
        }
        Relationships: []
      }
      availability_rules: {
        Row: {
          id: string
          practitioner_id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_duration_minutes: number
          buffer_minutes: number
          created_at: string
        }
        Insert: {
          practitioner_id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_duration_minutes?: number
          buffer_minutes?: number
        }
        Update: {
          day_of_week?: number
          start_time?: string
          end_time?: string
          slot_duration_minutes?: number
          buffer_minutes?: number
        }
        Relationships: []
      }
      availability_exceptions: {
        Row: {
          id: string
          practitioner_id: string
          exception_date: string
          is_closed: boolean
          start_time: string | null
          end_time: string | null
          created_at: string
        }
        Insert: {
          practitioner_id: string
          exception_date: string
          is_closed?: boolean
          start_time?: string | null
          end_time?: string | null
        }
        Update: {
          is_closed?: boolean
          start_time?: string | null
          end_time?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          id: string
          practitioner_id: string
          patient_id: string
          starts_at: string
          ends_at: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          practitioner_id: string
          patient_id: string
          starts_at: string
          ends_at: string
          status?: string
          notes?: string | null
        }
        Update: {
          status?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'appointments_patient_rel_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'practitioner_patients'
            referencedColumns: ['patient_id']
          },
        ]
      }
      caseload_entries: {
        Row: {
          id: string
          practitioner_id: string
          patient_id: string | null
          display_name: string
          status: string
          is_important: boolean
          wake_date: string | null
          invited_email: string | null
          care_pathways: string[]
          last_reviewed_at: string | null
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          practitioner_id: string
          display_name: string
          patient_id?: string | null
          status?: string
          is_important?: boolean
          wake_date?: string | null
          invited_email?: string | null
          care_pathways?: string[]
          last_reviewed_at?: string | null
        }
        Update: {
          display_name?: string
          patient_id?: string | null
          status?: string
          is_important?: boolean
          wake_date?: string | null
          invited_email?: string | null
          care_pathways?: string[]
          last_reviewed_at?: string | null
          archived_at?: string | null
        }
        Relationships: []
      }
      caseload_waits: {
        Row: {
          id: string
          entry_id: string
          practitioner_id: string
          label: string
          relance_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          entry_id: string
          practitioner_id: string
          label: string
          relance_date?: string | null
        }
        Update: {
          label?: string
          relance_date?: string | null
        }
        Relationships: []
      }
      caseload_actions: {
        Row: {
          id: string
          entry_id: string
          practitioner_id: string
          label: string
          due_date: string | null
          due_time: string | null
          is_urgent: boolean
          is_done: boolean
          done_at: string | null
          recurrence_days: number | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          entry_id: string
          practitioner_id: string
          label: string
          due_date?: string | null
          due_time?: string | null
          is_urgent?: boolean
          is_done?: boolean
          done_at?: string | null
          recurrence_days?: number | null
          sort_order?: number
        }
        Update: {
          label?: string
          due_date?: string | null
          due_time?: string | null
          is_urgent?: boolean
          is_done?: boolean
          done_at?: string | null
          recurrence_days?: number | null
          sort_order?: number
        }
        Relationships: []
      }
      caseload_notes: {
        Row: {
          id: string
          entry_id: string
          practitioner_id: string
          body: string
          is_pinned: boolean
          created_at: string
        }
        Insert: {
          entry_id: string
          practitioner_id: string
          body: string
          is_pinned?: boolean
        }
        Update: {
          body?: string
          is_pinned?: boolean
        }
        Relationships: []
      }
      practitioner_patient_notes: {
        Row: {
          id: string
          practitioner_id: string
          patient_id: string
          content: string
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          practitioner_id: string
          patient_id: string
          content: string
          tags?: string[]
        }
        Update: {
          content?: string
          tags?: string[]
        }
        Relationships: []
      }
      crisis_plan_configs: {
        Row: {
          patient_id: string
          practitioner_message: string
          commitment_phrase: string
          updated_at: string
        }
        Insert: {
          patient_id: string
          practitioner_message?: string
          commitment_phrase?: string
          updated_at?: string
        }
        Update: {
          practitioner_message?: string
          commitment_phrase?: string
          updated_at?: string
        }
        Relationships: []
      }
      crisis_plan_coping_cards: {
        Row: {
          id: string
          patient_id: string
          thought: string
          response: string
          sort_order: number
        }
        Insert: {
          patient_id: string
          thought?: string
          response?: string
          sort_order?: number
        }
        Update: {
          thought?: string
          response?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      // Journal d'audit — journalise un accès applicatif (lecture/export/effacement/purge).
      // L'acteur est dérivé de auth.uid() côté base (SECURITY DEFINER) ; le client ne le passe pas.
      log_data_access: {
        Args: {
          p_action: string
          p_target_table: string
          p_target_id?: string | null
          p_patient_id?: string | null
          p_metadata?: Record<string, string | number | boolean | null>
        }
        Returns: undefined
      }
      // Droits patient RGPD (#27) — export (art. 15/20). Renvoie un jsonb brut
      // (miroir neutre des données saisies, aucune interprétation — conforme MDR).
      export_patient_data: {
        Args: { p_patient_id: string }
        Returns: Record<string, unknown>
      }
      // Droits patient RGPD (#27) — effacement du non-cascadant (art. 17). La
      // suppression du compte auth.users (cascade) passe par l'Edge Function.
      erase_patient_data: {
        Args: { p_patient_id: string }
        Returns: { ok: boolean; invitations_deleted: number; caseload_entries_deleted: number }
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Types pratiques pour l'app
export interface ProfessionalTitle {
  code: string
  label_fr: string
  label_en: string
  sort_order: number
}

export interface Practitioner {
  id: string
  email: string
  name: string
  professional_title: string | null
  language_preference: string
  address: string | null
  phone: string | null
  avatar_url: string | null
  mfa_reminder_dismissed: boolean
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

export interface NotificationRoutine {
  id: string
  patient_module_id: string
  practitioner_id: string
  patient_id: string
  days_of_week: number[]
  time_of_day: string
  patient_time_override: string | null
  practitioner_note: string | null
  is_active: boolean
  patient_paused: boolean
  created_at: string
  updated_at: string
}

export interface NotificationRoutineInsert {
  patient_module_id: string
  practitioner_id: string
  patient_id: string
  days_of_week: number[]
  time_of_day: string
  practitioner_note?: string | null
}

export interface NotificationRoutineUpdate {
  days_of_week?: number[]
  time_of_day?: string
  practitioner_note?: string | null
  is_active?: boolean
}

export interface ActivityFeedEvent {
  id: string
  patient_id: string
  event_type: string
  metadata: Record<string, unknown>
  created_at: string
}
