// ─── Logique pure du panneau « Données » de l'humeur (praticien) ─────────────
//
// Transforme les MoodPoint (6 dimensions, un point par saisie) en séries de
// tendance par jour, moyennes de fenêtre, assiduité et statistiques descriptives.
// Aucune interprétation : moyennes/min/max sont des résumés de la série brute
// (autorisés MDR), jamais un seuil ni un jugement.

import type { MoodPoint } from '@services/engagementService'
import type { TrendPoint } from '@ui/Chart'
import type { MoodFrKey } from './moodDimensions'

const DAY_MS = 86_400_000

const round1 = (n: number): number => Math.round(n * 10) / 10

/** Jour (YYYY-MM-DD) d'un horodatage ISO. */
export function moodDay(iso: string): string {
  return iso.slice(0, 10)
}

/** Saisies dans la fenêtre glissante des `days` derniers jours. */
export function filterMoodByDays(points: readonly MoodPoint[], days: number): MoodPoint[] {
  const cutoff = Date.now() - days * DAY_MS
  return points.filter(p => new Date(p.date).getTime() >= cutoff)
}

/**
 * Série de tendance d'UNE dimension : un point par jour saisi. La dernière valeur
 * numérique du jour l'emporte ; un jour saisi sans cette dimension → `null`
 * (interruption de courbe, jamais une valeur inventée).
 */
export function buildDimensionTrend(points: readonly MoodPoint[], key: MoodFrKey): TrendPoint[] {
  const days = new Set<string>()
  const byDay = new Map<string, number>()
  for (const p of points) {
    const day = moodDay(p.date)
    days.add(day)
    const v = p[key]
    if (typeof v === 'number') byDay.set(day, v)
  }
  return [...days]
    .sort((a, b) => a.localeCompare(b))
    .map(date => ({ date, value: byDay.has(date) ? byDay.get(date)! : null }))
}

export interface MoodWindowSummary {
  /** Moyenne descriptive par clé FR sur la fenêtre, `null` si aucune valeur. */
  readonly averages: Record<string, number | null>
  /** Jours distincts comportant au moins une saisie dans la fenêtre. */
  readonly daysLogged: number
  readonly windowDays: number
}

/** Moyennes par dimension + assiduité sur une fenêtre de `days` jours. */
export function moodWindowSummary(
  points: readonly MoodPoint[],
  keys: readonly MoodFrKey[],
  days: number,
): MoodWindowSummary {
  const win = filterMoodByDays(points, days)
  const averages: Record<string, number | null> = {}
  for (const key of keys) {
    const values = win.map(p => p[key]).filter((v): v is number => typeof v === 'number')
    averages[key] = values.length > 0 ? round1(values.reduce((a, b) => a + b, 0) / values.length) : null
  }
  const daysLogged = new Set(win.map(p => moodDay(p.date))).size
  return { averages, daysLogged, windowDays: days }
}

export interface DimensionStats {
  readonly min: number | null
  readonly max: number | null
  readonly mean: number | null
  readonly n: number
}

/** min / max / moyenne / nombre de saisies d'une série de tendance. */
export function dimensionStats(trend: readonly TrendPoint[]): DimensionStats {
  const values = trend.map(t => t.value).filter((v): v is number => v != null)
  if (values.length === 0) return { min: null, max: null, mean: null, n: 0 }
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean: round1(values.reduce((a, b) => a + b, 0) / values.length),
    n: values.length,
  }
}

/**
 * Série de comparaison « mois -1 » d'une dimension : les valeurs brutes de la
 * fenêtre précédente de `shiftDays` jours, re-datées `shiftDays` jours plus tard
 * pour se superposer à la fenêtre courante. Valeurs brutes re-tracées, pas de moyenne.
 */
export function buildComparisonTrend(
  points: readonly MoodPoint[],
  key: MoodFrKey,
  shiftDays: number,
): TrendPoint[] {
  const now = Date.now()
  const cutoffCurrent = now - shiftDays * DAY_MS
  const cutoffPrev = now - 2 * shiftDays * DAY_MS
  const prev = points.filter(p => {
    const t = new Date(p.date).getTime()
    return t >= cutoffPrev && t < cutoffCurrent
  })
  const days = new Set<string>()
  const byDay = new Map<string, number>()
  for (const p of prev) {
    const shifted = moodDay(new Date(new Date(p.date).getTime() + shiftDays * DAY_MS).toISOString())
    days.add(shifted)
    const v = p[key]
    if (typeof v === 'number') byDay.set(shifted, v)
  }
  return [...days]
    .sort((a, b) => a.localeCompare(b))
    .map(date => ({ date, value: byDay.has(date) ? byDay.get(date)! : null }))
}
