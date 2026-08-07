// Le mock global de `react-i18next` (`src/__mocks__/react-i18next.ts`, branché par
// `jest.moduleNameMapper`) sert les vraies locales fr aux tests de rendu. Il porte donc
// une logique : résolution de clé, pluriel, interpolation.
//
// Cette logique a divergé sans bruit : le mock résolvait les pluriels avec le suffixe
// `_plural` de i18next v20 alors que le projet est en v26, où la règle est `_one` /
// `_other`. Conséquence : toute clé plurielle retombait sur la clé brute en test, donc
// un composant affichant « 3 questions sans réponse » aurait été vu vert en affichant
// « common.unanswered_count » (#405).
//
// Un mock non testé est un faux témoin : il rend les tests verts pour de mauvaises
// raisons. D'où cette couverture directe.

import { useTranslation } from '../__mocks__/react-i18next'

const { t } = useTranslation()

describe('mock react-i18next', () => {
  it('résout une clé simple depuis les locales fr réelles', () => {
    expect(t('common.save')).toBe('Enregistrer')
  })

  it('retourne la clé telle quelle quand elle est absente', () => {
    expect(t('common.cette_cle_nexiste_pas')).toBe('common.cette_cle_nexiste_pas')
  })

  it('interpole les paramètres', () => {
    expect(t('modules.phq9.progress', { answered: 3, total: 10 })).toBe('3 / 10 réponses')
  })

  it('résout le singulier via le suffixe `_one` (i18next v21+)', () => {
    expect(t('common.unanswered_count', { count: 1 })).toBe('1 question sans réponse.')
  })

  it('résout le pluriel via le suffixe `_other` (i18next v21+)', () => {
    expect(t('common.unanswered_count', { count: 4 })).toBe('4 questions sans réponse.')
    expect(t('common.unanswered_count', { count: 0 })).toBe('0 questions sans réponse.')
  })

  it('laisse passer un `count` sur une clé sans variante plurielle', () => {
    // Beaucoup de clés interpolent un nombre sans être des pluriels : elles ne doivent
    // pas être cassées par la recherche de suffixe.
    expect(t('modules.scale_history.avg', { value: 12 })).toBe('Moy. : 12')
  })
})
