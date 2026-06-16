import { describe, it, expect } from 'vitest'
import { noonAxisPos, barGeometry, formatMinutes, avg } from './sleepGrid'

describe('sleepGrid.noonAxisPos', () => {
  it('place midi au début et minuit au milieu de l’axe noon→noon', () => {
    expect(noonAxisPos('12:00')).toBeCloseTo(0)
    expect(noonAxisPos('00:00')).toBeCloseTo(0.5)
    expect(noonAxisPos('18:00')).toBeCloseTo(0.25)
    expect(noonAxisPos('06:00')).toBeCloseTo(0.75)
  })
})

describe('sleepGrid.barGeometry', () => {
  it('calcule left/width (%) d’une nuit qui traverse minuit', () => {
    // Coucher 23:00 (pos 0.4583), lever 07:00 (pos 0.7917) → largeur 8 h = 33,3 %
    const { left, width } = barGeometry('23:00', '07:00')
    expect(left).toBeCloseTo(45.83, 1)
    expect(width).toBeCloseTo(33.33, 1)
  })

  it('plafonne la largeur au bord droit de l’axe', () => {
    // Une fenêtre dépassant le second midi est tronquée à 100 %.
    const { left, width } = barGeometry('11:00', '13:00')
    expect(left + width).toBeLessThanOrEqual(100.0001)
  })
})

describe('sleepGrid.formatMinutes', () => {
  it('rend XhYY', () => {
    expect(formatMinutes(0)).toBe('0h00')
    expect(formatMinutes(60)).toBe('1h00')
    expect(formatMinutes(485)).toBe('8h05')
  })
})

describe('sleepGrid.avg', () => {
  it('moyenne arrondie, null si vide', () => {
    expect(avg([])).toBeNull()
    expect(avg([80, 90, 100])).toBe(90)
    expect(avg([85, 86])).toBe(86) // 85,5 arrondi
  })
})
