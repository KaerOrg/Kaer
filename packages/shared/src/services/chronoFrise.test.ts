import { describe, it, expect } from 'vitest'
import { buildDayMarkers } from './chronoFrise'
import { CHRONO_ANCHORS } from './chronoAnchors'

describe('buildDayMarkers (frise 24 h, parité web ≡ mobile)', () => {
  it('ne produit un marqueur que pour les ancres renseignées, dans l’ordre canonique', () => {
    const markers = buildDayMarkers({ bedtime: '23:00', wake_time: '07:00', light: '10:00' })
    expect(markers.map(m => m.key)).toEqual(['wake_time', 'light', 'bedtime'])
  })

  it('positionne le marqueur à l’heure exacte (leftPct)', () => {
    expect(buildDayMarkers({ wake_time: '12:00' })[0].leftPct).toBeCloseTo(50)
    expect(buildDayMarkers({ wake_time: '00:00' })[0].leftPct).toBe(0)
  })

  it('porte la couleur, l’icône et le libellé du repère (source unique)', () => {
    const [m] = buildDayMarkers({ wake_time: '07:00' })
    const spec = CHRONO_ANCHORS.find(a => a.key === 'wake_time')!
    expect(m).toMatchObject({ color: spec.color, iconName: spec.iconName, labelCode: spec.labelCode, time: '07:00' })
  })

  it('ignore les valeurs vides, non-string ou mal formées', () => {
    expect(buildDayMarkers({ wake_time: '' })).toEqual([])
    expect(buildDayMarkers({ wake_time: 42 })).toEqual([])
    expect(buildDayMarkers({ wake_time: 'nope' })).toEqual([])
    expect(buildDayMarkers({ wake_time: '25:00' })).toEqual([])
  })
})
