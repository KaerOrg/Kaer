import { describe, it, expect } from 'vitest'
import { sparklinePoints } from './sparklineMath'

describe('sparklinePoints', () => {
  it('projette une série pleine en un segment continu', () => {
    const segs = sparklinePoints([0, 5, 10], [0, 10], 100, 34)
    expect(segs).toHaveLength(1)
    // 3 points → 2 espaces.
    expect(segs[0].split(' ')).toHaveLength(3)
    // min tout en bas, max tout en haut (axe SVG inversé).
    const ys = segs[0].split(' ').map(p => Number(p.split(',')[1]))
    expect(ys[0]).toBeGreaterThan(ys[2])
  })

  it('interrompt le tracé sur un null (deux segments)', () => {
    const segs = sparklinePoints([1, 2, null, 8, 9], [0, 10], 100, 34)
    expect(segs).toHaveLength(2)
  })

  it('ignore un tronçon d’un seul point', () => {
    const segs = sparklinePoints([5, null, 7], [0, 10], 100, 34)
    expect(segs).toHaveLength(0)
  })

  it('borne les valeurs hors domaine', () => {
    const segs = sparklinePoints([-5, 20], [0, 10], 100, 34)
    const ys = segs[0].split(' ').map(p => Number(p.split(',')[1]))
    expect(ys[0]).toBeGreaterThanOrEqual(ys[1]) // -5 clampé en bas, 20 clampé en haut
  })
})
