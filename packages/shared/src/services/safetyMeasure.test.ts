import { describe, it, expect } from 'vitest'
import { composeMeasureSentence, toLocalIsoDate } from './safetyMeasure'

describe('composeMeasureSentence', () => {
  it('compose la phrase complète', () => {
    expect(composeMeasureSentence({
      who: 'Ma mère', verb: 'garde', what: 'la boîte', until: 'Jusqu\'au 12 septembre',
    })).toBe('Ma mère garde la boîte. · Jusqu\'au 12 septembre.')
  })

  // « Qui s'en occupe » est facultatif : s'éloigner n'implique personne d'autre, et un
  // champ obligatoire aurait bloqué ce cas.
  it('ne laisse aucun trou quand personne ne s\'en occupe', () => {
    expect(composeMeasureSentence({
      verb: 'M\'éloigner un temps', what: 'de la maison',
    })).toBe('M\'éloigner un temps de la maison.')
  })

  it('ne laisse aucun trou quand il n\'y a pas d\'échéance', () => {
    expect(composeMeasureSentence({ who: 'Mon frère', verb: 'garde', what: 'les clés' }))
      .toBe('Mon frère garde les clés.')
  })

  it('traite une chaîne vide ou blanche comme une absence', () => {
    expect(composeMeasureSentence({ who: '   ', verb: 'Ranger', what: 'le nécessaire', until: '' }))
      .toBe('Ranger le nécessaire.')
  })

  // L'échéance est un TEXTE autant qu'une date : un sélecteur de date seul forcerait
  // une fausse précision là où « mon prochain rendez-vous » est la vraie réponse.
  it('accepte une échéance en texte libre', () => {
    expect(composeMeasureSentence({
      verb: 'Confier', what: 'le trousseau', who: 'Ma sœur', until: 'Jusqu\'à mon prochain rendez-vous',
    })).toBe('Ma sœur Confier le trousseau. · Jusqu\'à mon prochain rendez-vous.')
  })

  it('ne double pas la ponctuation déjà écrite par le patient', () => {
    expect(composeMeasureSentence({ verb: 'Ranger', what: 'ce qu\'il faut.', until: 'Cette semaine.' }))
      .toBe('Ranger ce qu\'il faut. · Cette semaine.')
  })

  it('rend une chaîne vide quand il n\'y a rien à dire', () => {
    expect(composeMeasureSentence({ verb: '', what: '' })).toBe('')
    expect(composeMeasureSentence({ verb: '  ', what: '  ', who: null, until: null })).toBe('')
  })
})

describe('toLocalIsoDate', () => {
  // `toISOString()` bascule en UTC : en fuseau positif, minuit local y retombe la
  // veille, et une échéance saisie au 12 septembre s'afficherait au 11.
  it('formate depuis les getters locaux, jamais en UTC', () => {
    const minuitLocal = new Date(2026, 8, 12, 0, 0, 0)
    expect(toLocalIsoDate(minuitLocal)).toBe('2026-09-12')
  })

  it('remplit les mois et jours à deux chiffres', () => {
    expect(toLocalIsoDate(new Date(2026, 0, 3))).toBe('2026-01-03')
  })

  it('tient la fin de journée sans glisser au lendemain', () => {
    expect(toLocalIsoDate(new Date(2026, 11, 31, 23, 59, 59))).toBe('2026-12-31')
  })
})
