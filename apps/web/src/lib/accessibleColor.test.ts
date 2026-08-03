import { describe, it, expect } from 'vitest'
import {
  parseColor, contrastRatio, relativeLuminance, blend, accessibleTextColor,
} from './accessibleColor'

const WHITE = { r: 255, g: 255, b: 255 }
const BLACK = { r: 0, g: 0, b: 0 }

/** Accents réellement utilisés par le catalogue de modules (CHART_PALETTE + marque). */
const CATALOG_ACCENTS = [
  '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
  '#3B82F6', '#0EA5E9', '#F97316', '#DC2626', '#7C3AED', '#0891B2', '#64748B',
  '#6dbfc3',
]

describe('parseColor', () => {
  it('lit les trois notations utilisées dans l\'app', () => {
    expect(parseColor('#fff')).toEqual(WHITE)
    expect(parseColor('#F97316')).toEqual({ r: 249, g: 115, b: 22 })
    expect(parseColor('rgb(255, 0, 0)')).toEqual({ r: 255, g: 0, b: 0 })
    expect(parseColor('rgba(255, 0, 0, 0.5)')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('rend null sur une valeur non analysable', () => {
    expect(parseColor('var(--color-primary)')).toBeNull()
    expect(parseColor('currentColor')).toBeNull()
  })
})

describe('contrastRatio', () => {
  it('donne les bornes connues de WCAG', () => {
    expect(contrastRatio(WHITE, BLACK)).toBeCloseTo(21, 1)
    expect(contrastRatio(WHITE, WHITE)).toBeCloseTo(1, 5)
  })

  it('retrouve les ratios documentés du projet', () => {
    // #6dbfc3 sur blanc : environ 2,1:1 (cf. commentaire de packages/shared/theme.ts).
    expect(contrastRatio(parseColor('#6dbfc3')!, WHITE)).toBeCloseTo(2.1, 1)
    // #2C6E72 sur blanc : environ 5,9:1.
    expect(contrastRatio(parseColor('#2C6E72')!, WHITE)).toBeCloseTo(5.9, 1)
    // L'orange de l'armoire : 2,8:1 (le ticket annonçait 2,9, le calcul WCAG donne 2,80).
    expect(contrastRatio(parseColor('#F97316')!, WHITE)).toBeCloseTo(2.8, 1)
  })

  it('est symétrique', () => {
    const a = parseColor('#F97316')!
    expect(contrastRatio(a, WHITE)).toBeCloseTo(contrastRatio(WHITE, a), 6)
  })
})

describe('relativeLuminance', () => {
  it('va de 0 (noir) à 1 (blanc)', () => {
    expect(relativeLuminance(BLACK)).toBeCloseTo(0, 6)
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 6)
  })
})

describe('blend', () => {
  it('compose une couleur semi-transparente sur son fond', () => {
    expect(blend(BLACK, WHITE, 0)).toEqual(WHITE)
    expect(blend(BLACK, WHITE, 1)).toEqual(BLACK)
    expect(blend(BLACK, WHITE, 0.5)).toEqual({ r: 128, g: 128, b: 128 })
  })
})

describe('accessibleTextColor', () => {
  it('laisse intact un accent qui passe déjà AA', () => {
    expect(accessibleTextColor('#2C6E72')).toBe('#2C6E72')
  })

  it('assombrit un accent trop clair jusqu\'à AA', () => {
    const derived = accessibleTextColor('#F97316')
    expect(derived).not.toBe('#F97316')
    expect(contrastRatio(parseColor(derived)!, WHITE)).toBeGreaterThanOrEqual(4.5)
  })

  it('garantit AA pour TOUS les accents du catalogue', () => {
    for (const accent of CATALOG_ACCENTS) {
      const derived = accessibleTextColor(accent)
      const ratio = contrastRatio(parseColor(derived)!, WHITE)
      expect(ratio, `accent ${accent} rendu en ${derived}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('préserve la teinte : la variante reste plus sombre, jamais une autre couleur', () => {
    const accent = parseColor('#F97316')!
    const derived = parseColor(accessibleTextColor('#F97316'))!
    expect(derived.r).toBeLessThan(accent.r)
    // Les canaux gardent leur ordre relatif (rouge > vert > bleu) : même teinte.
    expect(derived.r).toBeGreaterThan(derived.g)
    expect(derived.g).toBeGreaterThan(derived.b)
  })

  it('rend la valeur d\'origine si elle n\'est pas analysable', () => {
    expect(accessibleTextColor('var(--color-primary)')).toBe('var(--color-primary)')
  })

  it('accepte un seuil plus exigeant (AAA)', () => {
    const derived = accessibleTextColor('#F97316', { r: 255, g: 255, b: 255 }, 7)
    expect(contrastRatio(parseColor(derived)!, WHITE)).toBeGreaterThanOrEqual(7)
  })
})
