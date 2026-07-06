import { isEntryComplete } from './entryCompletion'

describe('isEntryComplete', () => {
  it('est complète quand toutes les clés de complétion sont renseignées', () => {
    expect(isEntryComplete(
      { situation: 'au travail', rational_response: 'une autre lecture est possible' },
      ['rational_response'],
    )).toBe(true)
  })

  it('est à compléter quand une clé de complétion est absente ou vide', () => {
    expect(isEntryComplete({ situation: 'au travail' }, ['rational_response'])).toBe(false)
    expect(isEntryComplete({ rational_response: '' }, ['rational_response'])).toBe(false)
    expect(isEntryComplete({ rational_response: '   ' }, ['rational_response'])).toBe(false)
  })

  it('exige TOUTES les clés (plusieurs complete_key)', () => {
    const values = { rational_response: 'ok', outcome_emotion: '' }
    expect(isEntryComplete(values, ['rational_response', 'outcome_emotion'])).toBe(false)
    expect(isEntryComplete({ ...values, outcome_emotion: 'calme' }, ['rational_response', 'outcome_emotion'])).toBe(true)
  })

  it('accepte une valeur numérique (curseur) comme renseignée', () => {
    expect(isEntryComplete({ outcome_intensity: 0 }, ['outcome_intensity'])).toBe(true)
  })

  it('sans clé de complétion configurée, toute fiche est complète (pas de puce)', () => {
    expect(isEntryComplete({}, [])).toBe(true)
  })
})
