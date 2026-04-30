import i18next from 'i18next'
import frCommon from '../i18n/locales/fr/common.json'
import frTeen from '../i18n/locales/fr/teen.json'
import frPsyedu from '../i18n/locales/fr/psyedu.json'

i18next.init({
  lng: 'fr',
  fallbackLng: 'fr',
  ns: ['common', 'teen', 'psyedu'],
  defaultNS: 'common',
  resources: {
    fr: { common: frCommon, teen: frTeen, psyedu: frPsyedu },
  },
  interpolation: { escapeValue: false },
})

export const useTranslation = (ns?: string) => ({
  t: (key: string, opts?: Record<string, unknown>) => i18next.t(key, { ns: ns ?? 'common', ...opts }) as string,
  i18n: { changeLanguage: jest.fn(), language: 'fr' },
})

export const initReactI18next = {
  type: '3rdParty' as const,
  init: () => {},
}

export const Trans = ({ children }: { children: React.ReactNode }) => children
