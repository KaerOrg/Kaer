// Préparation des données du « rythmogramme » : l'heure de chaque repère tracée
// jour par jour sur un mois. Partagé web (praticien) ≡ mobile (patient) pour
// garantir une visualisation identique. Permet de voir d'un coup d'œil la
// régularité (ligne plate) et les décalages récurrents (un jour de semaine qui
// dérape). Conformité MDR 2017/745 : valeurs brutes uniquement, aucune
// interprétation, aucun seuil, aucun label clinique.

const MIN_PER_DAY = 1440

export interface RhythmEntry {
  /** Date locale YYYY-MM-DD. */
  date: string
  /** Map clé de repère → "HH:MM" ou null. */
  values: Record<string, string | null | undefined>
}

export interface RhythmAnchorStat {
  key: string
  /** Écart-type circulaire des horaires, en minutes (valeur brute). */
  sdMinutes: number
  /** Nombre de jours renseignés pour ce repère sur le mois. */
  count: number
}

export interface RhythmogramResult {
  /** Une ligne par jour du mois : { day, weekday(0=lundi), [anchorKey]: minutes|null }. */
  data: Record<string, number | null>[]
  /** Stats par repère (ordre d'entrée). */
  anchors: RhythmAnchorStat[]
  /** Domaine Y en minutes (peut dépasser 1440 si déroulé après minuit). */
  yDomain: [number, number]
  /** Jours du mois (1-based) qui tombent un lundi → repères de début de semaine. */
  weekStarts: number[]
  /** Nombre total de jours renseignés (au moins un repère). */
  loggedDays: number
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
 * Écart-type circulaire (en minutes) d'une série d'horaires. 23:50 et 00:10 sont
 * proches (passage par minuit géré), contrairement à un écart-type linéaire.
 * 0 si moins de 2 valeurs.
 */
export function circularSdMinutes(minutes: readonly number[]): number {
  if (minutes.length < 2) return 0
  let sumCos = 0
  let sumSin = 0
  for (const m of minutes) {
    const angle = (2 * Math.PI * m) / MIN_PER_DAY
    sumCos += Math.cos(angle)
    sumSin += Math.sin(angle)
  }
  const n = minutes.length
  const r = Math.sqrt((sumCos / n) ** 2 + (sumSin / n) ** 2)
  if (r >= 1) return 0
  const sdRad = Math.sqrt(-2 * Math.log(r))
  return Math.round((MIN_PER_DAY / (2 * Math.PI)) * sdRad)
}

/** Moyenne circulaire (en minutes) — référence robuste même autour de minuit. */
function circularMeanMinutes(values: number[]): number {
  let s = 0
  let c = 0
  for (const m of values) {
    const a = (2 * Math.PI * m) / MIN_PER_DAY
    s += Math.sin(a)
    c += Math.cos(a)
  }
  let ang = Math.atan2(s, c)
  if (ang < 0) ang += 2 * Math.PI
  return (ang / (2 * Math.PI)) * MIN_PER_DAY
}

/** Ramène `v` à moins de 12 h de `ref` (déroule autour de minuit). */
function unwrapAround(v: number, ref: number): number {
  let out = v
  while (out - ref > MIN_PER_DAY / 2) out -= MIN_PER_DAY
  while (ref - out > MIN_PER_DAY / 2) out += MIN_PER_DAY
  return out
}

function daysInMonth(year: number, month1: number): number {
  return new Date(year, month1, 0).getDate()
}

/** Lundi = 0 … Dimanche = 6. */
function weekdayMondayFirst(year: number, month1: number, day: number): number {
  return (new Date(year, month1 - 1, day).getDay() + 6) % 7
}

/**
 * Construit le rythmogramme d'un mois donné (month1 : 1-12).
 * Les horaires de chaque repère sont « déroulés » autour de leur moyenne
 * circulaire pour éviter le saut visuel d'un coucher qui passe minuit
 * (23:50 → 00:10).
 */
export function buildRhythmogram(
  entries: readonly RhythmEntry[],
  anchorKeys: readonly string[],
  year: number,
  month1: number,
): RhythmogramResult {
  const nDays = daysInMonth(year, month1)
  const prefix = `${year}-${String(month1).padStart(2, '0')}-`

  // minutes[key][dayIndex] = minutes since midnight | null (dayIndex 0..nDays-1)
  const minutes: Record<string, (number | null)[]> = {}
  for (const key of anchorKeys) minutes[key] = Array.from({ length: nDays }, () => null)

  for (const entry of entries) {
    if (!entry.date.startsWith(prefix)) continue
    const day = Number(entry.date.slice(8, 10))
    if (!Number.isInteger(day) || day < 1 || day > nDays) continue
    for (const key of anchorKeys) {
      const m = parseTimeToMinutes(entry.values[key])
      if (m !== null) minutes[key][day - 1] = m
    }
  }

  // Déroulage autour de la moyenne circulaire + SD circulaire par repère.
  const anchors: RhythmAnchorStat[] = []
  const unwrapped: Record<string, (number | null)[]> = {}
  let yMin = Infinity
  let yMax = -Infinity

  for (const key of anchorKeys) {
    const raw = minutes[key]
    const present = raw.filter((v): v is number => v !== null)
    anchors.push({ key, count: present.length, sdMinutes: circularSdMinutes(present) })
    if (present.length === 0) {
      unwrapped[key] = raw
      continue
    }
    const ref = circularMeanMinutes(present)
    unwrapped[key] = raw.map(v => {
      if (v === null) return null
      const u = unwrapAround(v, ref)
      if (u < yMin) yMin = u
      if (u > yMax) yMax = u
      return u
    })
  }

  if (!Number.isFinite(yMin)) {
    yMin = 0
    yMax = MIN_PER_DAY
  }

  const data: Record<string, number | null>[] = []
  const weekStarts: number[] = []
  let loggedDays = 0
  for (let d = 1; d <= nDays; d++) {
    const weekday = weekdayMondayFirst(year, month1, d)
    if (weekday === 0) weekStarts.push(d)
    const row: Record<string, number | null> = { day: d, weekday }
    let any = false
    for (const key of anchorKeys) {
      const v = unwrapped[key][d - 1]
      row[key] = v
      if (v !== null) any = true
    }
    if (any) loggedDays += 1
    data.push(row)
  }

  // Marge de 30 min haut/bas, bornée à des valeurs lisibles.
  return {
    data,
    anchors,
    yDomain: [Math.floor((yMin - 30) / 30) * 30, Math.ceil((yMax + 30) / 30) * 30],
    weekStarts,
    loggedDays,
  }
}

/** Formate des minutes (éventuellement > 1440) en libellé d'heure « 7h », « 23h ». */
export function minutesToHourLabel(minutes: number): string {
  const h = Math.round((((minutes % MIN_PER_DAY) + MIN_PER_DAY) % MIN_PER_DAY) / 60)
  return `${h % 24}h`
}

/** Formate des minutes en heure pleine « HH:MM » (pour les tooltips). */
export function minutesToClock(minutes: number): string {
  const total = (((Math.round(minutes) % MIN_PER_DAY) + MIN_PER_DAY) % MIN_PER_DAY)
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
