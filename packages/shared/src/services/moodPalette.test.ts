import { describe, it, expect } from 'vitest'
import {
  MOOD_DIMENSION_KEYS,
  MOOD_DIMENSION_COLORS,
  ribbonCellOpacity,
} from './moodPalette'

describe('moodPalette — table de dimensions', () => {
  it('couvre les 6 dimensions du mood_tracker avec les 3 nuances', () => {
    expect(MOOD_DIMENSION_KEYS).toEqual(['mood', 'energy', 'anxiety', 'pleasure', 'sleep', 'food'])
    for (const key of MOOD_DIMENSION_KEYS) {
      const set = MOOD_DIMENSION_COLORS[key]
      expect(set.fill).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(set.ink).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(set.mid).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})

describe('moodPalette.ribbonCellOpacity — magnitude seule (MDR)', () => {
  it('rend null pour une valeur absente (jour non renseigné = cellule vide)', () => {
    expect(ribbonCellOpacity(null, 10)).toBeNull()
    expect(ribbonCellOpacity(undefined, 10)).toBeNull()
    expect(ribbonCellOpacity(Number.NaN, 10)).toBeNull()
  })

  it('la valeur minimale reste visible (base 0.38)', () => {
    expect(ribbonCellOpacity(0, 10)).toBeCloseTo(0.38, 5)
  })

  it('la valeur maximale est pleine (1.0)', () => {
    expect(ribbonCellOpacity(10, 10)).toBeCloseTo(1, 5)
  })

  it('interpole linéairement entre base et plein', () => {
    // 5/10 → 0.38 + 0.5 × 0.62 = 0.69
    expect(ribbonCellOpacity(5, 10)).toBeCloseTo(0.69, 5)
  })

  it('borne les valeurs hors échelle sans jamais dépasser 1 ni descendre sous la base', () => {
    expect(ribbonCellOpacity(20, 10)).toBeCloseTo(1, 5)
    expect(ribbonCellOpacity(-3, 10)).toBeCloseTo(0.38, 5)
  })

  it('rend null si yMax est invalide', () => {
    expect(ribbonCellOpacity(5, 0)).toBeNull()
    expect(ribbonCellOpacity(5, -10)).toBeNull()
  })
})
