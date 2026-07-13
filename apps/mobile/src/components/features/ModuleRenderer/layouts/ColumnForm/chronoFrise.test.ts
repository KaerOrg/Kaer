import { buildDayMarkers, isTimelineConfig } from './chronoFrise'
import { CHRONO_ANCHORS } from '@kaer/shared'

const timeCol = { textChildren: [], sliderChildren: [], timeChildren: [{}] }
const mixedCol = { textChildren: [{}], sliderChildren: [{}], timeChildren: [] }

describe('buildDayMarkers', () => {
  it('ne produit un marqueur que pour les ancres renseignées', () => {
    const markers = buildDayMarkers({ wake_time: '07:00', bedtime: '23:00' })
    expect(markers.map(m => m.key)).toEqual(['wake_time', 'bedtime'])
  })

  it('respecte l’ordre canonique de CHRONO_ANCHORS', () => {
    const markers = buildDayMarkers({ bedtime: '23:00', wake_time: '07:00', light: '10:00' })
    expect(markers.map(m => m.key)).toEqual(['wake_time', 'light', 'bedtime'])
  })

  it('positionne le marqueur à l’heure exacte (leftPct)', () => {
    const [m] = buildDayMarkers({ wake_time: '12:00' })
    expect(m.leftPct).toBeCloseTo(50) // midi = 720/1440
    const [midnight] = buildDayMarkers({ wake_time: '00:00' })
    expect(midnight.leftPct).toBe(0)
  })

  it('porte la couleur et l’icône du repère (source unique)', () => {
    const [m] = buildDayMarkers({ wake_time: '07:00' })
    const spec = CHRONO_ANCHORS.find(a => a.key === 'wake_time')!
    expect(m.color).toBe(spec.color)
    expect(m.iconName).toBe(spec.iconName)
    expect(m.labelCode).toBe(spec.labelCode)
  })

  it('ignore les valeurs vides, non-string ou mal formées', () => {
    expect(buildDayMarkers({ wake_time: '' })).toEqual([])
    expect(buildDayMarkers({ wake_time: 42 })).toEqual([])
    expect(buildDayMarkers({ wake_time: 'nope' })).toEqual([])
  })
})

describe('isTimelineConfig', () => {
  it('vrai quand toutes les colonnes ne portent que des champs horaires', () => {
    expect(isTimelineConfig([timeCol])).toBe(true)
    expect(isTimelineConfig([timeCol, timeCol])).toBe(true)
  })

  it('faux si une colonne porte texte ou slider (craving_journal)', () => {
    expect(isTimelineConfig([mixedCol])).toBe(false)
    expect(isTimelineConfig([timeCol, mixedCol])).toBe(false)
  })

  it('faux pour une liste de colonnes vide', () => {
    expect(isTimelineConfig([])).toBe(false)
  })
})
