import frCommon from '../i18n/locales/fr/common.json'

type NestedObject = { [key: string]: NestedObject | string }

function flatten(obj: NestedObject, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') {
      result[key] = v
    } else {
      Object.assign(result, flatten(v as NestedObject, key))
    }
  }
  return result
}

const TRANSLATIONS = flatten(frCommon as unknown as NestedObject)

function t(key: string, params?: Record<string, string | number>): string {
  const count = params?.count
  let resolvedKey = key
  if (typeof count === 'number' && count !== 1) {
    const pluralKey = `${key}_plural`
    if (TRANSLATIONS[pluralKey] !== undefined) resolvedKey = pluralKey
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
