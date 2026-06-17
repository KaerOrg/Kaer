// Calcul de la régularité des ancres « Rythmes & régularité » pour le praticien.
//
// Conformité MDR 2017/745 : ce module produit des VALEURS BRUTES (écart-type en
// minutes par ancre) destinées au praticien. Aucune interprétation, aucun seuil,
// aucun label, aucune comparaison à une norme. Le praticien interprète, le code calcule.

const MINUTES_PER_DAY = 1440

export interface AnchorRegularity {
  /** Clé de l'ancre (wake_time, first_meal, …, light). */
  key: string
  /** Nombre de jours où l'ancre a été renseignée. */
  count: number
  /** Écart-type circulaire des horaires, en minutes (valeur brute). */
  sdMinutes: number
}

/** Parse 'HH:MM' → minutes depuis minuit ; `null` si vide ou invalide. */
export function parseTimeToMinutes(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

/**
 * Écart-type circulaire (en minutes) d'une série d'horaires. Statistiques
 * circulaires : 23:50 et 00:10 sont proches (passage par minuit géré), contrairement
 * à un écart-type linéaire qui les croirait éloignés de ~24 h. 0 si moins de 2 valeurs.
 */
export function circularSdMinutes(minutes: readonly number[]): number {
  if (minutes.length < 2) return 0
  let sumCos = 0
  let sumSin = 0
  for (const m of minutes) {
    const angle = (2 * Math.PI * m) / MINUTES_PER_DAY
    sumCos += Math.cos(angle)
    sumSin += Math.sin(angle)
  }
  const n = minutes.length
  const r = Math.sqrt((sumCos / n) ** 2 + (sumSin / n) ** 2)
  if (r >= 1) return 0
  const sdRad = Math.sqrt(-2 * Math.log(r))
  return Math.round((MINUTES_PER_DAY / (2 * Math.PI)) * sdRad)
}

/**
 * Régularité par ancre, sur les entrées synchronisées du patient. Chaque entrée
 * porte `values[anchorKey] = 'HH:MM'`. Seules les ancres renseignées au moins 2 fois
 * sont retournées (un écart-type sur 1 point n'a pas de sens).
 */
export function computeAnchorRegularity(
  entries: ReadonlyArray<{ values: Record<string, unknown> }>,
  anchorKeys: readonly string[],
): AnchorRegularity[] {
  const result: AnchorRegularity[] = []
  for (const key of anchorKeys) {
    const minutes: number[] = []
    for (const entry of entries) {
      const m = parseTimeToMinutes(entry.values[key])
      if (m !== null) minutes.push(m)
    }
    if (minutes.length >= 2) {
      result.push({ key, count: minutes.length, sdMinutes: circularSdMinutes(minutes) })
    }
  }
  return result
}
