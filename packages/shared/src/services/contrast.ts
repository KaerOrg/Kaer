// Contraste WCAG 2.1, partagé web ≡ mobile.
//
// Plusieurs teintes de la charte sont vives : excellentes en fond, en filet ou en
// pastille, elles échouent le ratio AA (4,5:1) dès qu'elles portent du TEXTE. Le
// turquoise de marque `#6dbfc3` plafonne à 2,1:1 sur blanc, et le blanc sur ce même
// turquoise tombe au même endroit.
//
// Ces fonctions servent à le VÉRIFIER par le calcul, dans les tests, plutôt qu'à
// l'oeil. Elles ne remplacent pas une passe visuelle sur appareil.

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

/** Ratio de contraste entre deux couleurs opaques, de 1 à 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [light, dark] = la >= lb ? [la, lb] : [lb, la]
  return (light + 0.05) / (dark + 0.05)
}

/** Ratio entre deux couleurs CSS. `null` si l'une n'est pas analysable. */
export function contrastBetween(foreground: string, background: string): number | null {
  const fg = parseColor(foreground)
  const bg = parseColor(background)
  if (!fg || !bg) return null
  return contrastRatio(fg, bg)
}

/** Compose une couleur semi-transparente sur un fond opaque (alpha blending). */
export function blend(foreground: Rgb, background: Rgb, alpha: number): Rgb {
  const mix = (f: number, b: number) => Math.round(f * alpha + b * (1 - alpha))
  return {
    r: mix(foreground.r, background.r),
    g: mix(foreground.g, background.g),
    b: mix(foreground.b, background.b),
  }
}

/** Seuil AA pour du texte courant. */
export const AA_TEXT = 4.5
/** Seuil AA pour du gros texte (>= 18,66px gras, ou 24px). */
export const AA_LARGE_TEXT = 3
/** Seuil AA pour un élément non textuel porteur de sens (bordure, icône). */
export const AA_NON_TEXT = 3
