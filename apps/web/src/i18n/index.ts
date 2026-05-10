import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import frCommon from './locales/fr/common.json'
import enCommon from './locales/en/common.json'
import esCommon from './locales/es/common.json'
import deCommon from './locales/de/common.json'
import itCommon from './locales/it/common.json'
import ptCommon from './locales/pt/common.json'

// Les `text_code` en base (`modules.<id>.<clé>`) suivent la convention mobile
// (clés à plat). On importe les sections `modules` du mobile pour que le preview
// praticien résolve ces clés sans dupliquer les traductions.
import mobileFrCommon from '../../../mobile/src/i18n/locales/fr/common.json'
import mobileEnCommon from '../../../mobile/src/i18n/locales/en/common.json'
import mobileEsCommon from '../../../mobile/src/i18n/locales/es/common.json'
import mobileDeCommon from '../../../mobile/src/i18n/locales/de/common.json'
import mobileItCommon from '../../../mobile/src/i18n/locales/it/common.json'
import mobilePtCommon from '../../../mobile/src/i18n/locales/pt/common.json'

// Namespace `psyedu` — fiches psychoéducatives (titres, summaries, blocs).
// Source unique côté mobile, partagée par le preview praticien web pour
// rendre le contenu réel de psyedu_topics + psyedu_blocks.
import mobileFrPsyedu from '../../../mobile/src/i18n/locales/fr/psyedu.json'

// Pour chaque module, on fusionne les clés mobile (DB-aligned) avec celles du web,
// en laissant le web gagner sur les clés en doublon (label, description). Les clés
// présentes uniquement côté mobile (`step_1_title`, `scale_info`, `effect_*`…)
// sont ainsi disponibles côté web sans dupliquer la traduction.
//
// La section `modules` mélange des entrées par module (objets) et des libellés
// transverses (`nav_link`, `title`, `subtitle`…, des strings). On ne fusionne que
// les entrées dont la valeur est un objet — sinon le spread d'un string casse le
// libellé en map { '0': 'M', '1': 'o', … }.
type ModulesEntry = Record<string, unknown> | string
type ModulesSection = Record<string, ModulesEntry>

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const mergeModules = <T extends { modules?: ModulesSection }>(
  web: T,
  mobile: { modules?: ModulesSection },
): T => {
  const webModules = web.modules ?? {}
  const mobModules = mobile.modules ?? {}
  const keys = new Set([...Object.keys(webModules), ...Object.keys(mobModules)])
  const merged: ModulesSection = {}
  for (const k of keys) {
    const w = webModules[k]
    const m = mobModules[k]
    if (isPlainObject(w) && isPlainObject(m)) {
      merged[k] = { ...m, ...w }
    } else if (w !== undefined) {
      merged[k] = w
    } else if (m !== undefined) {
      merged[k] = m
    }
  }
  return { ...web, modules: merged }
}

const fr = mergeModules(frCommon, mobileFrCommon)
const en = mergeModules(enCommon, mobileEnCommon)
const es = mergeModules(esCommon, mobileEsCommon)
const de = mergeModules(deCommon, mobileDeCommon)
const it = mergeModules(itCommon, mobileItCommon)
const pt = mergeModules(ptCommon, mobilePtCommon)

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
    ns: ['common', 'psyedu'],
    defaultNS: 'common',
    resources: {
      fr: { common: fr, psyedu: mobileFrPsyedu },
      en: { common: en, psyedu: mobileFrPsyedu },
      es: { common: es, psyedu: mobileFrPsyedu },
      de: { common: de, psyedu: mobileFrPsyedu },
      it: { common: it, psyedu: mobileFrPsyedu },
      pt: { common: pt, psyedu: mobileFrPsyedu },
    },
    interpolation: { escapeValue: false },
  })

export { SUPPORTED }
export default i18next
