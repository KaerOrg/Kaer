import { useTranslation } from 'react-i18next'
import { useTeen } from '../useTeen'

/** Valeurs interpolables dans une chaîne i18n (`{{label}}`, `{{count}}`…). */
export type ModuleTranslationValues = Record<string, string | number>

export function useModuleTranslation(): (key: string, values?: ModuleTranslationValues) => string {
  const { isTeenMode } = useTeen()
  const { t } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  return t
}
