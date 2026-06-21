// Série de « jours renseignés » — gamification légère MDR-safe.
// On compte les jours civils CONSÉCUTIFS où le patient a rempli son carnet,
// quel que soit le statut déclaré. On valorise l'acte de suivi, jamais la prise :
// un oubli renseigné ne casse pas la série. Aucune interprétation clinique (MDR 2017/745).

/** Décale une date YYYY-MM-DD de `delta` jours (UTC, insensible au fuseau). */
export function shiftDate(isoDate: string, delta: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}

/**
 * Longueur de la série courante de jours renseignés se terminant aujourd'hui.
 * Si aujourd'hui n'est pas encore renseigné, la série court jusqu'à hier
 * (elle n'« expire » donc pas tant que la journée n'est pas finie).
 */
export function computeLoggedStreak(loggedDates: ReadonlySet<string>, today: string): number {
  let cursor = today
  if (!loggedDates.has(cursor)) cursor = shiftDate(cursor, -1)
  let streak = 0
  while (loggedDates.has(cursor)) {
    streak += 1
    cursor = shiftDate(cursor, -1)
  }
  return streak
}
