import { describe, it, expect } from 'vitest'
import { densityAlpha, densityOpacity, DENSITY_STEPS } from './emotionNamingDensity'

describe('rampe de densité', () => {
  it('rend une case sans saisie totalement transparente', () => {
    expect(densityAlpha(0)).toBe('00')
    expect(densityAlpha(-1)).toBe('00')
    expect(densityOpacity(0)).toBe(0)
  })

  it('monte par paliers, jamais en continu', () => {
    expect(densityAlpha(1)).toBe('2E')
    expect(densityAlpha(2)).toBe('57')
    expect(densityAlpha(3)).toBe('57')
    expect(densityAlpha(4)).toBe('80')
    expect(densityAlpha(6)).toBe('80')
    expect(densityAlpha(7)).toBe('A8')
    expect(densityAlpha(120)).toBe('A8')
  })

  it('est monotone : un comptage plus élevé n\'est jamais plus pâle', () => {
    const counts = [0, 1, 2, 3, 4, 5, 6, 7, 50]
    const alphas = counts.map(n => Number.parseInt(densityAlpha(n), 16))
    const opacities = counts.map(densityOpacity)
    for (let i = 1; i < counts.length; i += 1) {
      expect(alphas[i]).toBeGreaterThanOrEqual(alphas[i - 1])
      expect(opacities[i]).toBeGreaterThanOrEqual(opacities[i - 1])
    }
  })

  it('fait correspondre les deux rendus palier par palier', () => {
    const counts = [0, 1, 2, 4, 7]
    const byAlpha = counts.map(densityAlpha)
    const byOpacity = counts.map(densityOpacity)
    expect(new Set(byAlpha).size).toBe(counts.length)
    expect(new Set(byOpacity).size).toBe(counts.length)
  })

  it('expose un palier de légende par niveau visible de la rampe', () => {
    const alphas = DENSITY_STEPS.map(densityAlpha)
    expect(new Set(alphas).size).toBe(DENSITY_STEPS.length)
    expect(alphas).not.toContain('00')
  })
})
