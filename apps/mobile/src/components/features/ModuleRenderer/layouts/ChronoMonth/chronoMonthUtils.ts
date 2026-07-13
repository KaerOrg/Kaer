// Helpers purs pour le layout 'chrono_month'.
// Aucune dépendance React — math + parsing date.

import {
  CHRONO_ANCHORS,
  circularSdMinutes,
  parseTimeToMinutes,
  type ChronoAnchorSpec,
  type RhythmAnchorStat,
  type RhythmEntry,
} from '@kaer/shared'

export interface AnchorEntry {
  /** Date locale au format YYYY-MM-DD. */
  readonly date: string
  /** Map clé d'ancrage → "HH:MM" ou null si non renseigné. */
  readonly anchors: Readonly<Record<string, string | null>>
}

// La liste des repères (ordre, couleur, clé i18n) vit dans `@kaer/shared` :
// source UNIQUE web ≡ mobile (cf. CHRONO_ANCHORS). Ré-exportée ici pour les
// consommateurs existants du layout chrono.
export type AnchorSpec = ChronoAnchorSpec
export const DEFAULT_ANCHORS: ReadonlyArray<AnchorSpec> = CHRONO_ANCHORS

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

/** Préfixes « YYYY-MM- » du mois (year, month) et des `monthsBack-1` mois précédents. */
function windowPrefixes(year: number, month: number, monthsBack: number): Set<string> {
  const prefixes = new Set<string>()
  for (let i = 0; i < monthsBack; i++) {
    let m = month - i
    let y = year
    while (m < 1) {
      m += 12
      y -= 1
    }
    prefixes.add(`${y}-${m.toString().padStart(2, '0')}-`)
  }
  return prefixes
}

/**
 * Écart brut jour à jour (écart-type circulaire, en minutes) par repère, sur une
 * fenêtre de `monthsBack` mois se terminant à (year, month). Réutilise le calcul
 * partagé (`parseTimeToMinutes` + `circularSdMinutes`) — la LOGIQUE est inchangée,
 * on l'applique juste à une fenêtre glissante. `monthsBack=1` reproduit exactement
 * `buildRhythmogram(...).anchors[].sdMinutes` du mois courant.
 * MDR 2017/745 : valeur brute descriptive, aucun seuil ni jugement.
 */
export function buildSpread(
  entries: readonly RhythmEntry[],
  anchorKeys: readonly string[],
  year: number,
  month: number,
  monthsBack = 1,
): RhythmAnchorStat[] {
  const prefixes = windowPrefixes(year, month, monthsBack)
  const byKey: Record<string, number[]> = {}
  for (const k of anchorKeys) byKey[k] = []
  for (const e of entries) {
    if (!prefixes.has(e.date.slice(0, 8))) continue
    for (const k of anchorKeys) {
      const m = parseTimeToMinutes(e.values[k])
      if (m !== null) byKey[k].push(m)
    }
  }
  return anchorKeys.map(k => ({
    key: k,
    count: byKey[k].length,
    sdMinutes: circularSdMinutes(byKey[k]),
  }))
}
