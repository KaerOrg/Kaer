import type { ActivityEntryPoint } from '@services/engagementService'

// Helpers de la grille hebdomadaire du panneau « Activation comportementale ».
// L'arithmétique de semaine (dates ISO locales) vit dans @kaer/shared (parité
// web ≡ mobile) ; seul le groupement typé ActivityEntryPoint est local.
export { shiftDate, mondayOf, weekDays, todayIso } from '@kaer/shared'

/** Groupe les activités par date métier (clé YYYY-MM-DD). */
export function groupByDate(entries: ActivityEntryPoint[]): Map<string, ActivityEntryPoint[]> {
  const map = new Map<string, ActivityEntryPoint[]>()
  for (const e of entries) {
    const list = map.get(e.date)
    if (list) list.push(e)
    else map.set(e.date, [e])
  }
  return map
}

// Moyenne journalière des ressentis (une par jour ayant au moins une activité
// réalisée et notée). Projetée en `TrendPoint` par dimension pour l'agrégation.
export type FeltMeanPoint = {
  date: string
  pleasure?: number
  mastery?: number
}

/**
 * Moyennes journalières des P/A ressentis (activités réalisées et notées),
 * arrondies à une décimale, triées par date. Métrique agrégée destinée au
 * praticien uniquement (l'agrégation côté soignant est autorisée, comme les
 * stats du panneau sommeil).
 */
export function dailyFeltMeans(entries: ActivityEntryPoint[]): FeltMeanPoint[] {
  const acc = new Map<string, { pSum: number; pN: number; mSum: number; mN: number }>()
  for (const e of entries) {
    if (!e.done) continue
    let day = acc.get(e.date)
    if (!day) {
      day = { pSum: 0, pN: 0, mSum: 0, mN: 0 }
      acc.set(e.date, day)
    }
    if (e.pleasure != null) { day.pSum += e.pleasure; day.pN += 1 }
    if (e.mastery != null) { day.mSum += e.mastery; day.mN += 1 }
  }
  const points: FeltMeanPoint[] = []
  for (const [date, day] of acc) {
    if (day.pN === 0 && day.mN === 0) continue
    const point: FeltMeanPoint = { date }
    if (day.pN > 0) point.pleasure = Math.round((day.pSum / day.pN) * 10) / 10
    if (day.mN > 0) point.mastery = Math.round((day.mSum / day.mN) * 10) / 10
    points.push(point)
  }
  points.sort((a, b) => a.date.localeCompare(b.date))
  return points
}
