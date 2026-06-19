// Helpers purs pour le layout 'chrono_month'.
// Aucune dépendance React — math + parsing date.

export interface AnchorEntry {
  /** Date locale au format YYYY-MM-DD. */
  readonly date: string
  /** Map clé d'ancrage → "HH:MM" ou null si non renseigné. */
  readonly anchors: Readonly<Record<string, string | null>>
}

export interface AnchorSpec {
  readonly key: string
  readonly labelCode: string
  readonly color: string
}

export const DEFAULT_ANCHORS: ReadonlyArray<AnchorSpec> = [
  { key: 'wake_time',     labelCode: 'modules.chronobiology_tracker.anchor_wake',     color: '#F59E0B' },
  { key: 'first_meal',    labelCode: 'modules.chronobiology_tracker.anchor_first_meal',    color: '#F97316' },
  { key: 'main_activity', labelCode: 'modules.chronobiology_tracker.anchor_main_activity', color: '#3B82F6' },
  { key: 'light',         labelCode: 'modules.chronobiology_tracker.anchor_light',    color: '#14B8A6' },
  { key: 'last_meal',     labelCode: 'modules.chronobiology_tracker.anchor_last_meal',     color: '#EF4444' },
  { key: 'bedtime',       labelCode: 'modules.chronobiology_tracker.anchor_bedtime',  color: '#8B5CF6' },
]

export function firstWeekday(year: number, month: number): number {
  // Lundi = 0, Dimanche = 6.
  const day = new Date(year, month - 1, 1).getDay()
  return (day + 6) % 7
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function toISODate(year: number, month: number, day: number): string {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

export function timeToFraction(time: string): number {
  const parts = time.split(':')
  if (parts.length < 2) return 0
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (Number.isNaN(h) || Number.isNaN(m)) return 0
  return Math.max(0, Math.min(1, (h * 60 + m) / 1440))
}

export function countFilledAnchors(entry: AnchorEntry, keys: readonly string[]): number {
  let count = 0
  for (const k of keys) {
    if (entry.anchors[k]) count += 1
  }
  return count
}

export function buildEntriesByDate(entries: readonly AnchorEntry[]): Map<string, AnchorEntry> {
  const m = new Map<string, AnchorEntry>()
  for (const e of entries) m.set(e.date, e)
  return m
}
