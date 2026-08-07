import frCommon from '../i18n/locales/fr/common.json'

type Translatable = string | { [key: string]: Translatable }

function flatten(obj: { [key: string]: Translatable }, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') {
      result[key] = v
    } else {
      Object.assign(result, flatten(v, key))
    }
  }
  return result
}

const TRANSLATIONS = flatten(frCommon)

// Suffixes candidats pour un `count` donné, dans l'ordre de préférence. i18next v21+
// résout les pluriels via `_one` / `_other` (Intl.PluralRules) ; `_plural` est la forme
// héritée de v20, conservée ici tant que des clés l'utilisent encore.
function pluralSuffixes(count: number): string[] {
  return count === 1 ? ['_one'] : ['_other', '_plural']
}

function t(key: string, params?: Record<string, string | number>): string {
  const count = params?.count
  let resolvedKey = key
  if (typeof count === 'number') {
    const match = pluralSuffixes(count)
      .map(suffix => `${key}${suffix}`)
      .find(candidate => TRANSLATIONS[candidate] !== undefined)
    if (match !== undefined) resolvedKey = match
  }
  let value = TRANSLATIONS[resolvedKey] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
    }
  }
  return value
}

export const useTranslation = () => ({
  t,
  i18n: { changeLanguage: jest.fn(), language: 'fr' },
})

export const initReactI18next = {
  type: '3rdParty' as const,
  init: () => {},
}

export const Trans = ({ children }: { children: React.ReactNode }) => children
