// Helpers purs de l'agenda du sommeil (sleep_diary) — sans JSX, testables isolément.
// Conversion d'horaires, fenêtres de dates, géométrie du calendrier mensuel,
// géométrie de la barre « fenêtre de sommeil » et agrégations de l'écran Évolution.
// Dates métier ancrées en local via @kaer/shared/weekDates (jamais toISOString,
// qui décale d'un jour en fuseau positif).

import { shiftDate, todayIso, mondayOf } from '@kaer/shared'
import type { DataPoint, XLabel } from '@ui/Chart'
import { computeSleepEfficiency, type SleepEntry } from '../../../../../lib/database'

export const WEEKDAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const

export function yesterdayDateStr(): string {
  return shiftDate(todayIso(), -1)
}

export function lastNDays(n: number): string[] {
  const today = todayIso()
  return Array.from({ length: n }, (_, i) => shiftDate(today, -(i + 1)))
}

export function toYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** Index (0=lundi … 6=dimanche) du 1er jour du mois. */
export function firstWeekday(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay()
  return (day + 6) % 7
}

/** Minutes de sommeil estimées d'une entrée (fenêtre essai→réveil − latence). */
export function sleepMinutes(entry: SleepEntry): number | null {
  if (!entry.bedtime || !entry.wake_time) return null
  const [bH, bM] = entry.bedtime.split(':').map(Number)
  const [wH, wM] = entry.wake_time.split(':').map(Number)
  let total = wH * 60 + wM - (bH * 60 + bM) - (entry.sleep_onset_minutes ?? 0)
  if (total < 0) total += 24 * 60
  return total
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h${String(m).padStart(2, '0')}`
}

/** Conversion « = XhYY » d'une durée en minutes, ou null si 0 (affichage d'appoint). */
export function minutesToHhmmHint(minutes: number): string | null {
  if (minutes === 0) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `= ${h}h${String(m).padStart(2, '0')}`
  if (h > 0) return `= ${h}h00`
  return null
}

// ─── Barre « fenêtre de sommeil » (liste) ────────────────────────────────────
// Affichage brut : on positionne le segment coucher→lever dans une fenêtre de
// référence fixe (18 h → midi le lendemain), sans jugement de qualité (MDR).

const WINDOW_START_HOUR = 18
const WINDOW_HOURS = 18

export interface SleepWindowGeometry {
  /** Décalage gauche du segment, en pourcentage de la piste [0..100]. */
  leftPct: number
  /** Largeur du segment, en pourcentage de la piste ]0..100]. */
  widthPct: number
}

/** Minutes écoulées depuis 18 h (fenêtre de référence), un horaire HH:MM → [0..1440[. */
function offsetFromWindowStart(time: string): number | null {
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  let offset = h * 60 + m - WINDOW_START_HOUR * 60
  if (offset < 0) offset += 24 * 60
  return offset
}

/**
 * Géométrie du segment de sommeil dans la fenêtre 18 h → midi (1080 min).
 * Retourne null si un horaire manque, est mal formé, ou si la largeur est nulle.
 */
export function computeSleepWindow(
  bedtime: string | null,
  wakeTime: string | null,
): SleepWindowGeometry | null {
  if (!bedtime || !wakeTime) return null
  const bedOffset = offsetFromWindowStart(bedtime)
  const wakeOffset = offsetFromWindowStart(wakeTime)
  if (bedOffset === null || wakeOffset === null) return null
  const total = WINDOW_HOURS * 60
  const left = Math.min(Math.max(bedOffset, 0), total)
  const end = Math.min(Math.max(wakeOffset, 0), total)
  const width = end - left
  if (width <= 0) return null
  return { leftPct: (left / total) * 100, widthPct: (width / total) * 100 }
}

// ─── Écran Évolution : métriques brutes + agrégations temporelles ─────────────

export type SleepMetric = 'duration' | 'efficiency'
export type EvolutionRange = '1M' | '3M' | '6M'

const RANGE_DAYS: Record<EvolutionRange, number> = { '1M': 30, '3M': 90, '6M': 180 }

/** Première date ISO (incluse) de la plage se terminant à `endIso` (défaut : aujourd'hui). */
export function rangeStartIso(range: EvolutionRange, endIso: string = todayIso()): string {
  return shiftDate(endIso, -(RANGE_DAYS[range] - 1))
}

/** Efficacité du sommeil (%) d'une nuit, ou null si horaires insuffisants. */
export function entryEfficiency(entry: SleepEntry): number | null {
  if (!entry.bedtime || !entry.wake_time) return null
  return computeSleepEfficiency(
    entry.bedtime, entry.wake_time, entry.sleep_onset_minutes,
    entry.awakenings_duration_minutes, entry.in_bed_time, entry.out_of_bed_time,
  )
}

/** Valeur brute d'une nuit pour une métrique : durée en heures (1 décimale) ou efficacité (%). */
export function metricValue(entry: SleepEntry, metric: SleepMetric): number | null {
  if (metric === 'efficiency') return entryEfficiency(entry)
  const min = sleepMinutes(entry)
  return min === null ? null : Math.round((min / 60) * 10) / 10
}

/** Nombre de jours entre deux dates ISO (local, ancré midi). */
export function daysBetweenIso(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T12:00:00`).getTime()
  const b = new Date(`${toIso}T12:00:00`).getTime()
  return Math.round((b - a) / 86_400_000)
}

/**
 * Un point par nuit de la plage [fromIso, toIso] ; `hasValue:false` (gap) sur les
 * nuits sans donnée. Valeurs brutes, aucune ligne de tendance calculée.
 */
export function buildNightlyPoints(
  entries: SleepEntry[], metric: SleepMetric, fromIso: string, toIso: string,
): DataPoint[] {
  const byDate = new Map<string, SleepEntry>()
  for (const e of entries) byDate.set(e.date, e)
  const points: DataPoint[] = []
  for (let iso = fromIso; iso <= toIso; iso = shiftDate(iso, 1)) {
    const entry = byDate.get(iso)
    const value = entry ? metricValue(entry, metric) : null
    points.push({ value: value ?? 0, hasValue: value !== null })
  }
  return points
}

/** Étiquettes d'axe X (nom de mois) alignées sur les points de `buildNightlyPoints`. */
export function buildNightlyLabels(fromIso: string, toIso: string, locale: string): XLabel[] {
  const labels: XLabel[] = []
  let index = 0
  let lastMonth = -1
  for (let iso = fromIso; iso <= toIso; iso = shiftDate(iso, 1), index += 1) {
    const month = Number(iso.slice(5, 7))
    if (month !== lastMonth) {
      lastMonth = month
      const label = new Date(`${iso}T12:00:00`)
        .toLocaleDateString(locale, { month: 'short' })
        .replace(/\./g, '')
      labels.push({ index, label })
    }
  }
  return labels
}

export interface WeeklySeries {
  points: DataPoint[]
  labels: XLabel[]
}

/**
 * Moyenne brute par semaine (ancrée au lundi) sur la plage [fromIso, toIso].
 * Étiquettes `<prefix>1`…`<prefix>n` (ex. « S1 »…« Sn »). Semaine sans donnée =
 * gap (`hasValue:false`). Aucune interprétation : moyenne arithmétique brute.
 */
export function buildWeeklyAverages(
  entries: SleepEntry[], metric: SleepMetric, fromIso: string, toIso: string, weekPrefix: string,
): WeeklySeries {
  const firstMonday = mondayOf(fromIso)
  const weeks = Math.floor(daysBetweenIso(firstMonday, toIso) / 7) + 1
  const buckets = Array.from({ length: weeks }, () => ({ sum: 0, count: 0 }))
  for (const entry of entries) {
    if (entry.date < fromIso || entry.date > toIso) continue
    const value = metricValue(entry, metric)
    if (value === null) continue
    const weekIndex = Math.floor(daysBetweenIso(firstMonday, entry.date) / 7)
    if (weekIndex < 0 || weekIndex >= weeks) continue
    buckets[weekIndex].sum += value
    buckets[weekIndex].count += 1
  }
  const points: DataPoint[] = buckets.map(b =>
    b.count > 0
      ? { value: Math.round((b.sum / b.count) * 10) / 10, hasValue: true }
      : { value: 0, hasValue: false },
  )
  const labels: XLabel[] = buckets.map((_, i) => ({ index: i, label: `${weekPrefix}${i + 1}` }))
  return { points, labels }
}

// Ré-export local pour les vues (évite un second import @kaer/shared côté composant).
export { todayIso }
