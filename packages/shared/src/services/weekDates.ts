// Arithmétique de semaine sur dates ISO locales (YYYY-MM-DD), partagée web ≡ mobile.
// Les calculs passent par un Date ancré à midi local pour ne pas décaler de jour
// selon le fuseau horaire (minuit UTC vs minuit local).

function toIso(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** Décale une date ISO (YYYY-MM-DD) de `days` jours. */
export function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return toIso(d)
}

/** Lundi (ISO) de la semaine contenant la date donnée. */
export function mondayOf(iso: string): string {
  const jsDay = new Date(`${iso}T12:00:00`).getDay() // 0 = dimanche
  const offset = jsDay === 0 ? -6 : 1 - jsDay
  return shiftDate(iso, offset)
}

/** Les 7 dates ISO de la semaine commençant au lundi donné. */
export function weekDays(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => shiftDate(monday, i))
}

/** Date ISO du jour courant (heure locale). */
export function todayIso(): string {
  return toIso(new Date())
}
