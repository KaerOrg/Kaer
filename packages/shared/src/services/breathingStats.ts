// Statistiques descriptives des sessions de respiration, partagées web ≡ mobile.
//
// Restitution brute uniquement (MDR 2017/745) : ces fonctions comptent des jours et
// des sessions, elles ne qualifient jamais une pratique. Aucun seuil, aucune moyenne
// pondérée, aucune tendance. Le hub patient et la vue praticien affichent le même
// compte, sans conclusion.
//
// L'arithmétique de dates passe par `weekDates` (ancrage midi local) : une date
// métier locale ne doit jamais transiter par `toISOString()`.

import { mondayOf, weekDays, shiftDate } from './weekDates'

/**
 * Contrat structurel d'une session vue par les statistiques : sa date métier locale
 * (`YYYY-MM-DD`). Volontairement minimal : la ligne SQLite mobile comme la ligne
 * Supabase le satisfont sans conversion.
 */
export interface BreathingSessionLike {
  readonly date: string
}

/** Un jour de la semaine affichée, dans l'ordre lundi → dimanche. */
export interface WeekPracticeDay {
  /** Date ISO locale du jour (`YYYY-MM-DD`). */
  iso: string
  /** Au moins une session ce jour-là. */
  practiced: boolean
  /** Ce jour est la date de référence (« aujourd'hui »). */
  isToday: boolean
}

/** Ensemble des jours (ISO) portant au moins une session : lookup O(1). */
function practicedDays(sessions: readonly BreathingSessionLike[]): Set<string> {
  const days = new Set<string>()
  for (const s of sessions) days.add(s.date)
  return days
}

/**
 * Les 7 jours de la semaine contenant `today` (lundi → dimanche), chacun marqué
 * « pratiqué » s'il porte au moins une session.
 */
export function buildWeekPractice(
  sessions: readonly BreathingSessionLike[],
  today: string,
): WeekPracticeDay[] {
  const days = practicedDays(sessions)
  return weekDays(mondayOf(today)).map(iso => ({
    iso,
    practiced: days.has(iso),
    isToday: iso === today,
  }))
}

/**
 * Nombre de sessions enregistrées dans la semaine contenant `today`.
 * Compte les **sessions**, pas les jours : l'objectif du module est en sessions par
 * semaine, et deux sessions le même jour comptent pour deux.
 */
export function sessionsInWeek(
  sessions: readonly BreathingSessionLike[],
  today: string,
): number {
  const monday = mondayOf(today)
  const sunday = shiftDate(monday, 6)
  let count = 0
  for (const s of sessions) {
    if (s.date >= monday && s.date <= sunday) count += 1
  }
  return count
}

/**
 * Nombre de jours consécutifs portant au moins une session, en remontant depuis
 * `today`. La série reste ouverte tant que la journée en cours n'est pas terminée :
 * si aucune session n'a encore eu lieu aujourd'hui, le décompte repart de la veille.
 * Aucune session ni aujourd'hui ni hier → 0.
 */
export function currentStreak(
  sessions: readonly BreathingSessionLike[],
  today: string,
): number {
  const days = practicedDays(sessions)
  let cursor = days.has(today) ? today : shiftDate(today, -1)
  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    cursor = shiftDate(cursor, -1)
  }
  return streak
}

/**
 * Contrat d'une session dont on veut aussi l'instant précis : deux sessions du même
 * jour se départagent sur `started_at`, que `date` (au jour) ne distingue pas.
 */
export interface BreathingSessionTimed extends BreathingSessionLike {
  /** Horodatage ISO du début de la session. */
  readonly started_at: string
}

/**
 * La session la plus récente, ou `null` si l'historique est vide. Le maximum est
 * recalculé ici plutôt que de faire confiance à l'ordre de la source : un appelant
 * qui passerait une liste non triée obtiendrait sinon la mauvaise session.
 */
export function lastSession<T extends BreathingSessionTimed>(sessions: readonly T[]): T | null {
  let latest: T | null = null
  for (const s of sessions) {
    if (latest === null || s.started_at > latest.started_at) latest = s
  }
  return latest
}
