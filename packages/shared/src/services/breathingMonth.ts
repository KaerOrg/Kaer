// Agrégation mensuelle des sessions de respiration, pour le calendrier de la page
// « Évolution clinique » (W2, epic #196).
//
// Conformité MDR 2017/745 : une case de calendrier porte l'IDENTITÉ de la technique
// pratiquée ce jour-là et le ressenti déclaré, rien d'autre. Aucune qualité de
// journée, aucun score, aucun cumul comparé à un seuil. Une case sans session est
// une absence de donnée, pas un manquement.
//
// Pur : aucune I/O, aucune lecture d'horloge. Les dates métier sont locales.

import type { BreathingFeelingValue, BreathingSessionRow } from './breathingReport'

/** Un mois calendaire, `month` de 1 à 12 (pas l'index JavaScript). */
export interface YearMonth {
  year: number
  month: number
}

/** Ce qu'une case de calendrier a besoin de savoir, pour un jour donné. */
export interface BreathingDay {
  /** Date métier `YYYY-MM-DD`. */
  date: string
  /** Jour du mois, 1 à 31. */
  day: number
  /** Sessions déclarées ce jour-là. */
  sessions: number
  /**
   * Technique la plus pratiquée ce jour-là. En cas d'égalité, celle de la session la
   * plus ancienne du jour : il faut un choix déterministe, et l'ordre chronologique
   * est le seul qui ne classe pas les techniques entre elles.
   */
  techniqueKey: string
  /** Ressenti de la DERNIÈRE session du jour, `null` si le patient a passé. */
  feeling: BreathingFeelingValue | null
}

/** Mois portant au moins une session, du plus ancien au plus récent. */
export function monthsWithSessions(sessions: readonly BreathingSessionRow[]): YearMonth[] {
  const seen = new Set<string>()
  for (const session of sessions) seen.add(session.startedAt.slice(0, 7))
  return [...seen]
    .sort()
    .map(key => ({ year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)) }))
}

/** Préfixe `YYYY-MM` d'un mois. */
function monthPrefix({ year, month }: YearMonth): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

/** Sessions du mois demandé. */
export function sessionsInMonth(
  sessions: readonly BreathingSessionRow[],
  month: YearMonth,
): BreathingSessionRow[] {
  const prefix = monthPrefix(month)
  return sessions.filter(session => session.startedAt.slice(0, 7) === prefix)
}

/**
 * Jours du mois portant au moins une session, du 1er au dernier. Les jours sans
 * session ne sont pas produits : c'est à l'affichage de rendre le mois complet, ce
 * module ne fabrique pas de données absentes.
 */
export function buildMonthDays(
  sessions: readonly BreathingSessionRow[],
  month: YearMonth,
): BreathingDay[] {
  const byDate = new Map<string, BreathingSessionRow[]>()
  for (const session of sessionsInMonth(sessions, month)) {
    const date = session.startedAt.slice(0, 10)
    const bucket = byDate.get(date)
    if (bucket) bucket.push(session)
    else byDate.set(date, [session])
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, daySessions]) => {
      const chronological = [...daySessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt))
      return {
        date,
        day: Number(date.slice(8, 10)),
        sessions: chronological.length,
        techniqueKey: majorityTechnique(chronological),
        feeling: chronological[chronological.length - 1].feeling,
      }
    })
}

/** Technique majoritaire d'une journée, égalité tranchée par la session la plus ancienne. */
function majorityTechnique(chronological: readonly BreathingSessionRow[]): string {
  const counts = new Map<string, number>()
  for (const session of chronological) {
    counts.set(session.techniqueKey, (counts.get(session.techniqueKey) ?? 0) + 1)
  }
  let best = chronological[0].techniqueKey
  for (const session of chronological) {
    if ((counts.get(session.techniqueKey) ?? 0) > (counts.get(best) ?? 0)) best = session.techniqueKey
  }
  return best
}

/** Mois précédent celui fourni, en repassant à décembre de l'année d'avant. */
export function previousMonth({ year, month }: YearMonth): YearMonth {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
}

/** Nombre de sessions tombant dans la semaine commençant le lundi fourni (7 jours). */
export function sessionsInWeekFrom(
  sessions: readonly BreathingSessionRow[],
  mondayIso: string,
  sundayIso: string,
): number {
  return sessions.filter(session => {
    const date = session.startedAt.slice(0, 10)
    return date >= mondayIso && date <= sundayIso
  }).length
}
