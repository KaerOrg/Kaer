import type { Appointment } from '@services/appointmentService'
import { dateToIso } from '@kaer/shared'

export interface AgendaData {
  /** Prochain rendez-vous à venir (le plus proche), mis en avant. `null` si aucun. */
  next: Appointment | null
  /** Rendez-vous à venir suivants (hors `next`), triés du plus proche au plus lointain. */
  upcoming: Appointment[]
  /** Rendez-vous passés ou annulés, triés du plus récent au plus ancien. */
  past: Appointment[]
  /** Dates ISO (YYYY-MM-DD, locales) portant au moins un RDV à venir — points de la bande semaine. */
  eventDays: string[]
}

function isUpcoming(appt: Appointment, now: Date): boolean {
  return (
    new Date(appt.starts_at) >= now &&
    appt.status !== 'cancelled_by_patient' &&
    appt.status !== 'cancelled_by_practitioner'
  )
}

/**
 * Répartit les rendez-vous du patient pour l'écran Agenda : le prochain (mis en avant),
 * les suivants à venir, les passés/annulés, et les jours porteurs d'événements pour la
 * bande semaine. Fonction pure — aucune conclusion clinique, simple tri chronologique.
 */
export function buildAgendaData(appointments: Appointment[], now: Date): AgendaData {
  const upcomingAll = appointments
    .filter((a) => isUpcoming(a, now))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))

  const past = appointments
    .filter((a) => !isUpcoming(a, now))
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at))

  const eventDays = Array.from(
    new Set(upcomingAll.map((a) => dateToIso(new Date(a.starts_at)))),
  )

  return {
    next: upcomingAll[0] ?? null,
    upcoming: upcomingAll.slice(1),
    past,
    eventDays,
  }
}
