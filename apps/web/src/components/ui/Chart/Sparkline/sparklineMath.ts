// Logique pure du Sparkline : projette une série (avec trous) en segments de
// polyline SVG, bornée par un domaine explicite. Testée isolément.

/**
 * Découpe `data` en segments de points `"x,y x,y …"` (un segment par tronçon
 * continu de valeurs renseignées ; un `null` interrompt le tracé). Un tronçon
 * d'un seul point n'est pas tracé (pas de polyline à 1 point).
 */
export function sparklinePoints(
  data: readonly (number | null)[],
  domain: readonly [number, number],
  width: number,
  height: number,
): string[] {
  const [min, max] = domain
  const span = max - min || 1
  const n = data.length
  const xAt = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * width)
  // padding vertical de 2px, axe SVG inversé (0 en haut).
  const yAt = (v: number) => {
    const clamped = Math.max(min, Math.min(v, max))
    return height - 2 - ((clamped - min) / span) * (height - 4)
  }

  const segments: string[] = []
  let current: string[] = []
  data.forEach((v, i) => {
    if (v == null || !Number.isFinite(v)) {
      if (current.length >= 2) segments.push(current.join(' '))
      current = []
    } else {
      current.push(`${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`)
    }
  })
  if (current.length >= 2) segments.push(current.join(' '))
  return segments
}
