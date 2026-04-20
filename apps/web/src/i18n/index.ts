import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import frCommon from './locales/fr/common.json'
import enCommon from './locales/en/common.json'
import esCommon from './locales/es/common.json'
import deCommon from './locales/de/common.json'
import itCommon from './locales/it/common.json'
import ptCommon from './locales/pt/common.json'

const SUPPORTED = ['fr', 'en', 'es', 'de', 'it', 'pt'] as const
export type SupportedLang = (typeof SUPPORTED)[number]

export const LANG_LABELS: Record<SupportedLang, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
}

export const LANG_FLAGS: Record<SupportedLang, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  es: '🇪🇸',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇵🇹',
}

const stored = localStorage.getItem('psytool_lang')
const browserLang = navigator.language.slice(0, 2)
const detected = (SUPPORTED as readonly string[]).includes(stored ?? '')
  ? (stored as SupportedLang)
  : (SUPPORTED as readonly string[]).includes(browserLang)
    ? (browserLang as SupportedLang)
    : 'fr'

export const setLanguage = (lang: SupportedLang) => {
  localStorage.setItem('psytool_lang', lang)
  void i18next.changeLanguage(lang)
}

i18next
  .use(initReactI18next)
  .init({
    lng: detected,
    fallbackLng: 'fr',
    ns: ['common'],
    defaultNS: 'common',
    resources: {
      fr: { common: frCommon },
      en: { common: enCommon },
      es: { common: esCommon },
      de: { common: deCommon },
      it: { common: itCommon },
      pt: { common: ptCommon },
    },
    interpolation: { escapeValue: false },
  })

export { SUPPORTED }
export default i18next
