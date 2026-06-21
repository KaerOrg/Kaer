import { describe, it, expect } from 'vitest'
import type { RhythmAnchorStat } from '@psytool/shared'
import { CHRONO_ANCHORS, CHRONO_ANCHOR_KEYS, buildRhythmogramAnchors } from './chronoAnchors'

// `t` factice : renvoie la clé, suffit à vérifier la résolution du libellé.
const t = (key: string) => key

describe('chronoAnchors', () => {
  it('CHRONO_ANCHOR_KEYS suit l’ordre canonique des repères', () => {
    expect(CHRONO_ANCHOR_KEYS).toEqual(CHRONO_ANCHORS.map(a => a.key))
    expect(CHRONO_ANCHOR_KEYS[0]).toBe('wake_time')
    expect(CHRONO_ANCHOR_KEYS.at(-1)).toBe('bedtime')
  })

  describe('buildRhythmogramAnchors', () => {
    it('préserve l’ordre canonique et reprend couleur + libellé résolu', () => {
      const result = buildRhythmogramAnchors([], t)
      expect(result.map(a => a.key)).toEqual(CHRONO_ANCHOR_KEYS)
      expect(result[0]).toMatchObject({
        key: 'wake_time',
        color: '#F59E0B',
        label: 'modules.chronobiology_tracker.anchor_wake',
      })
    })

    it('reprend sdMinutes / count des stats fournies', () => {
      const stats: RhythmAnchorStat[] = [
        { key: 'wake_time', sdMinutes: 18, count: 12 },
        { key: 'bedtime', sdMinutes: 35, count: 9 },
      ]
      const result = buildRhythmogramAnchors(stats, t)
      expect(result.find(a => a.key === 'wake_time')).toMatchObject({ sdMinutes: 18, count: 12 })
      expect(result.find(a => a.key === 'bedtime')).toMatchObject({ sdMinutes: 35, count: 9 })
    })

    it('met sdMinutes=0 et count=0 pour un repère sans stat', () => {
      const result = buildRhythmogramAnchors([{ key: 'wake_time', sdMinutes: 18, count: 12 }], t)
      const light = result.find(a => a.key === 'light')
      expect(light).toMatchObject({ sdMinutes: 0, count: 0 })
    })
  })
})
