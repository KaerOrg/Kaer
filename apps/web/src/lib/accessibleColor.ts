// Contraste WCAG : dériver une couleur de TEXTE lisible depuis une couleur d'ACCENT.
//
// Plusieurs accents du catalogue de modules sont des teintes vives (orange #F97316,
// turquoise #6dbfc3…). Elles font une excellente identité de module sur un filet ou
// une bordure, mais échouent le ratio AA (4,5:1) dès qu'on les emploie comme couleur
// de texte sur fond blanc : #F97316 sur blanc donne 2,9:1.
//
// Ces fonctions calculent le ratio et, si besoin, ASSOMBRISSENT l'accent jusqu'à ce
// qu'il passe. Le filet garde l'accent d'origine (l'identité reste lisible), seul le
// libellé bascule sur la variante foncée. Générique : aucun module n'est nommé ici,
// aucune table de correspondance à tenir à jour.

export interface Rgb { readonly r: number; readonly g: number; readonly b: number }

const HEX_SHORT = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i
const HEX_LONG = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
const RGB_FN = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i

/** Parse `#abc`, `#aabbcc`, `rgb(r, g, b)` et `rgba(...)`. `null` si non reconnu. */
export function parseColor(css: string): Rgb | null {
  const short = HEX_SHORT.exec(css)
  if (short) {
    return {
      r: Number.parseInt(short[1] + short[1], 16),
      g: Number.parseInt(short[2] + short[2], 16),
      b: Number.parseInt(short[3] + short[3], 16),
    }
  }
  const long = HEX_LONG.exec(css)
  if (long) {
    return {
      r: Number.parseInt(long[1], 16),
      g: Number.parseInt(long[2], 16),
      b: Number.parseInt(long[3], 16),
    }
  }
  const fn = RGB_FN.exec(css)
  if (fn) return { r: Number(fn[1]), g: Number(fn[2]), b: Number(fn[3]) }
  return null
}

function channelLuminance(value: number): number {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** Luminance relative WCAG 2.1 d'une couleur opaque. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
}

/** Ratio de contraste WCAG entre deux couleurs opaques, de 1 à 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [light, dark] = la >= lb ? [la, lb] : [lb, la]
  return (light + 0.05) / (dark + 0.05)
}

/** Compose une couleur semi-transparente sur un fond opaque (alpha blending). */
export function blend(foreground: Rgb, background: Rgb, alpha: number): Rgb {
  const mix = (f: number, b: number) => Math.round(f * alpha + b * (1 - alpha))
  return { r: mix(foreground.r, background.r), g: mix(foreground.g, background.g), b: mix(foreground.b, background.b) }
}

function toHex({ r, g, b }: Rgb): string {
  const part = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${part(r)}${part(g)}${part(b)}`
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 }
/** Pas d'assombrissement par itération : assez fin pour rester proche de l'accent. */
const DARKEN_STEP = 0.04

/**
 * Couleur de texte lisible dérivée d'un accent : l'accent lui-même s'il passe déjà
 * `minRatio` sur `background`, sinon la même teinte assombrie jusqu'à ce qu'elle
 * passe. Retourne la couleur d'origine telle quelle si elle n'est pas analysable
 * (variable CSS, `currentColor`…) : mieux vaut ne rien changer que casser un rendu.
 */
export function accessibleTextColor(accent: string, background: Rgb = WHITE, minRatio = 4.5): string {
  const parsed = parseColor(accent)
  if (!parsed) return accent
  if (contrastRatio(parsed, background) >= minRatio) return accent

  // On assombrit par multiplication des canaux : la teinte est préservée, seule la
  // clarté descend. Borne d'itérations = garde-fou, le noir passe toujours.
  let factor = 1
  for (let i = 0; i < 25; i += 1) {
    factor -= DARKEN_STEP
    if (factor <= 0) break
    const candidate: Rgb = { r: parsed.r * factor, g: parsed.g * factor, b: parsed.b * factor }
    if (contrastRatio(candidate, background) >= minRatio) return toHex(candidate)
  }
  return '#000000'
}
