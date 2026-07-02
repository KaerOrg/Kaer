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
