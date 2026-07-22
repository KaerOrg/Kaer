import type { DefusionPoint } from '@services/engagementService'
import type { DefusionTechnique } from '../../../lib/defusionTechniques'

// Helpers PURS du panneau Données « Décrocher d'une pensée » (filtre, synthèse,
// groupement par mois). Aucune interprétation clinique (MDR) : on regroupe et on
// compte des valeurs brutes, jamais un écart ni un jugement.

/** Filtre technique : une technique précise, ou toutes. */
export type DefusionTechniqueFilter = DefusionTechnique | 'all'

/** Période : 30 / 90 / 180 jours, ou tout l'historique. */
export type DefusionPeriod = '1m' | '3m' | '6m' | 'all'

export const DEFUSION_PERIODS: readonly DefusionPeriod[] = ['1m', '3m', '6m', 'all']

const PERIOD_DAYS: Record<DefusionPeriod, number | null> = {
  '1m': 30, '3m': 90, '6m': 180, 'all': null,
}

/** Une séance porte une mesure si au moins une paire (avant OU après) est renseignée. */
export function hasMeasures(point: DefusionPoint): boolean {
  return point.discomfort_before !== null || point.discomfort_after !== null
}

/**
 * Filtre par technique et période. `technique = 'all'` ne filtre pas ; `period = 'all'`
 * garde tout l'historique. Le point le plus récent sert de référence temporelle (comme
 * `filterByRange`) pour rester stable hors « maintenant ».
 */
export function filterSessions(
  points: DefusionPoint[],
  technique: DefusionTechniqueFilter,
  period: DefusionPeriod,
): DefusionPoint[] {
  const byTechnique = technique === 'all' ? points : points.filter(p => p.technique === technique)
  const days = PERIOD_DAYS[period]
  if (days === null || byTechnique.length === 0) return byTechnique
  const latest = byTechnique.reduce((max, p) => (p.date > max ? p.date : max), byTechnique[0].date)
  const cutoff = new Date(new Date(latest).getTime() - days * 24 * 60 * 60 * 1000).toISOString()
  return byTechnique.filter(p => p.date >= cutoff)
}

export interface DefusionSynthesis {
  total: number
  withMeasures: number
  lastDate: string | null
}

/** Synthèse brute : nombre de séances, séances avec mesures, date de la dernière. */
export function computeSynthesis(points: DefusionPoint[]): DefusionSynthesis {
  let withMeasures = 0
  let lastDate: string | null = null
  for (const p of points) {
    if (hasMeasures(p)) withMeasures++
    if (lastDate === null || p.date > lastDate) lastDate = p.date
  }
  return { total: points.length, withMeasures, lastDate }
}

export interface DefusionMonthGroup {
  /** Clé triable AAAA-MM (mois métier). */
  monthKey: string
  /** Séances du mois, de la plus récente à la plus ancienne. */
  points: DefusionPoint[]
}

/**
 * Regroupe les séances par mois calendaire, du mois le plus récent au plus ancien,
 * chaque groupe trié récent → ancien. Alimente le tableau chronologique + la
 * pagination « par ancienneté » (on révèle les mois les plus anciens à la demande).
 */
export function groupByMonth(points: DefusionPoint[]): DefusionMonthGroup[] {
  const byMonth = new Map<string, DefusionPoint[]>()
  for (const p of points) {
    const monthKey = p.date.slice(0, 7) // AAAA-MM depuis l'ISO
    const bucket = byMonth.get(monthKey)
    if (bucket) bucket.push(p)
    else byMonth.set(monthKey, [p])
  }
  return [...byMonth.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([monthKey, groupPoints]) => ({
      monthKey,
      points: [...groupPoints].sort((a, b) => (a.date < b.date ? 1 : -1)),
    }))
}
