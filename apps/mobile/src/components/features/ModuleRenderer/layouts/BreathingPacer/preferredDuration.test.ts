import { resolvePreferredDuration } from './preferredDuration'

const DURATIONS = [2, 5, 10]

describe('resolvePreferredDuration', () => {
  it('retient la durée enregistrée quand elle est proposée', () => {
    expect(resolvePreferredDuration(5, DURATIONS)).toBe(5)
  })

  it('retient la plus proche quand la durée enregistrée n’est pas proposée', () => {
    expect(resolvePreferredDuration(7, DURATIONS)).toBe(5)
    expect(resolvePreferredDuration(9, DURATIONS)).toBe(10)
  })

  it('retient la première des deux également proches', () => {
    expect(resolvePreferredDuration(3.5, DURATIONS)).toBe(2)
  })

  it('borne aux extrêmes proposés', () => {
    expect(resolvePreferredDuration(1, DURATIONS)).toBe(2)
    expect(resolvePreferredDuration(60, DURATIONS)).toBe(10)
  })

  it('rend null quand aucune durée n’est proposée', () => {
    expect(resolvePreferredDuration(5, [])).toBeNull()
  })
})
