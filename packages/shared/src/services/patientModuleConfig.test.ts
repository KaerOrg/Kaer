import { describe, it, expect } from 'vitest'
import { readEnabledGroups } from './patientModuleConfig'

describe('readEnabledGroups', () => {
  it('retourne les groupes activés', () => {
    expect(readEnabledGroups({ enabled_groups: ['evidence'] })).toEqual(['evidence'])
  })

  it('retourne [] pour une config absente, vide ou mal formée', () => {
    expect(readEnabledGroups(null)).toEqual([])
    expect(readEnabledGroups(undefined)).toEqual([])
    expect(readEnabledGroups({})).toEqual([])
    expect(readEnabledGroups({ enabled_groups: 'evidence' })).toEqual([])
  })

  it('filtre les valeurs non-string', () => {
    expect(readEnabledGroups({ enabled_groups: ['evidence', 42, null] })).toEqual(['evidence'])
  })
})
