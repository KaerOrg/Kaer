// Synthèse praticien des sessions de respiration (W1, epic #196).
//
// Conformité MDR 2017/745, à lire avant de toucher à ce fichier. Tout ce qui sort
// d'ici est un COMPTE BRUT ou une moyenne de DURÉE. Sont interdits, sans exception :
// toute note chiffrée du ressenti, toute moyenne ou pondération du ressenti, toute
// tendance, toute corrélation technique × ressenti, tout indicateur qui classerait
// une technique comme « meilleure ». Le ressenti se compte, il ne se calcule pas.
//
// Pur : aucune I/O, aucune dépendance à l'horloge sauf la date de référence fournie
// par l'appelant. Les périodes se calculent sur des dates métier locales.

import { shiftDate } from './weekDates'

/** Ressentis possibles en fin de session, tels que stockés. */
export type BreathingFeelingValue = 'calmer' | 'same' | 'tenser'

/** Une session telle que le praticien la lit. */
export interface BreathingSessionRow {
  /** Horodatage ISO du début de session (date métier). */
  readonly startedAt: string
  readonly techniqueKey: string
  /** Durée réellement pratiquée, en secondes. */
  readonly durationSeconds: number
  /** Durée choisie avant la session, en secondes. */
  readonly plannedDurationSeconds: number
  readonly cyclesCompleted: number
  /** Menée au bout, par opposition à interrompue. */
  readonly completed: boolean
  /** `null` quand le patient a passé : c'est un état légitime, pas une donnée manquante. */
  readonly feeling: BreathingFeelingValue | null
}

/** Fenêtres proposées par la barre de contrôle. */
export type BreathingPeriod = '30d' | '3m' | '6m' | 'all'

export const BREATHING_PERIODS: readonly BreathingPeriod[] = ['30d', '3m', '6m', 'all']

/** Moment de la journée, découpage fixe et déclaré (jamais dérivé des données). */
export type DayMoment = 'morning' | 'day' | 'evening'

export const DAY_MOMENTS: readonly DayMoment[] = ['morning', 'day', 'evening']

/** Nombre de jours couverts par chaque fenêtre. `null` = tout l'historique. */
const PERIOD_DAYS: Record<BreathingPeriod, number | null> = {
  '30d': 30, '3m': 90, '6m': 180, all: null,
}

/** Date ISO (incluse) à partir de laquelle une période commence. */
export function periodStart(period: BreathingPeriod, todayIsoDate: string): string | null {
  const days = PERIOD_DAYS[period]
  return days == null ? null : shiftDate(todayIsoDate, -(days - 1))
}

/** Date métier (`YYYY-MM-DD`) d'une session, depuis son horodatage local. */
function sessionDate(session: BreathingSessionRow): string {
  return session.startedAt.slice(0, 10)
}

/**
 * Sessions de la période et de la technique demandées, les plus récentes d'abord.
 * `techniqueKey` à `null` ne filtre pas.
 */
export function filterSessions(
  sessions: readonly BreathingSessionRow[],
  period: BreathingPeriod,
  todayIsoDate: string,
  techniqueKey: string | null,
): BreathingSessionRow[] {
  const start = periodStart(period, todayIsoDate)
  return sessions
    .filter(session => start == null || sessionDate(session) >= start)
    .filter(session => techniqueKey == null || session.techniqueKey === techniqueKey)
    .slice()
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

/** Les quatre tuiles de tête. Des comptes et une durée, rien d'interprété. */
export interface BreathingSummary {
  /** Nombre de sessions sur la période. */
  sessions: number
  /** Durée moyenne réellement pratiquée, en secondes. 0 sans session. */
  averageDurationSeconds: number
  /** Sessions menées au bout. */
  completed: number
  /** Jours distincts portant au moins une session. */
  practiceDays: number
  /** Jours de pratique rapportés à une semaine, sur la durée observée. */
  practiceDaysPerWeek: number
}

/**
 * Synthèse de la période. `observedDays` est la longueur de la fenêtre : pour
 * « Tout », l'appelant ne la connaît pas, on prend l'écart entre la première et la
 * dernière session, sans quoi le rythme hebdomadaire serait faussé par une fenêtre
 * arbitraire.
 */
export function summarize(
  sessions: readonly BreathingSessionRow[],
  observedDays: number | null,
): BreathingSummary {
  if (sessions.length === 0) {
    return { sessions: 0, averageDurationSeconds: 0, completed: 0, practiceDays: 0, practiceDaysPerWeek: 0 }
  }

  const days = new Set(sessions.map(sessionDate))
  const totalDuration = sessions.reduce((sum, session) => sum + session.durationSeconds, 0)

  const span = observedDays ?? spanInDays(sessions)
  // Une fenêtre plus courte qu'une semaine rapporterait un rythme absurde (une
  // session en deux jours ne fait pas « 3,5 jours par semaine »).
  const weeks = Math.max(1, span / 7)

  return {
    sessions: sessions.length,
    averageDurationSeconds: Math.round(totalDuration / sessions.length),
    completed: sessions.filter(session => session.completed).length,
    practiceDays: days.size,
    practiceDaysPerWeek: Math.round((days.size / weeks) * 10) / 10,
  }
}

/** Nombre de jours entre la première et la dernière session, bornes incluses. */
function spanInDays(sessions: readonly BreathingSessionRow[]): number {
  const dates = sessions.map(sessionDate).sort()
  const first = new Date(`${dates[0]}T12:00:00`).getTime()
  const last = new Date(`${dates[dates.length - 1]}T12:00:00`).getTime()
  return Math.round((last - first) / 86_400_000) + 1
}

/** Effectifs de ressenti d'un lot de sessions. Des comptes, jamais un score. */
export interface FeelingTally {
  calmer: number
  same: number
  tenser: number
  /** Sessions sans ressenti : le patient a passé, c'est légitime. */
  unanswered: number
  total: number
}

/** Les mêmes effectifs, rattachés à une technique. */
export interface FeelingCounts extends FeelingTally {
  techniqueKey: string
}

/** Effectifs de ressenti, toutes techniques confondues. */
export function tallyFeelings(sessions: readonly BreathingSessionRow[]): FeelingTally {
  return {
    calmer: sessions.filter(s => s.feeling === 'calmer').length,
    same: sessions.filter(s => s.feeling === 'same').length,
    tenser: sessions.filter(s => s.feeling === 'tenser').length,
    unanswered: sessions.filter(s => s.feeling == null).length,
    total: sessions.length,
  }
}

/**
 * Comptes de ressenti par technique, dans l'ordre des techniques fourni par
 * l'appelant (celui de la config). Une technique sans session apparaît à zéro
 * plutôt que de disparaître : son absence est une information.
 */
export function countFeelings(
  sessions: readonly BreathingSessionRow[],
  techniqueKeys: readonly string[],
): FeelingCounts[] {
  return techniqueKeys.map(techniqueKey => ({
    techniqueKey,
    ...tallyFeelings(sessions.filter(session => session.techniqueKey === techniqueKey)),
  }))
}

/**
 * Moment de la journée d'un horodatage local : matin 5h-12h, journée 12h-19h,
 * soir 19h-5h. Découpage fixe, déclaré ici, jamais déduit des données du patient.
 */
export function momentOfDay(startedAt: string): DayMoment {
  const hour = Number(startedAt.slice(11, 13))
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 19) return 'day'
  return 'evening'
}

/** Effectifs par moment de la journée, dans l'ordre matin → journée → soir. */
export function countMoments(sessions: readonly BreathingSessionRow[]): Record<DayMoment, number> {
  const counts: Record<DayMoment, number> = { morning: 0, day: 0, evening: 0 }
  for (const session of sessions) counts[momentOfDay(session.startedAt)] += 1
  return counts
}

/** En-têtes du CSV, dans l'ordre des colonnes. */
export const CSV_COLUMNS = [
  'date', 'heure', 'technique', 'duree_secondes', 'duree_prevue_secondes',
  'cycles', 'menee_au_bout', 'ressenti',
] as const

/**
 * Lignes brutes du CSV. **Aucune colonne calculée interprétative** : ce qui sort est
 * ce qui a été saisi, pour que le praticien puisse relire ou retraiter lui-même.
 * Un ressenti absent reste vide, il n'est jamais remplacé par une valeur par défaut.
 */
export function toCsvRows(sessions: readonly BreathingSessionRow[]): string[][] {
  return sessions.map(session => [
    sessionDate(session),
    session.startedAt.slice(11, 16),
    session.techniqueKey,
    String(session.durationSeconds),
    String(session.plannedDurationSeconds),
    String(session.cyclesCompleted),
    session.completed ? '1' : '0',
    session.feeling ?? '',
  ])
}

/** Sérialise en CSV, en échappant les champs qui en ont besoin. */
export function buildCsv(sessions: readonly BreathingSessionRow[]): string {
  const escape = (value: string) =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  const lines = [CSV_COLUMNS.join(',')]
  for (const row of toCsvRows(sessions)) lines.push(row.map(escape).join(','))
  return lines.join('\n')
}
