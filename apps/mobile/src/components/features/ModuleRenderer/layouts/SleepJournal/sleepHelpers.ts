// Helpers purs de l'agenda du sommeil (sleep_diary) — sans JSX, testables isolément.
// Conversion d'horaires, fenêtres de dates, géométrie du calendrier mensuel.

import type { SleepEntry } from '../../../../../lib/database'

export const WEEKDAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const

export function toHHMM(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

export function fromHHMM(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

/** Date HH:MM:00 d'aujourd'hui aux heures/minutes donnés (valeur par défaut d'un picker). */
export function timeToday(hours: number, minutes: number): Date {
  const d = new Date()
  d.setHours(hours, minutes, 0, 0)
  return d
}

export function yesterdayDateStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function lastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = 1; i <= n; i += 1) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
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
