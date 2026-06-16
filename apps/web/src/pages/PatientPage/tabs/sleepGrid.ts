// Helpers purs de la grille agenda du sommeil (SleepDataPanel) : géométrie de
// l'axe noon→noon, formatage de durée, moyenne. Sans JSX, testables isolément.

// Axe noon→noon (12:00 j → 12:00 j+1) : positionne une nuit de façon contiguë.
// Retourne la position [0,1] d'un horaire HH:MM sur cet axe.
export function noonAxisPos(time: string): number {
  const [h, m] = time.split(':').map(Number)
  let mins = h * 60 + m - 12 * 60
  if (mins < 0) mins += 24 * 60
  return mins / (24 * 60)
}

// Position et largeur (en %) d'une barre [start, end] sur l'axe noon→noon,
// plafonnée au bord droit (une nuit ne déborde pas du second midi).
export function barGeometry(start: string, end: string): { left: number; width: number } {
  const a = noonAxisPos(start)
  let b = noonAxisPos(end)
  if (b < a) b += 1
  return { left: a * 100, width: Math.min(1 - a, b - a) * 100 }
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h${String(m).padStart(2, '0')}`
}

export function avg(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}
