import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'

import frCommon from './locales/fr/common.json'
import frTeen from './locales/fr/teen.json'
import enCommon from './locales/en/common.json'
import enTeen from './locales/en/teen.json'
import esCommon from './locales/es/common.json'
import deCommon from './locales/de/common.json'
import itCommon from './locales/it/common.json'
import ptCommon from './locales/pt/common.json'

const SUPPORTED = ['fr', 'en', 'es', 'de', 'it', 'pt'] as const
type SupportedLang = (typeof SUPPORTED)[number]

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'fr'
export const initialLanguage: SupportedLang = (SUPPORTED as readonly string[]).includes(deviceLocale)
  ? (deviceLocale as SupportedLang)
  : 'fr'

i18next
  .use(initReactI18next)
  .init({
    lng: initialLanguage,
    fallbackLng: 'fr',
    ns: ['common', 'teen'],
    defaultNS: 'common',
    fallbackNS: 'common',
    resources: {
      fr: { common: frCommon, teen: frTeen },
      en: { common: enCommon, teen: enTeen },
      es: { common: esCommon },
      de: { common: deCommon },
      it: { common: itCommon },
      pt: { common: ptCommon },
    },
    interpolation: { escapeValue: false },
  })

export { SUPPORTED }
export default i18next
