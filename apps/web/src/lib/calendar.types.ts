export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0=Lundi … 6=Dimanche

export interface AvailabilityRule {
  id: string
  practitioner_id: string
  day_of_week: DayOfWeek
  start_time: string        // "HH:MM"
  end_time: string          // "HH:MM"
  slot_duration_minutes: number
  buffer_minutes: number    // temps de battement entre deux RDV
  created_at: string
}

export interface AvailabilityException {
  id: string
  practitioner_id: string
  exception_date: string    // "YYYY-MM-DD"
  is_closed: boolean
  start_time: string | null
  end_time: string | null
  created_at: string
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled_by_patient'
  | 'cancelled_by_practitioner'
  | 'completed'

export interface Appointment {
  id: string
  practitioner_id: string
  patient_id: string
  starts_at: string         // ISO 8601
  ends_at: string           // ISO 8601
  status: AppointmentStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AppointmentWithPatient extends Appointment {
  patient_display_name: string
  patient_email: string
}

export interface ComputedSlot {
  starts_at: string         // ISO 8601
  ends_at: string           // ISO 8601
  is_available: boolean
  appointment: AppointmentWithPatient | null
}
