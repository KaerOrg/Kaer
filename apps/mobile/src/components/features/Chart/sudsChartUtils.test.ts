import { sudsToY, pointToX, smoothPath, areaPath, type ChartPadding } from './sudsChartUtils'

const PAD: ChartPadding = { top: 10, bottom: 20, left: 30, right: 10 }

describe('sudsChartUtils', () => {
  describe('sudsToY', () => {
    it('mappe 100 vers le haut du plot', () => {
      const height = 100
      const y = sudsToY(100, height, PAD)
      expect(y).toBe(PAD.top)
    })

    it('mappe 0 vers le bas du plot', () => {
      const height = 100
      const y = sudsToY(0, height, PAD)
      expect(y).toBe(height - PAD.bottom)
    })

    it('mappe 50 au milieu du plot', () => {
      const height = 100
      const y = sudsToY(50, height, PAD)
      const plotH = height - PAD.top - PAD.bottom
      expect(y).toBe(PAD.top + plotH / 2)
    })
  })

  describe('pointToX', () => {
    it('centre un point unique', () => {
      const width = 200
      const x = pointToX(0, 1, width, PAD)
      const plotW = width - PAD.left - PAD.right
      expect(x).toBe(PAD.left + plotW / 2)
    })

    it('place le premier point à gauche du plot', () => {
      const width = 200
      const x = pointToX(0, 5, width, PAD)
      expect(x).toBe(PAD.left)
    })

    it('place le dernier point à droite du plot', () => {
      const width = 200
      const x = pointToX(4, 5, width, PAD)
      expect(x).toBe(width - PAD.right)
    })

    it('espace régulièrement les points intermédiaires', () => {
      const width = 200
      const plotW = width - PAD.left - PAD.right
      const x1 = pointToX(1, 5, width, PAD)
      const x2 = pointToX(2, 5, width, PAD)
      expect(x2 - x1).toBeCloseTo(plotW / 4)
    })
  })

  describe('smoothPath', () => {
    it('renvoie une chaîne vide si aucun point', () => {
      expect(smoothPath([])).toBe('')
    })

    it('renvoie un Move-to pour un point', () => {
      expect(smoothPath([{ x: 10, y: 20 }])).toBe('M 10 20')
    })

    it('génère des cubic bezier pour ≥2 points', () => {
      const path = smoothPath([{ x: 0, y: 0 }, { x: 100, y: 50 }])
      expect(path).toMatch(/^M 0 0/)
      expect(path).toContain('C ')
    })
  })

  describe('areaPath', () => {
    it('ferme le chemin vers le bas avec Z', () => {
      const path = areaPath([{ x: 0, y: 0 }, { x: 100, y: 50 }], 100)
      expect(path).toMatch(/Z$/)
      expect(path).toContain('L 100 100')
      expect(path).toContain('L 0 100')
    })

    it('renvoie une chaîne vide si aucun point', () => {
      expect(areaPath([], 100)).toBe('')
    })
  })
})
