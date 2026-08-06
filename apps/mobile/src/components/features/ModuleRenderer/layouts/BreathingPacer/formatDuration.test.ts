import { formatSessionDuration } from './formatDuration'

const lbl = (key: string, params?: Record<string, string | number>) => `${key}(${params?.count ?? ''})`

describe('formatSessionDuration', () => {
  it('lit en minutes au-delà d’une minute', () => {
    expect(formatSessionDuration(300, lbl)).toBe('hub_duration_min(5)')
  })

  it('lit en secondes en deçà d’une minute', () => {
    expect(formatSessionDuration(45, lbl)).toBe('hub_duration_sec(45)')
  })

  it('n’arrondit pas une session très courte à une minute', () => {
    expect(formatSessionDuration(20, lbl)).toBe('hub_duration_sec(20)')
  })

  it('arrondit à la minute la plus proche', () => {
    expect(formatSessionDuration(310, lbl)).toBe('hub_duration_min(5)')
    expect(formatSessionDuration(340, lbl)).toBe('hub_duration_min(6)')
  })

  it('affiche exactement une minute à 60 secondes', () => {
    expect(formatSessionDuration(60, lbl)).toBe('hub_duration_min(1)')
  })

  it('tolère une durée nulle ou négative', () => {
    expect(formatSessionDuration(0, lbl)).toBe('hub_duration_sec(0)')
    expect(formatSessionDuration(-5, lbl)).toBe('hub_duration_sec(0)')
  })
})
