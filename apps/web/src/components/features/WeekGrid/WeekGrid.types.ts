import type { AvailabilityRule, AvailabilityException, AppointmentWithPatient } from '../../../lib/calendar.types'

export interface WeekGridProps {
  weekStart: Date                       // Lundi de la semaine affichée
  rules: AvailabilityRule[]
  exceptions: AvailabilityException[]
  appointments: AppointmentWithPatient[]
  onSlotClick: (startsAt: string, endsAt: string, slotDuration: number) => void
  onAppointmentClick: (appointment: AppointmentWithPatient) => void
}

export interface TimeSlotCellProps {
  startsAt: string
  endsAt: string
  topPx: number
  heightPx: number
  onClick: () => void
}

export interface AppointmentBlockProps {
  appointment: AppointmentWithPatient
  topPx: number
  heightPx: number
  onClick: () => void
}
