// Helpers purs du primitive `Slider` — mapping position ↔ valeur, alignement au
// pas et bornage. Isolés du composant pour être testés sans simuler de geste
// PanResponder (rendu natif). Aucune interprétation : arithmétique neutre.

const clamp = (n: number, lo: number, hi: number): number =>
  n < lo ? lo : n > hi ? hi : n

/** Ratio [0,1] d'une position `x` sur une piste de largeur `width`. */
export function positionRatio(x: number, width: number): number {
  if (width <= 0) return 0
  return clamp(x / width, 0, 1)
}

/**
 * Valeur d'un ratio [0,1], alignée sur `step` puis bornée à [min,max].
 * `step <= 0` → valeur continue (arrondie à l'entier). Les valeurs restent
 * entières (intensités 0..100) pour un affichage propre.
 */
export function valueFromRatio(ratio: number, min: number, max: number, step: number): number {
  const raw = min + clamp(ratio, 0, 1) * (max - min)
  const snapped = step > 0 ? Math.round(raw / step) * step : raw
  return clamp(Math.round(snapped), min, max)
}

/** Ratio [0,1] d'une valeur (positionne le remplissage et le thumb). */
export function ratioFromValue(value: number, min: number, max: number): number {
  if (max <= min) return 0
  return clamp((value - min) / (max - min), 0, 1)
}

/**
 * Valeur décalée d'un pas dans la direction `delta` (±1) — sert les actions
 * d'accessibilité incrément / décrément. Part de `min` si rien n'est encore saisi.
 */
export function stepValue(current: number | null, delta: number, min: number, max: number, step: number): number {
  const unit = step > 0 ? step : 1
  return clamp((current ?? min) + delta * unit, min, max)
}
