import { useTranslation } from 'react-i18next'
import { useTeen } from '../useTeen'

export function useModuleTranslation(): (key: string) => string {
  const { isTeenMode } = useTeen()
  const { t } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  return t
}
