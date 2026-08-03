import { cursorAt, isCompleted, formatRemaining } from './sessionPhases'
import type { BreathingPhase } from '@services/breathingService'

const COHERENCE: BreathingPhase[] = [{ type: 'inhale', seconds: 5 }, { type: 'exhale', seconds: 5 }]
const CARREE: BreathingPhase[] = [
  { type: 'inhale', seconds: 4 }, { type: 'hold_in', seconds: 4 },
  { type: 'exhale', seconds: 4 }, { type: 'hold_out', seconds: 4 },
]
const QUATRE_SEPT_HUIT: BreathingPhase[] = [
  { type: 'inhale', seconds: 4 }, { type: 'hold_in', seconds: 7 }, { type: 'exhale', seconds: 8 },
]

describe('cursorAt', () => {
  it('démarre sur la première phase', () => {
    expect(cursorAt(COHERENCE, 0)).toMatchObject({
      phaseIndex: 0, remainingInPhase: 5, phaseSeconds: 5, cyclesCompleted: 0,
    })
  })

  it('bascule à la seconde pile, pas une seconde plus tard', () => {
    expect(cursorAt(COHERENCE, 5)?.phaseIndex).toBe(1)
    expect(cursorAt(COHERENCE, 4.99)?.phaseIndex).toBe(0)
  })

  it('compte un cycle complet au retour sur la première phase', () => {
    expect(cursorAt(COHERENCE, 10)).toMatchObject({ phaseIndex: 0, cyclesCompleted: 1 })
  })

  it('sert une technique à quatre phases, rétentions comprises', () => {
    expect(cursorAt(CARREE, 5)?.phaseIndex).toBe(1)   // hold_in
    expect(cursorAt(CARREE, 9)?.phaseIndex).toBe(2)   // exhale
    expect(cursorAt(CARREE, 13)?.phaseIndex).toBe(3)  // hold_out
    expect(cursorAt(CARREE, 16)).toMatchObject({ phaseIndex: 0, cyclesCompleted: 1 })
  })

  it('sert une technique à trois phases de durées inégales', () => {
    expect(cursorAt(QUATRE_SEPT_HUIT, 3)?.phaseIndex).toBe(0)
    expect(cursorAt(QUATRE_SEPT_HUIT, 10)?.phaseIndex).toBe(1)
    expect(cursorAt(QUATRE_SEPT_HUIT, 12)?.phaseIndex).toBe(2)
    expect(cursorAt(QUATRE_SEPT_HUIT, 19)).toMatchObject({ phaseIndex: 0, cyclesCompleted: 1 })
  })

  it('arrondit le décompte au supérieur (on affiche « 5 » pendant la 5e seconde)', () => {
    expect(cursorAt(COHERENCE, 0.2)?.remainingInPhase).toBe(5)
    expect(cursorAt(COHERENCE, 4.2)?.remainingInPhase).toBe(1)
  })

  it('donne une instance de phase distincte à chaque changement', () => {
    const first = cursorAt(CARREE, 1)?.phaseInstance
    const second = cursorAt(CARREE, 5)?.phaseInstance
    const nextCycleFirst = cursorAt(CARREE, 17)?.phaseInstance
    expect(second).not.toBe(first)
    expect(nextCycleFirst).not.toBe(first)
  })

  it('tolère un temps négatif en repartant du début', () => {
    expect(cursorAt(COHERENCE, -3)?.phaseIndex).toBe(0)
  })

  it('rend null pour une technique sans phase', () => {
    expect(cursorAt([], 5)).toBeNull()
  })

  it('rend null pour un cycle de durée nulle (aucune division par zéro)', () => {
    expect(cursorAt([{ type: 'inhale', seconds: 0 }], 5)).toBeNull()
  })
})

describe('isCompleted', () => {
  it('marque menée au bout à partir de la moitié de la durée choisie', () => {
    expect(isCompleted(150, 300)).toBe(true)
    expect(isCompleted(300, 300)).toBe(true)
  })

  it('marque interrompue en deçà de la moitié', () => {
    expect(isCompleted(149, 300)).toBe(false)
    expect(isCompleted(0, 300)).toBe(false)
  })

  it('marque interrompue quand aucune durée n’était prévue', () => {
    expect(isCompleted(120, 0)).toBe(false)
  })
})

describe('formatRemaining', () => {
  it('formate en m:ss avec les secondes sur deux chiffres', () => {
    expect(formatRemaining(194)).toBe('3:14')
    expect(formatRemaining(65)).toBe('1:05')
  })

  it('arrondit au supérieur (3:14 tant qu’il reste 3 min 13,2 s)', () => {
    expect(formatRemaining(193.2)).toBe('3:14')
  })

  it('affiche 0:00 en fin de session et jamais de valeur négative', () => {
    expect(formatRemaining(0)).toBe('0:00')
    expect(formatRemaining(-5)).toBe('0:00')
  })
})
