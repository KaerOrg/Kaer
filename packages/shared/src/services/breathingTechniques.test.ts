import { describe, it, expect } from 'vitest'
import { readBreathingTechniques, formatRhythm } from './breathingTechniques'

interface TestField {
  field_type: string
  sort_order: number
  props: Record<string, string>
  children: TestField[]
}

const phase = (type: string, seconds: string, sort: number): TestField => ({
  field_type: 'breathing_phase', sort_order: sort,
  props: { phase_type: type, phase_seconds: seconds }, children: [],
})

const technique = (key: string, children: TestField[], props: Record<string, string> = {}): TestField => ({
  field_type: 'breathing_technique', sort_order: 0,
  props: { technique_key: key, color: '#4A9EA3', recommended_duration_min: '5', ...props },
  children,
})

describe('readBreathingTechniques', () => {
  it('lit une technique et ses phases, triées par sort_order', () => {
    const techniques = readBreathingTechniques([
      technique('coherence_cardiaque', [phase('exhale', '5', 2), phase('inhale', '5', 1)]),
    ])
    expect(techniques).toEqual([{
      key: 'coherence_cardiaque', color: '#4A9EA3', recommendedDurationMin: 5,
      phases: [{ type: 'inhale', seconds: 5 }, { type: 'exhale', seconds: 5 }],
    }])
  })

  it('ignore les fields qui ne sont pas des techniques', () => {
    const other: TestField = { field_type: 'field_row', sort_order: 0, props: {}, children: [] }
    expect(readBreathingTechniques([other])).toEqual([])
  })

  it('ignore les enfants qui ne sont pas des phases', () => {
    const info: TestField = { field_type: 'technique_info', sort_order: 10, props: {}, children: [] }
    const techniques = readBreathingTechniques([technique('carree', [phase('inhale', '4', 1), info])])
    expect(techniques[0].phases).toHaveLength(1)
  })

  it('écarte une phase au type inconnu', () => {
    const techniques = readBreathingTechniques([
      technique('x', [phase('inhale', '4', 1), phase('souffler', '4', 2)]),
    ])
    expect(techniques[0].phases.map(p => p.type)).toEqual(['inhale'])
  })

  it('écarte une durée non numérique ou nulle, plutôt que de propager NaN', () => {
    const techniques = readBreathingTechniques([
      technique('x', [phase('inhale', 'quatre', 1), phase('exhale', '0', 2), phase('hold_in', '3', 3)]),
    ])
    expect(techniques[0].phases).toEqual([{ type: 'hold_in', seconds: 3 }])
  })

  it('ignore une technique sans clé', () => {
    expect(readBreathingTechniques([technique('', [])])).toEqual([])
  })

  it('tolère une durée recommandée absente', () => {
    const techniques = readBreathingTechniques([technique('x', [], { recommended_duration_min: '' })])
    expect(techniques[0].recommendedDurationMin).toBe(0)
  })

  it('conserve l’ordre de la config', () => {
    const techniques = readBreathingTechniques([technique('a', []), technique('b', [])])
    expect(techniques.map(t => t.key)).toEqual(['a', 'b'])
  })
})

describe('formatRhythm', () => {
  it('joint les durées dans l’ordre des phases', () => {
    expect(formatRhythm([{ type: 'inhale', seconds: 4 }, { type: 'exhale', seconds: 7 }])).toBe('4s · 7s')
  })

  it('rend une chaîne vide sans phase', () => {
    expect(formatRhythm([])).toBe('')
  })
})
