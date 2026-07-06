import { describe, it, expect } from 'vitest'
import { isFilledValue } from './entryValues'

describe('isFilledValue', () => {
  it('un nombre est toujours renseigné (y compris 0)', () => {
    expect(isFilledValue(0)).toBe(true)
    expect(isFilledValue(42)).toBe(true)
  })

  it('une chaîne non vide (après trim) est renseignée', () => {
    expect(isFilledValue('anxiété')).toBe(true)
    expect(isFilledValue('  a  ')).toBe(true)
  })

  it('une chaîne vide ou uniquement des espaces ne l’est pas', () => {
    expect(isFilledValue('')).toBe(false)
    expect(isFilledValue('   ')).toBe(false)
  })

  it('null / undefined / objets ne sont pas renseignés', () => {
    expect(isFilledValue(null)).toBe(false)
    expect(isFilledValue(undefined)).toBe(false)
    expect(isFilledValue({})).toBe(false)
  })
})
