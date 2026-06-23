import { describe, it, expect } from 'vitest'
import { collectIndexed } from './fieldProps'

describe('collectIndexed', () => {
  it('collecte les clés indexées dans l\'ordre numérique', () => {
    expect(collectIndexed({ duration_1: '5', duration_2: '15' }, 'duration')).toEqual(['5', '15'])
  })

  it('trie par index numérique, pas lexicographique (10 après 2)', () => {
    const props = { d_2: 'b', d_10: 'c', d_1: 'a' }
    expect(collectIndexed(props, 'd')).toEqual(['a', 'b', 'c'])
  })

  it('tolère les trous dans la séquence', () => {
    expect(collectIndexed({ k_1: 'a', k_3: 'c' }, 'k')).toEqual(['a', 'c'])
  })

  it('ignore les autres props et les suffixes non numériques', () => {
    const props = {
      widget_type: 'slider',
      target_age_1: 'ado',
      target_age_2: 'adulte',
      target_age_unit: 'x',
    }
    expect(collectIndexed(props, 'target_age')).toEqual(['ado', 'adulte'])
  })

  it('retourne [] quand aucune clé ne correspond', () => {
    expect(collectIndexed({ widget_type: 'time' }, 'duration')).toEqual([])
    expect(collectIndexed({}, 'duration')).toEqual([])
  })

  it('ne confond pas un préfixe partiel (required_key vs required_key_extra)', () => {
    const props = { required_key_1: 'situation', required_keys_any: 'packed' }
    expect(collectIndexed(props, 'required_key')).toEqual(['situation'])
  })
})
