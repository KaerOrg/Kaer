// Le message « il reste des questions sans réponse » était une chaîne française
// construite en dur dans `ScaleEntryScreen.handleSubmit`, accord du pluriel compris
// (#405, Q-1). Il passe par i18next, qui porte la règle d'accord de chaque langue.
//
// Ce test tourne sur une VRAIE instance i18next, pas sur le mock de `react-i18next` :
// c'est la résolution `_one` / `_other` du moteur qu'on veut vérifier, pas celle du
// mock. Il couvre aussi la parité fr / en de la clé.

import { createInstance, type i18n as I18n } from 'i18next'
import frCommon from '../../../i18n/locales/fr/common.json'
import enCommon from '../../../i18n/locales/en/common.json'

function makeInstance(lng: 'fr' | 'en'): I18n {
  const instance = createInstance()
  void instance.init({
    lng,
    fallbackLng: 'fr',
    resources: { fr: { common: frCommon }, en: { common: enCommon } },
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })
  return instance
}

describe('ScaleEntryScreen : compteur de questions sans réponse (i18n)', () => {
  it('accorde le singulier et le pluriel en fr', () => {
    const t = makeInstance('fr').t
    expect(t('common.unanswered_count', { count: 1 })).toBe('1 question sans réponse.')
    expect(t('common.unanswered_count', { count: 4 })).toBe('4 questions sans réponse.')
  })

  it('accorde le singulier et le pluriel en en', () => {
    const t = makeInstance('en').t
    expect(t('common.unanswered_count', { count: 1 })).toBe('1 unanswered question.')
    expect(t('common.unanswered_count', { count: 4 })).toBe('4 unanswered questions.')
  })

  it('ne laisse jamais fuiter la clé brute vers le patient', () => {
    for (const lng of ['fr', 'en'] as const) {
      const t = makeInstance(lng).t
      for (const count of [0, 1, 2, 9]) {
        expect(t('common.unanswered_count', { count })).not.toContain('unanswered_count')
      }
    }
  })
})
