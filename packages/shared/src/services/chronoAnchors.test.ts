import { describe, it, expect } from 'vitest'
import { CHRONO_ANCHORS, CHRONO_ANCHOR_KEYS } from './chronoAnchors'

describe('CHRONO_ANCHORS (source unique web ≡ mobile)', () => {
  it('expose 6 repères dans l’ordre canonique', () => {
    expect(CHRONO_ANCHOR_KEYS).toEqual([
      'wake_time', 'first_meal', 'main_activity', 'light', 'last_meal', 'bedtime',
    ])
  })

  it('CHRONO_ANCHOR_KEYS dérive bien des specs', () => {
    expect(CHRONO_ANCHOR_KEYS).toEqual(CHRONO_ANCHORS.map(a => a.key))
  })

  it('chaque repère porte une couleur et une clé i18n modules.chronobiology_tracker.*', () => {
    for (const a of CHRONO_ANCHORS) {
      expect(a.color).toMatch(/^#[0-9A-F]{6}$/i)
      expect(a.labelCode).toMatch(/^modules\.chronobiology_tracker\.anchor_/)
    }
  })

  it('clés et couleurs uniques', () => {
    expect(new Set(CHRONO_ANCHORS.map(a => a.key)).size).toBe(CHRONO_ANCHORS.length)
    expect(new Set(CHRONO_ANCHORS.map(a => a.color)).size).toBe(CHRONO_ANCHORS.length)
  })
})
