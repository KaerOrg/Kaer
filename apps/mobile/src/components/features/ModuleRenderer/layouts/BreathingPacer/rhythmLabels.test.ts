import { rhythmChipLabels, rhythmSummary } from './rhythmLabels'
import type { BreathingPhase } from '@services/breathingService'

const lbl = (key: string, params?: Record<string, string | number>) =>
  `${key}(${params?.seconds ?? ''})`

const PHASES: BreathingPhase[] = [
  { type: 'inhale', seconds: 4 },
  { type: 'hold_in', seconds: 7 },
  { type: 'exhale', seconds: 8 },
]

describe('rhythmChipLabels', () => {
  it('rend un libellé par phase, avec sa durée en paramètre', () => {
    expect(rhythmChipLabels(PHASES, lbl)).toEqual([
      'hub_rhythm_inhale(4)',
      'hub_rhythm_hold_in(7)',
      'hub_rhythm_exhale(8)',
    ])
  })

  it('rend [] sans phase', () => {
    expect(rhythmChipLabels([], lbl)).toEqual([])
  })
})

describe('rhythmSummary', () => {
  it('joint les durées dans l’ordre des phases', () => {
    expect(rhythmSummary(PHASES)).toBe('4s · 7s · 8s')
  })

  it('rend une chaîne vide sans phase', () => {
    expect(rhythmSummary([])).toBe('')
  })

  it('ne pose pas de séparateur pour une phase unique', () => {
    expect(rhythmSummary([{ type: 'inhale', seconds: 5 }])).toBe('5s')
  })
})
